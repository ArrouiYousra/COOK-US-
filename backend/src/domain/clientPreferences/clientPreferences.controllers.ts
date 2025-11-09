import { type Response } from 'express';
import { type AuthRequest } from '@core/middleware';
import { ClientPreferencesStore } from '@stores/clientPreferences.store';
import { ProfileStore } from '@stores/profile.store';
import { UserStore } from '@stores/user.store';
import type { DietaryRestriction, Allergy, CuisineType } from '../../types/database.types';

// ============ DIETARY RESTRICTIONS ============

export const getMyDietaryRestrictions = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated',
      });
      return;
    }

    const clientProfile = await ProfileStore.getClientProfileByUserId(req.user.id);
    if (!clientProfile) {
      res.status(404).json({
        error: 'Not Found',
        message: 'Client profile not found',
      });
      return;
    }

    const restrictions = await ClientPreferencesStore.getDietaryRestrictions(clientProfile.id);

    res.status(200).json({
      restrictions,
      count: restrictions.length,
    });
  } catch (error) {
    console.error('Get dietary restrictions error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get dietary restrictions',
    });
  }
};

export const addDietaryRestriction = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated',
      });
      return;
    }

    const clientProfile = await ProfileStore.getClientProfileByUserId(req.user.id);
    if (!clientProfile) {
      res.status(404).json({
        error: 'Not Found',
        message: 'Client profile not found',
      });
      return;
    }

    const { restriction } = req.body;
    if (!restriction) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'restriction is required',
      });
      return;
    }

    const added = await ClientPreferencesStore.addDietaryRestriction(
      clientProfile.id,
      restriction
    );

    res.status(201).json({
      message: 'Dietary restriction added successfully',
      restriction: added,
    });
  } catch (error) {
    console.error('Add dietary restriction error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to add dietary restriction',
      details: errorMessage,
    });
  }
};

export const removeDietaryRestriction = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated',
      });
      return;
    }

    const clientProfile = await ProfileStore.getClientProfileByUserId(req.user.id);
    if (!clientProfile) {
      res.status(404).json({
        error: 'Not Found',
        message: 'Client profile not found',
      });
      return;
    }

    const { restriction } = req.params;
    if (!restriction) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'restriction is required',
      });
      return;
    }

    await ClientPreferencesStore.removeDietaryRestriction(
      clientProfile.id,
      restriction as DietaryRestriction
    );

    res.status(200).json({
      message: 'Dietary restriction removed successfully',
    });
  } catch (error) {
    console.error('Remove dietary restriction error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to remove dietary restriction',
      details: errorMessage,
    });
  }
};

// ============ ALLERGIES ============

export const getMyAllergies = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated',
      });
      return;
    }

    const clientProfile = await ProfileStore.getClientProfileByUserId(req.user.id);
    if (!clientProfile) {
      res.status(404).json({
        error: 'Not Found',
        message: 'Client profile not found',
      });
      return;
    }

    const allergies = await ClientPreferencesStore.getAllergies(clientProfile.id);

    res.status(200).json({
      allergies,
      count: allergies.length,
    });
  } catch (error) {
    console.error('Get allergies error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get allergies',
    });
  }
};

export const addAllergy = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated',
      });
      return;
    }

    const clientProfile = await ProfileStore.getClientProfileByUserId(req.user.id);
    if (!clientProfile) {
      res.status(404).json({
        error: 'Not Found',
        message: 'Client profile not found',
      });
      return;
    }

    const { allergy } = req.body;
    if (!allergy) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'allergy is required',
      });
      return;
    }

    const added = await ClientPreferencesStore.addAllergy(clientProfile.id, allergy);

    res.status(201).json({
      message: 'Allergy added successfully',
      allergy: added,
    });
  } catch (error) {
    console.error('Add allergy error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to add allergy',
      details: errorMessage,
    });
  }
};

export const removeAllergy = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated',
      });
      return;
    }

    const clientProfile = await ProfileStore.getClientProfileByUserId(req.user.id);
    if (!clientProfile) {
      res.status(404).json({
        error: 'Not Found',
        message: 'Client profile not found',
      });
      return;
    }

    const { allergy } = req.params;
    if (!allergy) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'allergy is required',
      });
      return;
    }

    await ClientPreferencesStore.removeAllergy(clientProfile.id, allergy as Allergy);

    res.status(200).json({
      message: 'Allergy removed successfully',
    });
  } catch (error) {
    console.error('Remove allergy error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to remove allergy',
      details: errorMessage,
    });
  }
};

// ============ FAVORITE CUISINES ============

export const getMyFavoriteCuisines = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated',
      });
      return;
    }

    const clientProfile = await ProfileStore.getClientProfileByUserId(req.user.id);
    if (!clientProfile) {
      res.status(404).json({
        error: 'Not Found',
        message: 'Client profile not found',
      });
      return;
    }

    const cuisines = await ClientPreferencesStore.getFavoriteCuisines(clientProfile.id);

    res.status(200).json({
      cuisines,
      count: cuisines.length,
    });
  } catch (error) {
    console.error('Get favorite cuisines error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get favorite cuisines',
    });
  }
};

export const addFavoriteCuisine = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated',
      });
      return;
    }

    const clientProfile = await ProfileStore.getClientProfileByUserId(req.user.id);
    if (!clientProfile) {
      res.status(404).json({
        error: 'Not Found',
        message: 'Client profile not found',
      });
      return;
    }

    const { cuisine } = req.body;
    if (!cuisine) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'cuisine is required',
      });
      return;
    }

    const added = await ClientPreferencesStore.addFavoriteCuisine(clientProfile.id, cuisine);

    res.status(201).json({
      message: 'Favorite cuisine added successfully',
      cuisine: added,
    });
  } catch (error) {
    console.error('Add favorite cuisine error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to add favorite cuisine',
      details: errorMessage,
    });
  }
};

export const removeFavoriteCuisine = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated',
      });
      return;
    }

    const clientProfile = await ProfileStore.getClientProfileByUserId(req.user.id);
    if (!clientProfile) {
      res.status(404).json({
        error: 'Not Found',
        message: 'Client profile not found',
      });
      return;
    }

    const { cuisine } = req.params;
    if (!cuisine) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'cuisine is required',
      });
      return;
    }

    await ClientPreferencesStore.removeFavoriteCuisine(clientProfile.id, cuisine as CuisineType);

    res.status(200).json({
      message: 'Favorite cuisine removed successfully',
    });
  } catch (error) {
    console.error('Remove favorite cuisine error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to remove favorite cuisine',
      details: errorMessage,
    });
  }
};

