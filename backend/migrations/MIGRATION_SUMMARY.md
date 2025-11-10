# 📋 Résumé de la Migration : Gestion des Statuts d'Emploi

## ✅ Fichiers Créés

### 1. Migration SQL
**Fichier**: `backend/migrations/001_add_cook_employment_details.sql`

**Contenu**:
- ✅ Ajout de 7 nouvelles colonnes à `cook_profiles`
- ✅ Fonctions de chiffrement/déchiffrement (`encrypt_sensitive_data`, `decrypt_sensitive_data`)
- ✅ Triggers de validation (SIRET obligatoire, champs PORTAGE_SALARIAL)
- ✅ Vue sécurisée pour admins (`cook_profiles_decrypted`)
- ✅ Index pour optimiser les requêtes

### 2. Documentation
**Fichiers**:
- `backend/migrations/README.md` - Guide d'application des migrations
- `backend/docs/COOK_EMPLOYMENT_DETAILS.md` - Documentation complète des statuts

### 3. Utilitaires
**Fichier**: `backend/src/utils/encryption.ts`
- Fonctions de validation (SSN, IBAN, BIC)
- Fonctions de formatage

### 4. Types TypeScript
**Fichier**: `backend/src/types/database.types.ts`
- ✅ Interface `CookProfile` mise à jour
- ✅ Interface `CreateCookProfileDTO` mise à jour

## 📊 Nouveaux Champs dans `cook_profiles`

| Champ | Type | Obligatoire pour | Description |
|-------|------|------------------|-------------|
| `birth_place` | VARCHAR(100) | PORTAGE_SALARIAL | Lieu de naissance |
| `social_security_number_encrypted` | BYTEA | PORTAGE_SALARIAL | Numéro de sécurité sociale (chiffré) |
| `iban_encrypted` | BYTEA | PORTAGE_SALARIAL | IBAN pour virement (chiffré) |
| `bic_encrypted` | BYTEA | PORTAGE_SALARIAL | Code BIC (chiffré) |
| `rib_document_url` | TEXT | PORTAGE_SALARIAL | URL du document RIB |
| `employment_details_verified` | BOOLEAN | - | Vérification admin |
| `employment_details_verified_at` | TIMESTAMP | - | Date de vérification |

## 🔒 Sécurité

### Données Chiffrées
- `social_security_number_encrypted`
- `iban_encrypted`
- `bic_encrypted`

### Chiffrement
- Extension: `pgcrypto`
- Fonction: `encrypt_sensitive_data(value TEXT)`
- Clé: Variable d'environnement `app.encryption_key`

### Accès Déchiffré
- Vue: `cook_profiles_decrypted`
- Protection: Row Level Security (RLS) à configurer

## ✅ Validations Automatiques

### Trigger 1: `validate_siret_requirement`
- **Déclenchement**: Avant INSERT/UPDATE
- **Règle**: SIRET obligatoire pour `AUTO_ENTREPRENEUR` et `MICRO_ENTREPRISE`
- **Erreur**: `Le numéro SIRET est obligatoire pour les statuts AUTO_ENTREPRENEUR et MICRO_ENTREPRISE`

### Trigger 2: `validate_portage_salarial_fields`
- **Déclenchement**: Avant INSERT/UPDATE
- **Règle**: Champs obligatoires pour `PORTAGE_SALARIAL`
- **Vérifie**: `birth_place`, `social_security_number_encrypted`, `iban_encrypted`, `bic_encrypted`

## 🔌 API INSEE - Informations

### Endpoint
```
GET https://api.insee.fr/entreprises/sirene/V3/siret/{siret}
```

### Authentification
1. **Inscription**: https://api.insee.fr/catalogue/
2. **Type**: OAuth 2.0 (Bearer token)
3. **Accès**: Gratuit (avec limites) ou payant

### Utilisation
```typescript
// Exemple d'implémentation future
async function validateSIRET(siret: string): Promise<boolean> {
  const response = await fetch(
    `https://api.insee.fr/entreprises/sirene/V3/siret/${siret}`,
    {
      headers: {
        'Authorization': `Bearer ${process.env.INSEE_API_TOKEN}`
      }
    }
  );
  
  const data = await response.json();
  return data.etablissement?.uniteLegale?.etatAdministratifUniteLegale === 'A';
}
```

## 📝 Prochaines Étapes

### Backend
1. ⏳ Mettre à jour `registerCookSchema` avec validation conditionnelle
2. ⏳ Implémenter le service de validation SIRET (API INSEE)
3. ⏳ Mettre à jour `UserStore.createCookProfile` pour gérer le chiffrement
4. ⏳ Créer endpoint pour upload du document RIB
5. ⏳ Configurer RLS pour la vue `cook_profiles_decrypted`

### Frontend
1. ⏳ Mettre à jour `registerCookSchema` avec champs conditionnels
2. ⏳ Adapter le formulaire pour afficher/masquer les champs selon `employmentStatus`
3. ⏳ Ajouter validation en temps réel du SIRET (appel API)
4. ⏳ Ajouter upload du document RIB
5. ⏳ Ajouter messages d'erreur spécifiques

### Configuration
1. ⏳ Configurer la clé de chiffrement (`app.encryption_key`)
2. ⏳ Obtenir les credentials API INSEE
3. ⏳ Configurer Supabase Storage pour les documents RIB
4. ⏳ Configurer RLS en production

## ⚠️ Points d'Attention

1. **Clé de chiffrement**: Générer une clé forte et la stocker de manière sécurisée
2. **RLS**: Protéger la vue `cook_profiles_decrypted` en production
3. **API INSEE**: Respecter les quotas et rate limiting
4. **Documents**: Stocker les documents RIB dans Supabase Storage avec accès restreint
5. **RGPD**: S'assurer de la conformité pour les données personnelles (SSN, IBAN)

## 🔄 Rollback

Voir `backend/migrations/README.md` pour les instructions de rollback complètes.

## 📚 Documentation Complète

- **Migration**: `backend/migrations/001_add_cook_employment_details.sql`
- **Guide**: `backend/migrations/README.md`
- **Détails**: `backend/docs/COOK_EMPLOYMENT_DETAILS.md`
- **Utilitaires**: `backend/src/utils/encryption.ts`

