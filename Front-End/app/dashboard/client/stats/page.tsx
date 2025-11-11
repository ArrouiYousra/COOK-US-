"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  Euro,
  Calendar,
  Star,
  ChefHat,
  BarChart3,
  PieChart,
  Loader2,
  Download,
} from "lucide-react";
import { apiClient } from "@/lib/api/client";
import { useAuthStore } from "@/stores/authStore";
import { useAuthGuard } from "@/lib/hooks/useAuthGuard";
import { useBookingStore } from "@/stores/bookingStore";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNotificationToast } from "@/lib/hooks/useNotificationToast";

/**
 * Page Statistiques et Insights
 * Graphiques de dépenses, tendances, historique
 * PROTÉGÉE : Nécessite une authentification (protégée par layout + vérification locale)
 */
const bookingDateFields = [
  "date",
  "bookingDate",
  "booking_date",
  "event_date",
  "createdAt",
  "created_at",
];

const getBookingDate = (booking: any): Date => {
  for (const field of bookingDateFields) {
    if (booking[field]) {
      return new Date(booking[field]);
    }
  }
  return new Date();
};

const getBookingTotal = (booking: any): number => {
  return (
    booking.totalPrice ??
    booking.total_price ??
    booking.payment_total ??
    booking.price ??
    0
  );
};

type TimeRange = "week" | "month" | "year" | "all";

const generateTrendData = (bookings: any[], timeRange: TimeRange) => {
  const now = new Date();
  const config = {
    week: { buckets: 7, type: "day" as const },
    month: { buckets: 6, type: "week" as const },
    year: { buckets: 12, type: "month" as const },
    all: { buckets: 12, type: "month" as const },
  } as const;

  const { buckets, type } = config[timeRange];
  const labels: string[] = [];
  const spendingValues: number[] = [];
  const bookingValues: number[] = [];

  for (let i = 0; i < buckets; i++) {
    let bucketStart: Date;
    let bucketEnd: Date;
    let label = "";

    switch (type) {
      case "day": {
        bucketStart = new Date(now);
        bucketStart.setHours(0, 0, 0, 0);
        bucketStart.setDate(bucketStart.getDate() - (buckets - 1 - i));

        bucketEnd = new Date(bucketStart);
        bucketEnd.setHours(23, 59, 59, 999);

        label = bucketStart.toLocaleDateString("fr-FR", {
          weekday: "short",
        });
        break;
      }
      case "week": {
        bucketEnd = new Date(now);
        bucketEnd.setHours(23, 59, 59, 999);
        bucketEnd.setDate(bucketEnd.getDate() - 7 * (buckets - 1 - i));

        bucketStart = new Date(bucketEnd);
        bucketStart.setDate(bucketEnd.getDate() - 6);
        bucketStart.setHours(0, 0, 0, 0);

        label = `Sem. du ${bucketStart.toLocaleDateString("fr-FR", {
          day: "2-digit",
          month: "short",
        })}`;
        break;
      }
      case "month":
      default: {
        const monthDate = new Date(
          now.getFullYear(),
          now.getMonth() - (buckets - 1 - i),
          1,
        );
        bucketStart = new Date(monthDate);
        bucketStart.setHours(0, 0, 0, 0);

        bucketEnd = new Date(
          monthDate.getFullYear(),
          monthDate.getMonth() + 1,
          0,
          23,
          59,
          59,
          999,
        );

        label = bucketStart.toLocaleDateString("fr-FR", {
          month: "short",
        });
        break;
      }
    }

    const bucketBookings = bookings.filter((booking) => {
      const bookingDate = getBookingDate(booking);
      return bookingDate >= bucketStart && bookingDate <= bucketEnd;
    });

    const bucketSpent = bucketBookings.reduce(
      (sum, booking) => sum + getBookingTotal(booking),
      0,
    );

    labels.push(label);
    spendingValues.push(bucketSpent);
    bookingValues.push(bucketBookings.length);
  }

  return { labels, spendingValues, bookingValues };
};

const currencyFormatter = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
});

type NormalizedStatus = "pending" | "confirmed" | "completed" | "cancelled";

const statusConfig: Record<
  NormalizedStatus,
  { label: string; badgeClass: string }
