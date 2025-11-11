import { supabaseAdmin } from "@config/supabaseClient";
import type {
  Reservation,
  CreateReservationDTO,
  ReservationStatus,
} from "../types/database.types";

/**
 * Store pour gérer les réservations (propositions des cuisiniers sur demandes publiques)
 */
export class ReservationStore {
  /**
   * Créer une proposition (réservation) sur une demande publique
   * @param cookProfileId - ID du profil cuisinier
   * @param reservationData - Données de la proposition
   * @returns La réservation créée
   */
  static async createReservation(
    cookProfileId: string,
    reservationData: CreateReservationDTO,
  ): Promise<Reservation> {
    // Vérifier que le booking existe et est une demande publique (cook_profile_id IS NULL)
    const { data: booking, error: bookingError } = await supabaseAdmin
      .from("bookings")
      .select("id, cook_profile_id, status, client_profile_id")
      .eq("id", reservationData.booking_id)
      .single();

    if (bookingError || !booking) {
      throw new Error("Demande publique introuvable");
    }

    // Vérifier que c'est bien une demande publique
    if (booking.cook_profile_id !== null) {
      throw new Error("Cette demande a déjà un cuisinier assigné");
    }

    // Vérifier que le statut est PENDING
    if (booking.status !== "PENDING") {
      throw new Error(
        "Cette demande n'est plus disponible pour des propositions",
      );
    }

    // Vérifier que le cuisinier n'a pas déjà proposé
    const { data: existingReservation } = await supabaseAdmin
      .from("reservations")
      .select("id")
      .eq("booking_id", reservationData.booking_id)
      .eq("cook_profile_id", cookProfileId)
      .single();

    if (existingReservation) {
      throw new Error("Vous avez déjà fait une proposition sur cette demande");
    }

    // Calculer l'expiration (72h par défaut)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 72);

    // Créer la réservation
    const { data, error } = await supabaseAdmin
      .from("reservations")
      .insert({
        booking_id: reservationData.booking_id,
        cook_profile_id: cookProfileId,
        proposed_price: reservationData.proposed_price,
        proposed_hours: reservationData.proposed_hours || null,
        proposed_hourly_rate: reservationData.proposed_hourly_rate || null,
        message: reservationData.message || null,
        can_do_groceries: reservationData.can_do_groceries || false,
        can_set_table: reservationData.can_set_table || false,
        can_do_dishes: reservationData.can_do_dishes || false,
        status: "PENDING",
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("Create reservation error:", error);
      throw new Error(
        `Erreur lors de la création de la proposition: ${error.message}`,
      );
    }

    // Récupérer la réservation créée avec les données enrichies
    const createdReservation = await this.getReservationById(data.id);
    if (!createdReservation) {
      throw new Error("Erreur lors de la récupération de la proposition créée");
    }

    return createdReservation;
  }

  /**
   * Récupérer toutes les propositions pour une demande publique
   * @param bookingId - ID de la demande publique
   * @param includeExpired - Inclure les propositions expirées
   * @returns Liste des propositions enrichies avec les données du cuisinier
   */
  static async getReservationsByBookingId(
    bookingId: string,
    includeExpired: boolean = false,
  ): Promise<Reservation[]> {
    // Récupérer les réservations d'abord
    let query = supabaseAdmin
      .from("reservations")
      .select("*")
      .eq("booking_id", bookingId)
      .order("created_at", { ascending: false });

    // Exclure les expirées par défaut
    if (!includeExpired) {
      query = query.or(
        "status.neq.EXPIRED,expires_at.is.null,expires_at.gt.now()",
      );
    }

    const { data: reservationsData, error: reservationsError } = await query;

    if (reservationsError) {
      console.error("Get reservations by booking error:", reservationsError);
      throw new Error(
        `Erreur lors de la récupération des propositions: ${reservationsError.message}`,
      );
    }

    if (!reservationsData || reservationsData.length === 0) {
      return [];
    }

    // Récupérer les IDs des profils cuisiniers
    const cookProfileIds = [
      ...new Set(
        reservationsData
          .map((r: any) => r.cook_profile_id)
          .filter((id: string) => id),
      ),
    ];

    if (cookProfileIds.length === 0) {
      return reservationsData as Reservation[];
    }

    // Récupérer les profils cuisiniers
    const { data: cookProfilesData, error: cookProfilesError } =
      await supabaseAdmin
        .from("cook_profiles")
        .select("id, headline, bio, hourly_rate, average_rating, user_id")
        .in("id", cookProfileIds);

    if (cookProfilesError) {
      console.error("Get cook profiles error:", cookProfilesError);
      // Continuer même si on ne peut pas récupérer les profils
    }

    // Récupérer les user_ids uniques
    const userIds = [
      ...new Set(
        (cookProfilesData || [])
          .map((p: any) => p.user_id)
          .filter((id: string) => id),
      ),
    ];

    // Récupérer les utilisateurs
    let usersMap = new Map();
    if (userIds.length > 0) {
      const { data: usersData, error: usersError } = await supabaseAdmin
        .from("users")
        .select("id, first_name, last_name, avatar_url, email")
        .in("id", userIds);

      if (!usersError && usersData) {
        usersData.forEach((user: any) => {
          usersMap.set(user.id, user);
        });
      }
    }

    // Créer un map pour accéder rapidement aux profils
    const cookProfilesMap = new Map();
    if (cookProfilesData) {
      cookProfilesData.forEach((profile: any) => {
        cookProfilesMap.set(profile.id, profile);
      });
    }

    // Joindre les données
    const reservations = reservationsData.map((reservation: any) => {
      const cookProfile = cookProfilesMap.get(reservation.cook_profile_id);
      const user = cookProfile?.user_id
        ? usersMap.get(cookProfile.user_id)
        : null;

      return {
        ...reservation,
        cook: cookProfile
          ? {
              id: cookProfile.id,
              headline: cookProfile.headline,
              bio: cookProfile.bio,
              hourly_rate: cookProfile.hourly_rate,
              average_rating: cookProfile.average_rating,
              user: user
                ? {
                    id: user.id,
                    first_name: user.first_name,
                    last_name: user.last_name,
                    avatar_url: user.avatar_url,
                    email: user.email,
                  }
                : null,
            }
          : null,
      };
    });

    return reservations as Reservation[];
  }

  /**
   * Récupérer une proposition par son ID
   * @param reservationId - ID de la proposition
   * @returns La proposition enrichie avec les données du cuisinier ou null
   */
  static async getReservationById(
    reservationId: string,
  ): Promise<Reservation | null> {
    const { data, error } = await supabaseAdmin
      .from("reservations")
      .select(
        `
        *,
        cook_profiles!inner(
          id,
          headline,
          bio,
          hourly_rate,
          average_rating,
          user_id,
          users!inner(
            id,
            first_name,
            last_name,
            avatar_url,
            email
          )
        )
      `,
      )
      .eq("id", reservationId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null; // Not found
      }
      console.error("Get reservation by id error:", error);
      throw new Error(
        `Erreur lors de la récupération de la proposition: ${error.message}`,
      );
    }

    // Transformer les données pour avoir une structure plus simple
    const reservation = data as any;
    const cookProfile = reservation.cook_profiles;
    const user = cookProfile?.users;

    return {
      ...reservation,
      cook: cookProfile
        ? {
            id: cookProfile.id,
            headline: cookProfile.headline,
            bio: cookProfile.bio,
            hourly_rate: cookProfile.hourly_rate,
            average_rating: cookProfile.average_rating,
            user: user
              ? {
                  id: user.id,
                  first_name: user.first_name,
                  last_name: user.last_name,
                  avatar_url: user.avatar_url,
                  email: user.email,
                }
              : null,
          }
        : null,
    } as Reservation;
  }

