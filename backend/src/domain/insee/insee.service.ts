import { fetch } from 'undici';

interface InseeSiretResponse {
  etablissement?: {
    siret?: string;
    uniteLegale?: {
      denominationUniteLegale?: string;
      denominationUsuelle1UniteLegale?: string;
      denominationUsuelle2UniteLegale?: string;
      denominationUsuelle3UniteLegale?: string;
      etatAdministratifUniteLegale?: string;
      dateCreationUniteLegale?: string;
      categorieEntreprise?: string;
      activitePrincipaleUniteLegale?: string;
    };
    adresseEtablissement?: {
      numeroVoieEtablissement?: string;
      indiceRepetitionEtablissement?: string;
      typeVoieEtablissement?: string;
      libelleVoieEtablissement?: string;
      codePostalEtablissement?: string;
      libelleCommuneEtablissement?: string;
      complementAdresseEtablissement?: string;
    };
    etatAdministratifEtablissement?: string;
  };
  header?: {
    message?: string;
  };
}

interface InseeSirenResponse {
  etablissements?: Array<{
    siret?: string;
    etablissementSiege?: boolean;
    etatAdministratifEtablissement?: string;
    uniteLegale?: {
      denominationUniteLegale?: string;
      etatAdministratifUniteLegale?: string;
    };
  }>;
  header?: {
    message?: string;
    total?: number;
  };
}

export interface SiretValidationResult {
  isValid: boolean;
  siret?: string; // SIRET validé (peut être différent de l'input si SIREN fourni)
  companyName?: string;
  activityCode?: string;
  address?: string;
  metadata?: {
    creationDate?: string;
    companyCategory?: string;
  };
  raw?: InseeSiretResponse;
}

export class InseeApiError extends Error {
  public readonly statusCode: number;
  public readonly details?: unknown;

  constructor(message: string, statusCode: number, details?: unknown) {
    super(message);
    this.name = 'InseeApiError';
    this.statusCode = statusCode;
    this.details = details;
  }
}

// URL de base de l'API Sirene (version 3.11)
const INSEE_BASE_URL: string =
  process.env.INSEE_API_BASE_URL ?? 'https://api.insee.fr/api-sirene/3.11';
// Clé API pour l'authentification (mode public)
const INSEE_API_KEY: string | undefined = process.env.INSEE_API_KEY;

const SIRET_REGEX = /^[0-9]{14}$/;
const SIREN_REGEX = /^[0-9]{9}$/;

/**
 * Service pour la validation des SIRET via l'API INSEE Sirene
 * Utilise le mode "Public" avec API Key via le header X-INSEE-Api-Key-Integration
 * 
 * Documentation: https://api.insee.fr/catalogue/
 */
export class InseeService {
  private static ensureConfigured(): void {
    if (!INSEE_API_KEY) {
      throw new InseeApiError(
        'INSEE API credentials are not configured. Please set INSEE_API_KEY in your .env file.',
        500
      );
    }
  }

  private static buildAddress(payload?: InseeSiretResponse['etablissement']): string | undefined {
    if (!payload?.adresseEtablissement) {
      return undefined;
    }

    const parts = [
      payload.adresseEtablissement.numeroVoieEtablissement,
      payload.adresseEtablissement.indiceRepetitionEtablissement,
      payload.adresseEtablissement.typeVoieEtablissement,
      payload.adresseEtablissement.libelleVoieEtablissement,
      payload.adresseEtablissement.codePostalEtablissement,
      payload.adresseEtablissement.libelleCommuneEtablissement,
    ].filter((part) => Boolean(part));

    return parts.join(' ').replace(/\s+/g, ' ').trim();
  }

  private static buildCompanyName(payload?: InseeSiretResponse['etablissement']): string | undefined {
    if (!payload?.uniteLegale) {
      return undefined;
    }

    const {
      denominationUniteLegale,
      denominationUsuelle1UniteLegale,
      denominationUsuelle2UniteLegale,
      denominationUsuelle3UniteLegale,
    } = payload.uniteLegale;

    const names = [
      denominationUniteLegale,
      denominationUsuelle1UniteLegale,
      denominationUsuelle2UniteLegale,
      denominationUsuelle3UniteLegale,
    ].filter((value) => Boolean(value));

    return names[0]?.trim();
  }

