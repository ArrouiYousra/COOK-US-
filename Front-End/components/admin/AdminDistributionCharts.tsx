"use client";

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AdminDistributionStats } from "@/stores/adminStatsStore";

interface AdminDistributionChartsProps {
  distributions: AdminDistributionStats | null;
  isLoading: boolean;
}

const bookingColors = ["#3b82f6", "#22c55e", "#f97316", "#ef4444", "#0ea5e9", "#a855f7"];
const roleColors = ["#3b82f6", "#f97316", "#a855f7"];

export function AdminDistributionCharts({
  distributions,
  isLoading,
}: AdminDistributionChartsProps) {
  const bookingsData = distributions
    ? Object.entries(distributions.bookingsByStatus ?? {}).map(([status, value]) => ({
        name: formatBookingStatus(status),
        value,
      }))
    : [];

  const roleData = distributions
    ? Object.entries(distributions.usersByRole ?? {}).map(([role, value]) => ({
        role: formatRole(role),
        value,
      }))
    : [];

  const statusData = distributions
    ? Object.entries(distributions.usersByStatus ?? {}).map(([status, value]) => ({
        status: formatUserStatus(status),
        value,
      }))
    : [];

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card className="border-border/60 bg-card/80">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">
            Répartition des réservations
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[300px]">
          {isLoading ? (
            <SkeletonLoader />
          ) : bookingsData.length === 0 ? (
            <EmptyState message="Aucune réservation sur la période analysée." />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={bookingsData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                >
                  {bookingsData.map((entry, index) => (
                    <Cell
                      key={entry.name}
                      fill={bookingColors[index % bookingColors.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card className="border-border/60 bg-card/80">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">
            Population & statuts utilisateurs
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[300px]">
          {isLoading ? (
            <SkeletonLoader />
          ) : roleData.length === 0 && statusData.length === 0 ? (
            <EmptyState message="Aucun utilisateur référencé." />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={mergeRoleAndStatus(roleData, statusData)}
                margin={{ top: 12, right: 16, left: 8, bottom: 8 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip />
                <Bar
                  dataKey="role"
                  name="Par rôle"
                  fill="url(#roleGradient)"
                  radius={[6, 6, 0, 0]}
                />
                <Bar
                  dataKey="status"
                  name="Par statut"
                  fill="url(#statusGradient)"
                  radius={[6, 6, 0, 0]}
                />
                <defs>
                  <linearGradient id="roleGradient" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#2563eb" />
                  </linearGradient>
                  <linearGradient id="statusGradient" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#a855f7" />
                    <stop offset="100%" stopColor="#7c3aed" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function SkeletonLoader() {
  return (
    <div className="flex h-full items-center justify-center">
      <motion.div
        className="h-10 w-10 rounded-full border-2 border-blue-500/40 border-t-blue-500"
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
      />
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
      {message}
    </div>
  );
}

function formatBookingStatus(status: string) {
  const map: Record<string, string> = {
    PENDING: "En attente",
    ACCEPTED: "Acceptées",
    CONFIRMED: "Confirmées",
    IN_PROGRESS: "En cours",
    COMPLETED: "Terminées",
    CANCELLED: "Annulées",
    DISPUTED: "Litiges",
  };
  return map[status] ?? status;
}

function formatRole(role: string) {
  const map: Record<string, string> = {
    CLIENT: "Clients",
    COOK: "Cuisiniers",
    ADMIN: "Administrateurs",
  };
  return map[role] ?? role;
}

function formatUserStatus(status: string) {
  const map: Record<string, string> = {
    ACTIVE: "Actifs",
    SUSPENDED: "Suspendus",
    DELETED: "Supprimés",
    PENDING_VERIFICATION: "À vérifier",
  };
  return map[status] ?? status;
}

function mergeRoleAndStatus(
  roles: Array<{ role: string; value: number }>,
  statuses: Array<{ status: string; value: number }>,
) {
  const labels = new Set<string>();
  roles.forEach((role) => labels.add(role.role));
  statuses.forEach((status) => labels.add(status.status));

  return Array.from(labels).map((label) => ({
    label,
    role: roles.find((item) => item.role === label)?.value ?? 0,
    status: statuses.find((item) => item.status === label)?.value ?? 0,
  }));
}

