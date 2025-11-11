"use client";

import { useEffect, useMemo, useRef } from "react";
import { Search } from "lucide-react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { useAdminStatsStore } from "@/stores/adminStatsStore";
import {
  useAdminUsersStore,
  type AdminUserListItem,
} from "@/stores/adminUsersStore";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import type { UserRole, UserStatus } from "@/types";

const ROLE_FILTERS: Array<{ label: string; value?: UserRole }> = [
  { label: "Tous", value: undefined },
  { label: "Clients", value: "CLIENT" },
  { label: "Cuisiniers", value: "COOK" },
  { label: "Admins", value: "ADMIN" },
];

const STATUS_FILTERS: Array<{ label: string; value?: UserStatus }> = [
  { label: "Tous", value: undefined },
  { label: "Actifs", value: "ACTIVE" },
  { label: "En attente", value: "PENDING_VERIFICATION" },
  { label: "Suspendus", value: "SUSPENDED" },
  { label: "Supprimés", value: "DELETED" },
];

export default function AdminUsersPage() {
  const {
    summary,
    isLoadingSummary,
    fetchSummary,
  } = useAdminStatsStore();

  const {
    users,
    total,
    isLoading,
    filters,
    pagination,
    fetchUsers,
    setFilters,
    setPagination,
  } = useAdminUsersStore();

  const initializedRef = useRef(false);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;
    void fetchSummary();
    void fetchUsers();
  }, [fetchSummary, fetchUsers]);

  const totalPages = useMemo(() => {
    if (pagination.limit === 0) return 1;
    return Math.max(1, Math.ceil(total / pagination.limit));
  }, [pagination.limit, total]);

  const currentPage = Math.floor(pagination.offset / pagination.limit) + 1;

  const handleSearch = (value: string) => {
    const newFilters = { ...filters, search: value };
    setFilters(newFilters);
    setPagination({ offset: 0 });
    void fetchUsers({ ...newFilters, limit: pagination.limit, offset: 0 });
  };

  const handleRoleFilter = (value?: UserRole) => {
    const newFilters = { ...filters, role: value };
    setFilters(newFilters);
    setPagination({ offset: 0 });
    void fetchUsers({
      ...newFilters,
      limit: pagination.limit,
      offset: 0,
    });
  };

  const handleStatusFilter = (value?: UserStatus) => {
    const newFilters = { ...filters, status: value };
    setFilters(newFilters);
    setPagination({ offset: 0 });
    void fetchUsers({
      ...newFilters,
      limit: pagination.limit,
      offset: 0,
    });
  };

  const handlePageChange = (direction: "prev" | "next") => {
    const newPage =
      direction === "prev" ? Math.max(1, currentPage - 1) : Math.min(totalPages, currentPage + 1);
    const newOffset = (newPage - 1) * pagination.limit;
    setPagination({ offset: newOffset });
    void fetchUsers({
      ...filters,
      offset: newOffset,
      limit: pagination.limit,
    });
  };

  const handleRefresh = () => {
    void fetchSummary();
    void fetchUsers({
      ...filters,
      limit: pagination.limit,
      offset: pagination.offset,
    });
  };

  return (
    <>
      <AdminHeader
        summary={summary}
        isRefreshing={isLoadingSummary || isLoading}
        onRefresh={handleRefresh}
      />

      <section className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <header className="rounded-2xl border border-border/60 bg-card/80 p-6 shadow-sm">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-3">
              <h1 className="text-xl font-semibold text-foreground">Gestion des utilisateurs</h1>
              <p className="text-sm text-muted-foreground">
                Surveillez l'activité des comptes, les statuts de vérification et les performances
                des cuisiniers.
              </p>
              <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                <Badge variant="secondary" className="rounded-full bg-blue-500/10 text-blue-500">
                  {summary?.totalUsers ?? 0} comptes
                </Badge>
                <Badge variant="secondary" className="rounded-full bg-emerald-500/10 text-emerald-500">
                  {summary?.activeUsers ?? 0} actifs
                </Badge>
                <Badge variant="secondary" className="rounded-full bg-purple-500/10 text-purple-500">
                  {summary?.totalCooks ?? 0} cuisiniers
                </Badge>
              </div>
            </div>

            <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Rechercher (nom, email, rôle)"
                  className="pl-9"
                  value={filters.search ?? ""}
                  onChange={(event) => handleSearch(event.target.value)}
                />
              </div>
              <Select
                value={filters.role ?? "all"}
                onValueChange={(value) =>
                  handleRoleFilter(value === "all" ? undefined : (value as UserRole))
                }
              >
                <SelectTrigger className="sm:w-40">
                  <SelectValue placeholder="Rôle" />
                </SelectTrigger>
                <SelectContent>
                  {ROLE_FILTERS.map((role) => (
                    <SelectItem key={role.label} value={role.value ?? "all"}>
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={filters.status ?? "all"}
                onValueChange={(value) =>
                  handleStatusFilter(value === "all" ? undefined : (value as UserStatus))
                }
              >
                <SelectTrigger className="sm:w-44">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_FILTERS.map((status) => (
                    <SelectItem key={status.label} value={status.value ?? "all"}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </header>

        <div className="overflow-hidden rounded-2xl border border-border/60 bg-card/80 shadow-sm">
          <table className="min-w-full divide-y divide-border/60">
            <thead className="bg-muted/60">
              <tr>
                <TableHeadCell>Utilisateur</TableHeadCell>
                <TableHeadCell>Rôle</TableHeadCell>
                <TableHeadCell>Statut</TableHeadCell>
                <TableHeadCell>Créé le</TableHeadCell>
                <TableHeadCell>Dernière connexion</TableHeadCell>
                <TableHeadCell>Engagement</TableHeadCell>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {isLoading ? (
                <TableSkeleton rows={5} />
              ) : users.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="py-10 text-center text-sm text-muted-foreground"
                  >
                    Aucun utilisateur ne correspond aux filtres sélectionnés.
                  </td>
                </tr>
              ) : (
                users.map((user) => <UserTableRow key={user.id} user={user} />)
              )}
            </tbody>
          </table>
        </div>

        <footer className="flex flex-col items-center justify-between gap-3 rounded-2xl border border-border/60 bg-card/80 p-4 text-sm text-muted-foreground sm:flex-row">
          <span>
            Page {currentPage} sur {totalPages} — {total} utilisateurs
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange("prev")}
              disabled={currentPage === 1 || isLoading}
            >
              Précédent
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange("next")}
              disabled={currentPage === totalPages || isLoading}
            >
              Suivant
            </Button>
          </div>
        </footer>
      </section>
    </>
  );
}

function TableHeadCell({ children }: { children: React.ReactNode }) {
  return (
    <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
      {children}
    </th>
  );
}

function TableSkeleton({ rows }: { rows: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, index) => (
        <tr key={index} className="animate-pulse">
          {Array.from({ length: 6 }).map((__, cellIndex) => (
            <td key={cellIndex} className="px-4 py-4">
              <div className="h-4 rounded bg-muted" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

function UserTableRow({ user }: { user: AdminUserListItem }) {
  return (
    <tr className="hover:bg-muted/40">
      <td className="space-y-1 px-4 py-4">
        <p className="text-sm font-semibold text-foreground">
          {formatFullName(user)}
        </p>
        <p className="text-xs text-muted-foreground">{user.email}</p>
      </td>
      <td className="px-4 py-4">
        <Badge variant="secondary" className="rounded-full bg-blue-500/10 text-blue-500">
          {formatRole(user.role)}
        </Badge>
      </td>
      <td className="px-4 py-4">
        <Badge variant="secondary" className="rounded-full bg-emerald-500/10 text-emerald-500">
          {formatStatus(user.status)}
        </Badge>
      </td>
      <td className="px-4 py-4 text-sm text-muted-foreground">
        {formatDate(user.createdAt)}
      </td>
      <td className="px-4 py-4 text-sm text-muted-foreground">
        {user.lastLoginAt ? formatDate(user.lastLoginAt) : "Jamais"}
      </td>
      <td className="px-4 py-4">
        <div className="space-y-1 text-xs text-muted-foreground">
          {user.cookProfile ? (
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-purple-500/10 px-2 py-0.5 text-purple-500">
                {user.cookProfile.totalBookings} réservations
              </span>
              <span>
                {new Intl.NumberFormat("fr-FR", {
                  style: "currency",
                  currency: "EUR",
                }).format(user.cookProfile.totalEarnings)}
              </span>
            </div>
          ) : (
            <span className="rounded-full bg-slate-500/10 px-2 py-0.5 text-slate-500">
              Activité standard
            </span>
          )}
          {user.clientProfile ? (
            <div>
              <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-emerald-500">
                {user.clientProfile.totalBookings} commandes
              </span>
            </div>
          ) : null}
        </div>
      </td>
    </tr>
  );
}

function formatFullName(user: AdminUserListItem) {
  const first = user.firstName ?? "";
  const last = user.lastName ?? "";
  const full = `${first} ${last}`.trim();
  return full || "Utilisateur anonyme";
}

function formatRole(role: UserRole) {
  switch (role) {
    case "CLIENT":
      return "Client";
    case "COOK":
      return "Cuisinier";
    case "ADMIN":
      return "Administrateur";
    default:
      return role;
  }
}

function formatStatus(status: UserStatus) {
  switch (status) {
    case "ACTIVE":
      return "Actif";
    case "PENDING_VERIFICATION":
      return "À vérifier";
    case "SUSPENDED":
      return "Suspendu";
    case "DELETED":
      return "Supprimé";
    default:
      return status;
  }
}

function formatDate(value: string) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

