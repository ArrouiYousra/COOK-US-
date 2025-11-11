import { supabaseAdmin } from "@config/supabaseClient";
import type {
  Dispute,
  CreateDisputeDTO,
  UpdateDisputeDTO,
  ResolveDisputeDTO,
  DisputeStatus,
} from "../types/database.types";

export class DisputeStore {
  /**
   * Create a new dispute
   */
  static async createDispute(
    disputeData: CreateDisputeDTO,
    raisedBy: string,
  ): Promise<Dispute> {
    const { data, error } = await supabaseAdmin
      .from("disputes")
      .insert({
        booking_id: disputeData.booking_id,
        raised_by: raisedBy, // Changed from opened_by
        reason: disputeData.reason, // Changed from dispute_type
        description: disputeData.description,
        status: "OPEN", // Changed from OPENED
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
        `Failed to create dispute: ${error.message} (code: ${error.code})`,
      );
    }

    // Update booking status to DISPUTED
    await supabaseAdmin
      .from("bookings")
      .update({ status: "DISPUTED" })
      .eq("id", disputeData.booking_id);

    return data as Dispute;
  }

  /**
   * Get dispute by ID
   */
  static async getDisputeById(disputeId: string): Promise<Dispute | null> {
    const { data, error } = await supabaseAdmin
      .from("disputes")
      .select("*")
      .eq("id", disputeId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null; // Not found
      }
      throw new Error(`Failed to get dispute: ${error.message}`);
    }

    return data as Dispute;
  }

  /**
   * Get disputes by booking ID
   */
  static async getDisputesByBookingId(bookingId: string): Promise<Dispute[]> {
    const { data, error } = await supabaseAdmin
      .from("disputes")
      .select("*")
      .eq("booking_id", bookingId)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(`Failed to get disputes: ${error.message}`);
    }

    return (data ?? []) as Dispute[];
  }

  /**
   * Get disputes by user ID (disputes opened by or related to user)
   */
  static async getDisputesByUserId(userId: string): Promise<Dispute[]> {
    // Get user profiles to find bookings
    const { data: clientProfile } = await supabaseAdmin
      .from("client_profiles")
      .select("id")
      .eq("user_id", userId)
      .single();

    const { data: cookProfile } = await supabaseAdmin
      .from("cook_profiles")
      .select("id")
      .eq("user_id", userId)
      .single();

    const bookingIds: string[] = [];

    // Get bookings where user is client
    if (clientProfile) {
      const { data: clientBookings } = await supabaseAdmin
        .from("bookings")
        .select("id")
        .eq("client_profile_id", clientProfile.id);

      if (clientBookings) {
        bookingIds.push(...clientBookings.map((b: any) => b.id));
      }
    }

    // Get bookings where user is cook
    if (cookProfile) {
      const { data: cookBookings } = await supabaseAdmin
        .from("bookings")
        .select("id")
        .eq("cook_profile_id", cookProfile.id);

      if (cookBookings) {
        bookingIds.push(...cookBookings.map((b: any) => b.id));
      }
    }

    // Get disputes raised by user
    const { data: raisedDisputes } = await supabaseAdmin
      .from("disputes")
      .select("*")
      .eq("raised_by", userId);

    // Get disputes for bookings
    let bookingDisputes: Dispute[] = [];
    if (bookingIds.length > 0) {
      const { data } = await supabaseAdmin
        .from("disputes")
        .select("*")
        .in("booking_id", bookingIds);

      if (data) {
        bookingDisputes = data as Dispute[];
      }
    }

    // Combine and deduplicate
    const allDisputes = [...(raisedDisputes ?? []), ...bookingDisputes];
    const uniqueDisputes = Array.from(
      new Map(allDisputes.map((d) => [d.id, d])).values(),
    );

    // Sort by created_at descending
    return uniqueDisputes.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
  }

  /**
   * Get all disputes (admin only)
   */
  static async getAllDisputes(status?: DisputeStatus): Promise<Dispute[]> {
    let query = supabaseAdmin.from("disputes").select("*");

    if (status) {
      query = query.eq("status", status);
    }

    const { data, error } = await query.order("created_at", {
      ascending: false,
    });

    if (error) {
      throw new Error(`Failed to get disputes: ${error.message}`);
    }

    return (data ?? []) as Dispute[];
  }

  /**
   * Update dispute
   */
  static async updateDispute(
    disputeId: string,
    updates: UpdateDisputeDTO,
  ): Promise<Dispute> {
    const { data, error } = await supabaseAdmin
      .from("disputes")
      .update({
        ...(updates.description && { description: updates.description }),
        ...(updates.status && { status: updates.status }),
        updated_at: new Date().toISOString(),
      })
      .eq("id", disputeId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update dispute: ${error.message}`);
    }

    return data as Dispute;
  }

  /**
   * Resolve dispute (admin only)
   */
  static async resolveDispute(
    disputeId: string,
    _adminUserId: string, // Not stored in SQL, kept for API compatibility
    resolutionData: ResolveDisputeDTO,
  ): Promise<Dispute> {
    const { data, error } = await supabaseAdmin
      .from("disputes")
      .update({
        status: "RESOLVED",
        resolution: resolutionData.resolution, // TEXT, not ENUM
        resolved_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", disputeId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to resolve dispute: ${error.message}`);
    }

    return data as Dispute;
  }

  /**
   * Close dispute
   */
  static async closeDispute(disputeId: string): Promise<Dispute> {
    const { data, error } = await supabaseAdmin
      .from("disputes")
      .update({
        status: "CLOSED",
        updated_at: new Date().toISOString(),
      })
      .eq("id", disputeId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to close dispute: ${error.message}`);
    }

    return data as Dispute;
  }

  /**
   * Check if user has access to dispute
   */
  static async userHasAccessToDispute(
    disputeId: string,
    userId: string,
  ): Promise<boolean> {
    const dispute = await this.getDisputeById(disputeId);
    if (!dispute) {
      return false;
    }

    // User raised the dispute
    if (dispute.raised_by === userId) {
      return true;
    }

    // User is part of the booking
    const { data: booking } = await supabaseAdmin
      .from("bookings")
      .select("client_profile_id, cook_profile_id")
      .eq("id", dispute.booking_id)
      .single();

    if (!booking) {
      return false;
    }

    // Get user profiles
    const { data: clientProfile } = await supabaseAdmin
      .from("client_profiles")
      .select("user_id")
      .eq("id", booking.client_profile_id)
      .single();

    const { data: cookProfile } = await supabaseAdmin
      .from("cook_profiles")
      .select("user_id")
      .eq("id", booking.cook_profile_id)
      .single();

    return (
      clientProfile?.user_id === userId ||
      cookProfile?.user_id === userId ||
      false
    );
  }
}