  /**
   * Récupérer les propositions d'un cuisinier
   * @param cookProfileId - ID du profil cuisinier
   * @param status - Filtrer par statut (optionnel)
   * @returns Liste des propositions du cuisinier enrichies avec les données du cuisinier
   */
  static async getCookReservations(
    cookProfileId: string,
    status?: ReservationStatus,
  ): Promise<Reservation[]> {
    let query = supabaseAdmin
      .from("reservations")
      .select(
        `
        *,
        cook_profiles!inner(
          id,
          headline,
          bio,
          hourly_rate,
          average_rating,
          user_id,
          users!inner(
            id,
            first_name,
            last_name,
            avatar_url,
            email
          )
        )
      `,
      )
      .eq("cook_profile_id", cookProfileId)
      .order("created_at", { ascending: false });

    if (status) {
      query = query.eq("status", status);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Get cook reservations error:", error);
      throw new Error(
        `Erreur lors de la récupération des propositions: ${error.message}`,
      );
    }

    // Transformer les données pour avoir une structure plus simple
    const reservations = ((data as any[]) || []).map((reservation: any) => {
      const cookProfile = reservation.cook_profiles;
      const user = cookProfile?.users;

      return {
        ...reservation,
        cook: cookProfile
          ? {
              id: cookProfile.id,
              headline: cookProfile.headline,
              bio: cookProfile.bio,
              hourly_rate: cookProfile.hourly_rate,
              average_rating: cookProfile.average_rating,
              user: user
                ? {
                    id: user.id,
                    first_name: user.first_name,
                    last_name: user.last_name,
                    avatar_url: user.avatar_url,
                    email: user.email,
                  }
                : null,
            }
          : null,
      };
    });

    return reservations as Reservation[];
  }

