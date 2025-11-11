"use client";

import { useMemo } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AdminTimeseriesPoint } from "@/stores/adminStatsStore";

interface AdminTimeseriesChartProps {
  data: AdminTimeseriesPoint[];
  isLoading: boolean;
  range: number;
}

const tooltipFormatter = (value: number, name: string) => {
  if (name === "Revenus (€)") {
    return `${new Intl.NumberFormat("fr-FR").format(value)} €`;
  }

  return new Intl.NumberFormat("fr-FR").format(value);
};

export function AdminTimeseriesChart({ data, isLoading, range }: AdminTimeseriesChartProps) {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) {
      return [];
    }

    return data.map((point) => ({
      date: new Date(point.date).toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "short",
      }),
      bookings: point.bookings,
      confirmed: point.confirmed,
      revenue: Number(point.revenue.toFixed(2)),
      newUsers: point.newUsers,
    }));
  }, [data]);

  return (
    <Card className="border-border/60 bg-card/80">
      <CardHeader className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle className="text-lg font-semibold">
            Tendances ({range} derniers jours)
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Volumétrie des réservations, conversions et revenus générés
          </p>
        </div>
      </CardHeader>
      <CardContent className="h-[320px]">
        {isLoading ? (
          <div className="flex h-full w-full items-center justify-center">
            <motion.div
              className="h-10 w-10 rounded-full border-2 border-blue-500/40 border-t-blue-500"
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
            />
          </div>
        ) : chartData.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
            <p>Aucune donnée disponible pour cette période.</p>
            <p>Essayez de modifier la plage temporelle.</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 16, right: 24, left: 8, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
              <YAxis
                yAxisId="left"
                stroke="hsl(var(--muted-foreground))"
                tickFormatter={(value: number) => new Intl.NumberFormat("fr-FR").format(value)}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                stroke="hsl(var(--muted-foreground))"
                tickFormatter={(value: number) => `${new Intl.NumberFormat("fr-FR").format(value)} €`}
              />
              <Tooltip formatter={tooltipFormatter} />
              <Legend />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="bookings"
                name="Réservations"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="confirmed"
                name="Confirmées"
                stroke="#22c55e"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="revenue"
                name="Revenus (€)"
                stroke="#a855f7"
                strokeWidth={2}
                dot={false}
                strokeDasharray="5 5"
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

