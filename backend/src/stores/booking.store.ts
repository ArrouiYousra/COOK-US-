import { supabaseAdmin } from '@config/supabaseClient';
import type {
  Booking,
  CreateBookingDTO,
  BookingStatus,
  CancellationReason,
} from '../types/database.types';

export class BookingStore {
  /**
   * Calculate hours from start_time and end_time
   */
  private static calculateHours(startTime: string | null, endTime: string | null): number | null {
    if (!startTime || !endTime) return null;
    
    const start = new Date(`2000-01-01T${startTime}`);
    const end = new Date(`2000-01-01T${endTime}`);
    const diffMs = end.getTime() - start.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    
    return Math.round(diffHours * 100) / 100; // Round to 2 decimals
  }

  /**
   * Create a new booking
   */
  static async createBooking(
    clientProfileId: string,
    bookingData: CreateBookingDTO
  ): Promise<Booking> {
    let hourlyRate: number | null = null;
    let cookProfileId: string | null = bookingData.cook_profile_id || null;

    // If cook_profile_id is provided, get hourly rate
    if (cookProfileId) {
      const { data: cookProfile, error: cookError } = await supabaseAdmin
        .from('cook_profiles')
        .select('hourly_rate')
        .eq('id', cookProfileId)
        .single();

      if (cookError || !cookProfile) {
        throw new Error('Cook profile not found');
      }

      hourlyRate = cookProfile.hourly_rate;
    }
    
    // Calculate hours_booked from start_time and end_time
    const hoursBooked = this.calculateHours(bookingData.start_time || null, bookingData.end_time || null);
    
    // Calculate prices (only if cook is assigned)
    const subtotal = hoursBooked && hourlyRate ? hourlyRate * hoursBooked : null;
    // Calculate extra services price based on needs
    const extraServicesPrice = 
      (bookingData.need_groceries ? 10 : 0) +
      (bookingData.need_table_setting ? 5 : 0) +
      (bookingData.need_dishes ? 5 : 0);
    const platformFee = subtotal ? subtotal * 0.1 : null; // 10% platform fee (example)
    const totalPrice = subtotal && platformFee ? subtotal + extraServicesPrice + platformFee : null;
    const cookEarnings = subtotal && platformFee ? subtotal + extraServicesPrice - platformFee : null;

    const { data, error } = await supabaseAdmin
      .from('bookings')
      .insert({
        client_profile_id: clientProfileId,
        cook_profile_id: cookProfileId,
        booking_date: bookingData.booking_date,
        meal_type: bookingData.meal_type || null,
        start_time: bookingData.start_time || null,
        end_time: bookingData.end_time || null,
        number_of_guests: bookingData.number_of_guests || null,
        status: 'PENDING',
        need_groceries: bookingData.need_groceries || false,
        need_table_setting: bookingData.need_table_setting || false,
        need_dishes: bookingData.need_dishes || false,
        dietary_restrictions: bookingData.dietary_restrictions || null,
        allergies: bookingData.allergies || null,
        special_requests: bookingData.special_requests || null,
        ingredients_available: bookingData.ingredients_available || null,
        hourly_rate: hourlyRate,
        hours_booked: hoursBooked,
        extra_services_price: extraServicesPrice,
        subtotal: subtotal,
        platform_fee: platformFee,
        total_price: totalPrice,
        cook_earnings: cookEarnings,
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
   * Get bookings for a user (client or cook) via their profile
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
    // First, get the profile ID
    let profileId: string | null = null;
    
    if (role === 'CLIENT') {
      const { data: clientProfile } = await supabaseAdmin
        .from('client_profiles')
        .select('id')
        .eq('user_id', userId)
        .single();
      profileId = clientProfile?.id || null;
    } else {
      const { data: cookProfile } = await supabaseAdmin
        .from('cook_profiles')
        .select('id')
        .eq('user_id', userId)
        .single();
      profileId = cookProfile?.id || null;
    }

    if (!profileId) {
      return { bookings: [], count: 0 };
    }

    let query = supabaseAdmin
      .from('bookings')
      .select('*', { count: 'exact' });

    if (role === 'CLIENT') {
      query = query.eq('client_profile_id', profileId);
    } else {
      query = query.eq('cook_profile_id', profileId);
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

    // Order by booking_date desc (most recent first)
    query = query.order('booking_date', { ascending: false });
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
    // Get current booking to check if status is changing to COMPLETED
    const currentBooking = await this.getBookingById(bookingId);
    const isCompleting = currentBooking && 
                         currentBooking.status !== 'COMPLETED' && 
                         updates.status === 'COMPLETED';

    const { data, error } = await supabaseAdmin
      .from('bookings')
      .update(updates)
      .eq('id', bookingId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update booking: ${error.message}`);
    }

    const updatedBooking = data as Booking;

    // If booking is being completed, create payout transaction to cook
    if (isCompleting && updatedBooking.cook_earnings && updatedBooking.cook_earnings > 0) {
      try {
        // Get cook user_id
        const { data: cookProfile } = await supabaseAdmin
          .from('cook_profiles')
          .select('user_id')
          .eq('id', updatedBooking.cook_profile_id)
          .single();

        if (cookProfile) {
          // Import TransactionStore dynamically to avoid circular dependency
          const { TransactionStore } = await import('./transaction.store');
          
          await TransactionStore.createTransaction({
            type: 'PAYOUT',
            booking_id: bookingId,
            from_user_id: undefined, // Platform pays out
            to_user_id: cookProfile.user_id,
            amount: updatedBooking.cook_earnings,
            currency: 'EUR',
            description: `Payout to cook for completed booking ${bookingId}`,
            metadata: {
              booking_id: bookingId,
              cook_profile_id: updatedBooking.cook_profile_id,
            },
          });

          // Update cook's total_earnings
          try {
            await supabaseAdmin.rpc('increment_cook_earnings', {
              cook_profile_id: updatedBooking.cook_profile_id,
              amount: updatedBooking.cook_earnings,
            });
          } catch (rpcError) {
            // If RPC doesn't exist, update manually
            const { data: currentCook } = await supabaseAdmin
              .from('cook_profiles')
              .select('total_earnings')
              .eq('id', updatedBooking.cook_profile_id)
              .single();
            
            if (currentCook) {
              await supabaseAdmin
                .from('cook_profiles')
                .update({
                  total_earnings: (currentCook.total_earnings || 0) + updatedBooking.cook_earnings,
                })
                .eq('id', updatedBooking.cook_profile_id);
            }
          }
        }
      } catch (payoutError) {
        console.error('Failed to create payout transaction:', payoutError);
        // Continue even if payout transaction creation fails
      }
    }

    return updatedBooking;
  }

  /**
   * Accept booking (changes status to ACCEPTED or CONFIRMED)
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

    // Get profile ID to verify
    let profileId: string | null = null;
    if (role === 'CLIENT') {
      const { data: clientProfile } = await supabaseAdmin
        .from('client_profiles')
        .select('id')
        .eq('user_id', userId)
        .single();
      profileId = clientProfile?.id || null;
      
      if (profileId !== booking.client_profile_id) {
        throw new Error('Unauthorized: Not the client of this booking');
      }
    } else {
      const { data: cookProfile } = await supabaseAdmin
        .from('cook_profiles')
        .select('id')
        .eq('user_id', userId)
        .single();
      profileId = cookProfile?.id || null;
      
      if (profileId !== booking.cook_profile_id) {
        throw new Error('Unauthorized: Not the cook of this booking');
      }
    }

    // If status is PENDING, change to ACCEPTED
    // If status is ACCEPTED (other party accepted), change to CONFIRMED
    let newStatus: BookingStatus;
    if (booking.status === 'PENDING') {
      newStatus = 'ACCEPTED';
    } else if (booking.status === 'ACCEPTED') {
      newStatus = 'CONFIRMED';
    } else {
      throw new Error('Can only accept bookings with PENDING or ACCEPTED status');
    }

    return await this.updateBooking(bookingId, {
      status: newStatus,
    });
  }

  /**
   * Reject booking (only if PENDING)
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

    // Get profile ID to verify
    let profileId: string | null = null;
    if (role === 'CLIENT') {
      const { data: clientProfile } = await supabaseAdmin
        .from('client_profiles')
        .select('id')
        .eq('user_id', userId)
        .single();
      profileId = clientProfile?.id || null;
      
      if (profileId !== booking.client_profile_id) {
        throw new Error('Unauthorized: Not the client of this booking');
      }
    } else {
      const { data: cookProfile } = await supabaseAdmin
        .from('cook_profiles')
        .select('id')
        .eq('user_id', userId)
        .single();
      profileId = cookProfile?.id || null;
      
      if (profileId !== booking.cook_profile_id) {
        throw new Error('Unauthorized: Not the cook of this booking');
      }
    }

    // Can only reject if status is PENDING
    if (booking.status !== 'PENDING') {
      throw new Error('Can only reject bookings with PENDING status');
    }

    return await this.updateBooking(bookingId, {
      status: 'CANCELLED',
      cancelled_at: new Date().toISOString(),
      cancelled_by: userId,
    });
  }

  /**
   * Cancel booking
   */
  static async cancelBooking(
    bookingId: string,
    userId: string,
    role: 'CLIENT' | 'COOK',
    reason?: CancellationReason,
    note?: string
  ): Promise<Booking> {
    const booking = await this.getBookingById(bookingId);
    if (!booking) {
      throw new Error('Booking not found');
    }

    // Get profile ID to verify
    let profileId: string | null = null;
    if (role === 'CLIENT') {
      const { data: clientProfile } = await supabaseAdmin
        .from('client_profiles')
        .select('id')
        .eq('user_id', userId)
        .single();
      profileId = clientProfile?.id || null;
      
      if (profileId !== booking.client_profile_id) {
        throw new Error('Unauthorized: Not the client of this booking');
      }
    } else {
      const { data: cookProfile } = await supabaseAdmin
        .from('cook_profiles')
        .select('id')
        .eq('user_id', userId)
        .single();
      profileId = cookProfile?.id || null;
      
      if (profileId !== booking.cook_profile_id) {
        throw new Error('Unauthorized: Not the cook of this booking');
      }
    }

    // Can cancel if status is PENDING, ACCEPTED, or CONFIRMED
    if (!['PENDING', 'ACCEPTED', 'CONFIRMED'].includes(booking.status)) {
      throw new Error('Can only cancel bookings with PENDING, ACCEPTED, or CONFIRMED status');
    }

    return await this.updateBooking(bookingId, {
      status: 'CANCELLED',
      cancelled_at: new Date().toISOString(),
      cancelled_by: userId,
      cancellation_reason: reason || null,
      cancellation_note: note || null,
    });
  }
}
