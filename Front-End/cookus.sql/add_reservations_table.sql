-- ============================================
-- TABLE RESERVATIONS (Propositions des cuisiniers sur demandes publiques)
-- ============================================
-- Cette table permet de gérer les propositions multiples des cuisiniers
-- sur une même demande publique (booking avec cook_profile_id = NULL)

-- ENUM pour le statut des réservations
CREATE TYPE reservation_status AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED', 'EXPIRED');

-- Table des réservations (propositions)
CREATE TABLE reservations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  cook_profile_id UUID NOT NULL REFERENCES cook_profiles(id) ON DELETE CASCADE,
  
  -- Statut de la proposition
  status reservation_status DEFAULT 'PENDING',
  
  -- Détails de la proposition
  proposed_price NUMERIC(12,2) NOT NULL,  -- Prix total proposé
  proposed_hours NUMERIC(5,2),           -- Nombre d'heures proposées
  proposed_hourly_rate NUMERIC(10,2),     -- Tarif horaire proposé
  message TEXT,                            -- Message personnalisé du cuisinier
  
  -- Services additionnels proposés
  can_do_groceries BOOLEAN DEFAULT FALSE,
  can_set_table BOOLEAN DEFAULT FALSE,
  can_do_dishes BOOLEAN DEFAULT FALSE,
  
  -- Dates importantes
  expires_at TIMESTAMP,                    -- Date d'expiration de la proposition (72h par défaut)
  accepted_at TIMESTAMP,                   -- Date d'acceptation par le client
  rejected_at TIMESTAMP,                   -- Date de refus par le client
  cancelled_at TIMESTAMP,                  -- Date d'annulation par le cuisinier
  
  -- Raison du refus/annulation
  rejection_reason TEXT,
  cancellation_reason TEXT,
  
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  
  -- Un cuisinier ne peut proposer qu'une seule fois sur une demande
  UNIQUE(booking_id, cook_profile_id)
);

-- Index pour performance
CREATE INDEX idx_reservations_booking ON reservations(booking_id);
CREATE INDEX idx_reservations_cook ON reservations(cook_profile_id);
CREATE INDEX idx_reservations_status ON reservations(status);
CREATE INDEX idx_reservations_expires ON reservations(expires_at) WHERE status = 'PENDING';

-- Trigger pour updated_at
CREATE TRIGGER reservations_updated_at_trigger
  BEFORE UPDATE ON reservations
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- ============================================
-- MISE À JOUR DES ENUMS EXISTANTS
-- ============================================

-- Ajouter le statut PUBLIC_REQUEST_PENDING au booking_status
-- Note: PostgreSQL ne permet pas de modifier un ENUM directement
-- Il faut le faire manuellement ou via une migration
-- ALTER TYPE booking_status ADD VALUE 'PUBLIC_REQUEST_PENDING';

-- Pour l'instant, on peut utiliser 'PENDING' pour les demandes publiques
-- et distinguer via cook_profile_id IS NULL

-- ============================================
-- AJOUT DE CHAMPS POUR PAIEMENT EN 2 TEMPS
-- ============================================

-- Ajouter les colonnes pour le paiement en 2 temps dans bookings
ALTER TABLE bookings 
  ADD COLUMN IF NOT EXISTS deposit_amount NUMERIC(12,2),      -- Montant de l'acompte (30%)
  ADD COLUMN IF NOT EXISTS remaining_amount NUMERIC(12,2),   -- Montant restant (70%)
  ADD COLUMN IF NOT EXISTS deposit_paid_at TIMESTAMP,       -- Date de paiement de l'acompte
  ADD COLUMN IF NOT EXISTS remaining_paid_at TIMESTAMP,     -- Date de paiement du solde
  ADD COLUMN IF NOT EXISTS deposit_payment_intent_id VARCHAR(255),  -- Stripe payment intent pour l'acompte
  ADD COLUMN IF NOT EXISTS remaining_payment_intent_id VARCHAR(255); -- Stripe payment intent pour le solde

-- Index pour les paiements
CREATE INDEX IF NOT EXISTS idx_bookings_deposit_paid ON bookings(deposit_paid_at) WHERE deposit_paid_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_bookings_remaining_paid ON bookings(remaining_paid_at) WHERE remaining_paid_at IS NOT NULL;

-- ============================================
-- FONCTIONS UTILITAIRES
-- ============================================

-- Fonction pour expirer automatiquement les propositions expirées
CREATE OR REPLACE FUNCTION expire_old_reservations()
RETURNS void AS $$
BEGIN
  UPDATE reservations
  SET status = 'EXPIRED', updated_at = now()
  WHERE status = 'PENDING'
    AND expires_at IS NOT NULL
    AND expires_at < now();
END;
$$ LANGUAGE plpgsql;

-- Fonction pour rejeter automatiquement les autres propositions quand une est acceptée
CREATE OR REPLACE FUNCTION auto_reject_other_reservations()
RETURNS TRIGGER AS $$
BEGIN
  -- Si une proposition est acceptée, rejeter toutes les autres pour ce booking
  IF NEW.status = 'ACCEPTED' AND OLD.status != 'ACCEPTED' THEN
    UPDATE reservations
    SET status = 'REJECTED',
        rejected_at = now(),
        rejection_reason = 'Autre proposition acceptée par le client',
        updated_at = now()
    WHERE booking_id = NEW.booking_id
      AND id != NEW.id
      AND status = 'PENDING';
    
    -- Mettre à jour le booking avec le cuisinier accepté
    UPDATE bookings
    SET cook_profile_id = NEW.cook_profile_id,
        status = 'ACCEPTED',  -- Ou 'PROPOSAL_ACCEPTED' si on ajoute ce statut
        updated_at = now()
    WHERE id = NEW.booking_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour rejeter automatiquement les autres propositions
CREATE TRIGGER auto_reject_reservations_trigger
  AFTER UPDATE OF status ON reservations
  FOR EACH ROW
  WHEN (NEW.status = 'ACCEPTED' AND OLD.status != 'ACCEPTED')
  EXECUTE FUNCTION auto_reject_other_reservations();

-- ============================================
-- COMMENTAIRES
-- ============================================

COMMENT ON TABLE reservations IS 'Propositions des cuisiniers sur les demandes publiques';
COMMENT ON COLUMN reservations.booking_id IS 'Référence à la demande publique (booking avec cook_profile_id = NULL)';
COMMENT ON COLUMN reservations.cook_profile_id IS 'Le cuisinier qui fait la proposition';
COMMENT ON COLUMN reservations.proposed_price IS 'Prix total proposé par le cuisinier';
COMMENT ON COLUMN reservations.expires_at IS 'Date d''expiration de la proposition (72h par défaut)';
COMMENT ON COLUMN bookings.deposit_amount IS 'Montant de l''acompte (30% du total)';
COMMENT ON COLUMN bookings.remaining_amount IS 'Montant restant à payer (70% du total)';

