import { type Response } from 'express';
import { type AuthRequest } from '@core/middleware';
import { ReservationStore } from '@stores/reservation.store';
import { BookingStore } from '@stores/booking.store';
import { UserStore } from '@stores/user.store';
import { ProfileStore } from '@stores/profile.store';
import { supabaseAdmin } from '@config/supabaseClient';

export const applyToBooking = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated',
      });
      return;
    }

    const { bookingId } = req.params;

    if (!bookingId) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Booking ID is required',
      });
      return;
    }

    // Only cooks can apply
    const user = await UserStore.getUserById(req.user.id);
    if (!user || user.role !== 'COOK') {
      res.status(403).json({
        error: 'Forbidden',
        message: 'Only cooks can apply to bookings',
      });
      return;
    }

    // Verify booking exists and is public (no cook assigned)
    const booking = await BookingStore.getBookingById(bookingId);
    if (!booking) {
      res.status(404).json({
        error: 'Not Found',
        message: 'Booking not found',
      });
      return;
    }

    if (booking.cook_profile_id) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'This booking already has a cook assigned',
      });
      return;
    }

    if (booking.status !== 'PENDING') {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Can only apply to bookings with PENDING status',
      });
      return;
    }

    const reservation = await ReservationStore.createReservation(
      bookingId,
      req.user.id
    );

    res.status(201).json({
      message: 'Reservation submitted successfully',
      reservation,
    });
  } catch (error) {
    console.error('Apply to booking error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to apply to booking';
    
    if (errorMessage.includes('already applied')) {
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

export const getBookingReservations = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated',
      });
      return;
    }

    const { bookingId } = req.params;
    if (!bookingId) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Booking ID is required',
      });
      return;
    }

    // Verify user is the client of this booking
    const booking = await BookingStore.getBookingById(bookingId);
    if (!booking) {
      res.status(404).json({
        error: 'Not Found',
        message: 'Booking not found',
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

    // Only client can see reservations
    if (user.role !== 'CLIENT') {
      res.status(403).json({
        error: 'Forbidden',
        message: 'Only the client can view reservations',
      });
      return;
    }

    const clientProfile = await ProfileStore.getClientProfileByUserId(req.user.id);
    if (!clientProfile || clientProfile.id !== booking.client_profile_id) {
      res.status(403).json({
        error: 'Forbidden',
        message: 'You are not the client of this booking',
      });
      return;
    }

    const reservations = await ReservationStore.getReservationsByBooking(bookingId);

    // Get cook profile info for each reservation
    const reservationsWithCooks = await Promise.all(
      reservations.map(async (reservation) => {
        const cookUser = await UserStore.getUserById(reservation.user_id);
        const cookProfile = cookUser
          ? await ProfileStore.getCookProfileByUserId(cookUser.id)
          : null;

        return {
          ...reservation,
          cook: cookUser && cookProfile
            ? {
                profile_id: cookProfile.id,
                user_id: cookUser.id,
                first_name: cookUser.first_name,
                last_name: cookUser.last_name,
                avatar_url: cookUser.avatar_url,
                headline: cookProfile.headline,
                hourly_rate: cookProfile.hourly_rate,
                average_rating: cookProfile.average_rating,
              }
            : null,
        };
      })
    );

    res.status(200).json({
      reservations: reservationsWithCooks,
      count: reservationsWithCooks.length,
    });
  } catch (error) {
    console.error('Get reservations error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get reservations',
    });
  }
};