  /**
   * Accepter une proposition (par le client)
   * @param reservationId - ID de la proposition
   * @param clientUserId - ID de l'utilisateur client (pour vérification)
   * @returns La proposition mise à jour
   */
  static async acceptReservation(
    reservationId: string,
    clientUserId: string,
  ): Promise<Reservation> {
    // Récupérer la proposition
    const reservation = await this.getReservationById(reservationId);
    if (!reservation) {
      throw new Error("Proposition introuvable");
    }

    // Vérifier que la proposition est en PENDING
    if (reservation.status !== "PENDING") {
      throw new Error("Cette proposition ne peut plus être acceptée");
    }

    // Vérifier que le client est bien le propriétaire de la demande
    const { data: booking } = await supabaseAdmin
      .from("bookings")
      .select("client_profile_id")
      .eq("id", reservation.booking_id)
      .single();

    if (!booking) {
      throw new Error("Demande introuvable");
    }

    // Récupérer le client_profile pour vérifier le user_id
    const { data: clientProfile } = await supabaseAdmin
      .from("client_profiles")
      .select("user_id")
      .eq("id", booking.client_profile_id)
      .single();

    if (!clientProfile || clientProfile.user_id !== clientUserId) {
      throw new Error("Vous n'êtes pas autorisé à accepter cette proposition");
    }

    // Mettre à jour le statut (le trigger SQL s'occupera du reste)
    const { error: updateError } = await supabaseAdmin
      .from("reservations")
      .update({
        status: "ACCEPTED",
        accepted_at: new Date().toISOString(),
      })
      .eq("id", reservationId);

    if (updateError) {
      console.error("Accept reservation error:", updateError);
      throw new Error(
        `Erreur lors de l'acceptation de la proposition: ${updateError.message}`,
      );
    }

    // Le trigger SQL a déjà mis à jour le booking et rejeté les autres propositions
    // Récupérer la proposition mise à jour avec les données enrichies
    return (await this.getReservationById(reservationId)) as Reservation;
  }

  /**
   * Refuser une proposition (par le client)
   * @param reservationId - ID de la proposition
   * @param clientUserId - ID de l'utilisateur client (pour vérification)
   * @param rejectionReason - Raison du refus (optionnel)
   * @returns La proposition mise à jour
   */
  static async rejectReservation(
    reservationId: string,
    clientUserId: string,
    rejectionReason?: string,
  ): Promise<Reservation> {
    // Récupérer la proposition
    const reservation = await this.getReservationById(reservationId);
    if (!reservation) {
      throw new Error("Proposition introuvable");
    }

    // Vérifier que la proposition est en PENDING
    if (reservation.status !== "PENDING") {
      throw new Error("Cette proposition ne peut plus être refusée");
    }

    // Vérifier que le client est bien le propriétaire de la demande
    const { data: booking } = await supabaseAdmin
      .from("bookings")
      .select("client_profile_id")
      .eq("id", reservation.booking_id)
      .single();

    if (!booking) {
      throw new Error("Demande introuvable");
    }

    // Récupérer le client_profile pour vérifier le user_id
    const { data: clientProfile } = await supabaseAdmin
      .from("client_profiles")
      .select("user_id")
      .eq("id", booking.client_profile_id)
      .single();

    if (!clientProfile || clientProfile.user_id !== clientUserId) {
      throw new Error("Vous n'êtes pas autorisé à refuser cette proposition");
    }

    // Mettre à jour le statut
    const { error: updateError } = await supabaseAdmin
      .from("reservations")
      .update({
        status: "REJECTED",
        rejected_at: new Date().toISOString(),
        rejection_reason: rejectionReason || null,
      })
      .eq("id", reservationId);

    if (updateError) {
      console.error("Reject reservation error:", updateError);
      throw new Error(
        `Erreur lors du refus de la proposition: ${updateError.message}`,
      );
    }

    // Récupérer la proposition mise à jour avec les données enrichies
    return (await this.getReservationById(reservationId)) as Reservation;
  }

