"use client";

import { useEffect, useMemo, useState, Suspense } from "react";
import { useRouter, useSearchParams, type ReadonlyURLSearchParams } from "next/navigation";
import { Loader2, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";
import { apiClient } from "@/lib/api/client";
import { useAuthStore } from "@/stores/authStore";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import type { UserRole } from "@/types";

const parseOAuthParams = (hash: string, search: URLSearchParams | ReadonlyURLSearchParams) => {
  const fragmentParams = new URLSearchParams(hash.startsWith("#") ? hash.substring(1) : hash);
  const refreshToken = fragmentParams.get("refresh_token") || search.get("refresh_token");
  const role = search.get("role") || fragmentParams.get("role");

  return {
    refreshToken,
    role,
  };
};

function OAuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const applyAuthResponse = useAuthStore((state) => state.applyAuthResponse);
  const [error, setError] = useState<string | null>(null);

  const params = useMemo(() => {
    if (typeof window === "undefined") {
      return { refreshToken: null, role: null };
    }
    return parseOAuthParams(window.location.hash, searchParams);
  }, [searchParams]);

  useEffect(() => {
    if (!params.refreshToken) {
      return;
    }

    const handleOAuth = async () => {
      try {
        const response = await apiClient.refreshSession(
          params.refreshToken ?? undefined,
          {
            role: (params.role as UserRole | null) ?? undefined,
          },
        );
        applyAuthResponse(response);

        const destination =
          response.user.role === "COOK"
            ? "/dashboard/cook"
            : response.user.role === "ADMIN"
              ? "/dashboard/admin"
              : "/dashboard/client";

        router.replace(destination);
      } catch (oauthError) {
        const message =
          oauthError instanceof Error
            ? oauthError.message
            : "Impossible de finaliser la connexion OAuth. Veuillez réessayer.";
        setError(message);
      }
    };

    void handleOAuth();
  }, [applyAuthResponse, params.refreshToken, router]);

  if (!params.refreshToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md bg-card border border-border rounded-2xl p-8 shadow-lg text-center space-y-5"
        >
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-destructive" />
            </div>
          </div>
          <h1 className="text-2xl font-semibold">Connexion OAuth impossible</h1>
          <p className="text-muted-foreground">
            Le fournisseur n&rsquo;a pas retourné de jeton de session. Veuillez réessayer ou utiliser la connexion
            classique.
          </p>
          <div className="space-y-3">
            <Button asChild className="w-full bg-blue-600 hover:bg-blue-700 text-white">
              <Link href="/auth/login">Retour à la connexion</Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/">Retour à l&rsquo;accueil</Link>
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md bg-card border border-border rounded-2xl p-8 shadow-lg text-center space-y-5"
        >
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-destructive" />
            </div>
          </div>
          <h1 className="text-2xl font-semibold">Connexion OAuth impossible</h1>
          <p className="text-muted-foreground">{error}</p>
          <div className="space-y-3">
            <Button asChild className="w-full bg-blue-600 hover:bg-blue-700 text-white">
              <Link href="/auth/login">Retour à la connexion</Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/">Retour à l&rsquo;accueil</Link>
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 sm:px-6 lg:px-8 py-12">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md text-center space-y-4"
      >
        <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto" />
        <h1 className="text-2xl font-semibold">Connexion en cours...</h1>
        <p className="text-muted-foreground">
          Nous sécurisons votre session et vous redirigeons vers votre tableau de bord.
        </p>
      </motion.div>
    </div>
  );
}

export default function OAuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
        </div>
      }
    >
      <OAuthCallbackContent />
    </Suspense>
  );
}

