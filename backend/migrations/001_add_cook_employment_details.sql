-- ============================================
-- Migration: Ajout des champs pour gestion 
-- des statuts d'emploi des cuisiniers
-- ============================================
-- Date: 2024-12-XX
-- Description: 
--   - Ajout des champs pour PORTAGE_SALARIAL (lieu de naissance, SSN, IBAN, BIC)
--   - Validation SIRET obligatoire pour AUTO_ENTREPRENEUR et MICRO_ENTREPRISE
--   - Chiffrement des données sensibles (SSN, IBAN, BIC)
-- ============================================

-- Activer l'extension pgcrypto pour le chiffrement
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Ajouter les colonnes pour les informations de portage salarial
ALTER TABLE cook_profiles
  ADD COLUMN IF NOT EXISTS birth_place VARCHAR(100),
  ADD COLUMN IF NOT EXISTS social_security_number_encrypted BYTEA, -- Chiffré avec pgcrypto
  ADD COLUMN IF NOT EXISTS iban_encrypted BYTEA, -- Chiffré avec pgcrypto
  ADD COLUMN IF NOT EXISTS bic_encrypted BYTEA, -- Chiffré avec pgcrypto
  ADD COLUMN IF NOT EXISTS rib_document_url TEXT, -- URL du document RIB uploadé
  ADD COLUMN IF NOT EXISTS employment_details_verified BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS employment_details_verified_at TIMESTAMP;

-- Ajouter un index pour les recherches par statut d'emploi
CREATE INDEX IF NOT EXISTS idx_cook_profiles_employment_status ON cook_profiles(employment_status);

-- Ajouter un index pour les vérifications SIRET
CREATE INDEX IF NOT EXISTS idx_cook_profiles_siret_verified ON cook_profiles(siret_verified) WHERE siret_verified = TRUE;

-- Commentaires pour documentation
COMMENT ON COLUMN cook_profiles.birth_place IS 'Lieu de naissance (requis pour PORTAGE_SALARIAL)';
COMMENT ON COLUMN cook_profiles.social_security_number_encrypted IS 'Numéro de sécurité sociale chiffré (requis pour PORTAGE_SALARIAL)';
COMMENT ON COLUMN cook_profiles.iban_encrypted IS 'IBAN chiffré pour le virement (requis pour PORTAGE_SALARIAL)';
COMMENT ON COLUMN cook_profiles.bic_encrypted IS 'Code BIC chiffré pour le virement (requis pour PORTAGE_SALARIAL)';
COMMENT ON COLUMN cook_profiles.rib_document_url IS 'URL du document RIB uploadé vers Supabase Storage';
COMMENT ON COLUMN cook_profiles.employment_details_verified IS 'Indique si les détails d''emploi ont été vérifiés par l''admin';
COMMENT ON COLUMN cook_profiles.employment_details_verified_at IS 'Date de vérification des détails d''emploi';

-- ============================================
-- Fonctions utilitaires pour chiffrement/déchiffrement
-- ============================================

-- Fonction pour chiffrer une valeur (utilise la clé depuis les variables d'environnement)
-- Note: En production, utilisez une clé de chiffrement forte stockée de manière sécurisée
CREATE OR REPLACE FUNCTION encrypt_sensitive_data(data TEXT)
RETURNS BYTEA AS $$
BEGIN
  -- Utilise la clé de chiffrement depuis la variable d'environnement
  -- En production, utilisez une gestion de clés plus robuste (AWS KMS, HashiCorp Vault, etc.)
  RETURN pgp_sym_encrypt(data, current_setting('app.encryption_key', TRUE));
EXCEPTION
  WHEN OTHERS THEN
    -- Si la clé n'est pas définie, retourne NULL (gestion d'erreur)
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour déchiffrer une valeur
CREATE OR REPLACE FUNCTION decrypt_sensitive_data(encrypted_data BYTEA)
RETURNS TEXT AS $$
BEGIN
  RETURN pgp_sym_decrypt(encrypted_data, current_setting('app.encryption_key', TRUE));
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Contraintes de validation
-- ============================================

-- Fonction pour valider que le SIRET est requis pour AUTO_ENTREPRENEUR et MICRO_ENTREPRISE
CREATE OR REPLACE FUNCTION validate_siret_requirement()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.employment_status IN ('AUTO_ENTREPRENEUR', 'MICRO_ENTREPRISE') THEN
    IF NEW.siret_number IS NULL OR TRIM(NEW.siret_number) = '' THEN
      RAISE EXCEPTION 'Le numéro SIRET est obligatoire pour les statuts AUTO_ENTREPRENEUR et MICRO_ENTREPRISE';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour valider le SIRET
DROP TRIGGER IF EXISTS trigger_validate_siret_requirement ON cook_profiles;
CREATE TRIGGER trigger_validate_siret_requirement
  BEFORE INSERT OR UPDATE ON cook_profiles
  FOR EACH ROW
  EXECUTE FUNCTION validate_siret_requirement();

-- Fonction pour valider que les champs de portage salarial sont requis
CREATE OR REPLACE FUNCTION validate_portage_salarial_fields()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.employment_status = 'PORTAGE_SALARIAL' THEN
    -- Vérifier que les champs requis sont présents
    -- Note: birth_place peut venir de users.date_of_birth, mais birth_place est spécifique
    IF NEW.birth_place IS NULL OR TRIM(NEW.birth_place) = '' THEN
      RAISE EXCEPTION 'Le lieu de naissance est obligatoire pour le statut PORTAGE_SALARIAL';
    END IF;
    IF NEW.social_security_number_encrypted IS NULL THEN
      RAISE EXCEPTION 'Le numéro de sécurité sociale est obligatoire pour le statut PORTAGE_SALARIAL';
    END IF;
    IF NEW.iban_encrypted IS NULL THEN
      RAISE EXCEPTION 'L''IBAN est obligatoire pour le statut PORTAGE_SALARIAL';
    END IF;
    IF NEW.bic_encrypted IS NULL THEN
      RAISE EXCEPTION 'Le code BIC est obligatoire pour le statut PORTAGE_SALARIAL';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour valider les champs de portage salarial
DROP TRIGGER IF EXISTS trigger_validate_portage_salarial ON cook_profiles;
CREATE TRIGGER trigger_validate_portage_salarial
  BEFORE INSERT OR UPDATE ON cook_profiles
  FOR EACH ROW
  EXECUTE FUNCTION validate_portage_salarial_fields();

-- ============================================
-- Vues pour faciliter l'accès aux données déchiffrées (admin uniquement)
-- ============================================

-- Vue sécurisée pour les admins (nécessite une fonction avec sécurité)
-- Note: En production, utilisez Row Level Security (RLS) de Supabase
CREATE OR REPLACE VIEW cook_profiles_decrypted AS
SELECT 
  id,
  user_id,
  status,
  headline,
  employment_status,
  siret_number,
  siret_verified,
  birth_place,
  -- Déchiffrement uniquement si l'utilisateur est admin (à implémenter avec RLS)
  decrypt_sensitive_data(social_security_number_encrypted) AS social_security_number,
  decrypt_sensitive_data(iban_encrypted) AS iban,
  decrypt_sensitive_data(bic_encrypted) AS bic,
  rib_document_url,
  employment_details_verified,
  employment_details_verified_at,
  created_at,
  updated_at
FROM cook_profiles;

-- ============================================
-- Migration terminée
-- ============================================

