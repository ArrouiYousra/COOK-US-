import { type Response } from 'express';
import { z } from 'zod';
import { type AuthRequest } from '@core/middleware';
import { UserStore } from '@stores/user.store';
import { ProfileStore } from '@stores/profile.store';
import { FilterStore } from '@stores/filter.store';

const savedFilterSchema = z.object({
  name: z
    .string()
    .min(1, 'Le nom du filtre est requis')
    .max(100, 'Le nom du filtre ne peut pas dépasser 100 caractères'),
  filters: z.object({
    location: z.string().default(''),
    specialties: z.array(z.string()).default([]),
    minBudget: z.number().min(0).default(0),
    maxBudget: z.number().min(0).default(1000),
    minRating: z.number().min(0).max(5).default(0),
    availability: z.array(z.string()).default([]),
  }),
});

const savedFilterUpdateSchema = savedFilterSchema.partial();

function mapFilterToResponse(filter: any) {
  return {
    id: filter.id,
    name: filter.name,
    filters: filter.filters,
    createdAt: filter.created_at,
    updatedAt: filter.updated_at,
  };
}

async function ensureClientContext(req: AuthRequest, res: Response) {
  if (!req.user) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'User not authenticated',
    });
    return null;
  }

  const user = await UserStore.getUserById(req.user.id);
  if (!user || user.role !== 'CLIENT') {
    res.status(403).json({
      error: 'Forbidden',
      message: 'Only clients can manage saved filters',
    });
    return null;
  }

  const clientProfile = await ProfileStore.getClientProfileByUserId(req.user.id);
  if (!clientProfile) {
    res.status(404).json({
      error: 'Not Found',
      message: 'Client profile not found',
    });
    return null;
  }

  return { user, clientProfile };
}

export const getSavedFilters = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const context = await ensureClientContext(req, res);
    if (!context) return;

    const filters = await FilterStore.getFiltersByClientProfile(context.clientProfile.id);
    res.status(200).json(filters.map(mapFilterToResponse));
  } catch (error) {
    console.error('Get saved filters error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get saved filters',
    });
  }
};

export const createSavedFilter = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const context = await ensureClientContext(req, res);
    if (!context) return;

    const parsed = savedFilterSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: 'ValidationError',
        details: parsed.error.flatten(),
      });
      return;
    }

    const filter = await FilterStore.createFilter({
      client_profile_id: context.clientProfile.id,
      name: parsed.data.name,
      filters: parsed.data.filters,
    });

    res.status(201).json(mapFilterToResponse(filter));
  } catch (error) {
    console.error('Create saved filter error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to create saved filter',
    });
  }
};

export const updateSavedFilter = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const context = await ensureClientContext(req, res);
    if (!context) return;

    const { filterId } = req.params;
    if (!filterId) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Filter ID is required',
      });
      return;
    }

    const parsed = savedFilterUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: 'ValidationError',
        details: parsed.error.flatten(),
      });
      return;
    }

    const filter = await FilterStore.updateFilter(filterId, context.clientProfile.id, parsed.data);
    res.status(200).json(mapFilterToResponse(filter));
  } catch (error) {
    console.error('Update saved filter error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to update saved filter',
    });
  }
};

export const deleteSavedFilter = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const context = await ensureClientContext(req, res);
    if (!context) return;

    const { filterId } = req.params;
    if (!filterId) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Filter ID is required',
      });
      return;
    }

    await FilterStore.deleteFilter(filterId, context.clientProfile.id);
    res.status(200).json({
      message: 'Filter deleted successfully',
    });
  } catch (error) {
    console.error('Delete saved filter error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to delete saved filter',
    });
  }
};

