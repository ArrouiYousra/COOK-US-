import { supabaseAdmin } from "@config/supabaseClient";
import type {
  Booking,
  BookingStatus,
  DisputeStatus,
  Transaction,
  UserRole,
  UserStatus,
} from "../types/database.types";

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
  bookingsByStatus: Record<BookingStatus, number>;
  usersByRole: Record<UserRole, number>;
  usersByStatus: Record<UserStatus, number>;
  cooksByStatus: Record<string, number>;
}

export interface AdminUserListOptions {
  role?: UserRole;
  status?: UserStatus;
  search?: string;
  limit?: number;
  offset?: number;
  sortBy?: "created_at" | "last_login_at";
  sortDirection?: "asc" | "desc";
}

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

export class AdminStore {
  /**
   * Récupère les statistiques synthétiques pour le dashboard admin.
   */
  static async getSummaryStats(): Promise<AdminSummaryStats> {
    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(now.getDate() - 7);

    const [usersTotal, usersActive, usersNew7d, cooksTotal, cooksPending, bookingsTotal, bookingsConfirmed, bookings7d, transactionsCompleted, payoutsCompleted, disputesOpen] =
      await Promise.all([
        supabaseAdmin
          .from("users")
          .select("id", { count: "exact", head: true }),
        supabaseAdmin
          .from("users")
          .select("id", { count: "exact", head: true })
          .eq("status", "ACTIVE"),
        supabaseAdmin
          .from("users")
          .select("id", { count: "exact", head: true })
          .gte("created_at", sevenDaysAgo.toISOString()),
        supabaseAdmin
          .from("users")
          .select("id", { count: "exact", head: true })
          .eq("role", "COOK"),
        supabaseAdmin
          .from("cook_profiles")
          .select("id", { count: "exact", head: true })
          .eq("status", "PENDING_APPROVAL"),
        supabaseAdmin
          .from("bookings")
          .select("id", { count: "exact", head: true }),
        supabaseAdmin
          .from("bookings")
          .select("id", { count: "exact", head: true })
          .eq("status", "CONFIRMED"),
        supabaseAdmin
          .from("bookings")
          .select("id", { count: "exact", head: true })
          .gte("created_at", sevenDaysAgo.toISOString()),
        supabaseAdmin
          .from("transactions")
          .select("amount", { count: "exact" })
          .eq("status", "COMPLETED")
          .eq("type", "BOOKING_PAYMENT"),
        supabaseAdmin
          .from("transactions")
          .select("amount", { count: "exact" })
          .eq("status", "COMPLETED")
          .eq("type", "PAYOUT"),
        supabaseAdmin
          .from("disputes")
          .select("id", { count: "exact", head: true })
          .in("status", ["OPEN", "IN_REVIEW"] satisfies DisputeStatus[]),
      ]);

    const completedPayments =
      (transactionsCompleted.data as Pick<Transaction, "amount">[] | null) ??
      [];
    const payouts =
      (payoutsCompleted.data as Pick<Transaction, "amount">[] | null) ?? [];

    return {
      totalUsers: usersTotal.count ?? 0,
      activeUsers: usersActive.count ?? 0,
      newUsers7d: usersNew7d.count ?? 0,
      totalCooks: cooksTotal.count ?? 0,
      pendingCookVerifications: cooksPending.count ?? 0,
      totalBookings: bookingsTotal.count ?? 0,
      confirmedBookings: bookingsConfirmed.count ?? 0,
      bookingsLast7d: bookings7d.count ?? 0,
      grossMerchandiseVolume: completedPayments.reduce(
        (sum, tx) => sum + (tx.amount ?? 0),
        0,
      ),
      payoutsCompleted: payouts.reduce(
        (sum, tx) => sum + (tx.amount ?? 0),
        0,
      ),
      openDisputes: disputesOpen.count ?? 0,
    };
  }

  /**
   * Série temporelle des bookings / revenus / nouveaux utilisateurs.
   */
  static async getTimeseries(rangeDays = 30): Promise<AdminTimeseriesPoint[]> {
    const now = new Date();
    const startDate = new Date(now);
    startDate.setDate(now.getDate() - rangeDays + 1);

    const [bookingsRes, usersRes] = await Promise.all([
      supabaseAdmin
        .from("bookings")
        .select("created_at,status,total_price")
        .gte("created_at", startDate.toISOString())
        .lte("created_at", now.toISOString()),
      supabaseAdmin
        .from("users")
        .select("created_at")
        .gte("created_at", startDate.toISOString())
        .lte("created_at", now.toISOString()),
    ]);

    if (bookingsRes.error) {
      throw new Error(
        `Failed to fetch bookings timeseries: ${bookingsRes.error.message}`,
      );
    }

    if (usersRes.error) {
      throw new Error(
        `Failed to fetch users timeseries: ${usersRes.error.message}`,
      );
    }

    const pointsByDay = new Map<string, AdminTimeseriesPoint>();

    const ensurePoint = (date: string): AdminTimeseriesPoint => {
      let point = pointsByDay.get(date);
      if (!point) {
        point = {
          date,
          bookings: 0,
          confirmed: 0,
          revenue: 0,
          newUsers: 0,
        };
        pointsByDay.set(date, point);
      }
      return point;
    };

    const toDayKey = (isoDate: string): string =>
      isoDate ? isoDate.slice(0, 10) : "";

    (bookingsRes.data as Pick<Booking, "status" | "total_price" | "created_at">[] | null)?.forEach(
      (booking) => {
        const dayKey = toDayKey(booking.created_at);
        if (!dayKey) return;
        const point = ensurePoint(dayKey);
        point.bookings += 1;
        if (booking.status === "CONFIRMED" || booking.status === "COMPLETED") {
          point.confirmed += 1;
          const total = typeof booking.total_price === "number"
            ? booking.total_price
            : Number(booking.total_price ?? 0);
          point.revenue += isNaN(total) ? 0 : total;
        }
      },
    );

    (usersRes.data as { created_at: string }[] | null)?.forEach((user) => {
      const dayKey = toDayKey(user.created_at);
      if (!dayKey) return;
      const point = ensurePoint(dayKey);
      point.newUsers += 1;
    });

    // Remplir les jours manquants pour une courbe continue
    for (let i = 0; i < rangeDays; i += 1) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      const dayKey = date.toISOString().slice(0, 10);
      ensurePoint(dayKey);
    }

