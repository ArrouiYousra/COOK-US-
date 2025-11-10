import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  Booking,
  BookingResponse,
  ProposalsResponse,
  GetBookingsParams,
  GetMyProposalsParams,
} from "@/types";
import { apiClient } from "@/lib/api/client";

interface BookingStore {
  // État des bookings
  bookings: Booking[];
  bookingsCount: number;
  isLoadingBookings: boolean;
  bookingsError: string | null;

  // État des propositions
  proposals: Booking[];
  proposalsCount: number;
  proposalsStats: {
    pending: number;
    accepted: number;
    rejected: number;
  };
  isLoadingProposals: boolean;
  proposalsError: string | null;

  // Filtres
  bookingsFilter: {
    status?: string;
    limit?: number;
    offset?: number;
  };
  proposalsFilter: {
    filter?: "pending" | "accepted" | "rejected";
    limit?: number;
    offset?: number;
  };

  // Actions - Bookings
  fetchBookings: (params?: GetBookingsParams) => Promise<void>;
  setBookingsFilter: (filter: Partial<GetBookingsParams>) => void;
  clearBookingsError: () => void;

  // Actions - Proposals
  fetchProposals: (params?: GetMyProposalsParams) => Promise<void>;
  setProposalsFilter: (filter: Partial<GetMyProposalsParams>) => void;
  clearProposalsError: () => void;

  // Actions - Utilitaires
  clearAll: () => void;
  refreshAll: () => Promise<void>;
}

/**
 * Store Zustand pour la gestion des bookings et propositions
 */
export const useBookingStore = create<BookingStore>()(
  persist(
    (set, get) => ({
      // État initial - Bookings
      bookings: [],
      bookingsCount: 0,
      isLoadingBookings: false,
      bookingsError: null,
      bookingsFilter: {
        limit: 10,
        offset: 0,
      },

      // État initial - Proposals
      proposals: [],
      proposalsCount: 0,
      proposalsStats: {
        pending: 0,
        accepted: 0,
        rejected: 0,
      },
      isLoadingProposals: false,
      proposalsError: null,
      proposalsFilter: {
        limit: 10,
        offset: 0,
      },

      // Actions - Bookings
      fetchBookings: async (params?: GetBookingsParams) => {
        set({ isLoadingBookings: true, bookingsError: null });
        try {
          const currentFilter = get().bookingsFilter;
          const mergedParams = { ...currentFilter, ...params };
          
          const response = await apiClient.getBookings(mergedParams);
          
          set({
            bookings: response.bookings,
            bookingsCount: response.count,
            bookingsFilter: {
              status: mergedParams.status,
              limit: mergedParams.limit,
              offset: mergedParams.offset,
            },
            isLoadingBookings: false,
            bookingsError: null,
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : "Erreur lors du chargement des réservations";
          set({
            isLoadingBookings: false,
            bookingsError: message,
          });
        }
      },

      setBookingsFilter: (filter) => {
        const currentFilter = get().bookingsFilter;
        set({
          bookingsFilter: { ...currentFilter, ...filter },
        });
      },

      clearBookingsError: () => {
        set({ bookingsError: null });
      },

      // Actions - Proposals
      fetchProposals: async (params?: GetMyProposalsParams) => {
        set({ isLoadingProposals: true, proposalsError: null });
        try {
          const currentFilter = get().proposalsFilter;
          const mergedParams = { ...currentFilter, ...params };
          
          const response = await apiClient.getMyProposals(mergedParams);
          
          set({
            proposals: response.bookings,
            proposalsCount: response.count,
            proposalsStats: response.stats,
            proposalsFilter: {
              filter: mergedParams.filter,
              limit: mergedParams.limit,
              offset: mergedParams.offset,
            },
            isLoadingProposals: false,
            proposalsError: null,
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : "Erreur lors du chargement des propositions";
          set({
            isLoadingProposals: false,
            proposalsError: message,
          });
        }
      },

      setProposalsFilter: (filter) => {
        const currentFilter = get().proposalsFilter;
        set({
          proposalsFilter: { ...currentFilter, ...filter },
        });
      },

      clearProposalsError: () => {
        set({ proposalsError: null });
      },

      // Actions - Utilitaires
      clearAll: () => {
        set({
          bookings: [],
          bookingsCount: 0,
          proposals: [],
          proposalsCount: 0,
          proposalsStats: {
            pending: 0,
            accepted: 0,
            rejected: 0,
          },
          bookingsError: null,
          proposalsError: null,
        });
      },

      refreshAll: async () => {
        const { fetchBookings, fetchProposals } = get();
        await Promise.all([
          fetchBookings(),
          fetchProposals(),
        ]);
      },
    }),
    {
      name: "booking-storage",
      storage: createJSONStorage(() => localStorage),
      // Ne persister que les filtres, pas les données (qui peuvent changer)
      partialize: (state) => ({
        bookingsFilter: state.bookingsFilter,
        proposalsFilter: state.proposalsFilter,
      }),
    }
  )
);
