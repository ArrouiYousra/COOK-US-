"use client";

import { useState, useEffect, useMemo } from "react";
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
} from "lucide-react";
import { apiClient } from "@/lib/api/client";
import { useAuthStore } from "@/stores/authStore";
import { useBookingStore } from "@/stores/bookingStore";

/**
 * Page Statistiques et Insights
 * Graphiques de dépenses, tendances, historique
 */
export default function StatsPage() {
  const router = useRouter();
  const { user, isAuthenticated, checkAuth, isLoading: isAuthLoading } = useAuthStore();
  const { bookings, fetchBookings, isLoadingBookings } = useBookingStore();
  const [timeRange, setTimeRange] = useState<"week" | "month" | "year" | "all">("month");
  const [reviews, setReviews] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Vérifier l'authentification au montage (une seule fois)
  useEffect(() => {
    if (isAuthLoading) return;
    
    const verifyAuth = async () => {
      if (!isAuthenticated) {
        try {
          await checkAuth();
        } catch (error) {
          console.warn("Authentification échouée, redirection vers la page de connexion");
          // Utiliser router.replace pour éviter d'ajouter une entrée dans l'historique
          router.replace("/auth/login");
        }
      }
    };

      verifyAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Exécuter une seule fois au montage

  // Charger les données
  useEffect(() => {
    const loadData = async () => {
      if (isAuthLoading) return;
      if (!isAuthenticated || !user) return;

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
    const monthlySpending: number[] = [];
    const bookingsByMonth: number[] = [];
    const monthNames: string[] = [];
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      
      const monthBookings = filteredBookings.filter((b) => {
        const bookingDate = new Date(b.date || b.createdAt);
        return bookingDate >= monthStart && bookingDate <= monthEnd;
      });
      
      const monthSpent = monthBookings.reduce((sum, b) => {
        return sum + (b.totalPrice || 0);
      }, 0);
      
      monthlySpending.push(monthSpent);
      bookingsByMonth.push(monthBookings.length);
      monthNames.push(date.toLocaleDateString('fr-FR', { month: 'short' }));
    }

    // Calculer la tendance (comparaison avec le mois précédent)
    const currentMonthSpent = monthlySpending[monthlySpending.length - 1] || 0;
    const previousMonthSpent = monthlySpending[monthlySpending.length - 2] || 0;
    const spendingTrend = previousMonthSpent > 0
      ? ((currentMonthSpent - previousMonthSpent) / previousMonthSpent) * 100
      : 0;

    // Réservations ce mois
    const currentMonthBookings = bookingsByMonth[bookingsByMonth.length - 1] || 0;

    return {
      totalSpent,
      totalBookings,
      averageRating,
      favoriteCuisine,
      monthlySpending,
      bookingsByMonth,
      monthNames,
      spendingTrend,
      currentMonthBookings,
    };
  }, [filteredBookings, reviews]);

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
            {stats.currentMonthBookings} ce mois
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
              Dépenses mensuelles
            </h2>
          </div>
          <div className="space-y-4">
            {stats.monthlySpending.length > 0 ? (
              stats.monthlySpending.map((amount, index) => {
                const maxAmount = Math.max(...stats.monthlySpending, 1); // Éviter division par 0
                const percentage = (amount / maxAmount) * 100;
                
                return (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{stats.monthNames[index] || `M${index + 1}`}</span>
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
              Réservations par mois
            </h2>
          </div>
          <div className="space-y-4">
            {stats.bookingsByMonth.length > 0 ? (
              stats.bookingsByMonth.map((count, index) => {
                const maxCount = Math.max(...stats.bookingsByMonth, 1); // Éviter division par 0
                const percentage = (count / maxCount) * 100;
                
                return (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{stats.monthNames[index] || `M${index + 1}`}</span>
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

      {/* Insights et recommandations */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
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
