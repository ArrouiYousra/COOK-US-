import { type Response } from 'express';
import { type AuthRequest } from '@core/middleware';
import { BookingStore } from '@stores/booking.store';
import { UserStore } from '@stores/user.store';
import { ProfileStore } from '@stores/profile.store';
import type { BookingStatus, CancellationReason } from '../../types/database.types';

export const createBooking = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated',
      });
      return;
    }

    // Only clients can create bookings
    const user = await UserStore.getUserById(req.user.id);
    if (!user || user.role !== 'CLIENT') {
      res.status(403).json({
        error: 'Forbidden',
        message: 'Only clients can create bookings',
      });
      return;
    }

    // Get client profile ID
    const clientProfile = await ProfileStore.getClientProfileByUserId(req.user.id);
    if (!clientProfile) {
      res.status(404).json({
        error: 'Not Found',
        message: 'Client profile not found',
      });
      return;
    }

    const {
      cook_profile_id,
      booking_date,
      meal_type,
      start_time,
      end_time,
      number_of_guests,
      need_groceries,
      need_table_setting,
      need_dishes,
      dietary_restrictions,
      allergies,
      special_requests,
      ingredients_available,
      address_id,
    } = req.body;

    // Validation
    if (!cook_profile_id || !booking_date) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'cook_profile_id and booking_date are required',
      });
      return;
    }

    // Check if cook profile exists
    const cookProfile = await ProfileStore.getCookProfileById(cook_profile_id);
    if (!cookProfile) {
      res.status(404).json({
        error: 'Not Found',
        message: 'Cook profile not found',
      });
      return;
    }

    const booking = await BookingStore.createBooking(clientProfile.id, {
      cook_profile_id,
      booking_date,
      meal_type,
      start_time,
      end_time,
      number_of_guests,
      need_groceries,
      need_table_setting,
      need_dishes,
      dietary_restrictions,
      allergies,
      special_requests,
      ingredients_available,
      address_id,
    });

    res.status(201).json({
      message: 'Booking created successfully',
      booking,
    });
  } catch (error) {
    console.error('Create booking error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to create booking';
    res.status(500).json({
      error: 'Internal Server Error',
      message: errorMessage,
    });
  }
};

export const getBookings = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated',
      });
      return;
    }

    const user = await UserStore.getUserById(req.user.id);
    if (!user) {
      res.status(404).json({
        error: 'Not Found',
        message: 'User not found',
      });
      return;
    }

    if (user.role !== 'CLIENT' && user.role !== 'COOK') {
      res.status(403).json({
        error: 'Forbidden',
        message: 'Only clients and cooks can view bookings',
      });
      return;
    }

    const { status, limit, offset } = req.query;

    const filters: {
      status?: BookingStatus;
      limit?: number;
      offset?: number;
    } = {};

    if (status) {
      filters.status = status as BookingStatus;
    }

    if (limit) {
      filters.limit = parseInt(limit as string, 10);
    }

    if (offset) {
      filters.offset = parseInt(offset as string, 10);
    }

    const result = await BookingStore.getBookingsForUser(
      req.user.id,
      user.role as 'CLIENT' | 'COOK',
      filters
    );

    res.status(200).json({
      bookings: result.bookings,
      count: result.count,
      limit: filters.limit || 10,
      offset: filters.offset || 0,
    });
  } catch (error) {
    console.error('Get bookings error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get bookings',
    });
  }
};

