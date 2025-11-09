import axios, { AxiosInstance, AxiosError } from "axios";
import type { 
  AuthResponse, 
  RegisterClientInput, 
  RegisterCookInput, 
  LoginInput, 
  ForgotPasswordInput,
  ResetPasswordInput 
} from "@/types";

/**
 * Client API avec axios
 * Configuration centralisée pour tous les appels API
 */
class ApiClient {
  public client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api",
      timeout: 10000,
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Intercepteur pour ajouter le token à chaque requête
    this.client.interceptors.request.use(
      (config) => {
        const token = this.getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Intercepteur pour gérer les erreurs globalement
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError<{ message?: string; error?: string }>) => {
        const message = error.response?.data?.message || error.response?.data?.error || error.message || "Une erreur est survenue";
        return Promise.reject(new Error(message));
      }
    );
  }

  private getToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("cook-us-token");
  }

  setToken(token: string): void {
    if (typeof window !== "undefined") {
      localStorage.setItem("cook-us-token", token);
    }
  }

  removeToken(): void {
    if (typeof window !== "undefined") {
      localStorage.removeItem("cook-us-token");
    }
  }

  // ========== AUTHENTIFICATION ==========

  /**
   * Inscription client
   */
  async registerClient(data: RegisterClientInput): Promise<AuthResponse> {
    const response = await this.client.post<AuthResponse>("/auth/register/client", data);
    if (response.data.token) {
      this.setToken(response.data.token);
    }
    return response.data;
  }

  /**
   * Inscription cuisinier
   */
  async registerCook(data: RegisterCookInput): Promise<AuthResponse> {
    const response = await this.client.post<AuthResponse>("/auth/register/cook", data);
    if (response.data.token) {
      this.setToken(response.data.token);
    }
    return response.data;
  }

  /**
   * Connexion
   */
  async login(data: LoginInput): Promise<AuthResponse> {
    const response = await this.client.post<AuthResponse>("/auth/login", data);
    if (response.data.token) {
      this.setToken(response.data.token);
    }
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
    } finally {
      this.removeToken();
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
   */
  async resetPassword(data: ResetPasswordInput): Promise<{ message: string }> {
    const response = await this.client.post<{ message: string }>("/auth/reset-password", data);
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
}

// Instance singleton
export const apiClient = new ApiClient();

