"use client";

import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useThemeStore } from "@/stores/themeStore";
import { useEffect, useState } from "react";

/**
 * Composant toggle pour basculer entre light/dark mode
 * Évite les erreurs d'hydratation en ne s'affichant qu'après le montage
 */
export function ThemeToggle() {
  const { theme, toggleTheme } = useThemeStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Utiliser un callback pour éviter setState synchrone
    setTimeout(() => {
      setMounted(true);
    }, 0);
  }, []);

  if (!mounted) {
    // Retourner un placeholder de même taille pour éviter le layout shift
    return (
      <Button
        variant="ghost"
        size="icon"
        className="w-10 h-10"
        aria-label="Toggle theme"
        disabled
      >
        <Sun className="h-5 w-5" />
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className="w-10 h-10 text-foreground/80 hover:text-foreground hover:bg-accent"
      aria-label={`Passer en mode ${theme === "dark" ? "clair" : "sombre"}`}
    >
      {theme === "dark" ? (
        <Sun className="h-5 w-5" />
      ) : (
        <Moon className="h-5 w-5" />
      )}
    </Button>
  );
}