  /**
   * Annuler une proposition (par le cuisinier)
   * @param reservationId - ID de la proposition
   * @param cookProfileId - ID du profil cuisinier (pour vérification)
   * @param cancellationReason - Raison de l'annulation (optionnel)
   * @returns La proposition mise à jour
   */
  static async cancelReservation(
    reservationId: string,
    cookProfileId: string,
    cancellationReason?: string,
  ): Promise<Reservation> {
    // Récupérer la proposition
    const reservation = await this.getReservationById(reservationId);
    if (!reservation) {
      throw new Error("Proposition introuvable");
    }

    // Vérifier que le cuisinier est bien le propriétaire de la proposition
    if (reservation.cook_profile_id !== cookProfileId) {
      throw new Error("Vous n'êtes pas autorisé à annuler cette proposition");
    }

    // Vérifier que la proposition peut être annulée
    if (reservation.status === "ACCEPTED") {
      throw new Error("Une proposition acceptée ne peut pas être annulée");
    }

    if (
      reservation.status === "CANCELLED" ||
      reservation.status === "REJECTED"
    ) {
      throw new Error("Cette proposition est déjà annulée ou refusée");
    }

    // Mettre à jour le statut
    const { error: updateError } = await supabaseAdmin
      .from("reservations")
      .update({
        status: "CANCELLED",
        cancelled_at: new Date().toISOString(),
        cancellation_reason: cancellationReason || null,
      })
      .eq("id", reservationId);

    if (updateError) {
      console.error("Cancel reservation error:", updateError);
      throw new Error(
        `Erreur lors de l'annulation de la proposition: ${updateError.message}`,
      );
    }

    // Récupérer la proposition mise à jour avec les données enrichies
    return (await this.getReservationById(reservationId)) as Reservation;
  }

  /**
   * Récupérer les statistiques des propositions pour une demande publique
   * @param bookingId - ID de la demande publique
   * @returns Statistiques des propositions
   */
  static async getReservationStats(bookingId: string): Promise<{
    total: number;
    pending: number;
    accepted: number;
    rejected: number;
    cancelled: number;
    expired: number;
  }> {
    const { data, error } = await supabaseAdmin
      .from("reservations")
      .select("status")
      .eq("booking_id", bookingId);

    if (error) {
      console.error("Get reservation stats error:", error);
      throw new Error(
        `Erreur lors de la récupération des statistiques: ${error.message}`,
      );
    }

    const reservations = (data || []) as { status: ReservationStatus }[];

    return {
      total: reservations.length,
      pending: reservations.filter((r) => r.status === "PENDING").length,
      accepted: reservations.filter((r) => r.status === "ACCEPTED").length,
      rejected: reservations.filter((r) => r.status === "REJECTED").length,
      cancelled: reservations.filter((r) => r.status === "CANCELLED").length,
      expired: reservations.filter((r) => r.status === "EXPIRED").length,
    };
  }

  /**
   * Expirer automatiquement les propositions expirées
   * (À appeler via un cron job)
   */
  static async expireOldReservations(): Promise<number> {
    // Utiliser la fonction SQL créée
    const { error } = await supabaseAdmin.rpc("expire_old_reservations");

    if (error) {
      console.error("Expire old reservations error:", error);
      throw new Error(
        `Erreur lors de l'expiration des propositions: ${error.message}`,
      );
    }

    // La fonction SQL retourne void, donc on ne peut pas compter
    // On peut faire une requête pour compter les expirées
    const { count } = await supabaseAdmin
      .from("reservations")
      .select("*", { count: "exact", head: true })
      .eq("status", "EXPIRED");

    return count || 0;
  }
}
