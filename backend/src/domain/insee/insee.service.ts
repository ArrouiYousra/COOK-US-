import { fetch } from 'undici';

interface InseeTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope?: string;
}

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

const INSEE_TOKEN_URL: string = process.env.INSEE_API_TOKEN_URL ?? 'https://api.insee.fr/token';
const INSEE_BASE_URL: string =
  process.env.INSEE_API_BASE_URL ?? 'https://api.insee.fr/entreprises/sirene/V3';
const INSEE_CLIENT_ID: string | undefined = process.env.INSEE_API_KEY;
const INSEE_CLIENT_SECRET: string | undefined = process.env.INSEE_API_SECRET;
const INSEE_SCOPE: string | undefined = process.env.INSEE_API_SCOPE;

const SIRET_REGEX = /^[0-9]{14}$/;
const SIREN_REGEX = /^[0-9]{9}$/;

interface CachedToken {
  token: string;
  expiresAt: number;
}

/**
 * Service pour la validation des SIRET via l'API INSEE
 */
export class InseeService {
  private static cachedToken: CachedToken | null = null;

  private static ensureConfigured(): void {
    if (!INSEE_CLIENT_ID) {
      throw new InseeApiError(
        'INSEE API credentials are not configured. Please set INSEE_API_KEY.',
        500
      );
    }
  }

  /**
   * Obtient un token d'accès pour l'API INSEE
   * Supporte deux modes :
   * - OAuth 2.0 (si Client Secret fourni)
   * - API Key directe (si pas de Client Secret)
   */
  private static async getAccessToken(): Promise<string> {
    this.ensureConfigured();

    // Mode API Key directe (plan "api key" sans OAuth)
    if (!INSEE_CLIENT_SECRET || INSEE_CLIENT_SECRET.trim() === '') {
      // Retourne directement l'API Key comme "token"
      // Elle sera utilisée dans les headers Authorization
      return INSEE_CLIENT_ID;
    }

    // Mode OAuth 2.0 (plan avec Client Secret)
    const now = Date.now();
    if (this.cachedToken && this.cachedToken.expiresAt > now + 60_000) {
      return this.cachedToken.token;
    }

    const credentials = Buffer.from(`${INSEE_CLIENT_ID}:${INSEE_CLIENT_SECRET}`).toString('base64');
    const body = new URLSearchParams({
      grant_type: 'client_credentials',
    });

    if (INSEE_SCOPE && INSEE_SCOPE.trim().length > 0) {
      body.append('scope', INSEE_SCOPE.trim());
    }

    const response = await fetch(INSEE_TOKEN_URL, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    });

    if (!response.ok) {
      const errorPayload = await response.text().catch(() => undefined);
      throw new InseeApiError(
        "Échec de l'authentification auprès de l'API INSEE",
        response.status,
        errorPayload
      );
    }

    const data = (await response.json()) as InseeTokenResponse;
    const expiresAt = now + data.expires_in * 1000;

    this.cachedToken = {
      token: data.access_token,
      expiresAt,
    };

    return data.access_token;
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
    const token = await this.getAccessToken();
    const response = await fetch(`${INSEE_BASE_URL}/siret?q=siren:${siren}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
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

    const token = await this.getAccessToken();
    const response = await fetch(`${INSEE_BASE_URL}/siret/${siretToValidate}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    });

    if (response.status === 404) {
      throw new InseeApiError('Numéro SIRET introuvable dans la base INSEE', 400);
    }

    if (response.status === 429) {
      throw new InseeApiError("Limite de l'API INSEE atteinte. Veuillez réessayer plus tard.", 503);
    }

    if (!response.ok) {
      const errorPayload = await response.text().catch(() => undefined);
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


