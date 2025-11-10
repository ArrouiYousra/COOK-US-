-- ============================================
-- Migration: Ajout du champ fcm_token pour les notifications push
-- ============================================
-- Date: 2024-12-XX
-- Description: 
--   - Ajout du champ fcm_token dans la table users pour stocker les tokens Firebase Cloud Messaging
--   - Permet l'envoi de notifications push aux utilisateurs
-- ============================================

-- Ajouter la colonne fcm_token dans la table users
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS fcm_token TEXT,
  ADD COLUMN IF NOT EXISTS fcm_token_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Ajouter un index pour les recherches par token (optionnel, pour nettoyage)
CREATE INDEX IF NOT EXISTS idx_users_fcm_token ON users(fcm_token) WHERE fcm_token IS NOT NULL;

-- Commentaire pour documentation
COMMENT ON COLUMN users.fcm_token IS 'Firebase Cloud Messaging token pour les notifications push';
COMMENT ON COLUMN users.fcm_token_updated_at IS 'Date de dernière mise à jour du token FCM';

