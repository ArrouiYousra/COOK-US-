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
        } catch (error) {
            try {
              const refreshResponse = await apiClient.refreshSession();
              get().applyAuthResponse(refreshResponse);
              return;
            } catch (refreshError) {
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
