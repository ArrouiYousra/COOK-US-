import { supabaseAdmin } from '@config/supabaseClient';
import type { FavoriteCook } from '../types/database.types';

export class FavoriteStore {
  /**
   * Add a cook to favorites
   */
  static async addFavorite(
    clientProfileId: string,
    cookProfileId: string
  ): Promise<FavoriteCook> {
    // Check if already favorited (UNIQUE constraint)
    const existing = await this.getFavoriteByClientAndCook(clientProfileId, cookProfileId);
    if (existing) {
      throw new Error('This cook is already in your favorites');
    }

    const { data, error } = await supabaseAdmin
      .from('favorite_cooks')
      .insert({
        client_profile_id: clientProfileId,
        cook_profile_id: cookProfileId,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to add favorite: ${error.message}`);
    }

    return data as FavoriteCook;
  }

  /**
   * Remove a cook from favorites
   */
  static async removeFavorite(
    clientProfileId: string,
    cookProfileId: string
  ): Promise<void> {
    const { error } = await supabaseAdmin
      .from('favorite_cooks')
      .delete()
      .eq('client_profile_id', clientProfileId)
      .eq('cook_profile_id', cookProfileId);

    if (error) {
      throw new Error(`Failed to remove favorite: ${error.message}`);
    }
  }

  /**
   * Get favorite by client and cook
   */
  static async getFavoriteByClientAndCook(
    clientProfileId: string,
    cookProfileId: string
  ): Promise<FavoriteCook | null> {
    const { data, error } = await supabaseAdmin
      .from('favorite_cooks')
      .select('*')
      .eq('client_profile_id', clientProfileId)
      .eq('cook_profile_id', cookProfileId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Failed to get favorite: ${error.message}`);
    }

    return data as FavoriteCook;
  }

  /**
   * Get all favorites for a client
   */
  static async getFavoritesByClient(
    clientProfileId: string
  ): Promise<FavoriteCook[]> {
    const { data, error } = await supabaseAdmin
      .from('favorite_cooks')
      .select('*')
      .eq('client_profile_id', clientProfileId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to get favorites: ${error.message}`);
    }

    return (data as FavoriteCook[]) || [];
  }

  /**
   * Check if a cook is favorited by a client
   */
  static async isFavorite(
    clientProfileId: string,
    cookProfileId: string
  ): Promise<boolean> {
    const favorite = await this.getFavoriteByClientAndCook(clientProfileId, cookProfileId);
    return favorite !== null;
  }
}

