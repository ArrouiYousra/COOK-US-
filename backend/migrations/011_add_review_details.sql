-- ============================================
-- Migration: Ajout des détails aux avis (detailedRatings, photos, isRecommended)
-- ============================================
-- Date: 2024-11-11
-- Description: Ajoute les colonnes pour stocker les notes détaillées, photos et recommandation
-- ============================================

-- Ajouter la colonne detailed_ratings (JSONB) pour stocker les notes détaillées
ALTER TABLE reviews
ADD COLUMN IF NOT EXISTS detailed_ratings JSONB DEFAULT NULL;

-- Ajouter la colonne photos (TEXT[]) pour stocker les URLs des photos
ALTER TABLE reviews
ADD COLUMN IF NOT EXISTS photos TEXT[] DEFAULT NULL;

-- Ajouter la colonne is_recommended (BOOLEAN) pour indiquer si le cuisinier est recommandé
ALTER TABLE reviews
ADD COLUMN IF NOT EXISTS is_recommended BOOLEAN DEFAULT FALSE;

-- Index pour améliorer les performances des requêtes sur detailed_ratings
CREATE INDEX IF NOT EXISTS idx_reviews_detailed_ratings ON reviews USING gin(detailed_ratings);

-- Index pour améliorer les performances des requêtes sur is_recommended
CREATE INDEX IF NOT EXISTS idx_reviews_is_recommended ON reviews (is_recommended);

-- Commentaires pour documentation
COMMENT ON COLUMN reviews.detailed_ratings IS 'Notes détaillées: {quality, punctuality, cleanliness, communication} (0-5)';
COMMENT ON COLUMN reviews.photos IS 'Tableau des URLs des photos uploadées';
COMMENT ON COLUMN reviews.is_recommended IS 'Indique si le cuisinier est recommandé par le client';

