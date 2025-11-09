import { supabaseAdmin } from '@config/supabaseClient';
import type {
  CookProfile,
  ClientProfile,
  User,
  CookStatus,
} from '../types/database.types';

export class ProfileStore {
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
        return null; // Not found
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
        return null; // Not found
      }
      throw new Error(`Failed to get client profile: ${error.message}`);
    }

    return data as ClientProfile;
  }

  /**
   * Get cook profile by profile ID
   */
  static async getCookProfileById(profileId: string): Promise<CookProfile | null> {
    const { data, error } = await supabaseAdmin
      .from('cook_profiles')
      .select('*')
      .eq('id', profileId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      throw new Error(`Failed to get cook profile: ${error.message}`);
    }

    return data as CookProfile;
  }

  /**
   * Get client profile by profile ID
   */
  static async getClientProfileById(profileId: string): Promise<ClientProfile | null> {
    const { data, error } = await supabaseAdmin
      .from('client_profiles')
      .select('*')
      .eq('id', profileId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
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
   * Get list of cook profiles with filters
   */
  static async getCookProfiles(filters?: {
    status?: CookStatus;
    city?: string;
    minRating?: number;
    maxHourlyRate?: number;
    limit?: number;
    offset?: number;
  }): Promise<{ profiles: CookProfile[]; count: number }> {
    // If filtering by city, we need to join with users table
    let query;
    if (filters?.city) {
      query = supabaseAdmin
        .from('cook_profiles')
        .select('*, users!inner(city)', { count: 'exact' })
        .eq('users.city', filters.city);
    } else {
      query = supabaseAdmin.from('cook_profiles').select('*', { count: 'exact' });
    }

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.minRating) {
      query = query.gte('average_rating', filters.minRating);
    }

    if (filters?.maxHourlyRate) {
      query = query.lte('hourly_rate', filters.maxHourlyRate);
    }

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
    }

    // Order by average_rating desc, then by created_at desc
    query = query.order('average_rating', { ascending: false, nullsFirst: false });
    query = query.order('created_at', { ascending: false });

    const { data, error, count } = await query;

    if (error) {
      throw new Error(`Failed to get cook profiles: ${error.message}`);
    }

    // If we joined with users, extract only cook_profiles data
    const profiles = filters?.city
      ? (data as unknown[]).map((item: any) => {
          const { users, ...profile } = item;
          return profile;
        })
      : (data as CookProfile[]);

    return {
      profiles: profiles || [],
      count: count || 0,
    };
  }

  /**
   * Get user with their profile (cook or client)
   */
  static async getUserWithProfile(userId: string): Promise<{
    user: User;
    cookProfile?: CookProfile;
    clientProfile?: ClientProfile;
  } | null> {
    // Get user
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (userError || !userData) {
      return null;
    }

    const user = userData as User;

    // Get profile based on role
    if (user.role === 'COOK') {
      const cookProfile = await this.getCookProfileByUserId(userId);
      return {
        user,
        cookProfile: cookProfile || undefined,
      };
    } else if (user.role === 'CLIENT') {
      const clientProfile = await this.getClientProfileByUserId(userId);
      return {
        user,
        clientProfile: clientProfile || undefined,
      };
    }

    return { user };
  }
}

