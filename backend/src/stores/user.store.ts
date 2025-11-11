import { supabaseAdmin } from "@config/supabaseClient";
import type {
  User,
  CreateUserDTO,
  CreateCookProfileDTO,
  CreateClientProfileDTO,
  CookProfile,
  ClientProfile,
} from "../types/database.types";

export class UserStore {
  /**
   * Create a new user in the database
   */
  static async createUser(
    userId: string,
    userData: CreateUserDTO,
  ): Promise<User> {
    const { data, error } = await supabaseAdmin
      .from("users")
      .insert({
        id: userId, // Use Supabase Auth user ID
        email: userData.email,
        password: userData.passwordHash, // Store hashed password for auditing only
        first_name: userData.first_name,
        last_name: userData.last_name,
        role: userData.role ?? "CLIENT",
        phone: userData.phone ?? null,
        date_of_birth: userData.date_of_birth ?? null,
        address: userData.address ?? null,
        city: userData.city ?? null,
        postal_code: userData.postal_code ?? null,
        country: userData.country ?? "FR",
        status: "PENDING_VERIFICATION",
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
        `Failed to create user: ${error.message} (code: ${error.code})`,
      );
    }

    return data as User;
  }

  /**
   * Get user by ID
   */
  static async getUserById(userId: string): Promise<User | null> {
    const { data, error } = await supabaseAdmin
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
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
      .from("users")
      .select("*")
      .eq("email", email)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null; // Not found
      }
      throw new Error(`Failed to get user: ${error.message}`);
    }

    return data as User;
  }

  /**
   * Update user
   */
  static async updateUser(
    userId: string,
    updates: Partial<User>,
  ): Promise<User> {
    const { data, error } = await supabaseAdmin
      .from("users")
      .update(updates)
      .eq("id", userId)
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
  static async createCookProfile(
    profileData: CreateCookProfileDTO,
  ): Promise<CookProfile> {
    // Préparer les données chiffrées pour PORTAGE_SALARIAL
    // Note: Le chiffrement se fait côté PostgreSQL via encrypt_sensitive_data()
    // On passe les valeurs en clair, PostgreSQL s'occupe du chiffrement
    const insertData: Record<string, any> = {
      user_id: profileData.user_id,
      headline: profileData.headline,
      hourly_rate: profileData.hourly_rate,
      employment_status: profileData.employment_status,
      siret_number: profileData.siret_number ?? null,
      siret_verified: profileData.siret_verified ?? false,
      siret_verified_at: profileData.siret_verified_at ?? null,
      bio: profileData.bio ?? null,
      service_radius: profileData.service_radius ?? 10,
      minimum_booking_hours: profileData.minimum_booking_hours ?? 2,
      status: "PENDING_APPROVAL",
      // Champs PORTAGE_SALARIAL
      birth_place: profileData.birth_place ?? null,
      rib_document_url: profileData.rib_document_url ?? null,
    };

    // Chiffrer les données sensibles via fonction PostgreSQL
    // Note: Le chiffrement se fait via une requête SQL directe car encrypt_sensitive_data()
    // nécessite la clé de chiffrement depuis current_setting('app.encryption_key')
    if (profileData.social_security_number) {
      const { data: ssnResult, error: ssnError } = await supabaseAdmin.rpc(
        "encrypt_sensitive_data",
        {
          data: profileData.social_security_number,
        },
      );
      if (ssnError) {
        console.error("Erreur chiffrement SSN:", ssnError);
        throw new Error(
          `Failed to encrypt social security number: ${ssnError.message}`,
        );
      }
      if (!ssnResult) {
        throw new Error(
          "Failed to encrypt social security number: résultat vide",
        );
      }
      insertData.social_security_number_encrypted = ssnResult;
    }

    if (profileData.iban) {
      const { data: ibanResult, error: ibanError } = await supabaseAdmin.rpc(
        "encrypt_sensitive_data",
        {
          data: profileData.iban.toUpperCase().replace(/\s/g, ""),
        },
      );
      if (ibanError) {
        console.error("Erreur chiffrement IBAN:", ibanError);
        throw new Error(`Failed to encrypt IBAN: ${ibanError.message}`);
      }
      if (!ibanResult) {
        throw new Error("Failed to encrypt IBAN: résultat vide");
      }
      insertData.iban_encrypted = ibanResult;
    }

    if (profileData.bic) {
      const { data: bicResult, error: bicError } = await supabaseAdmin.rpc(
        "encrypt_sensitive_data",
        {
          data: profileData.bic.toUpperCase().replace(/\s/g, ""),
        },
      );
      if (bicError) {
        console.error("Erreur chiffrement BIC:", bicError);
        throw new Error(`Failed to encrypt BIC: ${bicError.message}`);
      }
      if (!bicResult) {
        throw new Error("Failed to encrypt BIC: résultat vide");
      }
      insertData.bic_encrypted = bicResult;
    }

    const { data, error } = await supabaseAdmin
      .from("cook_profiles")
      .insert(insertData)
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
  static async createClientProfile(
    profileData: CreateClientProfileDTO,
  ): Promise<ClientProfile> {
    const { data, error } = await supabaseAdmin
      .from("client_profiles")
      .insert({
        user_id: profileData.user_id,
        household_size: profileData.household_size ?? null,
      })
      .select()
      .single();

    if (error) {
      console.error("Supabase client_profiles insert error:", {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      });
      throw new Error(
        `Failed to create client profile: ${error.message} (code: ${error.code})`,
      );
    }

    return data as ClientProfile;
  }
}
