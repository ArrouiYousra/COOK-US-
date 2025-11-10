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
      timeout: 10000,
      withCredentials: true,
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Intercepteur pour gérer les erreurs globalement
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError<{ message?: string; error?: string }>) => {
        const message =
          error.response?.data?.message ||
          error.response?.data?.error ||
          error.message ||
          "Une erreur est survenue";
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
   * Réinitialisation du mot de passe
   * (le token est géré côté Supabase via le lien magique)
   */
  async resetPassword(data: ResetPasswordInput): Promise<{ message: string }> {
    const response = await this.client.post<{ message: string }>("/auth/reset-password", {
      password: data.password,
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

  // ========== FAVORITES ==========

  /**
   * Récupérer mes chefs favoris (pour les clients)
   */
  async getFavorites(): Promise<{ favorites: any[]; count: number }> {
    const response = await this.client.get<{ favorites: any[]; count: number }>("/favorites");
    return response.data;
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
    const response = await this.client.get<{ profiles: any[]; count: number; limit: number; offset: number }>(url);
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
}

// Instance singleton
export const apiClient = new ApiClient();