  /**
   * Chercher le SIRET principal (siège) à partir d'un SIREN
   */
  private static async findMainSiretFromSiren(siren: string): Promise<string> {
    this.ensureConfigured();
    
    // L'API Sirene utilise le header X-INSEE-Api-Key-Integration
    const response = await fetch(`${INSEE_BASE_URL}/siren/${siren}`, {
      method: 'GET',
      headers: {
        'X-INSEE-Api-Key-Integration': INSEE_API_KEY!,
        Accept: 'application/json',
      },
    });

    if (response.status === 404) {
      throw new InseeApiError('Numéro SIREN introuvable dans la base INSEE', 400);
    }

    if (response.status === 429) {
      throw new InseeApiError("Limite de l'API INSEE atteinte. Veuillez réessayer plus tard.", 503);
    }

    if (!response.ok) {
      const errorPayload = await response.text().catch(() => undefined);
      throw new InseeApiError(
        'Échec de la recherche du SIRET principal pour ce SIREN',
        response.status,
        errorPayload
      );
    }

    const data = (await response.json()) as InseeSirenResponse;
    const etablissements = data.etablissements;

    if (!etablissements || etablissements.length === 0) {
      throw new InseeApiError('Aucun établissement trouvé pour ce SIREN', 400);
    }

    // Chercher l'établissement siège
    const siege = etablissements.find((etab) => etab.etablissementSiege === true);
    if (siege?.siret) {
      return siege.siret;
    }

    // Si pas de siège trouvé, prendre le premier établissement actif
    const actif = etablissements.find(
      (etab) => etab.etatAdministratifEtablissement === 'A' && etab.siret
    );
    if (actif?.siret) {
      return actif.siret;
    }

    // Sinon, prendre le premier disponible
    if (etablissements[0]?.siret) {
      return etablissements[0].siret;
    }

    throw new InseeApiError('Impossible de déterminer le SIRET principal pour ce SIREN', 400);
  }

