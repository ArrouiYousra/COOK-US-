-- ============================================
-- Migration: Ajout de la colonne notification_preferences à la table users
-- ============================================
-- Date: 2024-XX-XX
-- Description: Ajoute une colonne JSONB pour stocker les préférences de notifications détaillées
-- ============================================

ALTER TABLE users
ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{
  "booking_request": {"email": true, "sms": false, "push": true},
  "booking_accepted": {"email": true, "sms": false, "push": true},
  "booking_confirmed": {"email": true, "sms": true, "push": true},
  "booking_cancelled": {"email": true, "sms": false, "push": true},
  "booking_reminder": {"email": true, "sms": true, "push": true},
  "review_received": {"email": true, "sms": false, "push": true},
  "message_received": {"email": false, "sms": false, "push": true},
  "payment_received": {"email": true, "sms": false, "push": true},
  "dispute_opened": {"email": true, "sms": false, "push": true},
  "profile_approved": {"email": true, "sms": false, "push": true},
  "profile_rejected": {"email": true, "sms": false, "push": true}
}'::jsonb;

-- Index pour améliorer les performances des requêtes sur notification_preferences
CREATE INDEX IF NOT EXISTS idx_users_notification_preferences ON users USING gin(notification_preferences);

