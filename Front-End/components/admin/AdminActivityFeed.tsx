"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { Calendar, TrendingUp, Users, MessageCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AdminSummaryStats, AdminTimeseriesPoint } from "@/stores/adminStatsStore";

interface AdminActivityFeedProps {
  summary: AdminSummaryStats | null;
  timeseries: AdminTimeseriesPoint[];
}

export function AdminActivityFeed({ summary, timeseries }: AdminActivityFeedProps) {
  const highlights = useMemo(() => buildHighlights(summary, timeseries), [summary, timeseries]);

  return (
    <Card className="border-border/60 bg-card/80">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Temps forts récents</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {highlights.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Les données analytiques sont en cours de collecte. Revenez bientôt pour obtenir des
            insights sur l’activité.
          </p>
        ) : (
          <ul className="space-y-4">
            {highlights.map((highlight, index) => (
              <motion.li
                key={highlight.title}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05, duration: 0.3 }}
                className="group relative overflow-hidden rounded-xl border border-border/70 bg-background/60 p-4 backdrop-blur-sm"
              >
                <div className="flex items-start gap-3">
                  <span className={`rounded-lg p-2 ${highlight.accent}`}>
                    <highlight.icon className="h-5 w-5" />
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-foreground">{highlight.title}</p>
                    <p className="text-sm text-muted-foreground">{highlight.description}</p>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  {highlight.meta.map((item) => (
                    <span
                      key={item}
                      className="rounded-full bg-muted px-2 py-0.5 text-[11px] uppercase tracking-wide"
                    >
                      {item}
                    </span>
                  ))}
                </div>
                <div className="absolute inset-y-0 right-0 w-1 bg-gradient-to-b from-blue-500 via-cyan-500 to-emerald-500 opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
              </motion.li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function buildHighlights(
  summary: AdminSummaryStats | null,
  timeseries: AdminTimeseriesPoint[],
) {
  const highlights: Array<{
    title: string;
    description: string;
    meta: string[];
    accent: string;
    icon: typeof Calendar;
  }> = [];

  if (summary) {
    const confirmationRate =
      summary.totalBookings === 0
        ? 0
        : Math.round((summary.confirmedBookings / summary.totalBookings) * 100);

    highlights.push({
      title: "Conversion des réservations",
      description: `Le taux de confirmation des réservations atteint ${confirmationRate}% pour ${summary.totalBookings} demandes.`,
      meta: [
        `${summary.confirmedBookings} confirmées`,
        `${summary.totalBookings - summary.confirmedBookings} à relancer`,
      ],
      accent: "bg-blue-500/15 text-blue-600 dark:bg-blue-500/20 dark:text-blue-300",
      icon: Calendar,
    });

    if (summary.openDisputes > 0) {
      highlights.push({
        title: "Litiges à traiter",
        description: `${summary.openDisputes} litiges sont en cours d'analyse. Priorisez le suivi qualité.`,
        meta: ["Support client", "Qualité"],
        accent: "bg-rose-500/15 text-rose-600 dark:bg-rose-500/20 dark:text-rose-300",
        icon: MessageCircle,
      });
    }

    if (summary.newUsers7d > 0) {
      highlights.push({
        title: "Croissance utilisateurs",
        description: `${summary.newUsers7d} nouveaux utilisateurs ont rejoint la plateforme ces 7 derniers jours.`,
        meta: [`${summary.totalUsers} utilisateurs`, `${summary.totalCooks} cuisiniers`],
        accent: "bg-emerald-500/15 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-300",
        icon: Users,
      });
    }
  }

  if (timeseries.length > 0) {
    const topDay = [...timeseries].sort((a, b) => b.bookings - a.bookings)[0];
    if (topDay) {
      highlights.push({
        title: "Pic de réservations",
        description: `Le ${new Date(topDay.date).toLocaleDateString("fr-FR")}, ${topDay.bookings} réservations ont été créées pour ${topDay.confirmed} confirmations.`,
        meta: [
          `Revenus: ${new Intl.NumberFormat("fr-FR", {
            style: "currency",
            currency: "EUR",
          }).format(topDay.revenue)}`,
          `${topDay.newUsers} nouveaux comptes`,
        ],
        accent: "bg-purple-500/15 text-purple-600 dark:bg-purple-500/20 dark:text-purple-300",
        icon: TrendingUp,
      });
    }
  }

  return highlights.slice(0, 4);
}

