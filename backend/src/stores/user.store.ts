import { supabaseAdmin } from '@config/supabaseClient';
import type {
  User,
  CreateUserDTO,
  CreateCookProfileDTO,
  CreateClientProfileDTO,
  CookProfile,
  ClientProfile,
} from '../types/database.types';

export class UserStore {
  /**
   * Create a new user in the database
   */
  static async createUser(userId: string, userData: CreateUserDTO): Promise<User> {
    const { data, error } = await supabaseAdmin
      .from('users')
      .insert({
        id: userId, // Use Supabase Auth user ID
        email: userData.email,
        password: userData.password, // This will be hashed by Supabase Auth
        first_name: userData.first_name,
        last_name: userData.last_name,
        role: userData.role ?? 'CLIENT',
        phone: userData.phone ?? null,
        date_of_birth: userData.date_of_birth ?? null,
        address: userData.address ?? null,
        city: userData.city ?? null,
        postal_code: userData.postal_code ?? null,
        country: userData.country ?? 'FR',
        status: 'PENDING_VERIFICATION',
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create user: ${error.message}`);
    }

    return data as User;
  }

  /**
   * Get user by ID
   */
  static async getUserById(userId: string): Promise<User | null> {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      throw new Error(`Failed to get user: ${error.message}`);
    }

    return data as User;
  }

  /**
   * Get user by email
   */
  static async getUserByEmail(email: string): Promise<User | null> {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      throw new Error(`Failed to get user: ${error.message}`);
    }

    return data as User;
  }

  /**
   * Update user
   */
  static async updateUser(userId: string, updates: Partial<User>): Promise<User> {
    const { data, error } = await supabaseAdmin
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update user: ${error.message}`);
    }

    return data as User;
  }

  /**
   * Create cook profile
   */
  static async createCookProfile(profileData: CreateCookProfileDTO): Promise<CookProfile> {
    const { data, error } = await supabaseAdmin
      .from('cook_profiles')
      .insert({
        user_id: profileData.user_id,
        headline: profileData.headline,
        hourly_rate: profileData.hourly_rate,
        employment_status: profileData.employment_status,
        bio: profileData.bio ?? null,
        service_radius: profileData.service_radius ?? 10,
        minimum_booking_hours: profileData.minimum_booking_hours ?? 2,
        status: 'PENDING_APPROVAL',
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create cook profile: ${error.message}`);
    }

    return data as CookProfile;
  }

  /**
   * Create client profile
   */
  static async createClientProfile(profileData: CreateClientProfileDTO): Promise<ClientProfile> {
    const { data, error } = await supabaseAdmin
      .from('client_profiles')
      .insert({
        user_id: profileData.user_id,
        household_size: profileData.household_size ?? null,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create client profile: ${error.message}`);
    }

    return data as ClientProfile;
  }
}

