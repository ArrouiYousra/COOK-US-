import { supabaseAdmin } from "@config/supabaseClient";
import type {
  CookPortfolioItem,
  CreatePortfolioItemDTO,
  UpdatePortfolioItemDTO,
} from "../types/database.types";

export class PortfolioStore {
  /**
   * Create a new portfolio item
   */
  static async createPortfolioItem(
    cookProfileId: string,
    itemData: CreatePortfolioItemDTO,
  ): Promise<CookPortfolioItem> {
    // No display_order in SQL, items ordered by created_at

    const { data, error } = await supabaseAdmin
      .from("cook_portfolio") // Changed table name to match SQL
      .insert({
        cook_profile_id: cookProfileId,
        title: itemData.title,
        description: itemData.description ?? null,
        media_url: itemData.media_url, // Changed from image_url
      })
      .select()
      .single();

    if (error) {
      console.error("Supabase error details:", {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      });
      throw new Error(
        `Failed to create portfolio item: ${error.message} (code: ${error.code})`,
      );
    }

    return data as CookPortfolioItem;
  }

  /**
   * Get all portfolio items for a cook
   */
  static async getPortfolioItemsByCookProfileId(
    cookProfileId: string,
  ): Promise<CookPortfolioItem[]> {
    const { data, error } = await supabaseAdmin
      .from("cook_portfolio") // Changed table name
      .select("*")
      .eq("cook_profile_id", cookProfileId)
      .order("created_at", { ascending: true }); // Order by created_at instead of display_order

    if (error) {
      throw new Error(`Failed to get portfolio items: ${error.message}`);
    }

    return (data ?? []) as CookPortfolioItem[];
  }

  /**
   * Get a single portfolio item by ID
   */
  static async getPortfolioItemById(
    itemId: string,
  ): Promise<CookPortfolioItem | null> {
    const { data, error } = await supabaseAdmin
      .from("cook_portfolio") // Changed table name
      .select("*")
      .eq("id", itemId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
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
    updates: UpdatePortfolioItemDTO,
  ): Promise<CookPortfolioItem> {
    // Verify the item belongs to the cook
    const item = await this.getPortfolioItemById(itemId);
    if (!item || item.cook_profile_id !== cookProfileId) {
      throw new Error("Portfolio item not found or access denied");
    }

    const { data, error } = await supabaseAdmin
      .from("cook_portfolio") // Changed table name
      .update({
        ...(updates.title && { title: updates.title }),
        ...(updates.description !== undefined && {
          description: updates.description ?? null,
        }),
        ...(updates.media_url && { media_url: updates.media_url }), // Changed from image_url
        updated_at: new Date().toISOString(),
      })
      .eq("id", itemId)
      .eq("cook_profile_id", cookProfileId)
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
  static async deletePortfolioItem(
    itemId: string,
    cookProfileId: string,
  ): Promise<void> {
    // Verify the item belongs to the cook
    const item = await this.getPortfolioItemById(itemId);
    if (!item || item.cook_profile_id !== cookProfileId) {
      throw new Error("Portfolio item not found or access denied");
    }

    const { error } = await supabaseAdmin
      .from("cook_portfolio") // Changed table name
      .delete()
      .eq("id", itemId)
      .eq("cook_profile_id", cookProfileId);

    if (error) {
      throw new Error(`Failed to delete portfolio item: ${error.message}`);
    }
  }
}
