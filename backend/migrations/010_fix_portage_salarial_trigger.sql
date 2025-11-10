-- ============================================
-- Migration: Correction du trigger de validation PORTAGE_SALARIAL
-- ============================================
-- Date: 2024-11-10
-- Description:
--   - Modifie le trigger validate_portage_salarial_fields pour permettre l'inscription
--     sans les champs PORTAGE_SALARIAL (ils seront complétés après)
--   - La validation ne s'applique que lors de l'UPDATE si au moins un champ est fourni
-- ============================================

-- Supprimer l'ancien trigger
DROP TRIGGER IF EXISTS trigger_validate_portage_salarial ON cook_profiles;

-- Recréer la fonction avec une logique modifiée
CREATE OR REPLACE FUNCTION validate_portage_salarial_fields()
RETURNS TRIGGER AS $$
BEGIN
  -- Ne valider que pour PORTAGE_SALARIAL
  IF NEW.employment_status = 'PORTAGE_SALARIAL' THEN
    -- Lors de l'INSERT (inscription), permettre les valeurs NULL
    -- Les champs seront complétés via updateMyProfile après l'inscription
    IF TG_OP = 'INSERT' THEN
      -- Pas de validation à l'inscription, on permet les valeurs NULL
      RETURN NEW;
    END IF;
    
    -- Lors de l'UPDATE, valider seulement si l'utilisateur essaie de compléter son profil
    -- Si au moins un champ PORTAGE_SALARIAL est fourni, tous doivent être présents
    IF TG_OP = 'UPDATE' THEN
      -- Vérifier si au moins un champ est fourni (non NULL et non vide)
      IF (NEW.birth_place IS NOT NULL AND TRIM(NEW.birth_place) != '') OR
         (NEW.social_security_number_encrypted IS NOT NULL) OR
         (NEW.iban_encrypted IS NOT NULL) OR
         (NEW.bic_encrypted IS NOT NULL) OR
         (NEW.rib_document_url IS NOT NULL AND TRIM(NEW.rib_document_url) != '') THEN
        
        -- Si au moins un champ est fourni, tous doivent être présents
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
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recréer le trigger (BEFORE INSERT OR UPDATE)
CREATE TRIGGER trigger_validate_portage_salarial
  BEFORE INSERT OR UPDATE ON cook_profiles
  FOR EACH ROW
  EXECUTE FUNCTION validate_portage_salarial_fields();

