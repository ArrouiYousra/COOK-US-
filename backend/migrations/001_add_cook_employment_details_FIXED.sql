-- ============================================
-- FIX: Migration corrigée pour Supabase
-- Remplace les fonctions qui utilisent current_setting()
-- par des fonctions qui lisent la clé depuis une table
-- ============================================

-- Table pour stocker la clé de chiffrement (protégée)
CREATE TABLE IF NOT EXISTS app_encryption_keys (
  id TEXT PRIMARY KEY DEFAULT 'main',
  encryption_key TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Fonction pour définir la clé (à exécuter une seule fois)
CREATE OR REPLACE FUNCTION set_encryption_key(key_value TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO app_encryption_keys (id, encryption_key, updated_at)
  VALUES ('main', key_value, NOW())
  ON CONFLICT (id) 
  DO UPDATE SET encryption_key = EXCLUDED.encryption_key, updated_at = NOW();
END;
$$;

-- Restreindre l'accès à la table
REVOKE ALL ON app_encryption_keys FROM PUBLIC;
GRANT SELECT ON app_encryption_keys TO authenticated, service_role;

-- Fonction pour chiffrer (corrigée)
CREATE OR REPLACE FUNCTION encrypt_sensitive_data(data TEXT)
RETURNS BYTEA AS $$
DECLARE
  key TEXT;
BEGIN
  SELECT encryption_key INTO key 
  FROM app_encryption_keys 
  WHERE id = 'main'
  LIMIT 1;
  
  IF key IS NULL THEN
    RAISE EXCEPTION 'Clé de chiffrement non configurée. Exécutez: SELECT set_encryption_key(''votre_cle'');';
  END IF;
  
  RETURN pgp_sym_encrypt(data, key);
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Erreur de chiffrement: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour déchiffrer (corrigée)
CREATE OR REPLACE FUNCTION decrypt_sensitive_data(encrypted_data BYTEA)
RETURNS TEXT AS $$
DECLARE
  key TEXT;
BEGIN
  SELECT encryption_key INTO key 
  FROM app_encryption_keys 
  WHERE id = 'main'
  LIMIT 1;
  
  IF key IS NULL THEN
    RAISE EXCEPTION 'Clé de chiffrement non configurée. Exécutez: SELECT set_encryption_key(''votre_cle'');';
  END IF;
  
  RETURN pgp_sym_decrypt(encrypted_data, key);
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Instructions d'utilisation :
-- ============================================
-- 1. Exécutez cette migration dans Supabase SQL Editor
-- 2. Puis exécutez (remplacez par votre vraie clé) :
--    SELECT set_encryption_key('VOTRE_CLE_32_CARACTERES');
-- ============================================

