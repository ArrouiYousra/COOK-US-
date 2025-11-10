import axios, { AxiosInstance, AxiosError } from "axios";
import type {
  AuthResponse,
  ForgotPasswordInput,
  LoginInput,
  RegisterClientInput,
  RegisterCookInput,
  ResetPasswordInput,
  UserProfile,
  BookingResponse,
  ProposalsResponse,
  GetBookingsParams,
  GetMyProposalsParams,
} from "@/types";

/**
 * Client API avec axios
 * Configuration centralisée pour tous les appels API
 */
class ApiClient {
  public client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api",
      timeout: 30000, // Augmenté à 30 secondes
      withCredentials: true,
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Intercepteur pour gérer les erreurs globalement
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError<{ message?: string; error?: string }>) => {
        const url = error.config?.url || '';
        
        // Gestion spéciale pour les timeouts et erreurs réseau
        if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
          console.warn(`Timeout pour ${url}. Le backend est peut-être lent ou inaccessible.`);
          // Pour les endpoints optionnels, retourner des valeurs par défaut
          if (url.includes('/notifications')) {
            return Promise.resolve({ data: { notifications: [], count: 0, unread_count: 0, limit: 10, offset: 0 } } as any);
          }
          if (url.includes('/bookings/my-proposals')) {
            return Promise.resolve({ data: { bookings: [], count: 0, stats: { pending: 0, accepted: 0, rejected: 0 }, filter: 'all', limit: 10, offset: 0 } } as any);
          }
          if (url.includes('/bookings') && !url.includes('/my-proposals')) {
            return Promise.resolve({ data: { bookings: [], count: 0, limit: 10, offset: 0 } } as any);
          }
          if (url.includes('/client/filters')) {
            return Promise.resolve({ data: [] } as any);
          }
        }

        // Gestion des erreurs réseau
        if (error.code === 'ERR_NETWORK' || !error.response) {
          console.error(`Erreur réseau pour ${url}. Vérifiez que le backend est démarré sur le port 5000.`);
          // Retourner des valeurs par défaut pour éviter les crashes
          if (url.includes('/notifications')) {
            return Promise.resolve({ data: { notifications: [], count: 0, unread_count: 0, limit: 10, offset: 0 } } as any);
          }
          if (url.includes('/bookings/my-proposals')) {
            return Promise.resolve({ data: { bookings: [], count: 0, stats: { pending: 0, accepted: 0, rejected: 0 }, filter: 'all', limit: 10, offset: 0 } } as any);
          }
          if (url.includes('/bookings') && !url.includes('/my-proposals')) {
            return Promise.resolve({ data: { bookings: [], count: 0, limit: 10, offset: 0 } } as any);
          }
          if (url.includes('/client/filters')) {
            return Promise.resolve({ data: [] } as any);
          }
        }

        // Ne pas rejeter les erreurs 404 pour les endpoints optionnels
        if (error.response?.status === 404) {
          // Si c'est un endpoint de filtres, retourner un tableau vide
          if (url.includes('/client/filters')) {
            return Promise.resolve({ data: [] } as any);
          }
        }

        // Extraire le message d'erreur
        let message =
          error.response?.data?.message ||
          error.response?.data?.error ||
          error.message ||
          String(error) ||
          "Une erreur est survenue";
        
        // Pour les erreurs SIRET, utiliser le message détaillé du backend
        if (error.response?.data?.error === 'SiretValidationError' && error.response?.data?.message) {
          message = error.response.data.message;
        }
        
        // Log l'erreur complète pour le debugging (seulement si ce n'est pas un timeout/network)
        if (error.code !== 'ECONNABORTED' && error.code !== 'ERR_NETWORK') {
          // Construire l'objet d'erreur de manière simple et directe
          const errorDetails: any = {
            message: message || 'Erreur inconnue',
            timestamp: new Date().toISOString(),
          };
          
          // Ajouter le type d'erreur
          try {
            errorDetails.errorType = error.constructor?.name || typeof error || "unknown";
          } catch (e) {
            errorDetails.errorType = "unknown";
          }
          
          // Ajouter le code d'erreur s'il existe
          try {
            if (error.code !== undefined && error.code !== null) {
              errorDetails.code = String(error.code);
            }
          } catch (e) {
            // Ignorer
          }
          
          // Ajouter les informations de la requête
          try {
            if (error.config) {
              errorDetails.url = String(error.config.url || 'unknown');
              errorDetails.method = String((error.config.method || 'unknown').toUpperCase());
              if (error.config.baseURL) {
                errorDetails.baseURL = String(error.config.baseURL);
              }
            } else if (error.request) {
              errorDetails.url = String(error.request.responseURL || error.request.url || 'unknown');
              errorDetails.method = String((error.request.method || 'unknown').toUpperCase());
            } else {
              errorDetails.url = 'unknown';
              errorDetails.method = 'unknown';
            }
          } catch (e) {
            errorDetails.url = 'error_parsing_url';
            errorDetails.method = 'error_parsing_method';
          }
          
          // Ajouter les informations de la réponse
          try {
            if (error.response) {
              errorDetails.status = Number(error.response.status);
              errorDetails.statusText = String(error.response.statusText || '');
              if (error.response.data) {
                try {
                  if (typeof error.response.data === 'object') {
                    errorDetails.data = JSON.parse(JSON.stringify(error.response.data));
                  } else {
                    errorDetails.data = String(error.response.data);
                  }
                } catch (e) {
                  errorDetails.data = String(error.response.data);
                }
              }
            }
          } catch (e) {
            errorDetails.responseError = 'error_parsing_response';
          }
          
          // Ajouter le message d'erreur original s'il diffère
          try {
            if (error.message && error.message !== message) {
              errorDetails.errorMessage = String(error.message);
            }
          } catch (e) {
            // Ignorer
          }
          
          // Vérifier que errorDetails n'est pas vide avant de logger
          if (Object.keys(errorDetails).length > 0) {
            console.error('API Error Details:', errorDetails);
          } else {
            // Si errorDetails est vide, logger au moins l'erreur de base
            console.error('API Error (no details available):', {
              message,
              error: String(error),
              type: typeof error,
            });
          }
          
          // Logger aussi l'erreur brute pour debugging
          try {
            console.error('API Error Raw:', {
              errorType: typeof error,
              errorConstructor: error.constructor?.name || 'unknown',
              hasCode: 'code' in error,
              codeValue: error.code,
              hasMessage: 'message' in error,
              messageValue: error.message,
              hasResponse: 'response' in error,
              hasRequest: 'request' in error,
              hasConfig: 'config' in error,
              allKeys: Object.keys(error),
              stack: error.stack,
            });
          } catch (e) {
            console.error('Error logging raw error:', e);
          }
        }
        
        return Promise.reject(new Error(message));
      },
    );
  }

  // ========== AUTHENTIFICATION ==========

  /**
   * Inscription client
   */
  async registerClient(data: RegisterClientInput): Promise<{ message: string; email: string }> {
    const response = await this.client.post<{ message: string; email: string }>("/auth/register/client", data);
    return response.data;
  }

  /**
   * Inscription cuisinier
   */
  async registerCook(data: RegisterCookInput): Promise<AuthResponse> {
    const response = await this.client.post<AuthResponse>("/auth/register/cook", data);
    return response.data;
  }

  /**
   * Connexion
   */
  async login(data: LoginInput): Promise<AuthResponse> {
    const response = await this.client.post<AuthResponse>("/auth/login", data);
    return response.data;
  }

  /**
   * Déconnexion
   */
  async logout(): Promise<void> {
    try {
      await this.client.post("/auth/logout");
    } catch (error) {
      // Ignorer les erreurs de déconnexion
    }
  }

  /**
   * Mot de passe oublié
   */
  async forgotPassword(data: ForgotPasswordInput): Promise<{ message: string }> {
    const response = await this.client.post<{ message: string }>("/auth/forgot-password", data);
    return response.data;
  }

  /**
   * Réinitialiser le mot de passe
   */
  async resetPassword(data: ResetPasswordInput): Promise<{ message: string }> {
    const response = await this.client.post<{ message: string }>("/auth/reset-password", {
      token: data.token,
    });
    return response.data;
  }

  /**
   * Vérifier le token et récupérer l'utilisateur actuel
   */
  async getCurrentUser(): Promise<AuthResponse> {
    const response = await this.client.get<AuthResponse>("/auth/me");
    return response.data;
  }

  /**
   * Rafraîchir la session via les cookies HttpOnly
   */
  async refreshSession(refreshToken?: string): Promise<AuthResponse> {
    const payload = refreshToken ? { refreshToken } : undefined;
    const response = await this.client.post<AuthResponse>("/auth/refresh", payload);
    return response.data;
  }

  /**
   * OAuth - Google
   */
  async loginWithGoogle(role: "CLIENT" | "COOK"): Promise<{ redirectUrl: string }> {
    const response = await this.client.post<{ redirectUrl: string }>("/auth/oauth/google", { role });
    return response.data;
  }

  /**
   * OAuth - Apple
   */
  async loginWithApple(role: "CLIENT" | "COOK"): Promise<{ redirectUrl: string }> {
    const response = await this.client.post<{ redirectUrl: string }>("/auth/oauth/apple", { role });
    return response.data;
  }

  // ========== PROFILES ==========

  /**
   * Récupérer mon profil complet (user + cookProfile/clientProfile)
   */
  async getMyProfile(): Promise<UserProfile> {
    const response = await this.client.get<UserProfile>("/profiles/me");
    return response.data;
  }

  // ========== BOOKINGS ==========

  /**
   * Récupérer la liste des bookings de l'utilisateur
   * @param params - Paramètres de filtrage (status, limit, offset)
   */
  async getBookings(params?: GetBookingsParams): Promise<BookingResponse> {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append("status", params.status);
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.offset) queryParams.append("offset", params.offset.toString());

    const queryString = queryParams.toString();
    const url = `/bookings${queryString ? `?${queryString}` : ""}`;
    const response = await this.client.get<BookingResponse>(url);
    return response.data;
  }

  /**
   * Récupérer mes propositions (pour les clients)
   * @param params - Paramètres de filtrage (filter, limit, offset)
   */
  async getMyProposals(params?: GetMyProposalsParams): Promise<ProposalsResponse> {
    const queryParams = new URLSearchParams();
    if (params?.filter) queryParams.append("filter", params.filter);
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.offset) queryParams.append("offset", params.offset.toString());

    const queryString = queryParams.toString();
    const url = `/bookings/my-proposals${queryString ? `?${queryString}` : ""}`;
    const response = await this.client.get<ProposalsResponse>(url);
    return response.data;
  }

  /**
   * Accepter une réservation
   */
  async acceptBooking(bookingId: string): Promise<{ message: string; booking: any }> {
    const response = await this.client.put<{ message: string; booking: any }>(`/bookings/${bookingId}/accept`);
    return response.data;
  }

  /**
   * Rejeter une réservation
   */
  async rejectBooking(bookingId: string): Promise<{ message: string; booking: any }> {
    const response = await this.client.put<{ message: string; booking: any }>(`/bookings/${bookingId}/reject`);
    return response.data;
  }

  /**
   * Annuler une réservation
   */
  async cancelBooking(bookingId: string, reason?: string, cancellationNote?: string): Promise<{ message: string; booking: any }> {
    const response = await this.client.put<{ message: string; booking: any }>(`/bookings/${bookingId}/cancel`, {
      reason,
      cancellation_note: cancellationNote,
    });
    return response.data;
  }

  // ========== MESSAGES ==========

  /**
   * Récupérer toutes les conversations de l'utilisateur
   */
  async getConversations(params?: { limit?: number; offset?: number }): Promise<{
    conversations: any[];
    count: number;
    limit: number;
    offset: number;
  }> {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.offset) queryParams.append("offset", params.offset.toString());

    const queryString = queryParams.toString();
    const url = `/messages/conversations${queryString ? `?${queryString}` : ""}`;

    const response = await this.client.get<{
      conversations: any[];
      count: number;
      limit: number;
      offset: number;
    }>(url);
    return response.data;
  }

  /**
   * Récupérer les messages d'une conversation
   */
  async getMessages(conversationId: string, params?: { limit?: number; offset?: number }): Promise<{
    messages: any[];
    count: number;
    limit: number;
    offset: number;
  }> {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.offset) queryParams.append("offset", params.offset.toString());

    const queryString = queryParams.toString();
    const url = `/messages/conversations/${conversationId}${queryString ? `?${queryString}` : ""}`;

    const response = await this.client.get<{
      messages: any[];
      count: number;
      limit: number;
      offset: number;
    }>(url);
    return response.data;
  }

  /**
   * Envoyer un message
   */
  async sendMessage(data: {
    recipient_id: string;
    content: string;
    message_type?: "TEXT" | "IMAGE" | "SYSTEM";
    attachment_url?: string;
    booking_id?: string;
  }): Promise<{ message: any }> {
    const response = await this.client.post<{ message: any }>("/messages", data);
    return response.data;
  }

  /**
   * Marquer tous les messages d'une conversation comme lus
   */
  async markConversationAsRead(conversationId: string): Promise<{ message: string }> {
    const response = await this.client.put<{ message: string }>(`/messages/conversations/${conversationId}/read`);
    return response.data;
  }

  // ========== FAVORITES ==========

  /**
   * Récupérer mes chefs favoris (pour les clients)
   */
  async getFavorites(): Promise<{ favorites: any[]; count: number }> {
    const response = await this.client.get<{ favorites: any[]; count: number }>("/favorites");
    return response.data;
  }

  /**
   * Ajouter un cuisinier aux favoris
   * @param cookId - ID du cuisinier
   */
  async addFavorite(cookId: string): Promise<{ message: string }> {
    const response = await this.client.post<{ message: string }>(`/favorites/${cookId}`);
    return response.data;
  }

  /**
   * Retirer un cuisinier des favoris
   * @param cookId - ID du cuisinier
   */
  async removeFavorite(cookId: string): Promise<{ message: string }> {
    const response = await this.client.delete<{ message: string }>(`/favorites/${cookId}`);
    return response.data;
  }

  /**
   * Vérifier si un cuisinier est en favori
   * @param cookId - ID du cuisinier
   */
  async checkFavorite(cookId: string): Promise<{ isFavorite: boolean }> {
    const response = await this.client.get<{ is_favorite: boolean }>(`/favorites/${cookId}/check`);
    return { isFavorite: response.data.is_favorite };
  }

  // ========== PROFILES (COOKS) ==========

  /**
   * Récupérer la liste des cuisiniers avec filtres
   * @param params - Paramètres de filtrage (status, city, min_rating, max_hourly_rate, limit, offset)
   */
  async getCookProfiles(params?: {
    status?: string;
    city?: string;
    min_rating?: number;
    max_hourly_rate?: number;
    limit?: number;
    offset?: number;
  }): Promise<{ profiles: any[]; count: number; limit: number; offset: number }> {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append("status", params.status);
    if (params?.city) queryParams.append("city", params.city);
    if (params?.min_rating) queryParams.append("min_rating", params.min_rating.toString());
    if (params?.max_hourly_rate) queryParams.append("max_hourly_rate", params.max_hourly_rate.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.offset) queryParams.append("offset", params.offset.toString());

    const queryString = queryParams.toString();
    const url = `/profiles/cooks${queryString ? `?${queryString}` : ""}`;
    
    try {
      const response = await this.client.get<{ profiles: any[]; count: number; limit: number; offset: number }>(url);
      // S'assurer que la réponse a toujours la structure attendue
      return {
        profiles: response.data?.profiles || [],
        count: response.data?.count || 0,
        limit: response.data?.limit || params?.limit || 10,
        offset: response.data?.offset || params?.offset || 0,
      };
    } catch (error: any) {
      // En cas d'erreur, retourner une structure vide plutôt que de faire planter
      // L'erreur sera déjà loggée par l'intercepteur axios
      // On ne log pas ici pour éviter les doublons
      return {
        profiles: [],
        count: 0,
        limit: params?.limit || 10,
        offset: params?.offset || 0,
      };
    }
  }

  // ========== NOTIFICATIONS ==========

  /**
   * Récupérer mes notifications
   * @param params - Paramètres de filtrage (is_read, type, limit, offset)
   */
  async getNotifications(params?: {
    is_read?: boolean;
    type?: string;
    limit?: number;
    offset?: number;
  }): Promise<{
    notifications: any[];
    count: number;
    unread_count: number;
    limit: number;
    offset: number;
  }> {
    const queryParams = new URLSearchParams();
    if (params?.is_read !== undefined) queryParams.append("is_read", params.is_read.toString());
    if (params?.type) queryParams.append("type", params.type);
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.offset) queryParams.append("offset", params.offset.toString());

    const queryString = queryParams.toString();
    const url = `/notifications${queryString ? `?${queryString}` : ""}`;
    const response = await this.client.get<{
      notifications: any[];
      count: number;
      unread_count: number;
      limit: number;
      offset: number;
    }>(url);
    return response.data;
  }

  /**
   * Marquer une notification comme lue
   * @param notificationId - ID de la notification
   */
  async markNotificationAsRead(notificationId: string): Promise<{ message: string }> {
    const response = await this.client.put<{ message: string }>(
      `/notifications/${notificationId}/read`
    );
    return response.data;
  }

  /**
   * Marquer toutes les notifications comme lues
   */
  async markAllNotificationsAsRead(): Promise<{ message: string }> {
    const response = await this.client.put<{ message: string }>("/notifications/read-all");
    return response.data;
  }

  // ========== PROFILES ==========

  /**
   * Récupérer le profil public d'un utilisateur (visible par les chefs)
   * @param userId - ID de l'utilisateur
   */
  async getUserProfile(userId: string): Promise<{
    user: any;
    cookProfile?: any;
    clientProfile?: {
      household_size?: number;
      pet_friendly?: boolean;
      smoking_allowed?: boolean;
      total_bookings?: number;
      average_rating_given?: number;
    };
  }> {
    const response = await this.client.get(`/profiles/${userId}`);
    return response.data;
  }

  // ========== DISPUTES ==========

  /**
   * Récupérer mes disputes
   */
  async getMyDisputes(): Promise<{
    disputes: any[];
    count: number;
  }> {
    const response = await this.client.get("/disputes/me");
    return response.data;
  }

  // ========== CLIENT PREFERENCES ==========

  /**
   * Récupérer les restrictions alimentaires
   */
  async getDietaryRestrictions(): Promise<{
    restrictions: Array<{ restriction: string }>;
  }> {
    const response = await this.client.get("/client-preferences/dietary-restrictions");
    return response.data;
  }

  /**
   * Récupérer les allergies
   */
  async getAllergies(): Promise<{
    allergies: Array<{ allergy: string }>;
  }> {
    const response = await this.client.get("/client-preferences/allergies");
    return response.data;
  }

  /**
   * Récupérer les cuisines préférées
   */
  async getFavoriteCuisines(): Promise<{
    cuisines: Array<{ cuisine: string }>;
  }> {
    const response = await this.client.get("/client-preferences/favorite-cuisines");
    return response.data;
  }

  // ========== PAYMENTS (STRIPE) ==========

  /**
   * Créer un Payment Intent pour une réservation
   * @param bookingId - ID de la réservation
   */
  async createPaymentIntent(bookingId: string): Promise<{
    message: string;
    paymentIntent: {
      id: string;
      client_secret: string;
      amount: number;
      currency: string;
      status: string;
    };
  }> {
    const response = await this.client.post<{
      message: string;
      paymentIntent: {
        id: string;
        client_secret: string;
        amount: number;
        currency: string;
        status: string;
      };
    }>("/payments/intent", { booking_id: bookingId });
    return response.data;
  }

  /**
   * Récupérer un Payment Intent par ID
   * @param paymentIntentId - ID du Payment Intent
   */
  async getPaymentIntent(paymentIntentId: string): Promise<{
    paymentIntent: {
      id: string;
      amount: number;
      currency: string;
      status: string;
      created: number;
    };
  }> {
    const response = await this.client.get<{
      paymentIntent: {
        id: string;
        amount: number;
        currency: string;
        status: string;
        created: number;
      };
    }>(`/payments/intent/${paymentIntentId}`);
    return response.data;
  }

  // ========== REVIEWS ==========

  /**
   * Récupérer mes avis (avis que j'ai écrits)
   */
  async getMyReviews(): Promise<{ reviews: any[]; count: number }> {
    const response = await this.client.get<{ reviews: any[]; count: number }>("/reviews/me");
    return response.data;
  }

  /**
   * Récupérer les avis reçus par un utilisateur
   * @param userId - ID de l'utilisateur
   */
  async getReviewsByUser(userId: string): Promise<{ reviews: any[]; count: number; average_rating: number | null }> {
    const response = await this.client.get<{ reviews: any[]; count: number; average_rating: number | null }>(`/reviews/user/${userId}`);
    return response.data;
  }

  /**
   * Récupérer l'avis pour une réservation spécifique
   * @param bookingId - ID de la réservation
   */
  async getReviewByBooking(bookingId: string): Promise<{ review: any }> {
    const response = await this.client.get<{ review: any }>(`/reviews/booking/${bookingId}`);
    return response.data;
  }

  /**
   * Créer un avis
   * @param data - Données de l'avis
   */
  async createReview(data: { booking_id: string; rating: number; comment?: string }): Promise<{ message: string; review: any }> {
    const response = await this.client.post<{ message: string; review: any }>("/reviews", data);
    return response.data;
  }

  /**
   * Mettre à jour un avis
   * @param reviewId - ID de l'avis
   * @param data - Données à mettre à jour
   */
  async updateReview(reviewId: string, data: { rating?: number; comment?: string }): Promise<{ message: string; review: any }> {
    const response = await this.client.put<{ message: string; review: any }>(`/reviews/${reviewId}`, data);
    return response.data;
  }

  /**
   * Supprimer un avis
   * @param reviewId - ID de l'avis
   */
  async deleteReview(reviewId: string): Promise<{ message: string }> {
    const response = await this.client.delete<{ message: string }>(`/reviews/${reviewId}`);
    return response.data;
  }

  // ========== PROFILE MANAGEMENT ==========

  /**
   * Mettre à jour mon profil
   * @param data - Données du profil à mettre à jour
   */
  async updateMyProfile(data: {
    first_name?: string;
    last_name?: string;
    phone?: string;
    address?: string;
    city?: string;
    postal_code?: string;
    country?: string;
    avatar_url?: string;
    language?: string;
    currency?: string;
    notifications_enabled?: boolean;
    email_notifications?: boolean;
    sms_notifications?: boolean;
    household_size?: number;
    pet_friendly?: boolean;
    smoking_allowed?: boolean;
  }): Promise<{
    message: string;
    user: any;
    cookProfile?: any;
    clientProfile?: any;
  }> {
    const response = await this.client.put("/profiles/me", data);
    return response.data;
  }

  // ========== AUTHENTICATION & SECURITY ==========

  /**
   * Changer le mot de passe
   * @param data - Données pour changer le mot de passe
   */
  async changePassword(data: {
    currentPassword: string;
    newPassword: string;
  }): Promise<{ message: string }> {
    const response = await this.client.put("/auth/change-password", data);
    return response.data;
  }

  /**
   * Supprimer mon compte
   * @param password - Mot de passe pour confirmation
   */
  async deleteAccount(password: string): Promise<{ message: string }> {
    const response = await this.client.delete("/auth/delete-account", {
      data: { password },
    });
    return response.data;
  }

  // ========== TWO-FACTOR AUTHENTICATION ==========

  /**
   * Activer la 2FA (génère le secret et le QR code)
   * @param password - Mot de passe pour confirmation
   */
  async enable2FA(password: string): Promise<{
    message: string;
    secret: string;
    qrCode: string;
    manualEntryKey: string;
  }> {
    const response = await this.client.post("/auth/2fa/enable", { password });
    return response.data;
  }

  /**
   * Vérifier et activer définitivement la 2FA
   * @param token - Code TOTP à 6 chiffres
   */
  async verifyAndEnable2FA(token: string): Promise<{ message: string }> {
    const response = await this.client.post("/auth/2fa/verify", { token });
    return response.data;
  }

  /**
   * Désactiver la 2FA
   * @param password - Mot de passe pour confirmation
   */
  async disable2FA(password: string): Promise<{ message: string }> {
    const response = await this.client.post("/auth/2fa/disable", { password });
    return response.data;
  }

  /**
   * Vérifier un token 2FA (pour la connexion)
   * @param token - Code TOTP à 6 chiffres
   */
  async verify2FAToken(token: string): Promise<{ message: string }> {
    const response = await this.client.post("/auth/2fa/verify-token", { token });
    return response.data;
  }

  // ========== CLIENT PREFERENCES MANAGEMENT ==========

  /**
   * Ajouter une restriction alimentaire
   * @param restriction - Type de restriction
   */
  async addDietaryRestriction(restriction: string): Promise<{ message: string }> {
    const response = await this.client.post("/client-preferences/dietary-restrictions", {
      restriction,
    });
    return response.data;
  }

  /**
   * Supprimer une restriction alimentaire
   * @param restriction - Type de restriction
   */
  async removeDietaryRestriction(restriction: string): Promise<{ message: string }> {
    const response = await this.client.delete(
      `/client-preferences/dietary-restrictions/${restriction}`
    );
    return response.data;
  }

  /**
   * Ajouter une allergie
   * @param allergy - Type d'allergie
   */
  async addAllergy(allergy: string): Promise<{ message: string }> {
    const response = await this.client.post("/client-preferences/allergies", { allergy });
    return response.data;
  }

  /**
   * Supprimer une allergie
   * @param allergy - Type d'allergie
   */
  async removeAllergy(allergy: string): Promise<{ message: string }> {
    const response = await this.client.delete(`/client-preferences/allergies/${allergy}`);
    return response.data;
  }

  /**
   * Ajouter une cuisine préférée
   * @param cuisine - Type de cuisine
   */
  async addFavoriteCuisine(cuisine: string): Promise<{ message: string }> {
    const response = await this.client.post("/client-preferences/favorite-cuisines", { cuisine });
    return response.data;
  }

  /**
   * Supprimer une cuisine préférée
   * @param cuisine - Type de cuisine
   */
  async removeFavoriteCuisine(cuisine: string): Promise<{ message: string }> {
    const response = await this.client.delete(`/client-preferences/favorite-cuisines/${cuisine}`);
    return response.data;
  }

  // ========== PAYMENT METHODS (STRIPE) ==========

  /**
   * Récupérer mes méthodes de paiement (cartes)
   */
  async getPaymentMethods(): Promise<{
    paymentMethods: any[];
    count: number;
  }> {
    const response = await this.client.get("/payments/methods");
    return response.data;
  }

  /**
   * Créer un Setup Intent pour ajouter une carte
   */
  async createSetupIntent(): Promise<{
    clientSecret: string;
    setupIntentId: string;
    customerId: string;
  }> {
    const response = await this.client.post("/payments/methods/setup-intent");
    return response.data;
  }

  /**
   * Confirmer et sauvegarder une carte après Setup Intent
   */
  async confirmPaymentMethod(data: {
    setupIntentId: string;
    paymentMethodId: string;
    isDefault?: boolean;
  }): Promise<{
    message: string;
    paymentMethod: any;
  }> {
    const response = await this.client.post("/payments/methods/confirm", data);
    return response.data;
  }

  /**
   * Définir une carte comme défaut
   */
  async setDefaultPaymentMethod(paymentMethodId: string): Promise<{
    message: string;
    paymentMethod: any;
  }> {
    const response = await this.client.put(`/payments/methods/${paymentMethodId}/default`);
    return response.data;
  }

  /**
   * Supprimer une carte
   */
  async deletePaymentMethod(paymentMethodId: string): Promise<{ message: string }> {
    const response = await this.client.delete(`/payments/methods/${paymentMethodId}`);
    return response.data;
  }

  // ========== NOTIFICATION PREFERENCES ==========

  /**
   * Récupérer les préférences de notifications détaillées
   */
  async getNotificationPreferences(): Promise<{
    preferences: {
      booking_request?: { email: boolean; sms: boolean; push: boolean };
      booking_accepted?: { email: boolean; sms: boolean; push: boolean };
      booking_confirmed?: { email: boolean; sms: boolean; push: boolean };
      booking_cancelled?: { email: boolean; sms: boolean; push: boolean };
      booking_reminder?: { email: boolean; sms: boolean; push: boolean };
      review_received?: { email: boolean; sms: boolean; push: boolean };
      message_received?: { email: boolean; sms: boolean; push: boolean };
      payment_received?: { email: boolean; sms: boolean; push: boolean };
      dispute_opened?: { email: boolean; sms: boolean; push: boolean };
      profile_approved?: { email: boolean; sms: boolean; push: boolean };
      profile_rejected?: { email: boolean; sms: boolean; push: boolean };
    };
  }> {
    const response = await this.client.get("/notifications/preferences");
    return response.data;
  }

  /**
   * Mettre à jour les préférences de notifications détaillées
   */
  async updateNotificationPreferences(preferences: {
    booking_request?: { email: boolean; sms: boolean; push: boolean };
    booking_accepted?: { email: boolean; sms: boolean; push: boolean };
    booking_confirmed?: { email: boolean; sms: boolean; push: boolean };
    booking_cancelled?: { email: boolean; sms: boolean; push: boolean };
    booking_reminder?: { email: boolean; sms: boolean; push: boolean };
    review_received?: { email: boolean; sms: boolean; push: boolean };
    message_received?: { email: boolean; sms: boolean; push: boolean };
    payment_received?: { email: boolean; sms: boolean; push: boolean };
    dispute_opened?: { email: boolean; sms: boolean; push: boolean };
    profile_approved?: { email: boolean; sms: boolean; push: boolean };
    profile_rejected?: { email: boolean; sms: boolean; push: boolean };
  }): Promise<{
    message: string;
    preferences: any;
  }> {
    const response = await this.client.put("/notifications/preferences", preferences);
    return response.data;
  }
}

// Instance singleton
export const apiClient = new ApiClient();
