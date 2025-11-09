"use client";

import { useEffect, useState } from "react";
import { useThemeStore } from "@/stores/themeStore";

/**
 * Provider pour initialiser le thème au chargement
 * Évite le flash de contenu non stylisé (FOUC)
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { theme, setTheme, initialized } = useThemeStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Initialiser le thème au montage du composant (une seule fois)
    if (!initialized && typeof window !== "undefined") {
      const stored = localStorage.getItem("cook-us-theme") as "light" | "dark" | null;
      const initialTheme = stored || "dark";
      setTheme(initialTheme);
    }
  }, [initialized, setTheme]);

  useEffect(() => {
    // S'assurer que le thème est appliqué au document quand il change
    if (mounted && typeof window !== "undefined") {
      document.documentElement.classList.remove("light", "dark");
      document.documentElement.classList.add(theme);
    }
  }, [theme, mounted]);

  // Éviter le flash de contenu non stylisé pendant l'hydratation
  if (!mounted) {
    return <>{children}</>;
  }

  return <>{children}</>;
}

