import { create } from "zustand";
import type { SearchFilters, FilterState } from "@/types";

interface FilterStore extends FilterState {
  setFilters: (filters: Partial<SearchFilters>) => void;
  resetFilters: () => void;
  setActiveFilters: (filters: Partial<SearchFilters>) => void;
}

/**
 * Store Zustand pour la gestion des filtres de recherche
 */
export const useFilterStore = create<FilterStore>((set) => ({
  filters: {},
  activeFilters: {},
  setFilters: (newFilters) =>
    set((state) => ({
      filters: { ...state.filters, ...newFilters },
    })),
  resetFilters: () =>
    set({
      filters: {},
      activeFilters: {},
    }),
  setActiveFilters: (activeFilters) =>
    set((state) => ({
      activeFilters: { ...state.activeFilters, ...activeFilters },
    })),
}));


