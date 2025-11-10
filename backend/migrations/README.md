# Migrations de Base de Données

Ce dossier contient les migrations SQL pour la base de données Supabase/PostgreSQL.

## 📋 Liste des Migrations

### 001_add_cook_employment_details.sql
**Date**: 2024-12-XX  
**Description**: Ajout des champs nécessaires pour la gestion des statuts d'emploi des cuisiniers

**Changements**:
- Ajout de `birth_place` (lieu de naissance) pour PORTAGE_SALARIAL
- Ajout de `social_security_number_encrypted` (numéro de sécurité sociale chiffré)
- Ajout de `iban_encrypted` (IBAN chiffré pour le virement)
- Ajout de `bic_encrypted` (code BIC chiffré pour le virement)
- Ajout de `rib_document_url` (URL du document RIB uploadé)
- Ajout de `employment_details_verified` et `employment_details_verified_at` (vérification admin)

**Validations**:
- SIRET obligatoire pour `AUTO_ENTREPRENEUR` et `MICRO_ENTREPRISE`
- Champs de portage salarial obligatoires pour `PORTAGE_SALARIAL`

**Sécurité**:
- Utilisation de `pgcrypto` pour chiffrer les données sensibles (SSN, IBAN, BIC)
- Fonctions `encrypt_sensitive_data()` et `decrypt_sensitive_data()` pour gérer le chiffrement
- Vue `cook_profiles_decrypted` pour l'accès admin (à sécuriser avec RLS)

## 🚀 Application des Migrations

### Via Supabase Dashboard
1. Aller dans **SQL Editor**
2. Copier le contenu de la migration
3. Exécuter le script

### Via CLI Supabase
```bash
# Si vous utilisez Supabase CLI
supabase db push
```

### Via psql
```bash
psql -h <host> -U <user> -d <database> -f migrations/001_add_cook_employment_details.sql
```

## ⚠️ Important

### Variables d'environnement requises
Avant d'appliquer la migration, configurez la clé de chiffrement :

```sql
-- Dans Supabase Dashboard > Settings > Database > Custom Config
-- Ou via SQL :
ALTER DATABASE your_database SET app.encryption_key = 'your-strong-encryption-key-here';
```

**⚠️ Sécurité**: En production, utilisez une gestion de clés robuste (AWS KMS, HashiCorp Vault, etc.)

### Génération d'une clé de chiffrement
```bash
# Générer une clé aléatoire de 32 bytes (256 bits)
openssl rand -hex 32
```

## 📝 Notes

- Les données sensibles (SSN, IBAN, BIC) sont chiffrées au repos
- Le déchiffrement nécessite la clé de chiffrement configurée
- Les triggers garantissent la cohérence des données selon le statut d'emploi
- La vue `cook_profiles_decrypted` doit être protégée par Row Level Security (RLS) en production

## 🔄 Rollback

Pour annuler cette migration :

```sql
-- Supprimer les triggers
DROP TRIGGER IF EXISTS trigger_validate_siret_requirement ON cook_profiles;
DROP TRIGGER IF EXISTS trigger_validate_portage_salarial ON cook_profiles;

-- Supprimer les fonctions
DROP FUNCTION IF EXISTS validate_siret_requirement();
DROP FUNCTION IF EXISTS validate_portage_salarial_fields();
DROP FUNCTION IF EXISTS encrypt_sensitive_data(TEXT);
DROP FUNCTION IF EXISTS decrypt_sensitive_data(BYTEA);

-- Supprimer la vue
DROP VIEW IF EXISTS cook_profiles_decrypted;

-- Supprimer les colonnes
ALTER TABLE cook_profiles
  DROP COLUMN IF EXISTS birth_place,
  DROP COLUMN IF EXISTS social_security_number_encrypted,
  DROP COLUMN IF EXISTS iban_encrypted,
  DROP COLUMN IF EXISTS bic_encrypted,
  DROP COLUMN IF EXISTS rib_document_url,
  DROP COLUMN IF EXISTS employment_details_verified,
  DROP COLUMN IF EXISTS employment_details_verified_at;

-- Supprimer les index
DROP INDEX IF EXISTS idx_cook_profiles_employment_status;
DROP INDEX IF EXISTS idx_cook_profiles_siret_verified;
```

