"use client";

import { useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { RefreshCw, ShieldAlert, BookOpen, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { NotificationsDropdown } from "@/components/dashboard/NotificationsDropdown";
import { GlobalSearch } from "@/components/dashboard/GlobalSearch";
import type { AdminSummaryStats } from "@/stores/adminStatsStore";
import { cn } from "@/lib/utils";

interface AdminHeaderProps {
  summary: AdminSummaryStats | null;
  isRefreshing?: boolean;
  onRefresh?: () => void;
}

export function AdminHeader({ summary, isRefreshing = false, onRefresh }: AdminHeaderProps) {

  const ctaLabel = useMemo(() => {
    if (!summary) {
      return "Découvrir les alertes";
    }

    if (summary.pendingCookVerifications > 0) {
      return `${summary.pendingCookVerifications} profils à vérifier`;
    }

    if (summary.openDisputes > 0) {
      return `${summary.openDisputes} litiges à traiter`;
    }

    return "Consulter les actions du jour";
  }, [summary]);

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur">
      <div className="flex flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <div className="flex flex-1 flex-col gap-3">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Sparkles className="h-4 w-4 text-blue-500" />
            <span className="text-xs font-medium uppercase tracking-[0.2em]">
              Console temps réel
            </span>
          </div>
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-bold leading-tight md:text-3xl">
                Pilotage plateforme
              </h1>
              <p className="text-sm text-muted-foreground">
                Surveillez l&lsquo;activité, les revenus et la qualité en temps
                réel.
              </p>
            </div>
            <motion.div
              className="flex items-center gap-2"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Button variant="outline" size="sm" className="gap-2" onClick={onRefresh} disabled={isRefreshing}>
                <RefreshCw
                  className={cn("h-4 w-4 text-blue-500", isRefreshing ? "animate-spin" : "")}
                />
                Actualiser
              </Button>
              <Button
                asChild
                size="sm"
                className="gap-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
              >
                <Link href="/dashboard/admin/users">
                  <ShieldAlert className="h-4 w-4" />
                  {ctaLabel}
                </Link>
              </Button>
            </motion.div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <GlobalSearch />
          <NotificationsDropdown />
          <ThemeToggle />
        </div>
      </div>

      <div className="border-t border-border bg-muted/40 px-4 py-2 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <BookOpen className="h-4 w-4 text-blue-500" />
          <span>
            Suivez les indicateurs clés de COOK US : GMV, conversions, qualité
            cuisiniers & satisfaction clients.
          </span>
        </div>
      </div>
    </header>
  );
}

