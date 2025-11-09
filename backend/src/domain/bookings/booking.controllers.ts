import { type Response } from 'express';
import { type AuthRequest } from '@core/middleware';
import { BookingStore } from '@stores/booking.store';
import { UserStore } from '@stores/user.store';
import type { BookingStatus } from '../../types/database.types';

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

    const {
      cook_id,
      service_date,
      service_duration_hours,
      number_of_guests,
      address,
      city,
      postal_code,
      country,
      special_requests,
      dietary_restrictions,
      pantry_items,
      menu_description,
      can_do_groceries,
      can_set_table,
      can_do_dishes,
    } = req.body;

    // Validation
    if (!cook_id || !service_date || !service_duration_hours || !number_of_guests) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'cook_id, service_date, service_duration_hours, and number_of_guests are required',
      });
      return;
    }

    if (!address || !city || !postal_code) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'address, city, and postal_code are required',
      });
      return;
    }

    // Check if cook exists and is active
    const cookUser = await UserStore.getUserById(cook_id);
    if (!cookUser || cookUser.role !== 'COOK') {
      res.status(404).json({
        error: 'Not Found',
        message: 'Cook not found',
      });
      return;
    }

    const booking = await BookingStore.createBooking(req.user.id, {
      cook_id,
      service_date,
      service_duration_hours,
      number_of_guests,
      address,
      city,
      postal_code,
      country,
      special_requests,
      dietary_restrictions,
      pantry_items,
      menu_description,
      can_do_groceries,
      can_set_table,
      can_do_dishes,
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
    if (booking.client_id !== req.user.id && booking.cook_id !== req.user.id) {
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
    const { reason } = req.body;

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
      reason
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

