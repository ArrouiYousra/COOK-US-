import { supabaseAdmin } from '@config/supabaseClient';
import type { Reservation } from '../types/database.types';

export class ReservationStore {
  /**
   * Create a reservation (cook applies to a booking)
   */
  static async createReservation(
    bookingId: string,
    userId: string
  ): Promise<Reservation> {
    // Check if reservation already exists
    const existing = await this.getReservationByBookingAndUser(bookingId, userId);
    if (existing) {
      throw new Error('You have already applied to this booking');
    }

    const { data, error } = await supabaseAdmin
      .from('reservations')
      .insert({
        booking_id: bookingId,
        user_id: userId,
        status: 'PENDING',
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create reservation: ${error.message}`);
    }

    return data as Reservation;
  }

  /**
   * Get reservation by booking and user
   */
  static async getReservationByBookingAndUser(
    bookingId: string,
    userId: string
  ): Promise<Reservation | null> {
    const { data, error } = await supabaseAdmin
      .from('reservations')
      .select('*')
      .eq('booking_id', bookingId)
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Failed to get reservation: ${error.message}`);
    }

    return data as Reservation;
  }

  /**
   * Get all reservations for a booking
   */
  static async getReservationsByBooking(
    bookingId: string
  ): Promise<Reservation[]> {
    const { data, error } = await supabaseAdmin
      .from('reservations')
      .select('*')
      .eq('booking_id', bookingId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to get reservations: ${error.message}`);
    }

    return (data as Reservation[]) || [];
  }

  /**
   * Get all reservations for a user (cook)
   */
  static async getReservationsByUser(
    userId: string
  ): Promise<Reservation[]> {
    const { data, error } = await supabaseAdmin
      .from('reservations')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to get reservations: ${error.message}`);
    }

    return (data as Reservation[]) || [];
  }

  /**
   * Confirm a reservation (client chooses a cook)
   */
  static async confirmReservation(
    reservationId: string,
    bookingId: string
  ): Promise<{ reservation: Reservation; booking: any }> {
    // Get reservation
    const { data: reservation, error: getError } = await supabaseAdmin
      .from('reservations')
      .select('*')
      .eq('id', reservationId)
      .single();

    if (getError || !reservation) {
      throw new Error('Reservation not found');
    }

    if (reservation.status !== 'PENDING') {
      throw new Error('Reservation is not pending');
    }

    // Update reservation status
    const { data: updatedReservation, error: updateError } = await supabaseAdmin
      .from('reservations')
      .update({ status: 'CONFIRMED' })
      .eq('id', reservationId)
      .select()
      .single();

    if (updateError) {
      throw new Error(`Failed to confirm reservation: ${updateError.message}`);
    }

    // Cancel all other reservations for this booking
    await supabaseAdmin
      .from('reservations')
      .update({ status: 'CANCELLED' })
      .eq('booking_id', bookingId)
      .neq('id', reservationId);

    // Get cook profile from user_id
    const { data: cookProfile, error: cookError } = await supabaseAdmin
      .from('cook_profiles')
      .select('id')
      .eq('user_id', (reservation as Reservation).user_id)
      .single();

    if (cookError || !cookProfile) {
      throw new Error('Cook profile not found for this user');
    }

    // Update booking with cook_profile_id
    const { data: booking, error: bookingError } = await supabaseAdmin
      .from('bookings')
      .update({
        cook_profile_id: cookProfile.id,
        status: 'ACCEPTED',
      })
      .eq('id', bookingId)
      .select()
      .single();

    if (bookingError) {
      throw new Error(`Failed to update booking: ${bookingError.message}`);
    }

    return {
      reservation: updatedReservation as Reservation,
      booking,
    };
  }

  /**
   * Cancel a reservation
   */
  static async cancelReservation(reservationId: string): Promise<Reservation> {
    const { data, error } = await supabaseAdmin
      .from('reservations')
      .update({ status: 'CANCELLED' })
      .eq('id', reservationId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to cancel reservation: ${error.message}`);
    }

    return data as Reservation;
  }

  /**
   * Get available bookings (public bookings without cook assigned)
   */
  static async getAvailableBookings(
    filters?: {
      city?: string;
      meal_type?: string;
      booking_date?: string;
      limit?: number;
      offset?: number;
    }
  ): Promise<{ bookings: any[]; count: number }> {
    let query = supabaseAdmin
      .from('bookings')
      .select('*, client_profiles!inner(user_id)', { count: 'exact' })
      .is('cook_profile_id', null)
      .eq('status', 'PENDING');

    if (filters?.booking_date) {
      query = query.eq('booking_date', filters.booking_date);
    }

    if (filters?.meal_type) {
      query = query.eq('meal_type', filters.meal_type);
    }

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
    }

    query = query.order('booking_date', { ascending: true });
    query = query.order('created_at', { ascending: false });

    const { data, error, count } = await query;

    if (error) {
      throw new Error(`Failed to get available bookings: ${error.message}`);
    }

    // Extract booking data (remove client_profiles join data)
    const bookings = (data || []).map((item: any) => {
      const { client_profiles, ...booking } = item;
      return booking;
    });

    return {
      bookings,
      count: count || 0,
    };
  }
}

