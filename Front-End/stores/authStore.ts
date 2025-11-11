import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { AuthResponse, AuthUser, UserRole } from "@/types";
import { apiClient } from "@/lib/api/client";

interface AuthStore {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  selectedRole: UserRole | null;
  
  // Actions
  setSelectedRole: (role: UserRole | null) => void;
  setUser: (user: AuthUser | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  applyAuthResponse: (auth: AuthResponse) => void;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  clearError: () => void;
}

/**
 * Store Zustand pour la gestion de l'authentification
 * Persisté dans localStorage pour maintenir la session
 */
export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      selectedRole: null,

      setSelectedRole: (role) => {
        set({ selectedRole: role });
      },

      setUser: (user) => {
        set({
          user,
          isAuthenticated: !!user,
          error: null,
        });
      },

      setLoading: (loading) => {
        set({ isLoading: loading });
      },

      setError: (error) => {
        set({ error });
      },

      clearError: () => {
        set({ error: null });
      },

      applyAuthResponse: (auth) => {
        // Stocker le token dans localStorage pour l'utiliser dans les requêtes
        if (auth.token && typeof window !== 'undefined') {
          localStorage.setItem('access_token', auth.token);
        }
        
        set({
          user: auth.user,
          isAuthenticated: true,
          isLoading: false,
          error: null,
          selectedRole: null,
        });
      },

      login: async (email: string, password: string) => {
        try {
          set({ isLoading: true, error: null });
          const response = await apiClient.login({ email, password });
          get().applyAuthResponse(response);
        } catch (error) {
          const message = error instanceof Error ? error.message : "Erreur de connexion";
          set({
            error: message,
            isLoading: false,
            isAuthenticated: false,
            user: null,
          });
          throw error;
        }
      },

      logout: async () => {
        try {
          await apiClient.logout();
        } catch (error) {
          // Ignorer les erreurs de déconnexion
        } finally {
          // Supprimer le token du localStorage
          if (typeof window !== 'undefined') {
            localStorage.removeItem('access_token');
          }
          
          set({
            user: null,
            isAuthenticated: false,
            error: null,
            selectedRole: null,
          });
        }
      },

      checkAuth: async () => {
        try {
          set({ isLoading: true });
          const response = await apiClient.getCurrentUser();
          get().applyAuthResponse(response);
        } catch (error: any) {
          // Si l'erreur est 401 (Unauthorized), essayer de rafraîchir la session
          if (error?.response?.status === 401) {
            try {
              const refreshResponse = await apiClient.refreshSession();
              get().applyAuthResponse(refreshResponse);
              return;
            } catch (refreshError) {
              // Si le refresh échoue aussi, l'utilisateur n'est plus authentifié
              // C'est un comportement normal après déconnexion, ne pas logger d'erreur
              // Supprimer le token du localStorage
              if (typeof window !== 'undefined') {
                localStorage.removeItem('access_token');
              }
              set({
                user: null,
                isAuthenticated: false,
                error: null,
              });
              // Ne pas logger cette erreur car c'est attendu après déconnexion
              return;
            }
          } else {
            // Pour les autres erreurs, seulement logger si ce n'est pas une erreur réseau normale
            // (comme ECONNABORTED ou ERR_NETWORK qui sont gérées par le client API)
            if (error?.code !== 'ECONNABORTED' && error?.code !== 'ERR_NETWORK') {
              // Ne logger que les erreurs inattendues, pas les erreurs normales de déconnexion
              console.warn('Erreur lors de la vérification de l\'authentification:', error?.message || 'Erreur inconnue');
            }
            // Supprimer le token du localStorage en cas d'erreur
            if (typeof window !== 'undefined') {
              localStorage.removeItem('access_token');
            }
            set({
              user: null,
              isAuthenticated: false,
              error: null,
            });
          }
        } finally {
          set({ isLoading: false });
        }
      },
    }),
    {
      name: "cook-us-auth",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        selectedRole: state.selectedRole,
      }),
    }
  )
);