    return Array.from(pointsByDay.values()).sort((a, b) =>
      a.date.localeCompare(b.date),
    );
  }

  /**
   * Répartition des statuts bookings / rôles utilisateurs / statuts utilisateurs.
   */
  static async getDistributions(
    rangeDays = 90,
  ): Promise<AdminDistributionStats> {
    const now = new Date();
    const startDate = new Date(now);
    startDate.setDate(now.getDate() - rangeDays + 1);

    const [bookingsRes, usersRes, cooksRes] = await Promise.all([
      supabaseAdmin
        .from("bookings")
        .select("status")
        .gte("created_at", startDate.toISOString()),
      supabaseAdmin.from("users").select("role,status"),
      supabaseAdmin.from("cook_profiles").select("status"),
    ]);

    if (bookingsRes.error) {
      throw new Error(
        `Failed to fetch booking distribution: ${bookingsRes.error.message}`,
      );
    }

    if (usersRes.error) {
      throw new Error(
        `Failed to fetch users distribution: ${usersRes.error.message}`,
      );
    }

    if (cooksRes.error) {
      throw new Error(
        `Failed to fetch cooks distribution: ${cooksRes.error.message}`,
      );
    }

    const bookingsByStatus = {} as Record<BookingStatus, number>;
    (bookingsRes.data as { status: BookingStatus }[] | null)?.forEach(
      ({ status }) => {
        bookingsByStatus[status] = (bookingsByStatus[status] ?? 0) + 1;
      },
    );

    const usersByRole = {} as Record<UserRole, number>;
    const usersByStatus = {} as Record<UserStatus, number>;
    (usersRes.data as { role: UserRole; status: UserStatus }[] | null)?.forEach(
      ({ role, status }) => {
        usersByRole[role] = (usersByRole[role] ?? 0) + 1;
        usersByStatus[status] = (usersByStatus[status] ?? 0) + 1;
      },
    );

    const cooksByStatus: Record<string, number> = {};
    (cooksRes.data as { status: string }[] | null)?.forEach(({ status }) => {
      cooksByStatus[status] = (cooksByStatus[status] ?? 0) + 1;
    });

    return {
      bookingsByStatus,
      usersByRole,
      usersByStatus,
      cooksByStatus,
    };
  }

  /**
   * Liste paginée des utilisateurs avec profils associés.
   */
  static async getUsers(
    options: AdminUserListOptions = {},
  ): Promise<{ users: AdminUserListItem[]; count: number }> {
    const {
      role,
      status,
      search,
      limit = 20,
      offset = 0,
      sortBy = "created_at",
      sortDirection = "desc",
    } = options;

    let query = supabaseAdmin
      .from("users")
      .select(
        `
        id,
        email,
        role,
        status,
        first_name,
        last_name,
        created_at,
        last_login_at,
        cook_profiles (
          id,
          status,
          headline,
          average_rating,
          total_bookings,
          total_earnings
        ),
        client_profiles (
          id,
          total_bookings,
          total_spent
        )
      `,
        { count: "exact" },
      )
      .order(sortBy, { ascending: sortDirection === "asc" })
      .range(offset, offset + limit - 1);

    if (role) {
      query = query.eq("role", role);
    }

    if (status) {
      query = query.eq("status", status);
    }

    if (search) {
      const sanitized = search.trim();
      if (sanitized) {
        query = query.or(
          `email.ilike.%${sanitized}%,first_name.ilike.%${sanitized}%,last_name.ilike.%${sanitized}%`,
        );
      }
    }

    const { data, error, count } = await query;

    if (error) {
      throw new Error(`Failed to fetch users: ${error.message}`);
    }

    const users =
      data?.map((item) => {
        const cookProfiles = Array.isArray((item as any).cook_profiles)
          ? (item as any).cook_profiles
          : [];
        const clientProfiles = Array.isArray((item as any).client_profiles)
          ? (item as any).client_profiles
          : [];

        const primaryCook = cookProfiles[0];
        const primaryClient = clientProfiles[0];

        return {
          id: item.id,
          email: item.email,
          role: item.role as UserRole,
          status: item.status as UserStatus,
          firstName: item.first_name ?? null,
          lastName: item.last_name ?? null,
          createdAt: item.created_at,
          lastLoginAt: item.last_login_at,
          cookProfile: primaryCook
            ? {
                id: primaryCook.id,
                status: primaryCook.status,
                headline: primaryCook.headline ?? null,
                averageRating: primaryCook.average_rating ?? null,
                totalBookings: primaryCook.total_bookings ?? 0,
                totalEarnings: primaryCook.total_earnings ?? 0,
              }
            : null,
          clientProfile: primaryClient
            ? {
                id: primaryClient.id,
                totalBookings: primaryClient.total_bookings ?? 0,
                totalSpent: primaryClient.total_spent ?? 0,
              }
            : null,
        };
      }) ?? [];

    return {
      users,
      count: count ?? users.length,
    };
  }
}

