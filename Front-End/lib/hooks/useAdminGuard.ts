"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuthGuard } from "./useAuthGuard";
import { useAuthStore } from "@/stores/authStore";

export function useAdminGuard() {
  const router = useRouter();
  const { isAuthenticated, isLoading: isAuthLoading } = useAuthGuard();
  const { user } = useAuthStore();
  const hasRedirectedRef = useRef(false);

  useEffect(() => {
    if (isAuthLoading) return;
    if (!isAuthenticated) return;

    if (user?.role !== "ADMIN" && !hasRedirectedRef.current) {
      hasRedirectedRef.current = true;
      router.replace("/dashboard/client");
    }
  }, [isAuthenticated, isAuthLoading, user?.role, router]);

  const isAuthorized = Boolean(isAuthenticated && user?.role === "ADMIN");
  const isLoading = isAuthLoading || (!user && isAuthenticated);

  return {
    isAuthorized,
    isLoading,
    user,
  };
}

