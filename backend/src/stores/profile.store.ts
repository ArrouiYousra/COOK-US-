import { supabaseAdmin } from '@config/supabaseClient';
import type {
  CookProfile,
  ClientProfile,
  User,
  CookStatus,
} from '../types/database.types';

interface GetCookProfilesFilters {
  status?: CookStatus;
  city?: string;
  minRating?: number;
  maxHourlyRate?: number;
  limit?: number;
  offset?: number;
}

interface GetCookProfilesResult {
  profiles: CookProfile[];
  count: number;
}

interface UserWithProfile {
  user: User;
  cookProfile?: CookProfile | null;
  clientProfile?: ClientProfile | null;
}

export class ProfileStore {
  /**
   * Get user with their cook and/or client profile
   */
  static async getUserWithProfile(userId: string): Promise<UserWithProfile | null> {
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return null;
    }

    // Get cook profile if exists
    const { data: cookProfile } = await supabaseAdmin
      .from('cook_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    // Get client profile if exists
    const { data: clientProfile } = await supabaseAdmin
      .from('client_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    return {
      user: user as User,
      cookProfile: cookProfile as CookProfile | null,
      clientProfile: clientProfile as ClientProfile | null,
    };
  }

  /**
   * Get cook profile by user ID
   */
  static async getCookProfileByUserId(userId: string): Promise<CookProfile | null> {
    const { data, error } = await supabaseAdmin
      .from('cook_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Failed to get cook profile: ${error.message}`);
    }

    return data as CookProfile;
  }

  /**
   * Get cook profile by ID
   */
  static async getCookProfileById(cookProfileId: string): Promise<CookProfile | null> {
    const { data, error } = await supabaseAdmin
      .from('cook_profiles')
      .select('*')
      .eq('id', cookProfileId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Failed to get cook profile: ${error.message}`);
    }

    return data as CookProfile;
  }

  /**
   * Get client profile by user ID
   */
  static async getClientProfileByUserId(userId: string): Promise<ClientProfile | null> {
    const { data, error } = await supabaseAdmin
      .from('client_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Failed to get client profile: ${error.message}`);
    }

    return data as ClientProfile;
  }

  /**
   * Update cook profile
   */
  static async updateCookProfile(
    userId: string,
    updates: Partial<CookProfile>
  ): Promise<CookProfile> {
    const { data, error } = await supabaseAdmin
      .from('cook_profiles')
      .update(updates)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update cook profile: ${error.message}`);
    }

    return data as CookProfile;
  }

  /**
   * Update client profile
   */
  static async updateClientProfile(
    userId: string,
    updates: Partial<ClientProfile>
  ): Promise<ClientProfile> {
    const { data, error } = await supabaseAdmin
      .from('client_profiles')
      .update(updates)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update client profile: ${error.message}`);
    }

    return data as ClientProfile;
  }

  /**
   * Get cook profiles with filters
   */
  static async getCookProfiles(filters: GetCookProfilesFilters = {}): Promise<GetCookProfilesResult> {
    let query = supabaseAdmin
      .from('cook_profiles')
      .select('*', { count: 'exact' });

    // Apply status filter
    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    // Apply min rating filter
    if (filters.minRating !== undefined) {
      query = query.gte('average_rating', filters.minRating);
    }

    // Apply max hourly rate filter
    if (filters.maxHourlyRate !== undefined) {
      query = query.lte('hourly_rate', filters.maxHourlyRate);
    }

    // Apply pagination
    const limit = filters.limit || 10;
    const offset = filters.offset || 0;
    query = query.range(offset, offset + limit - 1);

    // Order by average rating (descending) by default
    query = query.order('average_rating', { ascending: false, nullsLast: true });

    const { data, error, count } = await query;

    if (error) {
      throw new Error(`Failed to get cook profiles: ${error.message}`);
    }

    return {
      profiles: (data as CookProfile[]) || [],
      count: count || 0,
    };
  }
}

