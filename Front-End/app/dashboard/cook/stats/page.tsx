"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp,
  Euro,
  Calendar,
  Star,
  Users,
  BarChart3,
  PieChart,
  ChefHat,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { apiClient } from "@/lib/api/client";
import { useAuthStore } from "@/stores/authStore";
import { format, startOfMonth, endOfMonth, subMonths, subWeeks, startOfWeek, endOfWeek, startOfYear, endOfYear, isWithinInterval } from "date-fns";
import { fr } from "date-fns/locale";

/**
 * Page Statistiques du cuisinier
 * Graphiques de revenus, réservations, notes, etc.
 */
export default function CookStatsPage() {
  const { user, isAuthenticated, checkAuth, isLoading: isAuthLoading } = useAuthStore();
  const [timeRange, setTimeRange] = useState<"week" | "month" | "year" | "all">("month");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    averageRating: 0,
    totalBookings: 0,
    completedBookings: 0,
    monthlyRevenue: [] as number[],
    bookingsByMonth: [] as number[],
    topSpecialties: [] as string[],
    uniqueClients: 0,
    revenueGrowth: 0,
  });

  const timeRangeOptions = [
    { value: "week" as const, label: "7 jours" },
    { value: "month" as const, label: "30 jours" },
    { value: "year" as const, label: "12 mois" },
    { value: "all" as const, label: "Tout" },
  ];

  // Charger les données
  useEffect(() => {
    const loadStats = async () => {
      if (isAuthLoading) return;
      if (!isAuthenticated || !user?.id) return;

      setIsLoading(true);
      setError(null);

      try {
        // Charger toutes les données en parallèle
        const [bookingsResponse, transactionsResponse, reviewsResponse] = await Promise.allSettled([
          apiClient.getBookings({ limit: 10000 }), // Récupérer tous les bookings
          apiClient.getMyTransactions(), // Transactions
          apiClient.getReviewsByUser(user.id), // Avis reçus
        ]);

        // Traiter les bookings
        let allBookings: any[] = [];
        if (bookingsResponse.status === "fulfilled") {
          allBookings = bookingsResponse.value.bookings || [];
        }

        // Traiter les transactions
        let allTransactions: any[] = [];
        if (transactionsResponse.status === "fulfilled") {
          allTransactions = transactionsResponse.value.transactions || [];
        }

        // Traiter les avis
        let reviewsData: any[] = [];
        let averageRating = 0;
        if (reviewsResponse.status === "fulfilled") {
          reviewsData = reviewsResponse.value.reviews || [];
          if (reviewsResponse.value.average_rating !== null) {
            averageRating = reviewsResponse.value.average_rating;
          } else if (reviewsData.length > 0) {
            averageRating = reviewsData.reduce((sum, r) => sum + (r.rating || 0), 0) / reviewsData.length;
          }
        }

        // Définir la période selon timeRange
        const now = new Date();
        let startDate: Date;
        let endDate: Date = now;

        switch (timeRange) {
          case "week":
            startDate = startOfWeek(now, { locale: fr });
            endDate = endOfWeek(now, { locale: fr });
            break;
          case "month":
            startDate = startOfMonth(now);
            endDate = endOfMonth(now);
            break;
          case "year":
            startDate = startOfYear(now);
            endDate = endOfYear(now);
            break;
          case "all":
            startDate = new Date(0); // Date très ancienne
            endDate = now;
            break;
        }

        // Filtrer les bookings selon la période
        const filteredBookings = allBookings.filter((b) => {
          const bookingDate = new Date(b.booking_date || b.created_at);
          return isWithinInterval(bookingDate, { start: startDate, end: endDate });
        });

        // Filtrer les transactions selon la période (pour le cuisinier, on prend les crédits)
        const filteredTransactions = allTransactions.filter((t) => {
          const transactionDate = new Date(t.created_at);
          // Pour un cuisinier, on prend les transactions où il est le destinataire (crédits)
          // ou les remboursements où il est l'expéditeur
          const isCredit = t.to_user_id === user.id && t.type !== "PLATFORM_FEE";
          const isRefund = t.from_user_id === user.id && t.type === "REFUND";
          return isWithinInterval(transactionDate, { start: startDate, end: endDate }) && (isCredit || isRefund);
        });

        // Calculer les revenus totaux (depuis les transactions payées)
        const paidTransactions = filteredTransactions.filter((t) => t.status === "COMPLETED" || t.status === "PAID");
        const totalRevenue = paidTransactions.reduce((sum, t) => {
          if (t.to_user_id === user.id && t.type !== "PLATFORM_FEE") {
            return sum + (t.amount || 0) / 100; // Montant en centimes
          }
          if (t.from_user_id === user.id && t.type === "REFUND") {
            return sum - (t.amount || 0) / 100; // Remboursement (négatif)
          }
          return sum;
        }, 0);

        // Calculer la croissance des revenus (comparaison avec la période précédente)
        let previousStartDate: Date;
        let previousEndDate: Date;
        switch (timeRange) {
          case "week":
            const previousWeek = subWeeks(now, 1);
            previousStartDate = startOfWeek(previousWeek, { locale: fr });
            previousEndDate = endOfWeek(previousWeek, { locale: fr });
            break;
          case "month":
            previousStartDate = startOfMonth(subMonths(now, 1));
            previousEndDate = endOfMonth(subMonths(now, 1));
            break;
          case "year":
            previousStartDate = startOfYear(subMonths(now, 12));
            previousEndDate = endOfYear(subMonths(now, 12));
            break;
          default:
            previousStartDate = new Date(0);
            previousEndDate = now;
        }

        const previousTransactions = allTransactions.filter((t) => {
          const transactionDate = new Date(t.created_at);
          const isCredit = t.to_user_id === user.id && t.type !== "PLATFORM_FEE";
          const isRefund = t.from_user_id === user.id && t.type === "REFUND";
          return isWithinInterval(transactionDate, { start: previousStartDate, end: previousEndDate }) && (isCredit || isRefund);
        });

        const previousRevenue = previousTransactions
          .filter((t) => t.status === "COMPLETED" || t.status === "PAID")
          .reduce((sum, t) => {
            if (t.to_user_id === user.id && t.type !== "PLATFORM_FEE") {
              return sum + (t.amount || 0) / 100;
            }
            if (t.from_user_id === user.id && t.type === "REFUND") {
              return sum - (t.amount || 0) / 100;
            }
            return sum;
          }, 0);

        const revenueGrowth = previousRevenue > 0 
          ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 
          : (totalRevenue > 0 ? 100 : 0);

        // Calculer les réservations complétées
        const completedBookings = filteredBookings.filter((b) => b.status === "COMPLETED").length;

        // Calculer les clients uniques
        const uniqueClientIds = new Set(
          filteredBookings
            .filter((b) => b.client?.id || b.client_id)
            .map((b) => b.client?.id || b.client_id)
        );
        const uniqueClients = uniqueClientIds.size;

        // Calculer les revenus mensuels (6 derniers mois)
        const monthlyRevenue: number[] = [];
        const bookingsByMonth: number[] = [];
        const monthNames: string[] = [];

        for (let i = 5; i >= 0; i--) {
          const monthStart = startOfMonth(subMonths(now, i));
          const monthEnd = endOfMonth(subMonths(now, i));
          monthNames.push(format(monthStart, "MMM", { locale: fr }));

          // Revenus du mois
          const monthTransactions = allTransactions.filter((t) => {
            const transactionDate = new Date(t.created_at);
            const isCredit = t.to_user_id === user.id && t.type !== "PLATFORM_FEE";
            const isRefund = t.from_user_id === user.id && t.type === "REFUND";
            return isWithinInterval(transactionDate, { start: monthStart, end: monthEnd }) && (isCredit || isRefund);
          });

          const monthRevenue = monthTransactions
            .filter((t) => t.status === "COMPLETED" || t.status === "PAID")
            .reduce((sum, t) => {
              if (t.to_user_id === user.id && t.type !== "PLATFORM_FEE") {
                return sum + (t.amount || 0) / 100;
              }
              if (t.from_user_id === user.id && t.type === "REFUND") {
                return sum - (t.amount || 0) / 100;
              }
              return sum;
            }, 0);
          monthlyRevenue.push(Math.max(0, monthRevenue)); // Ne pas afficher de revenus négatifs

          // Réservations du mois
          const monthBookings = allBookings.filter((b) => {
            const bookingDate = new Date(b.booking_date || b.created_at);
            return isWithinInterval(bookingDate, { start: monthStart, end: monthEnd });
          });
          bookingsByMonth.push(monthBookings.length);
        }

        // Calculer les spécialités les plus demandées (basé sur les bookings)
        const specialtyCount: Record<string, number> = {};
        filteredBookings.forEach((b) => {
          // On peut utiliser le headline du cook profile ou d'autres données
          // Pour l'instant, on va utiliser une logique simple basée sur les bookings
        });

        // Pour les spécialités, on peut utiliser le profil du cuisinier
        // Pour l'instant, on laisse vide ou on utilise des données par défaut
        const topSpecialties: string[] = [];

        // Mettre à jour les statistiques
        setStats({
          totalRevenue,
          averageRating,
          totalBookings: filteredBookings.length,
          completedBookings,
          monthlyRevenue,
          bookingsByMonth,
          topSpecialties,
          uniqueClients,
          revenueGrowth,
        });
      } catch (err: any) {
        console.error("Erreur lors du chargement des statistiques:", err);
        setError(err.response?.data?.message || "Impossible de charger les statistiques");
      } finally {
        setIsLoading(false);
      }
    };

    if (!isAuthLoading && isAuthenticated && user?.id) {
      loadStats();
    }
  }, [isAuthenticated, user?.id, isAuthLoading, timeRange]);

  // Afficher un loader pendant le chargement
  if (isLoading || isAuthLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-trebuchet text-3xl lg:text-4xl font-bold text-foreground mb-2">
            Statistiques
          </h1>
          <p className="text-muted-foreground">
            Analysez vos performances et vos revenus
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

      {/* Messages d'erreur */}
      {error && (
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

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
            <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
          </div>
          <p className="text-sm text-muted-foreground mb-1">Revenus totaux</p>
          <p className="text-2xl font-bold text-foreground">{stats.totalRevenue.toFixed(2)} €</p>
          <p className={`text-xs mt-2 ${
            stats.revenueGrowth >= 0 
              ? "text-green-600 dark:text-green-400" 
              : "text-red-600 dark:text-red-400"
          }`}>
            {stats.revenueGrowth >= 0 ? "+" : ""}{stats.revenueGrowth.toFixed(1)}% vs période précédente
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
          </div>
          <p className="text-sm text-muted-foreground mb-1">Réservations</p>
          <p className="text-2xl font-bold text-foreground">{stats.totalBookings}</p>
          <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
            {stats.completedBookings} terminées
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
          </div>
          <p className="text-sm text-muted-foreground mb-1">Note moyenne</p>
          <p className="text-2xl font-bold text-foreground">{stats.averageRating.toFixed(1)}</p>
          <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-2">
            Basée sur vos avis
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
              <Users className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
          <p className="text-sm text-muted-foreground mb-1">Clients servis</p>
          <p className="text-2xl font-bold text-foreground">
            {stats.uniqueClients}
          </p>
          <p className="text-xs text-purple-600 dark:text-purple-400 mt-2">
            Clients uniques
          </p>
        </motion.div>
      </div>

      {/* Graphiques */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Graphique des revenus */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-card border border-border rounded-xl p-6 lg:p-8"
        >
          <div className="flex items-center gap-2 mb-6">
            <BarChart3 className="w-5 h-5 text-muted-foreground" />
            <h2 className="font-cera text-xl font-bold text-foreground">
              Revenus mensuels
            </h2>
          </div>
          <div className="space-y-4">
            {stats.monthlyRevenue.length > 0 ? (
              stats.monthlyRevenue.map((amount, index) => {
                const maxAmount = Math.max(...stats.monthlyRevenue, 1); // Éviter division par 0
                const percentage = maxAmount > 0 ? (amount / maxAmount) * 100 : 0;
                const monthNames = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin"];
                
                return (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{monthNames[index] || `M${index + 1}`}</span>
                      <span className="font-semibold text-foreground">{amount.toFixed(2)} €</span>
                    </div>
                    <div className="w-full h-3 bg-accent rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ duration: 0.8, delay: index * 0.1 }}
                        className="h-full bg-gradient-to-r from-green-500 to-green-600 rounded-full"
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                Aucune donnée disponible
              </p>
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
              Réservations par mois
            </h2>
          </div>
          <div className="space-y-4">
            {stats.bookingsByMonth.length > 0 ? (
              stats.bookingsByMonth.map((count, index) => {
                const maxCount = Math.max(...stats.bookingsByMonth, 1); // Éviter division par 0
                const percentage = maxCount > 0 ? (count / maxCount) * 100 : 0;
                const monthNames = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin"];
                
                return (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{monthNames[index] || `M${index + 1}`}</span>
                      <span className="font-semibold text-foreground">{count} réservation{count > 1 ? "s" : ""}</span>
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
              <p className="text-sm text-muted-foreground text-center py-4">
                Aucune donnée disponible
              </p>
            )}
          </div>
        </motion.div>
      </div>

      {/* Spécialités populaires */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-card border border-border rounded-xl p-6 lg:p-8"
      >
        <div className="flex items-center gap-2 mb-6">
          <ChefHat className="w-5 h-5 text-muted-foreground" />
          <h2 className="font-cera text-xl font-bold text-foreground">
            Vos spécialités les plus demandées
          </h2>
        </div>
        <div className="flex flex-wrap gap-3">
          {stats.topSpecialties.length > 0 ? (
            stats.topSpecialties.map((specialty, index) => (
              <motion.div
                key={specialty}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.7 + index * 0.1 }}
                className="px-4 py-2 rounded-full bg-accent border border-border"
              >
                <span className="text-sm font-medium text-foreground">{specialty}</span>
              </motion.div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">
              Aucune spécialité enregistrée pour le moment
            </p>
          )}
        </div>
      </motion.div>

      {/* Insights */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="bg-card border border-border rounded-xl p-6 lg:p-8"
      >
        <h2 className="font-cera text-xl font-bold text-foreground mb-6">
          Insights & Recommandations
        </h2>
        <div className="space-y-4">
          {stats.totalBookings > 0 && (
            <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
              <p className="text-sm text-green-600 dark:text-green-400">
                💰 Vos revenus moyens sont de {(stats.totalRevenue / stats.totalBookings).toFixed(2)} € par réservation. 
                {stats.revenueGrowth > 0 ? " Excellent travail !" : " Continuez vos efforts !"}
              </p>
            </div>
          )}
          {stats.averageRating > 0 && (
            <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <p className="text-sm text-blue-600 dark:text-blue-400">
                ⭐ Votre note moyenne de {stats.averageRating.toFixed(1)}/5 est {stats.averageRating >= 4.5 ? "excellente" : stats.averageRating >= 4 ? "très bonne" : "bonne"}. 
                Continuez sur cette lancée !
              </p>
            </div>
          )}
          <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/20">
            <p className="text-sm text-purple-600 dark:text-purple-400">
              📈 Vous avez {stats.totalBookings} réservation{stats.totalBookings > 1 ? "s" : ""} au total 
              {stats.completedBookings > 0 ? ` (${stats.completedBookings} complétée${stats.completedBookings > 1 ? "s" : ""})` : ""}. 
              {stats.totalBookings === 0 ? " Commencez à proposer vos services !" : " Pensez à mettre à jour vos disponibilités pour en recevoir plus !"}
            </p>
          </div>
          {stats.uniqueClients > 0 && (
            <div className="p-4 rounded-lg bg-orange-500/10 border border-orange-500/20">
              <p className="text-sm text-orange-600 dark:text-orange-400">
                👥 Vous avez servi {stats.uniqueClients} client{stats.uniqueClients > 1 ? "s" : ""} unique{stats.uniqueClients > 1 ? "s" : ""} 
                {stats.uniqueClients > 5 ? ". Félicitations pour votre fidélisation !" : ". Continuez à développer votre clientèle !"}
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

