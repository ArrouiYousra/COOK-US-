import { supabaseAdmin } from "@config/supabaseClient";
import type {
  CookCertification,
  CreateCertificationDTO,
  UpdateCertificationDTO,
} from "../types/database.types";

export class CertificationStore {
  /**
   * Create a new certification
   */
  static async createCertification(
    cookProfileId: string,
    certData: CreateCertificationDTO,
  ): Promise<CookCertification> {
    const { data, error } = await supabaseAdmin
      .from("cook_certifications")
      .insert({
        cook_profile_id: cookProfileId,
        certification: certData.certification, // Changed from name
        issued_by: certData.issued_by, // Changed from issuing_organization
        issue_date: certData.issue_date ?? null,
        expiry_date: certData.expiry_date ?? null,
        certificate_url: certData.certificate_url ?? null,
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
        `Failed to create certification: ${error.message} (code: ${error.code})`,
      );
    }

    return data as CookCertification;
  }

  /**
   * Get all certifications for a cook
   */
  static async getCertificationsByCookProfileId(
    cookProfileId: string,
  ): Promise<CookCertification[]> {
    const { data, error } = await supabaseAdmin
      .from("cook_certifications")
      .select("*")
      .eq("cook_profile_id", cookProfileId)
      .order("created_at", { ascending: false }); // Order by created_at since no issue_date ordering needed

    if (error) {
      throw new Error(`Failed to get certifications: ${error.message}`);
    }

    return (data ?? []) as CookCertification[];
  }

  /**
   * Get a single certification by ID
   */
  static async getCertificationById(
    certId: string,
  ): Promise<CookCertification | null> {
    const { data, error } = await supabaseAdmin
      .from("cook_certifications")
      .select("*")
      .eq("id", certId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null; // Not found
      }
      throw new Error(`Failed to get certification: ${error.message}`);
    }

    return data as CookCertification;
  }

  /**
   * Update a certification
   */
  static async updateCertification(
    certId: string,
    cookProfileId: string,
    updates: UpdateCertificationDTO,
  ): Promise<CookCertification> {
    // Verify the certification belongs to the cook
    const cert = await this.getCertificationById(certId);
    if (!cert || cert.cook_profile_id !== cookProfileId) {
      throw new Error("Certification not found or access denied");
    }

    const { data, error } = await supabaseAdmin
      .from("cook_certifications")
      .update({
        ...(updates.certification && { certification: updates.certification }), // Changed from name
        ...(updates.issued_by && { issued_by: updates.issued_by }), // Changed from issuing_organization
        ...(updates.issue_date !== undefined && {
          issue_date: updates.issue_date ?? null,
        }),
        ...(updates.expiry_date !== undefined && {
          expiry_date: updates.expiry_date ?? null,
        }),
        ...(updates.certificate_url !== undefined && {
          certificate_url: updates.certificate_url ?? null,
        }),
      })
      .eq("id", certId)
      .eq("cook_profile_id", cookProfileId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update certification: ${error.message}`);
    }

    return data as CookCertification;
  }

  /**
   * Delete a certification
   */
  static async deleteCertification(
    certId: string,
    cookProfileId: string,
  ): Promise<void> {
    // Verify the certification belongs to the cook
    const cert = await this.getCertificationById(certId);
    if (!cert || cert.cook_profile_id !== cookProfileId) {
      throw new Error("Certification not found or access denied");
    }

    const { error } = await supabaseAdmin
      .from("cook_certifications")
      .delete()
      .eq("id", certId)
      .eq("cook_profile_id", cookProfileId);

    if (error) {
      throw new Error(`Failed to delete certification: ${error.message}`);
    }
  }
}