> = {
  pending: {
    label: "En attente",
    badgeClass:
      "bg-yellow-500/10 text-yellow-700 border border-yellow-500/20 dark:text-yellow-300",
  },
  confirmed: {
    label: "Confirmée",
    badgeClass:
      "bg-green-500/10 text-green-700 border border-green-500/20 dark:text-green-300",
  },
  completed: {
    label: "Terminée",
    badgeClass:
      "bg-blue-500/10 text-blue-700 border border-blue-500/20 dark:text-blue-300",
  },
  cancelled: {
    label: "Annulée",
    badgeClass:
      "bg-red-500/10 text-red-700 border border-red-500/20 dark:text-red-300",
  },
};

const normalizeStatus = (status?: string | null): NormalizedStatus => {
  const value = status?.toString().toUpperCase() ?? "PENDING";

  if (
    value === "CONFIRMED" ||
    value === "PROPOSITION_ACCEPTED" ||
    value === "ACCEPTED"
  ) {
    return "confirmed";
  }

  if (value === "COMPLETED" || value === "DONE") {
    return "completed";
  }

  if (value === "CANCELLED" || value === "CANCELED") {
    return "cancelled";
  }

  return "pending";
};

export default function StatsPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { isAuthenticated, isLoading: isAuthLoading } = useAuthGuard();
  const { bookings, fetchBookings, isLoadingBookings } = useBookingStore();
  const [timeRange, setTimeRange] = useState<TimeRange>("month");
  const [reviews, setReviews] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { showSuccessToast, showErrorToast } = useNotificationToast();
  const [isExporting, setIsExporting] = useState(false);

  // Double protection : layout + page (au cas où)
  if (isAuthLoading || !isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  // Charger les données
  useEffect(() => {
    const loadData = async () => {
      if (!user) return;

      setIsLoading(true);
      setError(null);
      try {
        // Charger les réservations
        await fetchBookings({ limit: 1000 });

        // Charger les avis
        const reviewsData = await apiClient.getMyReviews();
        setReviews(reviewsData.reviews);
      } catch (err: any) {
        console.error("Erreur lors du chargement des statistiques:", err);
        
        // Si l'erreur est 401, rediriger vers la connexion
        if (err.response?.status === 401 || err.message?.includes("Jeton d'authentification manquant")) {
          router.push("/auth/login");
          return;
        }
        
        setError(err.response?.data?.message || "Impossible de charger les statistiques");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [isAuthenticated, isAuthLoading, user, router, fetchBookings]);

  const timeRangeOptions = [
    { value: "week" as const, label: "7 jours" },
    { value: "month" as const, label: "30 jours" },
    { value: "year" as const, label: "12 mois" },
    { value: "all" as const, label: "Tout" },
  ];

  // Filtrer les bookings selon la période sélectionnée
  const filteredBookings = useMemo(() => {
    if (!bookings || bookings.length === 0) return [];
    
    const now = new Date();
    let startDate: Date;
    
    switch (timeRange) {
      case "week":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "month":
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case "year":
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        return bookings;
    }
    
    return bookings.filter((booking) => {
      const bookingDate = new Date(booking.date || booking.createdAt);
      return bookingDate >= startDate;
    });
  }, [bookings, timeRange]);

  // Calculer les statistiques
  const stats = useMemo(() => {
    // Total dépensé
    const totalSpent = filteredBookings.reduce((sum, b) => {
      return sum + (b.totalPrice || 0);
    }, 0);

    // Total des réservations
    const totalBookings = filteredBookings.length;

    // Note moyenne (depuis les avis)
    const averageRating = reviews.length > 0
      ? reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length
      : 0;

    // Cuisine préférée (depuis les réservations - on utilise le headline du cuisinier)
    // Pour l'instant, on utilise un placeholder car on n'a pas encore chargé les profils des cuisiniers
    const favoriteCuisine = "Cuisine variée"; // TODO: Calculer depuis les spécialités des cuisiniers réservés

    // Dépenses mensuelles (6 derniers mois)
    const trendData = generateTrendData(filteredBookings, timeRange);

    // Calculer la tendance (comparaison avec la période précédente)
    const currentPeriodSpent =
      trendData.spendingValues[trendData.spendingValues.length - 1] || 0;
    const previousPeriodSpent =
      trendData.spendingValues[trendData.spendingValues.length - 2] || 0;

    let spendingTrend = 0;
    if (trendData.spendingValues.length >= 2) {
      if (previousPeriodSpent > 0) {
        spendingTrend =
          ((currentPeriodSpent - previousPeriodSpent) / previousPeriodSpent) *
          100;
      } else {
        spendingTrend = currentPeriodSpent > 0 ? 100 : 0;
      }
    }

    // Réservations sur la période actuelle
    const currentPeriodBookings =
      trendData.bookingValues[trendData.bookingValues.length - 1] || 0;

    return {
      totalSpent,
      totalBookings,
      averageRating,
      favoriteCuisine,
      trendLabels: trendData.labels,
      spendingValues: trendData.spendingValues,
      bookingValues: trendData.bookingValues,
      spendingTrend,
      currentPeriodBookings,
    };
  }, [filteredBookings, reviews, timeRange]);

  const bookingHistory = useMemo(() => {
    if (!filteredBookings || filteredBookings.length === 0) {
      return [];
    }

    return filteredBookings
      .slice()
      .sort(
        (a, b) =>
          getBookingDate(b).getTime() - getBookingDate(a).getTime(),
      )
      .map((booking) => {
        const date = getBookingDate(booking);
        const total = getBookingTotal(booking);
        const guests =
          booking.numberOfGuests ?? booking.number_of_guests ?? 0;
        const cookData = (booking as any).cook;
        const cookUser = cookData?.user;
        const cookName =
          cookData?.name ||
          [
            cookUser?.first_name || cookUser?.firstName,
            cookUser?.last_name || cookUser?.lastName,
          ]
            .filter(Boolean)
            .join(" ") ||
          (booking as any).cookName ||
          "Cuisinier";
        const normalizedStatus = normalizeStatus(booking.status);

        const formattedTime = (() => {
          const timeValue =
            booking.time ||
            booking.start_time ||
            (booking as any).startTime ||
            null;
          if (!timeValue) return null;
          try {
            const [hours, minutes] = timeValue.split(":");
            const dateClone = new Date(date);
            dateClone.setHours(Number(hours), Number(minutes), 0, 0);
            return dateClone.toLocaleTimeString("fr-FR", {
              hour: "2-digit",
              minute: "2-digit",
            });
          } catch {
            return timeValue;
          }
        })();

        return {
          id: booking.id,
          dateLabel: date.toLocaleDateString("fr-FR", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          }),
          timeLabel: formattedTime,
          total,
          guests,
          cookName,
          status: normalizedStatus,
        };
      });
  }, [filteredBookings]);

  const handleExportData = useCallback(() => {
    if (!bookingHistory.length) {
      showErrorToast("Aucune réservation à exporter pour cette période.");
      return;
    }

    setIsExporting(true);
    try {
      const headers = [
        "Date",
        "Heure",
        "Cuisinier",
        "Invités",
        "Montant",
        "Statut",
      ];

      const rows = bookingHistory.map((booking) => [
        booking.dateLabel,
        booking.timeLabel ?? "",
        booking.cookName,
        booking.guests.toString(),
        currencyFormatter.format(booking.total),
        statusConfig[booking.status].label,
      ]);

      const escapeCsvValue = (value: string) =>
        `"${value.replace(/"/g, '""')}"`;

      const csvContent = [
        headers.map(escapeCsvValue).join(";"),
        ...rows.map((row) => row.map(escapeCsvValue).join(";")),
      ].join("\n");

      const blob = new Blob([csvContent], {
        type: "text/csv;charset=utf-8;",
      });
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `historique_reservations_${timeRange}_${new Date()
          .toISOString()
          .split("T")[0]}.csv`,
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showSuccessToast("Export CSV téléchargé.");
    } catch (exportError) {
      console.error("Erreur lors de l'export CSV:", exportError);
      showErrorToast("Impossible de générer le fichier CSV.");
    } finally {
      setIsExporting(false);
    }
  }, [bookingHistory, showErrorToast, showSuccessToast, timeRange]);

  if (isAuthLoading || isLoading || isLoadingBookings) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-trebuchet text-3xl lg:text-4xl font-bold text-foreground mb-2">
            Statistiques & Insights
          </h1>
          <p className="text-muted-foreground">
            Analysez vos dépenses et vos préférences culinaires
          </p>
        </div>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value as typeof timeRange)}
          className="px-4 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        >
          {timeRangeOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Cartes de statistiques principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-lg bg-green-500/10 dark:bg-green-500/20 flex items-center justify-center">
              <Euro className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            {stats.spendingTrend >= 0 ? (
              <TrendingUp className={`w-5 h-5 ${stats.spendingTrend >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`} />
            ) : (
              <TrendingDown className="w-5 h-5 text-red-600 dark:text-red-400" />
            )}
          </div>
          <p className="text-sm text-muted-foreground mb-1">Total dépensé</p>
          <p className="text-2xl font-bold text-foreground">{stats.totalSpent.toFixed(2)} €</p>
          <p className={`text-xs mt-2 ${stats.spendingTrend >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
            {stats.spendingTrend >= 0 ? '+' : ''}{stats.spendingTrend.toFixed(1)}% vs mois dernier
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card border border-border rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-lg bg-blue-500/10 dark:bg-blue-500/20 flex items-center justify-center">
              <Calendar className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <p className="text-sm text-muted-foreground mb-1">Réservations</p>
          <p className="text-2xl font-bold text-foreground">{stats.totalBookings}</p>
          <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
            {stats.currentPeriodBookings} sur la période
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card border border-border rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-lg bg-yellow-500/10 dark:bg-yellow-500/20 flex items-center justify-center">
              <Star className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <TrendingUp className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
          </div>
          <p className="text-sm text-muted-foreground mb-1">Note moyenne</p>
          <p className="text-2xl font-bold text-foreground">
            {stats.averageRating > 0 ? stats.averageRating.toFixed(1) : "N/A"}
          </p>
          <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-2">
            Basée sur {reviews.length} avis
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-card border border-border rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-lg bg-purple-500/10 dark:bg-purple-500/20 flex items-center justify-center">
              <ChefHat className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
          <p className="text-sm text-muted-foreground mb-1">Cuisine préférée</p>
          <p className="text-2xl font-bold text-foreground">{stats.favoriteCuisine}</p>
          <p className="text-xs text-purple-600 dark:text-purple-400 mt-2">
            Basé sur vos réservations
          </p>
        </motion.div>
      </div>

      {/* Graphiques */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Graphique des dépenses */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-card border border-border rounded-xl p-6 lg:p-8"
        >
          <div className="flex items-center gap-2 mb-6">
            <BarChart3 className="w-5 h-5 text-muted-foreground" />
            <h2 className="font-cera text-xl font-bold text-foreground">
              {timeRange === "week" && "Dépenses quotidiennes (7 jours)"}
              {timeRange === "month" && "Dépenses hebdomadaires (6 semaines)"}
              {timeRange === "year" && "Dépenses mensuelles (12 mois)"}
              {timeRange === "all" && "Dépenses mensuelles (12 mois)"}
            </h2>
          </div>
          <div className="space-y-4">
            {stats.spendingValues.length > 0 ? (
              stats.spendingValues.map((amount, index) => {
                const maxAmount = Math.max(...stats.spendingValues, 1); // Éviter division par 0
                const percentage = (amount / maxAmount) * 100;
                
                return (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {stats.trendLabels[index] || `P${index + 1}`}
                      </span>
                      <span className="font-semibold text-foreground">{amount.toFixed(2)} €</span>
                    </div>
                  <div className="w-full h-3 bg-accent rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ duration: 0.8, delay: index * 0.1 }}
                      className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"
                    />
                  </div>
                </div>
              );
            })
            ) : (
              <p className="text-center text-muted-foreground py-8">Aucune donnée disponible</p>
            )}
          </div>
        </motion.div>

        {/* Graphique des réservations */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-card border border-border rounded-xl p-6 lg:p-8"
        >
          <div className="flex items-center gap-2 mb-6">
            <PieChart className="w-5 h-5 text-muted-foreground" />
            <h2 className="font-cera text-xl font-bold text-foreground">
              {timeRange === "week" && "Réservations quotidiennes"}
              {timeRange === "month" && "Réservations hebdomadaires"}
              {timeRange === "year" && "Réservations mensuelles"}
              {timeRange === "all" && "Réservations mensuelles"}
            </h2>
          </div>
          <div className="space-y-4">
            {stats.bookingValues.length > 0 ? (
              stats.bookingValues.map((count, index) => {
                const maxCount = Math.max(...stats.bookingValues, 1); // Éviter division par 0
                const percentage = (count / maxCount) * 100;
                
                return (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {stats.trendLabels[index] || `P${index + 1}`}
                      </span>
                      <span className="font-semibold text-foreground">{count} réservation{count > 1 ? "s" : ""}</span>
                    </div>
                  <div className="w-full h-3 bg-accent rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ duration: 0.8, delay: index * 0.1 }}
                      className="h-full bg-gradient-to-r from-purple-500 to-purple-600 rounded-full"
                    />
                  </div>
                </div>
              );
            })
            ) : (
              <p className="text-center text-muted-foreground py-8">Aucune donnée disponible</p>
            )}
          </div>
        </motion.div>
      </div>

      {/* Historique des réservations */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-card border border-border rounded-xl p-6 lg:p-8"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-cera text-xl font-bold text-foreground">
            Historique des réservations
          </h2>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">
              {bookingHistory.length} réservation
              {bookingHistory.length > 1 ? "s" : ""} sur la période
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportData}
              disabled={isExporting}
            >
              {isExporting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Export...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Exporter CSV
                </>
              )}
            </Button>
          </div>
        </div>

        {bookingHistory.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            Aucune réservation pour la période sélectionnée.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border">
              <thead>
                <tr className="text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  <th className="py-3 pr-4">Date</th>
                  <th className="py-3 pr-4">Heure</th>
                  <th className="py-3 pr-4">Cuisinier</th>
                  <th className="py-3 pr-4">Invités</th>
                  <th className="py-3 pr-4">Montant</th>
                  <th className="py-3">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-sm">
                {bookingHistory.map((booking) => {
                  const statusMeta = statusConfig[booking.status];
                  return (
                    <tr key={booking.id} className="hover:bg-accent/50">
                      <td className="py-3 pr-4 font-medium text-foreground whitespace-nowrap">
                        {booking.dateLabel}
                      </td>
                      <td className="py-3 pr-4 text-muted-foreground whitespace-nowrap">
                        {booking.timeLabel ?? "-"}
                      </td>
                      <td className="py-3 pr-4 text-foreground">
                        {booking.cookName}
                      </td>
                      <td className="py-3 pr-4 text-foreground">
                        {booking.guests}
                      </td>
                      <td className="py-3 pr-4 text-foreground whitespace-nowrap">
                        {currencyFormatter.format(booking.total)}
                      </td>
                      <td className="py-3">
                        <Badge className={statusMeta.badgeClass}>
                          {statusMeta.label}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* Insights et recommandations */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="bg-card border border-border rounded-xl p-6 lg:p-8"
      >
        <h2 className="font-cera text-xl font-bold text-foreground mb-6">
          Insights & Recommandations
        </h2>
        <div className="space-y-4">
          {stats.totalBookings > 0 && (
            <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <p className="text-sm text-blue-600 dark:text-blue-400">
                💡 Vous dépensez en moyenne {Math.round(stats.totalSpent / stats.totalBookings)} € par réservation. 
                Pensez à réserver en avance pour bénéficier de meilleurs tarifs !
              </p>
            </div>
          )}
          <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
            <p className="text-sm text-green-600 dark:text-green-400">
              ✨ Votre cuisine préférée est la {stats.favoriteCuisine}. 
              Découvrez d'autres cuisiniers spécialisés dans cette cuisine !
            </p>
          </div>
          {stats.totalBookings > 0 && (
            <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/20">
              <p className="text-sm text-purple-600 dark:text-purple-400">
                🎯 Vous avez réservé {stats.totalBookings} fois. 
                Continuez à explorer de nouvelles expériences culinaires !
              </p>
            </div>
          )}
          {stats.totalBookings === 0 && (
            <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
              <p className="text-sm text-yellow-600 dark:text-yellow-400">
                🚀 Commencez votre aventure culinaire en créant votre première réservation !
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
