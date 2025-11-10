import { supabaseAdmin } from '@config/supabaseClient';
import type { SavedFilter, SavedFilterCriteria } from '../types/database.types';

interface CreateSavedFilterDTO {
  client_profile_id: string;
  name: string;
  filters: SavedFilterCriteria;
}

interface UpdateSavedFilterDTO {
  name?: string;
  filters?: SavedFilterCriteria;
}

export class FilterStore {
  static async getFiltersByClientProfile(clientProfileId: string): Promise<SavedFilter[]> {
    const { data, error } = await supabaseAdmin
      .from('client_saved_filters')
      .select('*')
      .eq('client_profile_id', clientProfileId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to get saved filters: ${error.message}`);
    }

    return (data as SavedFilter[]) || [];
  }

  static async createFilter(data: CreateSavedFilterDTO): Promise<SavedFilter> {
    const { data: insertData, error } = await supabaseAdmin
      .from('client_saved_filters')
      .insert({
        client_profile_id: data.client_profile_id,
        name: data.name,
        filters: data.filters,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create saved filter: ${error.message}`);
    }

    return insertData as SavedFilter;
  }

  static async updateFilter(
    filterId: string,
    clientProfileId: string,
    updates: UpdateSavedFilterDTO
  ): Promise<SavedFilter> {
    const { data, error } = await supabaseAdmin
      .from('client_saved_filters')
      .update({
        name: updates.name,
        filters: updates.filters,
      })
      .eq('id', filterId)
      .eq('client_profile_id', clientProfileId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update saved filter: ${error.message}`);
    }

    return data as SavedFilter;
  }

  static async deleteFilter(filterId: string, clientProfileId: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from('client_saved_filters')
      .delete()
      .eq('id', filterId)
      .eq('client_profile_id', clientProfileId);

    if (error) {
      throw new Error(`Failed to delete saved filter: ${error.message}`);
    }
  }
}

