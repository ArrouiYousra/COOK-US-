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
   * Get client proposals with simplified filters (pending, accepted, rejected)
   */
  static async getClientProposals(
    userId: string,
    filter?: 'pending' | 'accepted' | 'rejected',
    limit?: number,
    offset?: number
  ): Promise<{ bookings: Booking[]; count: number; stats: { pending: number; accepted: number; rejected: number } }> {
    // Get client profile ID
    const { data: clientProfile } = await supabaseAdmin
      .from('client_profiles')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (!clientProfile) {
      return { bookings: [], count: 0, stats: { pending: 0, accepted: 0, rejected: 0 } };
    }

    // Build query based on filter
    let statusFilter: BookingStatus[] | null = null;
    if (filter === 'pending') {
      statusFilter = ['PENDING'];
    } else if (filter === 'accepted') {
      statusFilter = ['ACCEPTED', 'CONFIRMED'];
    } else if (filter === 'rejected') {
      statusFilter = ['CANCELLED'];
    }

    // Get filtered bookings
    // IMPORTANT: Les propositions privées sont uniquement les bookings avec un cuisinier assigné
    // Exclure les demandes publiques (cook_profile_id IS NULL)
    let query = supabaseAdmin
      .from('bookings')
      .select('*', { count: 'exact' })
      .eq('client_profile_id', clientProfile.id);

    // Filtrer pour exclure les demandes publiques (cook_profile_id IS NOT NULL)
    // En Supabase, on utilise .not() avec 'is' et null pour exclure les valeurs NULL
    query = query.not('cook_profile_id', 'is', null);

    if (statusFilter && statusFilter.length > 0) {
      query = query.in('status', statusFilter);
    }

    // Get stats (all statuses for this client, mais uniquement les propositions privées)
    const { data: allBookings } = await supabaseAdmin
      .from('bookings')
      .select('status')
      .eq('client_profile_id', clientProfile.id)
      .not('cook_profile_id', 'is', null); // Exclure les demandes publiques

    const stats = {
      pending: allBookings?.filter((b) => b.status === 'PENDING').length || 0,
      accepted: allBookings?.filter((b) => b.status === 'ACCEPTED' || b.status === 'CONFIRMED').length || 0,
      rejected: allBookings?.filter((b) => b.status === 'CANCELLED').length || 0,
    };

    // Apply pagination
    if (limit) {
      query = query.limit(limit);
    }

    if (offset !== undefined) {
      const endRange = offset + (limit || 10) - 1;
      query = query.range(offset, endRange);
    }

    // Order by booking_date desc (most recent first)
    query = query.order('booking_date', { ascending: false });
    query = query.order('created_at', { ascending: false });

    const { data, error, count } = await query;

    if (error) {
      throw new Error(`Failed to get client proposals: ${error.message}`);
    }

    const bookings = (data as Booking[]) || [];
    
    // Log pour déboguer
    console.log(`[BookingStore.getClientProposals] Client ${userId}: ${bookings.length} propositions privées trouvées`);
    bookings.forEach((b, index) => {
      console.log(`[BookingStore] Proposition privée #${index + 1}:`, {
        id: b.id?.slice(0, 8),
        status: b.status,
        cook_profile_id: b.cook_profile_id,
        client_profile_id: b.client_profile_id,
        booking_date: b.booking_date,
      });
    });

    return {
      bookings,
      count: count || 0,
      stats,
    };
  }

  /**
   * Get public requests (bookings without cook_profile_id, status PENDING)
   * These are requests that clients have published and cooks can apply to
   */
  static async getPublicRequests(
    filters?: {
      city?: string;
      limit?: number;
      offset?: number;
    }
  ): Promise<{ bookings: Booking[]; count: number }> {
    let query = supabaseAdmin
      .from('bookings')
      .select('*', { count: 'exact' })
      .is('cook_profile_id', null)
      .eq('status', 'PENDING');

    // Apply city filter if provided (requires join with addresses and users)
    if (filters?.city) {
      // We'll need to join with addresses and users to filter by city
      // For now, we'll get all and filter in the application layer
      // TODO: Optimize with proper join query
    }

    // Apply pagination
    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
    }

    // Order by booking_date asc (soonest first), then created_at desc
    query = query.order('booking_date', { ascending: true });
    query = query.order('created_at', { ascending: false });

    const { data, error, count } = await query;

    if (error) {
      throw new Error(`Failed to get public requests: ${error.message}`);
    }

    let bookings = (data as Booking[]) || [];

    // Filter by city if provided (requires fetching client profile and user)
    if (filters?.city && bookings.length > 0) {
      const filteredBookings: Booking[] = [];
      for (const booking of bookings) {
        // Get client profile
        const { data: clientProfile } = await supabaseAdmin
          .from('client_profiles')
          .select('user_id')
          .eq('id', booking.client_profile_id)
          .single();

        if (clientProfile) {
          // Get user to check city
          const { data: user } = await supabaseAdmin
            .from('users')
            .select('city')
            .eq('id', clientProfile.user_id)
            .single();

          if (user && user.city?.toLowerCase() === filters.city?.toLowerCase()) {
            filteredBookings.push(booking);
          }
        }
      }
      bookings = filteredBookings;
    }

    return {
      bookings,
      count: count || 0,
    };
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
      // IMPORTANT: Pour les clients, on veut TOUS les bookings (y compris ceux avec cook_profile_id = null)
      // Ne pas filtrer par cook_profile_id pour inclure les demandes publiques
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

    const bookings = (data as Booking[]) || [];
    
    // Log pour déboguer
    if (role === 'CLIENT') {
      console.log(`[BookingStore.getBookingsForUser] Client ${userId}: ${bookings.length} bookings trouvés`);
      bookings.forEach((b, index) => {
        console.log(`[BookingStore] Booking #${index + 1}:`, {
          id: b.id?.slice(0, 8),
          status: b.status,
          cook_profile_id: b.cook_profile_id,
          cook_profile_id_is_null: b.cook_profile_id === null,
          client_profile_id: b.client_profile_id,
          booking_date: b.booking_date,
        });
      });
    }

    return {
      bookings,
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