export const getBookingById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated',
      });
      return;
    }

    const { id } = req.params;
    if (!id) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Booking ID is required',
      });
      return;
    }

    const booking = await BookingStore.getBookingById(id);

    if (!booking) {
      res.status(404).json({
        error: 'Not Found',
        message: 'Booking not found',
      });
      return;
    }

    // Verify user has access (must be client or cook of this booking)
    const user = await UserStore.getUserById(req.user.id);
    if (!user) {
      res.status(404).json({
        error: 'Not Found',
        message: 'User not found',
      });
      return;
    }

    // Get profile IDs to verify
    let hasAccess = false;
    if (user.role === 'CLIENT') {
      const clientProfile = await ProfileStore.getClientProfileByUserId(req.user.id);
      hasAccess = clientProfile?.id === booking.client_profile_id;
    } else if (user.role === 'COOK') {
      const cookProfile = await ProfileStore.getCookProfileByUserId(req.user.id);
      hasAccess = cookProfile?.id === booking.cook_profile_id;
    }

    if (!hasAccess) {
      res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have access to this booking',
      });
      return;
    }

    res.status(200).json({
      booking,
    });
  } catch (error) {
    console.error('Get booking error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get booking',
    });
  }
};

export const acceptBooking = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated',
      });
      return;
    }

    const { id } = req.params;
    if (!id) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Booking ID is required',
      });
      return;
    }

    const user = await UserStore.getUserById(req.user.id);
    if (!user) {
      res.status(404).json({
        error: 'Not Found',
        message: 'User not found',
      });
      return;
    }

    if (user.role !== 'CLIENT' && user.role !== 'COOK') {
      res.status(403).json({
        error: 'Forbidden',
        message: 'Only clients and cooks can accept bookings',
      });
      return;
    }

    const booking = await BookingStore.acceptBooking(id, req.user.id, user.role as 'CLIENT' | 'COOK');

    res.status(200).json({
      message: 'Booking accepted successfully',
      booking,
    });
  } catch (error) {
    console.error('Accept booking error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to accept booking';
    
    if (errorMessage.includes('Unauthorized') || errorMessage.includes('not found')) {
      res.status(404).json({
        error: 'Not Found',
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

export const rejectBooking = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated',
      });
      return;
    }

    const { id } = req.params;
    if (!id) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Booking ID is required',
      });
      return;
    }

    const user = await UserStore.getUserById(req.user.id);
    if (!user) {
      res.status(404).json({
        error: 'Not Found',
        message: 'User not found',
      });
      return;
    }

    if (user.role !== 'CLIENT' && user.role !== 'COOK') {
      res.status(403).json({
        error: 'Forbidden',
        message: 'Only clients and cooks can reject bookings',
      });
      return;
    }

    const booking = await BookingStore.rejectBooking(id, req.user.id, user.role as 'CLIENT' | 'COOK');

    res.status(200).json({
      message: 'Booking rejected successfully',
      booking,
    });
  } catch (error) {
    console.error('Reject booking error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to reject booking';
    
    if (errorMessage.includes('Unauthorized') || errorMessage.includes('not found')) {
      res.status(404).json({
        error: 'Not Found',
        message: errorMessage,
      });
      return;
    }

    if (errorMessage.includes('Can only reject')) {
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

export const cancelBooking = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated',
      });
      return;
    }

    const { id } = req.params;
    if (!id) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Booking ID is required',
      });
      return;
    }

    const { reason, cancellation_note } = req.body;

    const user = await UserStore.getUserById(req.user.id);
    if (!user) {
      res.status(404).json({
        error: 'Not Found',
        message: 'User not found',
      });
      return;
    }

    if (user.role !== 'CLIENT' && user.role !== 'COOK') {
      res.status(403).json({
        error: 'Forbidden',
        message: 'Only clients and cooks can cancel bookings',
      });
      return;
    }

    const booking = await BookingStore.cancelBooking(
      id,
      req.user.id,
      user.role as 'CLIENT' | 'COOK',
      reason as CancellationReason | undefined,
      cancellation_note
    );

    res.status(200).json({
      message: 'Booking cancelled successfully',
      booking,
    });
  } catch (error) {
    console.error('Cancel booking error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to cancel booking';
    
    if (errorMessage.includes('Unauthorized') || errorMessage.includes('not found')) {
      res.status(404).json({
        error: 'Not Found',
        message: errorMessage,
      });
      return;
    }

    if (errorMessage.includes('Can only cancel')) {
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
