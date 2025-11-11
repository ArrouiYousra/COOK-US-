import { supabaseAdmin } from "@config/supabaseClient";
import type {
  DietaryRestriction,
  Allergy,
  CuisineType,
  ClientDietaryRestriction,
  ClientAllergy,
  ClientFavoriteCuisine,
} from "../types/database.types";

export class ClientPreferencesStore {
  // ============ DIETARY RESTRICTIONS ============

  static async getDietaryRestrictions(
    clientProfileId: string,
  ): Promise<ClientDietaryRestriction[]> {
    const { data, error } = await supabaseAdmin
      .from("client_dietary_restrictions")
      .select("*")
      .eq("client_profile_id", clientProfileId);

    if (error) {
      throw new Error(`Failed to get dietary restrictions: ${error.message}`);
    }

    return (data ?? []) as ClientDietaryRestriction[];
  }

  static async addDietaryRestriction(
    clientProfileId: string,
    restriction: DietaryRestriction,
  ): Promise<ClientDietaryRestriction> {
    const { data, error } = await supabaseAdmin
      .from("client_dietary_restrictions")
      .insert({
        client_profile_id: clientProfileId,
        restriction,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to add dietary restriction: ${error.message}`);
    }

    return data as ClientDietaryRestriction;
  }

  static async removeDietaryRestriction(
    clientProfileId: string,
    restriction: DietaryRestriction,
  ): Promise<void> {
    const { error } = await supabaseAdmin
      .from("client_dietary_restrictions")
      .delete()
      .eq("client_profile_id", clientProfileId)
      .eq("restriction", restriction);

    if (error) {
      throw new Error(`Failed to remove dietary restriction: ${error.message}`);
    }
  }

  // ============ ALLERGIES ============

  static async getAllergies(clientProfileId: string): Promise<ClientAllergy[]> {
    const { data, error } = await supabaseAdmin
      .from("client_allergies")
      .select("*")
      .eq("client_profile_id", clientProfileId);

    if (error) {
      throw new Error(`Failed to get allergies: ${error.message}`);
    }

    return (data ?? []) as ClientAllergy[];
  }

  static async addAllergy(
    clientProfileId: string,
    allergy: Allergy,
  ): Promise<ClientAllergy> {
    const { data, error } = await supabaseAdmin
      .from("client_allergies")
      .insert({
        client_profile_id: clientProfileId,
        allergy,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to add allergy: ${error.message}`);
    }

    return data as ClientAllergy;
  }

  static async removeAllergy(
    clientProfileId: string,
    allergy: Allergy,
  ): Promise<void> {
    const { error } = await supabaseAdmin
      .from("client_allergies")
      .delete()
      .eq("client_profile_id", clientProfileId)
      .eq("allergy", allergy);

    if (error) {
      throw new Error(`Failed to remove allergy: ${error.message}`);
    }
  }

  // ============ FAVORITE CUISINES ============

  static async getFavoriteCuisines(
    clientProfileId: string,
  ): Promise<ClientFavoriteCuisine[]> {
    const { data, error } = await supabaseAdmin
      .from("client_favorite_cuisines")
      .select("*")
      .eq("client_profile_id", clientProfileId);

    if (error) {
      throw new Error(`Failed to get favorite cuisines: ${error.message}`);
    }

    return (data ?? []) as ClientFavoriteCuisine[];
  }

  static async addFavoriteCuisine(
    clientProfileId: string,
    cuisine: CuisineType,
  ): Promise<ClientFavoriteCuisine> {
    const { data, error } = await supabaseAdmin
      .from("client_favorite_cuisines")
      .insert({
        client_profile_id: clientProfileId,
        cuisine,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to add favorite cuisine: ${error.message}`);
    }

    return data as ClientFavoriteCuisine;
  }

  static async removeFavoriteCuisine(
    clientProfileId: string,
    cuisine: CuisineType,
  ): Promise<void> {
    const { error } = await supabaseAdmin
      .from("client_favorite_cuisines")
      .delete()
      .eq("client_profile_id", clientProfileId)
      .eq("cuisine", cuisine);

    if (error) {
      throw new Error(`Failed to remove favorite cuisine: ${error.message}`);
    }
  }
}
