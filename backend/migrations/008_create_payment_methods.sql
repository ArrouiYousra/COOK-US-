-- ============================================
-- Migration: Création de la table payment_methods et ajout de stripe_customer_id
-- ============================================
-- Date: 2024-XX-XX
-- Description:
--   - Ajoute le champ stripe_customer_id à la table users pour lier un utilisateur à son Customer Stripe
--   - Crée la table payment_methods pour stocker les cartes de paiement enregistrées via Stripe
-- ============================================

-- Ajouter stripe_customer_id à la table users
ALTER TABLE users
ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(255) UNIQUE;

-- Créer un index pour les recherches rapides
CREATE INDEX IF NOT EXISTS idx_users_stripe_customer_id ON users(stripe_customer_id);

-- Table des méthodes de paiement (cartes enregistrées)
CREATE TABLE IF NOT EXISTS payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  stripe_payment_method_id VARCHAR(255) NOT NULL UNIQUE,
  type VARCHAR(50) NOT NULL DEFAULT 'card',
  last4 VARCHAR(4),
  brand VARCHAR(50), -- visa, mastercard, amex, etc.
  expiry_month INT,
  expiry_year INT,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index pour les recherches rapides
CREATE INDEX IF NOT EXISTS idx_payment_methods_user_id ON payment_methods(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_methods_stripe_id ON payment_methods(stripe_payment_method_id);
CREATE INDEX IF NOT EXISTS idx_payment_methods_is_default ON payment_methods(user_id, is_default) WHERE is_default = TRUE;

-- Trigger pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_payment_methods_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_payment_methods_updated_at
  BEFORE UPDATE ON payment_methods
  FOR EACH ROW
  EXECUTE FUNCTION update_payment_methods_updated_at();

-- Contrainte : un seul payment method par défaut par utilisateur
CREATE UNIQUE INDEX IF NOT EXISTS idx_payment_methods_one_default_per_user
  ON payment_methods(user_id)
  WHERE is_default = TRUE;

