"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";

/**
 * Hook pour protéger les pages nécessitant une authentification
 * Évite les boucles infinies et les blocages de navigation
 */
export function useAuthGuard() {
  const router = useRouter();
  const { isAuthenticated, checkAuth, isLoading: isAuthLoading } = useAuthStore();
  const hasCheckedRef = useRef(false);
  const isRedirectingRef = useRef(false);

  useEffect(() => {
    // Ne vérifier qu'une seule fois
    if (hasCheckedRef.current || isAuthLoading || isRedirectingRef.current) {
      return;
    }

    const verifyAuth = async () => {
      // Si déjà authentifié, on peut continuer
      if (isAuthenticated) {
        hasCheckedRef.current = true;
        return;
      }

      try {
        hasCheckedRef.current = true;
        // Vérifier l'authentification
        await checkAuth();
        
        // Vérifier à nouveau après checkAuth pour être sûr
        const currentState = useAuthStore.getState();
        if (!currentState.isAuthenticated) {
          throw new Error("Authentification échouée");
        }
      } catch (error) {
        // Si l'authentification échoue, rediriger immédiatement vers la page de connexion
        if (!isRedirectingRef.current) {
          isRedirectingRef.current = true;
          console.warn("Authentification échouée, redirection vers la page de connexion");
          // Utiliser replace pour éviter d'ajouter une entrée dans l'historique
          // Ajouter le paramètre returnUrl pour rediriger après connexion
          const currentPath = typeof window !== "undefined" ? window.location.pathname : "/";
          router.replace(`/auth/login?returnUrl=${encodeURIComponent(currentPath)}`);
        }
      }
    };

    verifyAuth();
  }, [isAuthenticated, checkAuth, router, isAuthLoading]);

  return {
    isAuthenticated,
    isLoading: isAuthLoading,
  };
}

