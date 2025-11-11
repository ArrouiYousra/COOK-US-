-- ============================================
-- Migration: Activation de Supabase Realtime pour la table notifications
-- ============================================
-- Date: 2024-11-11
-- Description: Configure la table notifications pour émettre des événements Realtime
-- ============================================

DO $$
BEGIN
  -- S'assurer que la table dispose d'une identité de réplication complète
  ALTER TABLE public.notifications REPLICA IDENTITY FULL;

  -- Ajouter la table à la publication supabase_realtime si ce n'est pas déjà fait
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  EXCEPTION
    WHEN duplicate_object THEN
      -- La table est déjà dans la publication, ignorer l'erreur
      NULL;
  END;
END
$$;


