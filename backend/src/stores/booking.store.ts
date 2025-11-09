import { supabaseAdmin } from '@config/supabaseClient';
import type {
  Booking,
  CreateBookingDTO,
  BookingStatus,
} from '../types/database.types';

export class BookingStore {
  /**
   * Create a new booking
   */
  static async createBooking(
    clientId: string,
    bookingData: CreateBookingDTO
  ): Promise<Booking> {
    // Get cook profile to get hourly rate
    const { data: cookProfile, error: cookError } = await supabaseAdmin
      .from('cook_profiles')
      .select('hourly_rate')
      .eq('user_id', bookingData.cook_id)
      .single();

    if (cookError || !cookProfile) {
      throw new Error('Cook not found');
    }

    const hourlyRate = cookProfile.hourly_rate;
    const totalPrice = hourlyRate * bookingData.service_duration_hours;

    const { data, error } = await supabaseAdmin
      .from('bookings')
      .insert({
        client_id: clientId,
        cook_id: bookingData.cook_id,
        status: 'PENDING',
        service_date: bookingData.service_date,
        service_duration_hours: bookingData.service_duration_hours,
        number_of_guests: bookingData.number_of_guests,
        address: bookingData.address,
        city: bookingData.city,
        postal_code: bookingData.postal_code,
        country: bookingData.country || 'FR',
        special_requests: bookingData.special_requests || null,
        dietary_restrictions: bookingData.dietary_restrictions || null,
        pantry_items: bookingData.pantry_items || null,
        menu_description: bookingData.menu_description || null,
        total_price: totalPrice,
        hourly_rate: hourlyRate,
        can_do_groceries: bookingData.can_do_groceries || false,
        can_set_table: bookingData.can_set_table || false,
        can_do_dishes: bookingData.can_do_dishes || false,
        client_accepted: false,
        cook_accepted: false,
        payment_status: 'PENDING',
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create booking: ${error.message}`);
    }

    return data as Booking;
  }

  /**
   * Get booking by ID
   */
  static async getBookingById(bookingId: string): Promise<Booking | null> {
    const { data, error } = await supabaseAdmin
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      throw new Error(`Failed to get booking: ${error.message}`);
    }

    return data as Booking;
  }

  /**
   * Get bookings for a user (client or cook)
   */
  static async getBookingsForUser(
    userId: string,
    role: 'CLIENT' | 'COOK',
    filters?: {
      status?: BookingStatus;
      limit?: number;
      offset?: number;
    }
  ): Promise<{ bookings: Booking[]; count: number }> {
    let query = supabaseAdmin
      .from('bookings')
      .select('*', { count: 'exact' });

    if (role === 'CLIENT') {
      query = query.eq('client_id', userId);
    } else {
      query = query.eq('cook_id', userId);
    }

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
    }

    // Order by service_date desc (most recent first)
    query = query.order('service_date', { ascending: false });
    query = query.order('created_at', { ascending: false });

    const { data, error, count } = await query;

    if (error) {
      throw new Error(`Failed to get bookings: ${error.message}`);
    }

    return {
      bookings: (data as Booking[]) || [],
      count: count || 0,
    };
  }

  /**
   * Update booking
   */
  static async updateBooking(
    bookingId: string,
    updates: Partial<Booking>
  ): Promise<Booking> {
    const { data, error } = await supabaseAdmin
      .from('bookings')
      .update(updates)
      .eq('id', bookingId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update booking: ${error.message}`);
    }

    return data as Booking;
  }

  /**
   * Accept booking (by cook or client)
   */
  static async acceptBooking(
    bookingId: string,
    userId: string,
    role: 'CLIENT' | 'COOK'
  ): Promise<Booking> {
    const booking = await this.getBookingById(bookingId);
    if (!booking) {
      throw new Error('Booking not found');
    }

    // Verify user has permission
    if (role === 'CLIENT' && booking.client_id !== userId) {
      throw new Error('Unauthorized: Not the client of this booking');
    }
    if (role === 'COOK' && booking.cook_id !== userId) {
      throw new Error('Unauthorized: Not the cook of this booking');
    }

    const updates: Partial<Booking> = {};
    const now = new Date().toISOString();

    if (role === 'CLIENT') {
      updates.client_accepted = true;
      updates.client_accepted_at = now;
    } else {
      updates.cook_accepted = true;
      updates.cook_accepted_at = now;
    }

    // If both have accepted, status becomes CONFIRMED
    if (
      (role === 'CLIENT' && booking.cook_accepted) ||
      (role === 'COOK' && booking.client_accepted)
    ) {
      updates.status = 'CONFIRMED';
    } else {
      updates.status = 'ACCEPTED';
    }

    return await this.updateBooking(bookingId, updates);
  }

  /**
   * Reject booking
   */
  static async rejectBooking(
    bookingId: string,
    userId: string,
    role: 'CLIENT' | 'COOK'
  ): Promise<Booking> {
    const booking = await this.getBookingById(bookingId);
    if (!booking) {
      throw new Error('Booking not found');
    }

    // Verify user has permission
    if (role === 'CLIENT' && booking.client_id !== userId) {
      throw new Error('Unauthorized: Not the client of this booking');
    }
    if (role === 'COOK' && booking.cook_id !== userId) {
      throw new Error('Unauthorized: Not the cook of this booking');
    }

    // Can only reject if status is PENDING
    if (booking.status !== 'PENDING') {
      throw new Error('Can only reject bookings with PENDING status');
    }

    return await this.updateBooking(bookingId, {
      status: 'CANCELLED',
      cancelled_at: new Date().toISOString(),
      cancelled_by: role,
    });
  }

  /**
   * Cancel booking
   */
  static async cancelBooking(
    bookingId: string,
    userId: string,
    role: 'CLIENT' | 'COOK',
    reason?: string
  ): Promise<Booking> {
    const booking = await this.getBookingById(bookingId);
    if (!booking) {
      throw new Error('Booking not found');
    }

    // Verify user has permission
    if (role === 'CLIENT' && booking.client_id !== userId) {
      throw new Error('Unauthorized: Not the client of this booking');
    }
    if (role === 'COOK' && booking.cook_id !== userId) {
      throw new Error('Unauthorized: Not the cook of this booking');
    }

    // Can cancel if status is PENDING, ACCEPTED, or CONFIRMED
    if (!['PENDING', 'ACCEPTED', 'CONFIRMED'].includes(booking.status)) {
      throw new Error('Can only cancel bookings with PENDING, ACCEPTED, or CONFIRMED status');
    }

    return await this.updateBooking(bookingId, {
      status: 'CANCELLED',
      cancelled_at: new Date().toISOString(),
      cancelled_by: role,
      cancellation_reason: reason || null,
    });
  }
}

