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
  const isRedirectingRef = useRef(false);
  const isCheckingRef = useRef(false);

  useEffect(() => {
    if (isAuthLoading || isCheckingRef.current || isRedirectingRef.current) {
      return;
    }

    if (isAuthenticated) {
      // Réinitialiser le flag de redirection pour de futures vérifications
      isRedirectingRef.current = false;
      return;
    }

    const verifyAuth = async () => {
      isCheckingRef.current = true;

      try {
        await checkAuth();
        const currentState = useAuthStore.getState();
        if (!currentState.isAuthenticated) {
          throw new Error("Authentification échouée");
        }
        isRedirectingRef.current = false;
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
      } finally {
        isCheckingRef.current = false;
      }
    };

    verifyAuth();
  }, [isAuthenticated, checkAuth, router, isAuthLoading]);

  useEffect(() => {
    if (isAuthenticated) {
      isRedirectingRef.current = false;
    }
  }, [isAuthenticated]);

  return {
    isAuthenticated,
    isLoading: isAuthLoading,
  };
}

