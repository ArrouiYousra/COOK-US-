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
    // S'assurer que l'URL de base se termine par /api
    let baseURL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
    // Si l'URL ne se termine pas par /api, l'ajouter
    if (!baseURL.endsWith("/api")) {
      baseURL = baseURL.endsWith("/") ? `${baseURL}api` : `${baseURL}/api`;
    }
    
    this.client = axios.create({
      baseURL,
            timeout: 60000, // Augmenté à 60 secondes pour les uploads d'avatar
            withCredentials: true,
            headers: {
              "Content-Type": "application/json",
            },
            maxContentLength: 5242880, // 5MB max content length
            maxBodyLength: 5242880, // 5MB max body length
          });

    // Intercepteur pour ajouter le token d'authentification dans les headers
    this.client.interceptors.request.use(
      (config) => {
        // Priorité 1: Récupérer le token depuis localStorage (stocké après login)
        if (typeof window !== 'undefined') {
          const token = localStorage.getItem('access_token');
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
            return config;
          }
        }
        
        // Priorité 2: Essayer de récupérer le token depuis les cookies accessibles (non-HttpOnly)
        // Note: Les cookies HttpOnly ne sont pas accessibles depuis JavaScript
        // Le backend devrait gérer l'authentification via les cookies avec withCredentials: true
        if (typeof document !== 'undefined') {
          const cookies = document.cookie.split(';');
          for (const cookie of cookies) {
            const [name, value] = cookie.trim().split('=');
            if (name === 'access_token' && value) {
              config.headers.Authorization = `Bearer ${value}`;
              break;
            }
          }
        }
        
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

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
          const baseURL = error.config?.baseURL || 'http://localhost:5000/api';
          console.error(`Erreur réseau pour ${url}. Vérifiez que le backend est démarré sur ${baseURL}`);
          console.error('Détails de l\'erreur:', {
            code: error.code,
            message: error.message,
            config: {
              baseURL: error.config?.baseURL,
              url: error.config?.url,
              method: error.config?.method,
            },
          });
          
          // Ne pas retourner de valeurs par défaut pour les endpoints critiques (auth, mapbox token)
          if (url.includes('/auth/login') || url.includes('/auth/register') || url.includes('/mapbox/token')) {
            throw error; // Propager l'erreur pour ces endpoints critiques
          }
          
          // Retourner des valeurs par défaut pour éviter les crashes (endpoints non critiques)
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
        // Ne pas logger les erreurs 401 dans checkAuth car c'est normal après déconnexion
        const is401Error = error.response?.status === 401;
        const isCheckAuthCall = error.config?.url?.includes('/auth/me') || error.config?.url?.includes('/users/me');
        
        if (error.code !== 'ECONNABORTED' && error.code !== 'ERR_NETWORK' && !(is401Error && isCheckAuthCall)) {
          // Construire l'objet d'erreur de manière simple et directe
          // Toujours s'assurer d'avoir au moins message et timestamp
          let errorMessage: string;
          try {
            errorMessage = message || error.message || String(error) || 'Erreur inconnue';
          } catch (e) {
            errorMessage = 'Erreur inconnue';
          }
          
          let errorTimestamp: string;
          try {
            errorTimestamp = new Date().toISOString();
          } catch (e) {
            errorTimestamp = new Date().toString();
          }
          
          // Créer l'objet avec les propriétés de base directement - garanties d'exister
          const errorDetails: Record<string, any> = {
            message: errorMessage || 'Erreur inconnue',
            timestamp: errorTimestamp || new Date().toISOString(),
          };
          
          // Vérifier immédiatement que l'objet a bien les propriétés
          const initialKeys = Object.keys(errorDetails);
          if (initialKeys.length === 0 || !errorDetails.message || !errorDetails.timestamp) {
            console.error('⚠️ ERREUR CRITIQUE: errorDetails n\'a pas été créé correctement!', {
              errorMessage,
              errorTimestamp,
              errorDetails,
              initialKeys,
              errorDetailsType: typeof errorDetails,
            });
            // Forcer la création avec des valeurs par défaut
            errorDetails.message = errorMessage || 'Erreur inconnue';
            errorDetails.timestamp = errorTimestamp || new Date().toISOString();
          }
          
          console.log('errorDetails créé avec', Object.keys(errorDetails).length, 'clés:', Object.keys(errorDetails));
          
          // Ajouter le type d'erreur
          try {
            const errorType = error?.constructor?.name || typeof error || "unknown";
            if (errorType) errorDetails.errorType = String(errorType);
          } catch (e) {
            errorDetails.errorType = "unknown";
            errorDetails.errorTypeError = e instanceof Error ? e.message : String(e);
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
              } else {
                errorDetails.data = null;
              }
            } else {
              // Pas de réponse (erreur réseau, timeout, etc.)
              errorDetails.status = null;
              errorDetails.statusText = 'No response';
            }
          } catch (e) {
            errorDetails.responseError = 'error_parsing_response';
            errorDetails.parseError = e instanceof Error ? e.message : String(e);
          }
          
          // Ajouter le message d'erreur original s'il diffère
          try {
            if (error.message && error.message !== message) {
              errorDetails.errorMessage = String(error.message);
            }
          } catch (e) {
            // Ignorer
          }
          
          // Toujours logger errorDetails - il devrait toujours contenir au moins message et timestamp
          // Vérifier que errorDetails existe et n'est pas vide avant de le logger
          try {
            const errorDetailsKeys = errorDetails ? Object.keys(errorDetails) : [];
            
            // Debug: vérifier pourquoi errorDetails pourrait être vide
            if (!errorDetails || errorDetailsKeys.length === 0) {
              console.error('⚠️ ERREUR CRITIQUE: errorDetails est vide ou undefined!', {
                errorMessage,
                errorTimestamp,
                errorDetailsObject: errorDetails,
                errorDetailsType: typeof errorDetails,
                errorDetailsConstructor: errorDetails?.constructor?.name,
              });
              
              // Recréer errorDetails de manière simple
              const fallbackErrorDetails = {
                message: errorMessage || 'Erreur inconnue',
                timestamp: errorTimestamp || new Date().toISOString(),
                error: 'errorDetails was empty or undefined',
              };
              console.error('API Error Details (fallback):', fallbackErrorDetails);
            } else {
              // S'assurer que errorDetails a au moins message et timestamp
              if (!errorDetails.message || !errorDetails.timestamp) {
                errorDetails.message = errorDetails.message || errorMessage || 'Erreur inconnue';
                errorDetails.timestamp = errorDetails.timestamp || errorTimestamp || new Date().toISOString();
              }
              console.error('API Error Details:', errorDetails);
            }
          } catch (logError) {
            // Si même le logging échoue, utiliser un fallback minimal
            console.error('Erreur lors du logging des détails:', logError);
            console.error('Erreur API (fallback minimal):', {
              message: errorMessage || 'Erreur inconnue',
              timestamp: errorTimestamp || new Date().toISOString(),
              originalError: error instanceof Error ? error.message : String(error),
              errorCode: error.code,
              errorResponse: error.response ? {
                status: error.response.status,
                statusText: error.response.statusText,
                data: error.response.data,
              } : null,
            });
          }
          
          // Logger aussi l'erreur brute pour debugging
          try {
            console.error('Erreur brute complète:', {
              error,
              errorType: typeof error,
              errorKeys: error ? Object.keys(error) : [],
              errorString: String(error),
              errorJSON: JSON.stringify(error, Object.getOwnPropertyNames(error), 2),
            });
          } catch (jsonError) {
            console.error('Impossible de sérialiser l\'erreur:', jsonError);
          }
          
          try {
            const rawErrorInfo: Record<string, any> = {
              errorType: typeof error,
            };
            
            try {
              rawErrorInfo.errorConstructor = error?.constructor?.name || 'unknown';
            } catch (e) {
              rawErrorInfo.errorConstructorError = String(e);
            }
            
            if (error && typeof error === 'object') {
              try {
                rawErrorInfo.hasCode = 'code' in error;
                if ('code' in error) rawErrorInfo.codeValue = (error as any).code;
              } catch (e) {
                // Ignorer
              }
              
              try {
                rawErrorInfo.hasMessage = 'message' in error;
                if ('message' in error) rawErrorInfo.messageValue = (error as any).message;
              } catch (e) {
                // Ignorer
              }
              
              try {
                rawErrorInfo.hasResponse = 'response' in error;
                rawErrorInfo.hasRequest = 'request' in error;
                rawErrorInfo.hasConfig = 'config' in error;
              } catch (e) {
                // Ignorer
              }
              
              try {
                rawErrorInfo.allKeys = Object.keys(error);
              } catch (e) {
                rawErrorInfo.allKeysError = 'Cannot get keys';
              }
              
              try {
                if (error instanceof Error) {
                  rawErrorInfo.stack = error.stack;
                }
              } catch (e) {
                // Ignorer
              }
            }
            
            console.error('API Error Raw:', rawErrorInfo);
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
    // Log pour déboguer
    console.log("[API Client] Tentative de connexion avec:", {
      email: data.email,
      passwordLength: data.password?.length,
      hasPassword: !!data.password,
    });
    
    try {
      const response = await this.client.post<AuthResponse>("/auth/login", data);
      console.log("[API Client] Connexion réussie");
      return response.data;
    } catch (error: any) {
      console.error("[API Client] Erreur de connexion:", {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
        url: error.config?.url,
        baseURL: error.config?.baseURL,
      });
      throw error;
    }
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
   * Récupérer les demandes publiques (pour les cuisiniers)
   * @param params - Paramètres de filtrage (city, limit, offset)
   */
  async getPublicRequests(params?: { city?: string; limit?: number; offset?: number }): Promise<{ bookings: any[]; count: number; limit: number; offset: number }> {
    const queryParams = new URLSearchParams();
    if (params?.city) queryParams.append("city", params.city);
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.offset) queryParams.append("offset", params.offset.toString());

    const queryString = queryParams.toString();
    const url = `/bookings/public${queryString ? `?${queryString}` : ""}`;
    const response = await this.client.get<{ bookings: any[]; count: number; limit: number; offset: number }>(url);
    return response.data;
  }

  /**
   * Créer une demande publique (pour les clients)
   * @param data - Données de la demande
   */
  async createPublicRequest(data: {
    booking_date: string;
    meal_type?: string;
    start_time?: string;
    end_time?: string;
    number_of_guests?: number;
    need_groceries?: boolean;
    need_table_setting?: boolean;
    need_dishes?: boolean;
    dietary_restrictions?: string[];
    allergies?: string[];
    special_requests?: string;
    ingredients_available?: string;
    address_id?: string;
  }): Promise<{ message: string; booking: any }> {
    const response = await this.client.post<{ message: string; booking: any }>('/bookings/public', data);
    return response.data;
  }

  /**
   * Récupérer une réservation par son ID
   */
  async getBookingById(bookingId: string): Promise<{ booking: any }> {
    const response = await this.client.get<{ booking: any }>(`/bookings/${bookingId}`);
    return response.data;
  }

  /**
   * Accepter une réservation
   */
  async acceptBooking(bookingId: string): Promise<{ message: string; booking: any }> {
    const response = await this.client.put<{ message: string; booking: any }>(`/bookings/${bookingId}/accept`);
    return response.data;
  }

  // ========== RESERVATIONS (Propositions des cuisiniers) ==========

  /**
   * Créer une proposition (réservation) sur une demande publique
   * @param data - Données de la proposition
   */
  async createReservation(data: {
    booking_id: string;
    proposed_price: number;
    proposed_hours?: number;
    proposed_hourly_rate?: number;
    message?: string;
    can_do_groceries?: boolean;
    can_set_table?: boolean;
    can_do_dishes?: boolean;
  }): Promise<{ message: string; reservation: any }> {
    const response = await this.client.post<{ message: string; reservation: any }>('/reservations', data);
    return response.data;
  }

  /**
   * Récupérer les propositions pour une demande publique
   * @param bookingId - ID de la demande publique
   * @param includeExpired - Inclure les propositions expirées
   */
  async getReservationsByBookingId(
    bookingId: string,
    includeExpired?: boolean
  ): Promise<{ reservations: any[]; stats: any; count: number }> {
    const queryParams = new URLSearchParams();
    if (includeExpired) queryParams.append('includeExpired', 'true');
    const queryString = queryParams.toString();
    const url = `/reservations/booking/${bookingId}${queryString ? `?${queryString}` : ''}`;
    const response = await this.client.get<{ reservations: any[]; stats: any; count: number }>(url);
    return response.data;
  }

  /**
   * Récupérer mes propositions (cuisinier)
   * @param status - Filtrer par statut (optionnel)
   */
  async getMyReservations(status?: string): Promise<{ reservations: any[]; count: number }> {
    const queryParams = new URLSearchParams();
    if (status) queryParams.append('status', status);
    const queryString = queryParams.toString();
    const url = `/reservations/my-proposals${queryString ? `?${queryString}` : ''}`;
    const response = await this.client.get<{ reservations: any[]; count: number }>(url);
    return response.data;
  }

  /**
   * Récupérer une proposition par son ID
   * @param reservationId - ID de la proposition
   */
  async getReservationById(reservationId: string): Promise<{ reservation: any }> {
    const response = await this.client.get<{ reservation: any }>(`/reservations/${reservationId}`);
    return response.data;
  }

  /**
   * Accepter une proposition (client)
   * @param reservationId - ID de la proposition
   */
  async acceptReservation(reservationId: string): Promise<{
    message: string;
    reservation: any;
    depositAmount: number;
    remainingAmount: number;
  }> {
    const response = await this.client.put<{
      message: string;
      reservation: any;
      depositAmount: number;
      remainingAmount: number;
    }>(`/reservations/${reservationId}/accept`);
    return response.data;
  }

  /**
   * Refuser une proposition (client)
   * @param reservationId - ID de la proposition
   * @param rejectionReason - Raison du refus (optionnel)
   */
  async rejectReservation(
    reservationId: string,
    rejectionReason?: string
  ): Promise<{ message: string; reservation: any }> {
    const response = await this.client.put<{ message: string; reservation: any }>(
      `/reservations/${reservationId}/reject`,
      { rejection_reason: rejectionReason }
    );
    return response.data;
  }

  /**
   * Annuler une proposition (cuisinier)
   * @param reservationId - ID de la proposition
   * @param cancellationReason - Raison de l'annulation (optionnel)
   */
  async cancelReservation(
    reservationId: string,
    cancellationReason?: string
  ): Promise<{ message: string; reservation: any }> {
    const response = await this.client.put<{ message: string; reservation: any }>(
      `/reservations/${reservationId}/cancel`,
      { cancellation_reason: cancellationReason }
    );
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
      console.log("Réponse brute de l'API getCookProfiles:", response.data);
      // S'assurer que la réponse a toujours la structure attendue
      const result = {
        profiles: response.data?.profiles || [],
        count: response.data?.count || 0,
        limit: response.data?.limit || params?.limit || 10,
        offset: response.data?.offset || params?.offset || 0,
      };
      console.log("Résultat formaté getCookProfiles:", result);
      return result;
    } catch (error: any) {
      // Logger l'erreur pour le débogage
      console.error("Erreur dans getCookProfiles:", {
        url,
        params,
        error: error?.message,
        response: error?.response?.data,
        status: error?.response?.status,
      });
      // Propager l'erreur pour que le composant puisse la gérer
      throw error;
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
    // User fields
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
    // Client profile fields
    household_size?: number;
    pet_friendly?: boolean;
    smoking_allowed?: boolean;
    // Cook profile fields
    headline?: string;
    bio?: string;
    experience?: string;
    video_intro_url?: string;
    service_radius?: number;
    hourly_rate?: number;
    minimum_booking_hours?: number;
    can_do_groceries?: boolean;
    can_set_table?: boolean;
    can_do_dishes?: boolean;
    max_guests?: number;
    employment_status?: "AUTO_ENTREPRENEUR" | "PORTAGE_SALARIAL" | "MICRO_ENTREPRISE" | "ASSOCIATION";
    siret_number?: string;
    insurance_number?: string;
    insurance_expiry_date?: string;
    id_card_url?: string;
    insurance_cert_url?: string;
    kbis_url?: string;
    is_available?: boolean;
    availability_note?: string;
  }): Promise<{
    message: string;
    user: any;
    cookProfile?: any;
    clientProfile?: any;
  }> {
    try {
      const response = await this.client.put("/profiles/me", data);
      console.log("updateMyProfile response:", response.data);
      return response.data;
    } catch (error: any) {
      console.error("Erreur dans updateMyProfile:", error);
      console.error("Response data:", error?.response?.data);
      console.error("Response status:", error?.response?.status);
      throw error;
    }
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

  // ========== TRANSACTIONS ==========

  /**
   * Récupérer mes transactions
   */
  async getMyTransactions(): Promise<{
    transactions: any[];
    count: number;
  }> {
    const response = await this.client.get<{
      transactions: any[];
      count: number;
    }>("/transactions/me");
    return response.data;
  }

  /**
   * Récupérer une transaction par ID
   */
  async getTransactionById(transactionId: string): Promise<{
    transaction: any;
  }> {
    const response = await this.client.get<{
      transaction: any;
    }>(`/transactions/${transactionId}`);
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

  // ========== AVAILABILITIES ==========

  /**
   * Récupérer mes disponibilités (cook)
   */
  async getMyAvailabilities(): Promise<{ availabilities: any[]; count: number }> {
    const response = await this.client.get<{ availabilities: any[]; count: number }>("/availabilities/me");
    return response.data;
  }

  /**
   * Créer une disponibilité
   */
  async createAvailability(data: {
    day_of_week: "MONDAY" | "TUESDAY" | "WEDNESDAY" | "THURSDAY" | "FRIDAY" | "SATURDAY" | "SUNDAY";
    meal_type: "BREAKFAST" | "LUNCH" | "DINNER" | "BRUNCH";
    start_time: string; // HH:MM:SS
    end_time: string; // HH:MM:SS
    is_active?: boolean;
  }): Promise<{ message: string; availability: any }> {
    const response = await this.client.post<{ message: string; availability: any }>("/availabilities", data);
    return response.data;
  }

  /**
   * Mettre à jour une disponibilité
   */
  async updateAvailability(
    availabilityId: string,
    data: {
      day_of_week?: "MONDAY" | "TUESDAY" | "WEDNESDAY" | "THURSDAY" | "FRIDAY" | "SATURDAY" | "SUNDAY";
      meal_type?: "BREAKFAST" | "LUNCH" | "DINNER" | "BRUNCH";
      start_time?: string;
      end_time?: string;
      is_active?: boolean;
    }
  ): Promise<{ message: string; availability: any }> {
    const response = await this.client.put<{ message: string; availability: any }>(`/availabilities/${availabilityId}`, data);
    return response.data;
  }

  /**
   * Supprimer une disponibilité
   */
  async deleteAvailability(availabilityId: string): Promise<{ message: string }> {
    const response = await this.client.delete<{ message: string }>(`/availabilities/${availabilityId}`);
    return response.data;
  }

  /**
   * Récupérer mes dates bloquées
   */
  async getMyBlockedDates(params?: { from_date?: string; to_date?: string }): Promise<{ blocked_dates: any[]; count: number }> {
    const queryParams = new URLSearchParams();
    if (params?.from_date) queryParams.append("from_date", params.from_date);
    if (params?.to_date) queryParams.append("to_date", params.to_date);

    const queryString = queryParams.toString();
    const url = `/availabilities/blocked-dates/me${queryString ? `?${queryString}` : ""}`;
    const response = await this.client.get<{ blocked_dates: any[]; count: number }>(url);
    return response.data;
  }

  /**
   * Bloquer une date
   */
  async createBlockedDate(data: { date: string; reason?: string }): Promise<{ message: string; blocked_date: any }> {
    const response = await this.client.post<{ message: string; blocked_date: any }>("/availabilities/blocked-dates", data);
    return response.data;
  }

  /**
   * Débloquer une date
   */
  async deleteBlockedDate(blockedDateId: string): Promise<{ message: string }> {
    const response = await this.client.delete<{ message: string }>(`/availabilities/blocked-dates/${blockedDateId}`);
    return response.data;
  }

  // ========== MAPBOX ==========

  /**
   * Rechercher des adresses (autocomplete)
   * @param query - Texte de recherche
   * @param country - Code pays (optionnel, ex: "FR")
   * @param proximity - Coordonnées pour biais de proximité [lng, lat] (optionnel)
   */
  async searchAddresses(
    query: string,
    country?: string,
    proximity?: [number, number]
  ): Promise<{ suggestions: any[] }> {
    const queryParams = new URLSearchParams();
    queryParams.append("query", query);
    if (country) queryParams.append("country", country);
    if (proximity) {
      queryParams.append("proximity_lng", proximity[0].toString());
      queryParams.append("proximity_lat", proximity[1].toString());
    }

    const response = await this.client.get<{ suggestions: any[] }>(
      `/mapbox/search?${queryParams.toString()}`
    );
    return response.data;
  }

  /**
   * Geocoder une adresse (adresse -> coordonnées)
   * @param address - Adresse à geocoder
   * @param country - Code pays (optionnel)
   */
  async geocodeAddress(
    address: string,
    country?: string
  ): Promise<{
    result: {
      latitude: number;
      longitude: number;
      placeName: string;
      address: string;
      city?: string;
      postalCode?: string;
      country?: string;
    };
  }> {
    const queryParams = new URLSearchParams();
    queryParams.append("address", address);
    if (country) queryParams.append("country", country);

    const response = await this.client.get<{
      result: {
        latitude: number;
        longitude: number;
        placeName: string;
        address: string;
        city?: string;
        postalCode?: string;
        country?: string;
      };
    }>(`/mapbox/geocode?${queryParams.toString()}`);
    return response.data;
  }

  /**
   * Reverse geocoder (coordonnées -> adresse)
   * @param latitude - Latitude
   * @param longitude - Longitude
   */
  async reverseGeocode(
    latitude: number,
    longitude: number
  ): Promise<{
    result: {
      placeName: string;
      address: string;
      city?: string;
      postalCode?: string;
      country?: string;
    };
  }> {
    const queryParams = new URLSearchParams();
    queryParams.append("latitude", latitude.toString());
    queryParams.append("longitude", longitude.toString());

    const response = await this.client.get<{
      result: {
        placeName: string;
        address: string;
        city?: string;
        postalCode?: string;
        country?: string;
      };
    }>(`/mapbox/reverse-geocode?${queryParams.toString()}`);
    return response.data;
  }

  /**
   * Calculer la distance et la durée entre deux points
   * @param origin - Point d'origine [lat, lng]
   * @param destination - Point de destination [lat, lng]
   * @param profile - Profil de routage (driving, walking, cycling)
   */
  async calculateDistance(
    origin: [number, number],
    destination: [number, number],
    profile: "driving" | "walking" | "cycling" = "driving"
  ): Promise<{
    result: {
      distance: number; // en mètres
      distance_km: string; // en kilomètres formaté
      duration: number; // en secondes
      duration_minutes: number; // en minutes
      geometry?: {
        type: "LineString";
        coordinates: [number, number][]; // [longitude, latitude]
      };
    };
  }> {
    const queryParams = new URLSearchParams();
    queryParams.append("origin_lat", origin[0].toString());
    queryParams.append("origin_lng", origin[1].toString());
    queryParams.append("dest_lat", destination[0].toString());
    queryParams.append("dest_lng", destination[1].toString());
    queryParams.append("profile", profile);

    const response = await this.client.get<{
      result: {
        distance: number;
        distance_km: string;
        duration: number;
        duration_minutes: number;
      };
    }>(`/mapbox/distance?${queryParams.toString()}`);
    return response.data;
  }

  /**
   * Récupérer le token Mapbox pour le frontend (sécurisé)
   */
  async getMapboxToken(): Promise<{ token: string }> {
    try {
      console.log("🔑 Tentative de récupération du token Mapbox...");
      const response = await this.client.get<{ token: string }>("/mapbox/token");
      console.log("✅ Token Mapbox récupéré avec succès");
      return response.data;
    } catch (error: any) {
      console.error("❌ Erreur lors de la récupération du token Mapbox:", {
        error,
        message: error?.message,
        code: error?.code,
        response: {
          status: error?.response?.status,
          statusText: error?.response?.statusText,
          data: error?.response?.data,
        },
        config: {
          url: error?.config?.url,
          baseURL: error?.config?.baseURL,
          method: error?.config?.method,
        },
      });
      
      // Messages d'erreur spécifiques selon le type d'erreur
      if (error.code === 'ERR_NETWORK' || !error.response) {
        throw new Error("Impossible de se connecter au backend. Vérifiez que le serveur est démarré sur le port 5000.");
      }
      
      if (error.response?.status === 401) {
        throw new Error("Vous devez être connecté pour accéder aux cartes. Veuillez vous connecter.");
      }
      
      if (error.response?.status === 500) {
        const backendMessage = error.response?.data?.message || "Erreur serveur";
        throw new Error(`Erreur serveur: ${backendMessage}`);
      }
      
      throw error;
    }
  }
}

// Instance singleton
export const apiClient = new ApiClient();