export const confirmReservation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated',
      });
      return;
    }

    const { bookingId, reservationId } = req.params;
    if (!bookingId || !reservationId) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Booking ID and Reservation ID are required',
      });
      return;
    }

    // Verify user is the client
    const user = await UserStore.getUserById(req.user.id);
    if (!user || user.role !== 'CLIENT') {
      res.status(403).json({
        error: 'Forbidden',
        message: 'Only the client can confirm reservations',
      });
      return;
    }

    const booking = await BookingStore.getBookingById(bookingId);
    if (!booking) {
      res.status(404).json({
        error: 'Not Found',
        message: 'Booking not found',
      });
      return;
    }

    const clientProfile = await ProfileStore.getClientProfileByUserId(req.user.id);
    if (!clientProfile || clientProfile.id !== booking.client_profile_id) {
      res.status(403).json({
        error: 'Forbidden',
        message: 'You are not the client of this booking',
      });
      return;
    }

    const result = await ReservationStore.confirmReservation(reservationId, bookingId);

    res.status(200).json({
      message: 'Reservation confirmed successfully. Booking is now confirmed.',
      reservation: result.reservation,
      booking: result.booking,
    });
  } catch (error) {
    console.error('Confirm reservation error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to confirm reservation';
    
    if (errorMessage.includes('not found') || errorMessage.includes('not pending')) {
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

export const cancelReservation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated',
      });
      return;
    }

    const { reservationId } = req.params;
    if (!reservationId) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Reservation ID is required',
      });
      return;
    }

    // Get reservation to verify ownership
    const { data: reservation, error: resError } = await supabaseAdmin
      .from('reservations')
      .select('booking_id, user_id')
      .eq('id', reservationId)
      .single();

    if (resError || !reservation) {
      res.status(404).json({
        error: 'Not Found',
        message: 'Reservation not found',
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

    // Client can cancel (reject) or cook can cancel (withdraw)
    const booking = await BookingStore.getBookingById(reservation.booking_id);
    if (!booking) {
      res.status(404).json({
        error: 'Not Found',
        message: 'Booking not found',
      });
      return;
    }

    // If client, verify ownership
    if (user.role === 'CLIENT') {
      const clientProfile = await ProfileStore.getClientProfileByUserId(req.user.id);
      if (!clientProfile || clientProfile.id !== booking.client_profile_id) {
        res.status(403).json({
          error: 'Forbidden',
          message: 'You are not the client of this booking',
        });
        return;
      }
    } else if (user.role === 'COOK') {
      // If cook, verify it's their reservation
      if (reservation.user_id !== req.user.id) {
        res.status(403).json({
          error: 'Forbidden',
          message: 'This is not your reservation',
        });
        return;
      }
    } else {
      res.status(403).json({
        error: 'Forbidden',
        message: 'Only clients and cooks can cancel reservations',
      });
      return;
    }

    const cancelledReservation = await ReservationStore.cancelReservation(reservationId);

    res.status(200).json({
      message: 'Reservation cancelled successfully',
      reservation: cancelledReservation,
    });
  } catch (error) {
    console.error('Cancel reservation error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to cancel reservation';
    
    if (errorMessage.includes('not found')) {
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

export const getAvailableBookings = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated',
      });
      return;
    }

    // Only cooks can see available bookings
    const user = await UserStore.getUserById(req.user.id);
    if (!user || user.role !== 'COOK') {
      res.status(403).json({
        error: 'Forbidden',
        message: 'Only cooks can view available bookings',
      });
      return;
    }

    const { meal_type, booking_date, limit, offset } = req.query;

    const filters: {
      meal_type?: string;
      booking_date?: string;
      limit?: number;
      offset?: number;
    } = {};

    if (meal_type) {
      filters.meal_type = meal_type as string;
    }

    if (booking_date) {
      filters.booking_date = booking_date as string;
    }

    if (limit) {
      filters.limit = parseInt(limit as string, 10);
    }

    if (offset) {
      filters.offset = parseInt(offset as string, 10);
    }

    const result = await ReservationStore.getAvailableBookings(filters);

    res.status(200).json({
      bookings: result.bookings,
      count: result.count,
      limit: filters.limit || 10,
      offset: filters.offset || 0,
    });
  } catch (error) {
    console.error('Get available bookings error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get available bookings',
    });
  }
};

