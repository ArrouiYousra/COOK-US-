import { supabaseAdmin } from '@config/supabaseClient';
import type {
  CookPortfolioItem,
  CreatePortfolioItemDTO,
  UpdatePortfolioItemDTO,
} from '../types/database.types';

export class PortfolioStore {
  /**
   * Create a new portfolio item
   */
  static async createPortfolioItem(
    cookProfileId: string,
    itemData: CreatePortfolioItemDTO
  ): Promise<CookPortfolioItem> {
    // Get the current max display_order for this cook
    const { data: existingItems } = await supabaseAdmin
      .from('cook_portfolio_items')
      .select('display_order')
      .eq('cook_profile_id', cookProfileId)
      .order('display_order', { ascending: false })
      .limit(1)
      .single();

    const displayOrder = itemData.display_order ?? (existingItems?.display_order ?? 0) + 1;

    const { data, error } = await supabaseAdmin
      .from('cook_portfolio_items')
      .insert({
        cook_profile_id: cookProfileId,
        title: itemData.title,
        description: itemData.description ?? null,
        image_url: itemData.image_url,
        category: itemData.category ?? null,
        display_order: displayOrder,
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase error details:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      });
      throw new Error(`Failed to create portfolio item: ${error.message} (code: ${error.code})`);
    }

    return data as CookPortfolioItem;
  }

  /**
   * Get all portfolio items for a cook
   */
  static async getPortfolioItemsByCookProfileId(
    cookProfileId: string
  ): Promise<CookPortfolioItem[]> {
    const { data, error } = await supabaseAdmin
      .from('cook_portfolio_items')
      .select('*')
      .eq('cook_profile_id', cookProfileId)
      .order('display_order', { ascending: true });

    if (error) {
      throw new Error(`Failed to get portfolio items: ${error.message}`);
    }

    return (data ?? []) as CookPortfolioItem[];
  }

  /**
   * Get a single portfolio item by ID
   */
  static async getPortfolioItemById(itemId: string): Promise<CookPortfolioItem | null> {
    const { data, error } = await supabaseAdmin
      .from('cook_portfolio_items')
      .select('*')
      .eq('id', itemId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      throw new Error(`Failed to get portfolio item: ${error.message}`);
    }

    return data as CookPortfolioItem;
  }

  /**
   * Update a portfolio item
   */
  static async updatePortfolioItem(
    itemId: string,
    cookProfileId: string,
    updates: UpdatePortfolioItemDTO
  ): Promise<CookPortfolioItem> {
    // Verify the item belongs to the cook
    const item = await this.getPortfolioItemById(itemId);
    if (!item || item.cook_profile_id !== cookProfileId) {
      throw new Error('Portfolio item not found or access denied');
    }

    const { data, error } = await supabaseAdmin
      .from('cook_portfolio_items')
      .update({
        ...(updates.title && { title: updates.title }),
        ...(updates.description !== undefined && { description: updates.description ?? null }),
        ...(updates.image_url && { image_url: updates.image_url }),
        ...(updates.category !== undefined && { category: updates.category ?? null }),
        ...(updates.display_order && { display_order: updates.display_order }),
        updated_at: new Date().toISOString(),
      })
      .eq('id', itemId)
      .eq('cook_profile_id', cookProfileId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update portfolio item: ${error.message}`);
    }

    return data as CookPortfolioItem;
  }

  /**
   * Delete a portfolio item
   */
  static async deletePortfolioItem(itemId: string, cookProfileId: string): Promise<void> {
    // Verify the item belongs to the cook
    const item = await this.getPortfolioItemById(itemId);
    if (!item || item.cook_profile_id !== cookProfileId) {
      throw new Error('Portfolio item not found or access denied');
    }

    const { error } = await supabaseAdmin
      .from('cook_portfolio_items')
      .delete()
      .eq('id', itemId)
      .eq('cook_profile_id', cookProfileId);

    if (error) {
      throw new Error(`Failed to delete portfolio item: ${error.message}`);
    }
  }

  /**
   * Reorder portfolio items
   */
  static async reorderPortfolioItems(
    cookProfileId: string,
    itemIds: string[]
  ): Promise<CookPortfolioItem[]> {
    // Verify all items belong to the cook
    const { data: items } = await supabaseAdmin
      .from('cook_portfolio_items')
      .select('id')
      .eq('cook_profile_id', cookProfileId)
      .in('id', itemIds);

    if (!items || items.length !== itemIds.length) {
      throw new Error('Some portfolio items not found or access denied');
    }

    // Update display_order for each item
    const updates = itemIds.map((id, index) => ({
      id,
      display_order: index + 1,
    }));

    const promises = updates.map((update) =>
      supabaseAdmin
        .from('cook_portfolio_items')
        .update({ display_order: update.display_order })
        .eq('id', update.id)
        .eq('cook_profile_id', cookProfileId)
    );

    await Promise.all(promises);

    // Return updated items
    return this.getPortfolioItemsByCookProfileId(cookProfileId);
  }
}

