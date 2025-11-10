-- ============================================
-- Migration: Sécurisation des données sensibles cuisinier
-- ============================================
-- Objectifs :
--   - Activer la Row Level Security sur cook_profiles
--   - Limiter l'accès aux données sensibles aux utilisateurs autorisés
--   - Créer une fonction sécurisée pour récupérer les données déchiffrées
--   - Restreindre l'accès à la vue cook_profiles_decrypted
-- ============================================

-- Activer la RLS
ALTER TABLE cook_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE cook_profiles FORCE ROW LEVEL SECURITY;

-- Supprimer les politiques existantes si besoin
DROP POLICY IF EXISTS cook_profiles_select_self ON cook_profiles;
DROP POLICY IF EXISTS cook_profiles_update_self ON cook_profiles;
DROP POLICY IF EXISTS cook_profiles_select_admin ON cook_profiles;

-- Autoriser un cuisinier à sélectionner sa propre fiche
CREATE POLICY cook_profiles_select_self
  ON cook_profiles
  FOR SELECT
  USING (auth.uid() = user_id);

-- Autoriser un cuisinier à mettre à jour sa fiche
CREATE POLICY cook_profiles_update_self
  ON cook_profiles
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Autoriser un admin (via role dans JWT) à consulter toutes les fiches
CREATE POLICY cook_profiles_select_admin
  ON cook_profiles
  FOR SELECT
  USING (coalesce(auth.jwt()->>'role', '') = 'ADMIN');

-- Rafraîchir la vue des données déchiffrées
DROP VIEW IF EXISTS cook_profiles_decrypted;

CREATE VIEW cook_profiles_decrypted AS
SELECT
  id,
  user_id,
  status,
  headline,
  employment_status,
  siret_number,
  siret_verified,
  birth_place,
  decrypt_sensitive_data(social_security_number_encrypted) AS social_security_number,
  decrypt_sensitive_data(iban_encrypted) AS iban,
  decrypt_sensitive_data(bic_encrypted) AS bic,
  rib_document_url,
  employment_details_verified,
  employment_details_verified_at,
  created_at,
  updated_at
FROM cook_profiles;

-- Restreindre l'accès direct à la vue aux seuls rôles serveur
REVOKE ALL ON cook_profiles_decrypted FROM PUBLIC;
GRANT SELECT ON cook_profiles_decrypted TO service_role;

-- Fonction sécurisée pour récupérer les données déchiffrées (admins uniquement)
CREATE OR REPLACE FUNCTION admin_get_cook_profiles_decrypted(target_user_id UUID DEFAULT NULL)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  status cook_status,
  headline TEXT,
  employment_status employment_status,
  siret_number VARCHAR,
  siret_verified BOOLEAN,
  birth_place VARCHAR,
  social_security_number TEXT,
  iban TEXT,
  bic TEXT,
  rib_document_url TEXT,
  employment_details_verified BOOLEAN,
  employment_details_verified_at TIMESTAMP,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
) AS $$
BEGIN
  IF coalesce(auth.jwt()->>'role', '') <> 'ADMIN' THEN
    RAISE EXCEPTION 'Accès interdit: rôle ADMIN requis';
  END IF;

  RETURN QUERY
    SELECT
      cp.id,
      cp.user_id,
      cp.status,
      cp.headline,
      cp.employment_status,
      cp.siret_number,
      cp.siret_verified,
      cp.birth_place,
      decrypt_sensitive_data(cp.social_security_number_encrypted),
      decrypt_sensitive_data(cp.iban_encrypted),
      decrypt_sensitive_data(cp.bic_encrypted),
      cp.rib_document_url,
      cp.employment_details_verified,
      cp.employment_details_verified_at,
      cp.created_at,
      cp.updated_at
    FROM cook_profiles cp
    WHERE target_user_id IS NULL OR cp.user_id = target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION admin_get_cook_profiles_decrypted(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION admin_get_cook_profiles_decrypted(UUID) TO authenticated, service_role;

-- ============================================
-- Migration terminée
-- ============================================

