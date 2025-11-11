"use client";

import { motion } from "framer-motion";
import {
  Users,
  UserCheck,
  Briefcase,
  AlertTriangle,
  PiggyBank,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { AdminSummaryStats } from "@/stores/adminStatsStore";

interface AdminSummaryCardsProps {
  summary: AdminSummaryStats | null;
  isLoading: boolean;
}

const numberFormatter = new Intl.NumberFormat("fr-FR");

export function AdminSummaryCards({ summary, isLoading }: AdminSummaryCardsProps) {
  const cards = [
    {
      label: "Utilisateurs actifs",
      value: summary?.activeUsers ?? 0,
      detail: summary
        ? `${summary.newUsers7d} nouveaux ces 7 derniers jours`
        : "Chargement…",
      icon: Users,
      accent: "bg-blue-500/15 text-blue-600 dark:bg-blue-500/20 dark:text-blue-300",
    },
    {
      label: "GMV (30 derniers jours)",
      value: summary?.grossMerchandiseVolume ?? 0,
      detail: summary
        ? `${numberFormatter.format(summary.confirmedBookings)} réservations confirmées`
        : "Chargement…",
      icon: PiggyBank,
      accent: "bg-emerald-500/15 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-300",
      isCurrency: true,
    },
    {
      label: "Cuisiniers vérifiés",
      value: summary?.totalCooks ?? 0,
      detail: summary
        ? `${summary.pendingCookVerifications} en attente de validation`
        : "Chargement…",
      icon: Briefcase,
      accent: "bg-purple-500/15 text-purple-600 dark:bg-purple-500/20 dark:text-purple-300",
    },
    {
      label: "Litiges ouverts",
      value: summary?.openDisputes ?? 0,
      detail: summary
        ? `${summary.bookingsLast7d} demandes traitées sur 7 jours`
        : "Chargement…",
      icon: AlertTriangle,
      accent: "bg-rose-500/15 text-rose-600 dark:bg-rose-500/20 dark:text-rose-300",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card, index) => {
        const Icon = card.icon;
        const value = card.isCurrency
          ? `${numberFormatter.format(card.value)} €`
          : numberFormatter.format(card.value);

        return (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.06, duration: 0.35 }}
            className="h-full"
          >
            <Card className="relative h-full overflow-hidden border-border/60 bg-card/80">
              <CardContent className="flex flex-col gap-5 pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {card.label}
                    </p>
                    <p className="mt-2 text-3xl font-bold text-foreground">
                      {isLoading && !summary ? "…" : value}
                    </p>
                  </div>
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-xl ${card.accent}`}
                  >
                    <Icon className="h-6 w-6" />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    {card.detail}
                  </span>
                  {card.label === "Cuisiniers vérifiés" && summary ? (
                    <Badge
                      variant="secondary"
                      className="rounded-full bg-purple-500/15 text-xs text-purple-600 dark:text-purple-300"
                    >
                      {summary.pendingCookVerifications} à valider
                    </Badge>
                  ) : null}
                  {card.label === "Litiges ouverts" && summary ? (
                    <Badge
                      variant="secondary"
                      className="rounded-full bg-rose-500/15 text-xs text-rose-600 dark:text-rose-300"
                    >
                      {summary.openDisputes > 0 ? "Action requise" : "RAS"}
                    </Badge>
                  ) : null}
                </div>
              </CardContent>
              {card.label === "Utilisateurs actifs" && summary ? (
                <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-emerald-500" />
              ) : null}
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}

