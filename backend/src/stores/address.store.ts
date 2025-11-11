import { supabaseAdmin } from "@config/supabaseClient";
import type { Address, CreateAddressDTO } from "../types/database.types";

export class AddressStore {
  /**
   * Create an address for a client
   * Converts lat/lng to PostGIS POINT format using SQL function
   */
  static async createAddress(
    clientProfileId: string,
    addressData: CreateAddressDTO,
  ): Promise<Address> {
    // If this is set as default, unset other default addresses
    if (addressData.is_default) {
      await supabaseAdmin
        .from("addresses")
        .update({ is_default: false })
        .eq("client_profile_id", clientProfileId)
        .eq("is_default", true);
    }

    // Insert address data (location will be set via SQL function or trigger)
    const insertData: any = {
      client_profile_id: clientProfileId,
      type: addressData.type || "HOME",
      label: addressData.label || null,
      street: addressData.street,
      street_number: addressData.street_number,
      complement: addressData.complement || null,
      city: addressData.city,
      postal_code: addressData.postal_code,
      country: addressData.country || "FR",
      access_code: addressData.access_code || null,
      access_notes: addressData.access_notes || null,
      parking_info: addressData.parking_info || null,
      has_oven: addressData.has_oven ?? true,
      has_dishwasher: addressData.has_dishwasher ?? false,
      kitchen_notes: addressData.kitchen_notes || null,
      is_default: addressData.is_default ?? false,
    };

    // Insert address
    const { data: inserted, error: insertError } = await supabaseAdmin
      .from("addresses")
      .insert(insertData)
      .select()
      .single();

    if (insertError) {
      throw new Error(`Failed to create address: ${insertError.message}`);
    }

    // Update location using PostGIS function via RPC
    // Note: This requires a PostgreSQL function to be created in the database
    // For now, we'll try to use a direct SQL approach or store lat/lng separately
    if (
      addressData.latitude !== undefined &&
      addressData.longitude !== undefined
    ) {
      // Try to update location using a PostgreSQL function
      // The function should be created in the database:
      // CREATE OR REPLACE FUNCTION update_address_location(addr_id UUID, lat NUMERIC, lng NUMERIC)
      // RETURNS VOID AS $$
      // BEGIN
      //   UPDATE addresses SET location = ST_SetSRID(ST_MakePoint(lng, lat), 4326) WHERE id = addr_id;
      // END;
      // $$ LANGUAGE plpgsql;

      try {
        await supabaseAdmin.rpc("update_address_location", {
          addr_id: inserted.id,
          lat: addressData.latitude,
          lng: addressData.longitude,
        });
      } catch (rpcError) {
        // If RPC function doesn't exist, log warning but continue
        // The location can be set later via a database function or trigger
        console.warn(
          "Location update function not available. Location will need to be set via database function.",
        );
      }
    }

    // Fetch the complete address to return
    const address = await this.getAddressById(inserted.id);
    if (!address) {
      throw new Error("Failed to retrieve created address");
    }

    return address;
  }

  /**
   * Get address by ID
   */
  static async getAddressById(addressId: string): Promise<Address | null> {
    const { data, error } = await supabaseAdmin
      .from("addresses")
      .select("*")
      .eq("id", addressId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null;
      }
      throw new Error(`Failed to get address: ${error.message}`);
    }

    return data as Address;
  }

  /**
   * Get all addresses for a client
   */
  static async getAddressesByClient(
    clientProfileId: string,
    showAll: boolean = false,
  ): Promise<Address[]> {
    let query = supabaseAdmin
      .from("addresses")
      .select("*")
      .eq("client_profile_id", clientProfileId)
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: false });

    // If showAll is false, only show default address (for other users viewing)
    if (!showAll) {
      query = query.eq("is_default", true);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to get addresses: ${error.message}`);
    }

    return (data as Address[]) || [];
  }

  /**
   * Update an address
   */
  static async updateAddress(
    addressId: string,
    clientProfileId: string,
    updates: Partial<CreateAddressDTO>,
  ): Promise<Address> {
    // Verify ownership
    const address = await this.getAddressById(addressId);
    if (!address) {
      throw new Error("Address not found");
    }

    if (address.client_profile_id !== clientProfileId) {
      throw new Error("You can only update your own addresses");
    }

    // If setting as default, unset other defaults
    if (updates.is_default === true) {
      await supabaseAdmin
        .from("addresses")
        .update({ is_default: false })
        .eq("client_profile_id", clientProfileId)
        .eq("is_default", true)
        .neq("id", addressId);
    }

    const updateData: any = {
      type: updates.type,
      label: updates.label,
      street: updates.street,
      street_number: updates.street_number,
      complement: updates.complement,
      city: updates.city,
      postal_code: updates.postal_code,
      country: updates.country,
      access_code: updates.access_code,
      access_notes: updates.access_notes,
      parking_info: updates.parking_info,
      has_oven: updates.has_oven,
      has_dishwasher: updates.has_dishwasher,
      kitchen_notes: updates.kitchen_notes,
      is_default: updates.is_default,
    };

    // Remove undefined values
    Object.keys(updateData).forEach((key) => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    // Update location if lat/lng provided
    if (updates.latitude !== undefined && updates.longitude !== undefined) {
      // Try to update location using PostgreSQL function
      try {
        await supabaseAdmin.rpc("update_address_location", {
          addr_id: addressId,
          lat: updates.latitude,
          lng: updates.longitude,
        });
      } catch (rpcError) {
        // If RPC function doesn't exist, log warning but continue
        console.warn("Location update function not available.");
      }
    }

    const { data, error } = await supabaseAdmin
      .from("addresses")
      .update(updateData)
      .eq("id", addressId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update address: ${error.message}`);
    }

    return data as Address;
  }

  /**
   * Delete an address
   */
  static async deleteAddress(
    addressId: string,
    clientProfileId: string,
  ): Promise<void> {
    // Verify ownership
    const address = await this.getAddressById(addressId);
    if (!address) {
      throw new Error("Address not found");
    }

    if (address.client_profile_id !== clientProfileId) {
      throw new Error("You can only delete your own addresses");
    }

    const { error } = await supabaseAdmin
      .from("addresses")
      .delete()
      .eq("id", addressId);

    if (error) {
      throw new Error(`Failed to delete address: ${error.message}`);
    }
  }

  /**
   * Set address as default
   */
  static async setDefaultAddress(
    addressId: string,
    clientProfileId: string,
  ): Promise<Address> {
    // Verify ownership
    const address = await this.getAddressById(addressId);
    if (!address) {
      throw new Error("Address not found");
    }

    if (address.client_profile_id !== clientProfileId) {
      throw new Error("You can only set your own addresses as default");
    }

    // Unset other default addresses
    await supabaseAdmin
      .from("addresses")
      .update({ is_default: false })
      .eq("client_profile_id", clientProfileId)
      .eq("is_default", true)
      .neq("id", addressId);

    // Set this address as default
    const { data, error } = await supabaseAdmin
      .from("addresses")
      .update({ is_default: true })
      .eq("id", addressId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to set default address: ${error.message}`);
    }

    return data as Address;
  }
}
