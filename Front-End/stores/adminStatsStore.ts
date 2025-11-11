import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { apiClient } from "@/lib/api/client";

export interface AdminSummaryStats {
  totalUsers: number;
  activeUsers: number;
  newUsers7d: number;
  totalCooks: number;
  pendingCookVerifications: number;
  totalBookings: number;
  confirmedBookings: number;
  bookingsLast7d: number;
  grossMerchandiseVolume: number;
  payoutsCompleted: number;
  openDisputes: number;
}

export interface AdminTimeseriesPoint {
  date: string;
  bookings: number;
  confirmed: number;
  revenue: number;
  newUsers: number;
}

export interface AdminDistributionStats {
  bookingsByStatus: Record<string, number>;
  usersByRole: Record<string, number>;
  usersByStatus: Record<string, number>;
  cooksByStatus: Record<string, number>;
}

interface AdminStatsStore {
  summary: AdminSummaryStats | null;
  timeseries: AdminTimeseriesPoint[];
  distributions: AdminDistributionStats | null;
  isLoadingSummary: boolean;
  isLoadingTimeseries: boolean;
  isLoadingDistributions: boolean;
  errorSummary: string | null;
  errorTimeseries: string | null;
  errorDistributions: string | null;

  fetchSummary: () => Promise<void>;
  fetchTimeseries: (range?: number) => Promise<void>;
  fetchDistributions: (range?: number) => Promise<void>;
}

export const useAdminStatsStore = create<AdminStatsStore>()(
  devtools((set) => ({
    summary: null,
    timeseries: [],
    distributions: null,
    isLoadingSummary: false,
    isLoadingTimeseries: false,
    isLoadingDistributions: false,
    errorSummary: null,
    errorTimeseries: null,
    errorDistributions: null,

    fetchSummary: async () => {
      try {
        set({ isLoadingSummary: true, errorSummary: null });
        const response = await apiClient.getAdminSummaryStats();
        set({ summary: response.stats, isLoadingSummary: false });
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Impossible de charger les statistiques admin.";
        set({ errorSummary: message, isLoadingSummary: false });
      }
    },

    fetchTimeseries: async (range = 30) => {
      try {
        set({ isLoadingTimeseries: true, errorTimeseries: null });
        const response = await apiClient.getAdminTimeseries(range);
        set({
          timeseries: response.timeseries,
          isLoadingTimeseries: false,
        });
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Impossible de charger la série temporelle.";
        set({ errorTimeseries: message, isLoadingTimeseries: false });
      }
    },

    fetchDistributions: async (range = 90) => {
      try {
        set({ isLoadingDistributions: true, errorDistributions: null });
        const response = await apiClient.getAdminDistributions(range);
        set({
          distributions: response.distributions,
          isLoadingDistributions: false,
        });
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Impossible de charger les répartitions.";
        set({ errorDistributions: message, isLoadingDistributions: false });
      }
    },
  })),
);

