import { type Response } from 'express';
import { type AuthRequest } from '@core/middleware';
import { AvailabilityStore } from '@stores/availability.store';
import { ProfileStore } from '@stores/profile.store';
import { UserStore } from '@stores/user.store';

// ============ AVAILABILITIES ============

export const getMyAvailabilities = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated',
      });
      return;
    }

    // Only cooks can manage availabilities
    const user = await UserStore.getUserById(req.user.id);
    if (!user || user.role !== 'COOK') {
      res.status(403).json({
        error: 'Forbidden',
        message: 'Only cooks can manage availabilities',
      });
      return;
    }

    const cookProfile = await ProfileStore.getCookProfileByUserId(req.user.id);
    if (!cookProfile) {
      res.status(404).json({
        error: 'Not Found',
        message: 'Cook profile not found',
      });
      return;
    }

    const availabilities = await AvailabilityStore.getAvailabilitiesByCook(cookProfile.id);

    res.status(200).json({
      availabilities,
      count: availabilities.length,
    });
  } catch (error) {
    console.error('Get availabilities error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get availabilities',
    });
  }
};

export const getCookAvailabilities = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated',
      });
      return;
    }

    const { cookId } = req.params;
    if (!cookId) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Cook ID is required',
      });
      return;
    }

    const cookProfile = await ProfileStore.getCookProfileById(cookId);
    if (!cookProfile) {
      res.status(404).json({
        error: 'Not Found',
        message: 'Cook profile not found',
      });
      return;
    }

    // Only return active availabilities for public view
    const allAvailabilities = await AvailabilityStore.getAvailabilitiesByCook(cookProfile.id);
    const activeAvailabilities = allAvailabilities.filter((a) => a.is_active);

    res.status(200).json({
      availabilities: activeAvailabilities,
      count: activeAvailabilities.length,
    });
  } catch (error) {
    console.error('Get cook availabilities error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get cook availabilities',
    });
  }
};

export const createAvailability = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated',
      });
      return;
    }

    // Only cooks can create availabilities
    const user = await UserStore.getUserById(req.user.id);
    if (!user || user.role !== 'COOK') {
      res.status(403).json({
        error: 'Forbidden',
        message: 'Only cooks can create availabilities',
      });
      return;
    }

    const cookProfile = await ProfileStore.getCookProfileByUserId(req.user.id);
    if (!cookProfile) {
      res.status(404).json({
        error: 'Not Found',
        message: 'Cook profile not found',
      });
      return;
    }

    const { day_of_week, meal_type, start_time, end_time, is_active } = req.body;

    if (!day_of_week || !meal_type || !start_time || !end_time) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'day_of_week, meal_type, start_time, and end_time are required',
      });
      return;
    }

    const availability = await AvailabilityStore.createAvailability(cookProfile.id, {
      day_of_week,
      meal_type,
      start_time,
      end_time,
      is_active,
    });

    res.status(201).json({
      message: 'Availability created successfully',
      availability,
    });
  } catch (error) {
    console.error('Create availability error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to create availability';
    
    if (errorMessage.includes('already exists')) {
      res.status(400).json({
        error: 'Bad Request',
        message: errorMessage,
      });
      return;
    }

    res.status(500).json({
      error: 'Internal Server Error',
      message: errorMessage,
    });
  }
};

export const updateAvailability = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated',
      });
      return;
    }

    const { availabilityId } = req.params;
    if (!availabilityId) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Availability ID is required',
      });
      return;
    }

    // Only cooks can update availabilities
    const user = await UserStore.getUserById(req.user.id);
    if (!user || user.role !== 'COOK') {
      res.status(403).json({
        error: 'Forbidden',
        message: 'Only cooks can update availabilities',
      });
      return;
    }

    const cookProfile = await ProfileStore.getCookProfileByUserId(req.user.id);
    if (!cookProfile) {
      res.status(404).json({
        error: 'Not Found',
        message: 'Cook profile not found',
      });
      return;
    }

    const { day_of_week, meal_type, start_time, end_time, is_active } = req.body;

    const availability = await AvailabilityStore.updateAvailability(
      availabilityId,
      cookProfile.id,
      {
        day_of_week,
        meal_type,
        start_time,
        end_time,
        is_active,
      }
    );

    res.status(200).json({
      message: 'Availability updated successfully',
      availability,
    });
  } catch (error) {
    console.error('Update availability error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to update availability';
    
    if (errorMessage.includes('not found') || errorMessage.includes('only update')) {
      res.status(400).json({
        error: 'Bad Request',
        message: errorMessage,
      });
      return;
    }

    res.status(500).json({
      error: 'Internal Server Error',
      message: errorMessage,
    });
  }
};

