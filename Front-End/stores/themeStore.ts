import { create } from "zustand";

type Theme = "light" | "dark";

interface ThemeStore {
  theme: Theme;
  initialized: boolean;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

/**
 * Fonction pour appliquer le thème au DOM
 */
const applyTheme = (theme: Theme) => {
  if (typeof window !== "undefined") {
    document.documentElement.classList.remove("light", "dark");
    document.documentElement.classList.add(theme);
    localStorage.setItem("cook-us-theme", theme);
  }
};

/**
 * Store Zustand pour la gestion du thème (light/dark)
 * Le thème est persisté via localStorage manuellement pour éviter les erreurs SSR
 */
export const useThemeStore = create<ThemeStore>((set, get) => ({
  theme: "dark", // Valeur par défaut pour SSR
  initialized: false,
  
  setTheme: (theme) => {
    set({ theme, initialized: true });
    applyTheme(theme);
  },
  
  toggleTheme: () => {
    const currentTheme = get().theme;
    const newTheme = currentTheme === "dark" ? "light" : "dark";
    set({ theme: newTheme, initialized: true });
    applyTheme(newTheme);
  },
}));

