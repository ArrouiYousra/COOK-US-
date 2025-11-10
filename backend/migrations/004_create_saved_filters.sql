-- ============================================
-- Migration: Création de la table client_saved_filters
-- ============================================
-- Date: 2024-XX-XX
-- Description:
--   - Crée la table client_saved_filters pour stocker les filtres sauvegardés
--     par les clients sur la page de recherche des cuisiniers.
--   - Chaque filtre est lié au profil client et stocke un JSON des critères.
-- ============================================

CREATE TABLE IF NOT EXISTS client_saved_filters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_profile_id UUID NOT NULL REFERENCES client_profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  filters JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_client_saved_filters_client_profile_id
  ON client_saved_filters(client_profile_id);

-- Trigger pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_client_saved_filters_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_client_saved_filters_updated_at
  BEFORE UPDATE ON client_saved_filters
  FOR EACH ROW
  EXECUTE FUNCTION update_client_saved_filters_updated_at();

