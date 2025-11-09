import { supabaseAdmin } from '@config/supabaseClient';
import type {
  Availability,
  BlockedDate,
  CreateAvailabilityDTO,
  CreateBlockedDateDTO,
} from '../types/database.types';

export class AvailabilityStore {
  /**
   * Create an availability for a cook
   */
  static async createAvailability(
    cookProfileId: string,
    availabilityData: CreateAvailabilityDTO
  ): Promise<Availability> {
    // Check if availability already exists (UNIQUE constraint)
    const existing = await this.getAvailabilityByCookDayMeal(
      cookProfileId,
      availabilityData.day_of_week,
      availabilityData.meal_type
    );

    if (existing) {
      throw new Error(
        'An availability already exists for this day and meal type. Update it instead.'
      );
    }

    const { data, error } = await supabaseAdmin
      .from('availabilities')
      .insert({
        cook_profile_id: cookProfileId,
        day_of_week: availabilityData.day_of_week,
        meal_type: availabilityData.meal_type,
        start_time: availabilityData.start_time,
        end_time: availabilityData.end_time,
        is_active: availabilityData.is_active ?? true,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create availability: ${error.message}`);
    }

    return data as Availability;
  }

  /**
   * Get availability by cook, day, and meal type
   */
  static async getAvailabilityByCookDayMeal(
    cookProfileId: string,
    dayOfWeek: string,
    mealType: string
  ): Promise<Availability | null> {
    const { data, error } = await supabaseAdmin
      .from('availabilities')
      .select('*')
      .eq('cook_profile_id', cookProfileId)
      .eq('day_of_week', dayOfWeek)
      .eq('meal_type', mealType)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Failed to get availability: ${error.message}`);
    }

    return data as Availability;
  }

  /**
   * Get all availabilities for a cook
   */
  static async getAvailabilitiesByCook(
    cookProfileId: string
  ): Promise<Availability[]> {
    const { data, error } = await supabaseAdmin
      .from('availabilities')
      .select('*')
      .eq('cook_profile_id', cookProfileId)
      .order('day_of_week', { ascending: true })
      .order('meal_type', { ascending: true });

    if (error) {
      throw new Error(`Failed to get availabilities: ${error.message}`);
    }

    return (data as Availability[]) || [];
  }

  /**
   * Update an availability
   */
  static async updateAvailability(
    availabilityId: string,
    cookProfileId: string,
    updates: Partial<CreateAvailabilityDTO> & { is_active?: boolean }
  ): Promise<Availability> {
    // Verify ownership
    const availability = await this.getAvailabilityById(availabilityId);
    if (!availability) {
      throw new Error('Availability not found');
    }

    if (availability.cook_profile_id !== cookProfileId) {
      throw new Error('You can only update your own availabilities');
    }

    const { data, error } = await supabaseAdmin
      .from('availabilities')
      .update({
        day_of_week: updates.day_of_week,
        meal_type: updates.meal_type,
        start_time: updates.start_time,
        end_time: updates.end_time,
        is_active: updates.is_active,
      })
      .eq('id', availabilityId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update availability: ${error.message}`);
    }

    return data as Availability;
  }

  /**
   * Delete an availability
   */
  static async deleteAvailability(
    availabilityId: string,
    cookProfileId: string
  ): Promise<void> {
    // Verify ownership
    const availability = await this.getAvailabilityById(availabilityId);
    if (!availability) {
      throw new Error('Availability not found');
    }

    if (availability.cook_profile_id !== cookProfileId) {
      throw new Error('You can only delete your own availabilities');
    }

    const { error } = await supabaseAdmin
      .from('availabilities')
      .delete()
      .eq('id', availabilityId);

    if (error) {
      throw new Error(`Failed to delete availability: ${error.message}`);
    }
  }

  /**
   * Get availability by ID
   */
  static async getAvailabilityById(availabilityId: string): Promise<Availability | null> {
    const { data, error } = await supabaseAdmin
      .from('availabilities')
      .select('*')
      .eq('id', availabilityId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Failed to get availability: ${error.message}`);
    }

    return data as Availability;
  }

  /**
   * Create a blocked date for a cook
   */
  static async createBlockedDate(
    cookProfileId: string,
    blockedDateData: CreateBlockedDateDTO
  ): Promise<BlockedDate> {
    // Check if date is already blocked (UNIQUE constraint)
    const existing = await this.getBlockedDateByCookAndDate(
      cookProfileId,
      blockedDateData.date
    );

    if (existing) {
      throw new Error('This date is already blocked');
    }

    const { data, error } = await supabaseAdmin
      .from('blocked_dates')
      .insert({
        cook_profile_id: cookProfileId,
        date: blockedDateData.date,
        reason: blockedDateData.reason || null,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create blocked date: ${error.message}`);
    }

    return data as BlockedDate;
  }

  /**
   * Get blocked date by cook and date
   */
  static async getBlockedDateByCookAndDate(
    cookProfileId: string,
    date: string
  ): Promise<BlockedDate | null> {
    const { data, error } = await supabaseAdmin
      .from('blocked_dates')
      .select('*')
      .eq('cook_profile_id', cookProfileId)
      .eq('date', date)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Failed to get blocked date: ${error.message}`);
    }

    return data as BlockedDate;
  }

  /**
   * Get all blocked dates for a cook
   */
  static async getBlockedDatesByCook(
    cookProfileId: string,
    filters?: { from_date?: string; to_date?: string }
  ): Promise<BlockedDate[]> {
    let query = supabaseAdmin
      .from('blocked_dates')
      .select('*')
      .eq('cook_profile_id', cookProfileId)
      .order('date', { ascending: true });

    if (filters?.from_date) {
      query = query.gte('date', filters.from_date);
    }

    if (filters?.to_date) {
      query = query.lte('date', filters.to_date);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to get blocked dates: ${error.message}`);
    }

    return (data as BlockedDate[]) || [];
  }

  /**
   * Delete a blocked date
   */
  static async deleteBlockedDate(
    blockedDateId: string,
    cookProfileId: string
  ): Promise<void> {
    // Verify ownership
    const blockedDate = await this.getBlockedDateById(blockedDateId);
    if (!blockedDate) {
      throw new Error('Blocked date not found');
    }

    if (blockedDate.cook_profile_id !== cookProfileId) {
      throw new Error('You can only delete your own blocked dates');
    }

    const { error } = await supabaseAdmin
      .from('blocked_dates')
      .delete()
      .eq('id', blockedDateId);

    if (error) {
      throw new Error(`Failed to delete blocked date: ${error.message}`);
    }
  }

  /**
   * Get blocked date by ID
   */
  static async getBlockedDateById(blockedDateId: string): Promise<BlockedDate | null> {
    const { data, error } = await supabaseAdmin
      .from('blocked_dates')
      .select('*')
      .eq('id', blockedDateId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Failed to get blocked date: ${error.message}`);
    }

    return data as BlockedDate;
  }
}

