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
  
  // Actions - Mise à jour temps réel
  addBooking: (booking: Booking) => void;
  updateBooking: (id: string, updates: Partial<Booking>) => void;
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
          // Si status est explicitement undefined, ne pas utiliser le filtre persistant
          const mergedParams = params?.status === undefined 
            ? { ...currentFilter, ...params, status: undefined }
            : { ...currentFilter, ...params };
          
          console.log("[BookingStore] fetchBookings appelé avec params:", mergedParams);
          const response = await apiClient.getBookings(mergedParams);
          console.log("[BookingStore] Réponse de l'API:", {
            bookingsCount: response.bookings?.length || 0,
            totalCount: response.count,
            bookings: response.bookings?.map((b: any) => ({
              id: b.id,
              status: b.status,
              cook_profile_id: b.cook_profile_id,
              booking_date: b.booking_date || b.date
            }))
          });
          
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
          
          console.log("[BookingStore] Store mis à jour avec", response.bookings?.length || 0, "bookings");
        } catch (error) {
          console.error("[BookingStore] Erreur lors du fetchBookings:", error);
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

      // Actions - Mise à jour temps réel
      addBooking: (booking) => {
        set((state) => ({
          bookings: [booking, ...state.bookings],
          bookingsCount: state.bookingsCount + 1,
        }));
      },

      updateBooking: (id, updates) => {
        set((state) => ({
          bookings: state.bookings.map((b) =>
            b.id === id ? { ...b, ...updates } : b
          ),
        }));
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
