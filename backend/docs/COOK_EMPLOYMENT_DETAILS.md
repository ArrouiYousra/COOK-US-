# Gestion des Statuts d'Emploi des Cuisiniers

## 📋 Vue d'ensemble

Ce document décrit la gestion des différents statuts d'emploi des cuisiniers et les données requises pour chacun.

## 🏢 Statuts d'Emploi

### 1. AUTO_ENTREPRENEUR
**Champs obligatoires**:
- ✅ `siret_number` (14 chiffres)
- ✅ `siret_verified` (vérifié via API INSEE)

**Champs optionnels**:
- `kbis_url` (document KBIS)
- `insurance_number` (numéro d'assurance)
- `insurance_expiry_date` (date d'expiration de l'assurance)

### 2. MICRO_ENTREPRISE
**Champs obligatoires**:
- ✅ `siret_number` (14 chiffres)
- ✅ `siret_verified` (vérifié via API INSEE)

**Champs optionnels**:
- `kbis_url` (document KBIS)
- `insurance_number` (numéro d'assurance)
- `insurance_expiry_date` (date d'expiration de l'assurance)

### 3. PORTAGE_SALARIAL
**Champs obligatoires**:
- ✅ `birth_place` (lieu de naissance)
- ✅ `social_security_number` (numéro de sécurité sociale - 15 chiffres)
- ✅ `iban` (IBAN pour le virement - format FR)
- ✅ `bic` (code BIC - 8 ou 11 caractères)
- ✅ `rib_document_url` (chemin sécurisé du document RIB uploadé dans Supabase Storage)

**Note**: Ces données seront transmises à une application de type PayFit ou Silae pour la gestion du contrat de travail.

**Champs optionnels**:
- `id_card_url` (copie de la carte d'identité)

### 4. ASSOCIATION
**Champs obligatoires**:
- ✅ `siret_number` (14 chiffres) - si l'association a un SIRET
- ✅ `siret_verified` (vérifié via API INSEE)

**Champs optionnels**:
- `kbis_url` (document KBIS)
- `insurance_number` (numéro d'assurance)

## 🔒 Sécurité des Données

### Données chiffrées
Les données suivantes sont **chiffrées au repos** dans la base de données :
- `social_security_number_encrypted` (numéro de sécurité sociale)
- `iban_encrypted` (IBAN)
- `bic_encrypted` (code BIC)

### Chiffrement
- Utilisation de `pgcrypto` (PostgreSQL)
- Fonction `encrypt_sensitive_data()` pour chiffrer
- Fonction `decrypt_sensitive_data()` pour déchiffrer (admin uniquement)
- Clé de chiffrement stockée dans `app.encryption_key` (variable d'environnement)

### Accès aux données déchiffrées
- Vue `cook_profiles_decrypted` pour les admins
- **Important**: Protéger avec Row Level Security (RLS) en production
- Seuls les admins peuvent accéder aux données déchiffrées

## ✅ Validation des Données

### SIRET
- **Format**: 14 chiffres
- **Validation**: API INSEE (voir section API INSEE ci-dessous)
- **Obligatoire pour**: `AUTO_ENTREPRENEUR`, `MICRO_ENTREPRISE`, `ASSOCIATION` (si applicable)

### Numéro de Sécurité Sociale
- **Format**: 15 chiffres
  - 1 chiffre (sexe: 1=homme, 2=femme)
  - 2 chiffres (année de naissance)
  - 2 chiffres (mois de naissance)
  - 2 chiffres ou 2A/2B (département)
  - 3 chiffres (commune)
  - 3 chiffres (ordre)
  - 2 chiffres (clé de contrôle)
- **Exemple**: `1 85 05 75 123 45 67`
- **Obligatoire pour**: `PORTAGE_SALARIAL`

### IBAN
- **Format**: FR + 2 chiffres de contrôle + 23 caractères alphanumériques
- **Exemple**: `FR76 1234 5678 9012 3456 7890 123`
- **Obligatoire pour**: `PORTAGE_SALARIAL`

### BIC
- **Format**: 8 ou 11 caractères alphanumériques
- **Exemple**: `BNPAFRPPXXX`
- **Obligatoire pour**: `PORTAGE_SALARIAL`

### Lieu de Naissance
- **Format**: Texte libre (ville, département, pays)
- **Exemple**: `Paris, 75, France`
- **Obligatoire pour**: `PORTAGE_SALARIAL`

### Document RIB
- **Format**: Fichier binaire converti en base64 côté frontend (`data:...;base64,`)
- **Validation**: Contrôle du type MIME et de la taille côté frontend + backend
- **Transformation**: Le backend reconvertit le base64 en binaire et stocke le fichier dans Supabase Storage
- **Stockage sécurisé**: Le chemin `rib_document_url` est conservé dans la table `cook_profiles` sans rendre le fichier public

## 🔌 API INSEE pour Validation SIRET

### Endpoint
```
GET https://api.insee.fr/entreprises/sirene/V3/siret/{siret}
```

### Authentification
- **Type**: OAuth 2.0
- **Token**: Bearer token
- **Inscription**: https://api.insee.fr/catalogue/

### Exemple de requête
```bash
curl -X GET \
  "https://api.insee.fr/entreprises/sirene/V3/siret/12345678901234" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Réponse
```json
{
  "etablissement": {
    "siret": "12345678901234",
    "uniteLegale": {
      "denominationUniteLegale": "NOM DE L'ENTREPRISE",
      "activitePrincipaleUniteLegale": "56.10Z",
      "etatAdministratifUniteLegale": "A"
    },
    "adresseEtablissement": {
      "numeroVoieEtablissement": "123",
      "typeVoieEtablissement": "RUE",
      "libelleVoieEtablissement": "EXEMPLE",
      "codePostalEtablissement": "75001",
      "libelleCommuneEtablissement": "PARIS"
    }
  }
}
```

### Validation
- Vérifier que `etatAdministratifUniteLegale` = "A" (Actif)
- Vérifier que le SIRET correspond bien
- Enregistrer `siret_verified = true` et `siret_verified_at = NOW()`

### Limites
- **Quota**: Variable selon le type d'accès (gratuit ou payant)
- **Rate limiting**: À respecter selon les conditions d'utilisation
- **Cache**: Mettre en cache les résultats pour éviter les appels répétés

## 📝 Schéma de Validation Zod (Backend)

```typescript
const registerCookSchema = baseRegisterSchema.extend({
  role: z.literal<'COOK'>('COOK').default('COOK'),
  employmentStatus: z.enum(employmentStatusValues),
  headline: z.string().min(10).max(160),
  hourlyRate: z.number().min(10).max(500),
  siretNumber: z
    .union([
      z.literal(''),
      z.string().trim().regex(/^[0-9]{14}$/),
      z.undefined()
    ])
    .transform((value) => (value === '' ? undefined : value))
    .refine((value, ctx) => {
      const status = ctx.parent.employmentStatus;
      if (status === 'AUTO_ENTREPRENEUR' || status === 'MICRO_ENTREPRISE') {
        return value !== undefined && value !== '';
      }
      return true;
    }, {
      message: 'Le numéro SIRET est obligatoire pour AUTO_ENTREPRENEUR et MICRO_ENTREPRISE'
    }),
  // Champs PORTAGE_SALARIAL
  birthPlace: z.string().min(2).max(100).optional(),
  socialSecurityNumber: z.string().regex(/^[12][0-9]{2}(0[1-9]|1[0-2])([0-9]{2}|2[AB])[0-9]{3}[0-9]{3}[0-9]{2}$/).optional(),
  iban: z.string().regex(/^FR[0-9]{2}[A-Z0-9]{23}$/).optional(),
  bic: z.string().regex(/^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$/).optional(),
  ribDocument: z
    .string()
    .regex(/^data:(application\/pdf|image\/jpeg|image\/png);base64,/i, 'Format de fichier RIB invalide')
    .max(15_000_000, 'Le document RIB est trop volumineux')
    .optional(),
  ribDocumentName: z.string().max(255).optional(),
}).refine((data) => {
  // Validation conditionnelle pour PORTAGE_SALARIAL
  if (data.employmentStatus === 'PORTAGE_SALARIAL') {
    return data.birthPlace && 
           data.socialSecurityNumber && 
           data.iban && 
           data.bic &&
           data.ribDocument;
  }
  return true;
}, {
  message: 'Les champs de portage salarial sont obligatoires',
  path: ['employmentStatus']
});
```

## 🎯 Prochaines Étapes

1. ✅ Migration SQL initiale (champs supplémentaires + fonctions de chiffrement)
2. ✅ Validation SIRET via API INSEE côté backend
3. ✅ Schémas Zod backend/frontend mis à jour (validation conditionnelle + base64 RIB)
4. ✅ Upload RIB géré via Supabase Storage (DocumentService)
5. ⏳ Générer des URLs signées pour consultation des documents côté admin
6. ⏳ Mettre en place le workflow d'approbation admin (vérification `employment_details_verified`)
7. ✅ Configuration RLS / fonction sécurisée pour les données sensibles
8. ✅ Documentation mise à jour (API INSEE, RIB, sécurité)

## 📚 Références

- [API INSEE Sirene](https://api.insee.fr/catalogue/)
- [Documentation pgcrypto](https://www.postgresql.org/docs/current/pgcrypto.html)
- [Format IBAN](https://fr.wikipedia.org/wiki/International_Bank_Account_Number)
- [Format BIC](https://fr.wikipedia.org/wiki/Code_identifiant_de_banque)
- [Numéro de sécurité sociale français](https://fr.wikipedia.org/wiki/Num%C3%A9ro_de_s%C3%A9curit%C3%A9_sociale_en_France)