  /**
   * Valider un numéro SIRET ou SIREN via l'API INSEE
   * Si un SIREN (9 chiffres) est fourni, cherche le SIRET principal (siège)
   */
  static async validateSiret(siretOrSiren: string): Promise<SiretValidationResult> {
    const trimmed = siretOrSiren.replace(/\s/g, '');

    let siretToValidate: string;

    // Si c'est un SIREN (9 chiffres), chercher le SIRET principal
    if (SIREN_REGEX.test(trimmed)) {
      siretToValidate = await this.findMainSiretFromSiren(trimmed);
    } else if (SIRET_REGEX.test(trimmed)) {
      siretToValidate = trimmed;
    } else {
      throw new InseeApiError(
        'Le numéro doit contenir 9 chiffres (SIREN) ou 14 chiffres (SIRET)',
        400
      );
    }

    this.ensureConfigured();
    
    // Log pour debugging (en développement seulement)
    if (process.env.NODE_ENV === 'development') {
      console.log('[INSEE] Validating SIRET:', siretToValidate);
      console.log('[INSEE] API Key configured:', INSEE_API_KEY ? 'Yes' : 'No');
      console.log('[INSEE] API Key preview:', INSEE_API_KEY ? `${INSEE_API_KEY.substring(0, 10)}...` : 'N/A');
      console.log('[INSEE] API URL:', `${INSEE_BASE_URL}/siret/${siretToValidate}`);
    }
    
    // L'API Sirene utilise le header X-INSEE-Api-Key-Integration (pas Authorization)
    const response = await fetch(`${INSEE_BASE_URL}/siret/${siretToValidate}`, {
      method: 'GET',
      headers: {
        'X-INSEE-Api-Key-Integration': INSEE_API_KEY!,
        Accept: 'application/json',
      },
    });

    // Log de la réponse complète en développement
    if (process.env.NODE_ENV === 'development') {
      console.log('[INSEE] Response status:', response.status);
      console.log('[INSEE] Response statusText:', response.statusText);
      console.log('[INSEE] Response headers:', Object.fromEntries(response.headers.entries()));
    }

    if (response.status === 404) {
      const errorBody = await response.text().catch(() => '');
      console.error('[INSEE] 404 Error - SIRET not found:', siretToValidate);
      console.error('[INSEE] Response body:', errorBody);
      
      // Essayer de parser le JSON si possible
      let parsedError: any = null;
      try {
        parsedError = JSON.parse(errorBody);
      } catch {
        // Pas de JSON, on garde le texte brut
      }
      
      throw new InseeApiError('Numéro SIRET introuvable dans la base INSEE', 400, {
        siret: siretToValidate,
        responseBody: errorBody,
        parsedError,
        possibleCauses: [
          'Le SIRET n\'existe pas dans la base INSEE',
          'Le SIRET correspond à un établissement fermé',
          'Problème d\'authentification (vérifier INSEE_API_KEY)',
          'Format du header X-INSEE-Api-Key-Integration incorrect',
          'L\'établissement a une opposition à la diffusion',
        ],
      });
    }

    if (response.status === 429) {
      throw new InseeApiError("Limite de l'API INSEE atteinte. Veuillez réessayer plus tard.", 503);
    }

    if (!response.ok) {
      const errorPayload = await response.text().catch(() => undefined);
      
      // Log détaillé en développement
      if (process.env.NODE_ENV === 'development') {
        console.error('[INSEE] Request failed:', {
          status: response.status,
          statusText: response.statusText,
          url: `${INSEE_BASE_URL}/siret/${siretToValidate}`,
          apiKeyUsed: INSEE_API_KEY ? `${INSEE_API_KEY.substring(0, 10)}...` : 'N/A',
          errorPayload,
        });
      }
      
      // Si c'est une erreur 401, c'est probablement un problème d'authentification
      if (response.status === 401) {
        throw new InseeApiError(
          "Erreur d'authentification auprès de l'API INSEE. Vérifiez votre clé API (INSEE_API_KEY).",
          response.status,
          {
            errorPayload,
            troubleshooting: [
              'Vérifiez que INSEE_API_KEY est correctement configuré dans votre .env',
              'Vérifiez que la clé API n\'est pas expirée ou révoquée',
              'Vérifiez que vous avez bien souscrit au plan "Public" sur https://api.insee.fr/catalogue/',
              'Vérifiez le format du header X-INSEE-Api-Key-Integration',
            ],
          }
        );
      }
      
      // Si c'est une erreur 403, problème de permissions
      if (response.status === 403) {
        throw new InseeApiError(
          "Accès refusé par l'API INSEE. Vérifiez les permissions de votre clé API.",
          response.status,
          errorPayload
        );
      }
      
      throw new InseeApiError(
        "Échec de la validation du SIRET auprès de l'API INSEE",
        response.status,
        errorPayload
      );
    }

    const data = (await response.json()) as InseeSiretResponse;
    const etablissement = data.etablissement;

    if (!etablissement || etablissement.etatAdministratifEtablissement === 'F') {
      throw new InseeApiError(
        'Le numéro SIRET correspond à un établissement fermé ou invalide',
        400,
        data
      );
    }

    const uniteLegale = etablissement.uniteLegale;
    if (uniteLegale?.etatAdministratifUniteLegale && uniteLegale.etatAdministratifUniteLegale !== 'A') {
      throw new InseeApiError(
        "L'unité légale associée à ce SIRET n'est pas active",
        400,
        data
      );
    }

    return {
      isValid: true,
      siret: siretToValidate, // Retourne le SIRET validé (peut être différent de l'input)
      companyName: this.buildCompanyName(etablissement),
      activityCode: uniteLegale?.activitePrincipaleUniteLegale,
      address: this.buildAddress(etablissement),
      metadata: {
        creationDate: uniteLegale?.dateCreationUniteLegale,
        companyCategory: uniteLegale?.categorieEntreprise,
      },
      raw: data,
    };
  }
}
