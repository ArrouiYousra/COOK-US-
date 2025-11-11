import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { UserRole, UserStatus } from "@/types";
import { apiClient } from "@/lib/api/client";

export interface AdminUserListItem {
  id: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  firstName: string | null;
  lastName: string | null;
  createdAt: string;
  lastLoginAt: string | null;
  cookProfile?: {
    id: string;
    status: string;
    headline: string | null;
    averageRating: number | null;
    totalBookings: number;
    totalEarnings: number;
  } | null;
  clientProfile?: {
    id: string;
    totalBookings: number;
    totalSpent: number;
  } | null;
}

interface AdminUsersStore {
  users: AdminUserListItem[];
  total: number;
  isLoading: boolean;
  error: string | null;
  filters: {
    search?: string;
    role?: UserRole;
    status?: UserStatus;
  };
  pagination: {
    limit: number;
    offset: number;
  };

  fetchUsers: (params?: {
    search?: string;
    role?: UserRole;
    status?: UserStatus;
    limit?: number;
    offset?: number;
  }) => Promise<void>;
  setFilters: (filters: { search?: string; role?: UserRole; status?: UserStatus }) => void;
  setPagination: (pagination: { limit?: number; offset?: number }) => void;
}

export const useAdminUsersStore = create<AdminUsersStore>()(
  devtools((set, get) => ({
    users: [],
    total: 0,
    isLoading: false,
    error: null,
    filters: {},
    pagination: {
      limit: 20,
      offset: 0,
    },

    fetchUsers: async (params) => {
      const { filters, pagination } = get();
      const mergedFilters = { ...filters, ...params };
      const limit = params?.limit ?? pagination.limit;
      const offset = params?.offset ?? pagination.offset;

      try {
        set({ isLoading: true, error: null });
        const response = await apiClient.getAdminUsers({
          ...mergedFilters,
          limit,
          offset,
        });
        set({
          users: response.users,
          total: response.count,
          isLoading: false,
          filters: mergedFilters,
          pagination: {
            limit,
            offset,
          },
        });
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Impossible de charger les utilisateurs.";
        set({ isLoading: false, error: message });
      }
    },

    setFilters: (newFilters) => {
      set((state) => ({
        filters: {
          ...state.filters,
          ...newFilters,
        },
        pagination: {
          ...state.pagination,
          offset: 0,
        },
      }));
    },

    setPagination: (newPagination) => {
      set((state) => ({
        pagination: {
          limit: newPagination.limit ?? state.pagination.limit,
          offset: newPagination.offset ?? state.pagination.offset,
        },
      }));
    },
  })),
);

