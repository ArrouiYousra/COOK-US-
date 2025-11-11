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
      if (isAuthenticated) {
        hasCheckedRef.current = true;
        return;
      }

      try {
        hasCheckedRef.current = true;
        await checkAuth();
      } catch (error) {
        // Si l'authentification échoue, rediriger vers la page de connexion
        if (!isRedirectingRef.current) {
          isRedirectingRef.current = true;
          console.warn("Authentification échouée, redirection vers la page de connexion");
          // Utiliser replace pour éviter d'ajouter une entrée dans l'historique
          router.replace("/auth/login");
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