export const deleteAvailability = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated',
      });
      return;
    }

    const { availabilityId } = req.params;
    if (!availabilityId) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Availability ID is required',
      });
      return;
    }

    // Only cooks can delete availabilities
    const user = await UserStore.getUserById(req.user.id);
    if (!user || user.role !== 'COOK') {
      res.status(403).json({
        error: 'Forbidden',
        message: 'Only cooks can delete availabilities',
      });
      return;
    }

    const cookProfile = await ProfileStore.getCookProfileByUserId(req.user.id);
    if (!cookProfile) {
      res.status(404).json({
        error: 'Not Found',
        message: 'Cook profile not found',
      });
      return;
    }

    await AvailabilityStore.deleteAvailability(availabilityId, cookProfile.id);

    res.status(200).json({
      message: 'Availability deleted successfully',
    });
  } catch (error) {
    console.error('Delete availability error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete availability';
    
    if (errorMessage.includes('not found') || errorMessage.includes('only delete')) {
      res.status(400).json({
        error: 'Bad Request',
        message: errorMessage,
      });
      return;
    }

    res.status(500).json({
      error: 'Internal Server Error',
      message: errorMessage,
    });
  }
};

// ============ BLOCKED DATES ============

export const getMyBlockedDates = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated',
      });
      return;
    }

    // Only cooks can manage blocked dates
    const user = await UserStore.getUserById(req.user.id);
    if (!user || user.role !== 'COOK') {
      res.status(403).json({
        error: 'Forbidden',
        message: 'Only cooks can manage blocked dates',
      });
      return;
    }

    const cookProfile = await ProfileStore.getCookProfileByUserId(req.user.id);
    if (!cookProfile) {
      res.status(404).json({
        error: 'Not Found',
        message: 'Cook profile not found',
      });
      return;
    }

    const { from_date, to_date } = req.query;

    const blockedDates = await AvailabilityStore.getBlockedDatesByCook(cookProfile.id, {
      from_date: from_date as string | undefined,
      to_date: to_date as string | undefined,
    });

    res.status(200).json({
      blocked_dates: blockedDates,
      count: blockedDates.length,
    });
  } catch (error) {
    console.error('Get blocked dates error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get blocked dates',
    });
  }
};

export const createBlockedDate = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated',
      });
      return;
    }

    // Only cooks can create blocked dates
    const user = await UserStore.getUserById(req.user.id);
    if (!user || user.role !== 'COOK') {
      res.status(403).json({
        error: 'Forbidden',
        message: 'Only cooks can create blocked dates',
      });
      return;
    }

    const cookProfile = await ProfileStore.getCookProfileByUserId(req.user.id);
    if (!cookProfile) {
      res.status(404).json({
        error: 'Not Found',
        message: 'Cook profile not found',
      });
      return;
    }

    const { date, reason } = req.body;

    if (!date) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'date is required',
      });
      return;
    }

    const blockedDate = await AvailabilityStore.createBlockedDate(cookProfile.id, {
      date,
      reason,
    });

    res.status(201).json({
      message: 'Blocked date created successfully',
      blocked_date: blockedDate,
    });
  } catch (error) {
    console.error('Create blocked date error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to create blocked date';
    
    if (errorMessage.includes('already blocked')) {
      res.status(400).json({
        error: 'Bad Request',
        message: errorMessage,
      });
      return;
    }

    res.status(500).json({
      error: 'Internal Server Error',
      message: errorMessage,
    });
  }
};

export const deleteBlockedDate = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated',
      });
      return;
    }

    const { blockedDateId } = req.params;
    if (!blockedDateId) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Blocked date ID is required',
      });
      return;
    }

    // Only cooks can delete blocked dates
    const user = await UserStore.getUserById(req.user.id);
    if (!user || user.role !== 'COOK') {
      res.status(403).json({
        error: 'Forbidden',
        message: 'Only cooks can delete blocked dates',
      });
      return;
    }

    const cookProfile = await ProfileStore.getCookProfileByUserId(req.user.id);
    if (!cookProfile) {
      res.status(404).json({
        error: 'Not Found',
        message: 'Cook profile not found',
      });
      return;
    }

    await AvailabilityStore.deleteBlockedDate(blockedDateId, cookProfile.id);

    res.status(200).json({
      message: 'Blocked date deleted successfully',
    });
  } catch (error) {
    console.error('Delete blocked date error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete blocked date';
    
    if (errorMessage.includes('not found') || errorMessage.includes('only delete')) {
      res.status(400).json({
        error: 'Bad Request',
        message: errorMessage,
      });
      return;
    }

    res.status(500).json({
      error: 'Internal Server Error',
      message: errorMessage,
    });
  }
};

