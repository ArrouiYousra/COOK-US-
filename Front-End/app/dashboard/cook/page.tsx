"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import { Calendar, Euro, Star, TrendingUp, Clock, Users, FileText, ChefHat, Loader2, AlertCircle } from "lucide-react";
import { apiClient } from "@/lib/api/client";
import { useAuthStore } from "@/stores/authStore";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

/**
 * Page Dashboard (Accueil) du cuisinier
 * Vue synthétique des activités et statistiques avec données réelles
 */
export default function CookDashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, checkAuth, isLoading: isAuthLoading } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    upcomingBookings: 0,
    averageRating: 0,
    totalBookings: 0,
    pendingRequests: 0,
    todayBookings: 0,
  });
  const [upcomingBookings, setUpcomingBookings] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);

  // Vérifier l'authentification au montage
  useEffect(() => {
    const verifyAuth = async () => {
      if (!isAuthenticated && !isAuthLoading) {
        try {
          await checkAuth();
        } catch (error) {
          console.warn("Authentification échouée, redirection vers la page de connexion");
          router.push("/auth/login");
        }
      }
    };

    if (!isAuthLoading) {
      verifyAuth();
    }
  }, [isAuthenticated, checkAuth, router, isAuthLoading]);

  // Charger les données du dashboard
  useEffect(() => {
    const loadDashboardData = async () => {
      if (isAuthLoading) return;
      if (!isAuthenticated || !user) return;

      setIsLoading(true);
      setError(null);

      try {
        // Charger les bookings, les avis et les demandes en parallèle
        const [bookingsResponse, reviewsResponse, pendingBookingsResponse] = await Promise.allSettled([
          apiClient.getBookings({ limit: 1000 }), // Récupérer tous les bookings pour les stats
          user?.id ? apiClient.getReviewsByUser(user.id) : Promise.resolve({ reviews: [], count: 0, average_rating: null }), // Avis reçus par le cuisinier
          apiClient.getBookings({ status: "PENDING", limit: 100 }), // Demandes en attente
        ]);

        // Traiter les bookings
        let allBookings: any[] = [];
        if (bookingsResponse.status === "fulfilled") {
          allBookings = bookingsResponse.value.bookings || [];
        }

        // Traiter les demandes en attente
        let pendingBookings: any[] = [];
        if (pendingBookingsResponse.status === "fulfilled") {
          pendingBookings = pendingBookingsResponse.value.bookings || [];
        }

        // Traiter les avis
        let reviewsData: any[] = [];
        let averageRating = 0;
        if (reviewsResponse.status === "fulfilled") {
          reviewsData = reviewsResponse.value.reviews || [];
          // Utiliser la note moyenne de l'API si disponible, sinon calculer
          if (reviewsResponse.value.average_rating !== null) {
            averageRating = reviewsResponse.value.average_rating;
          } else if (reviewsData.length > 0) {
            averageRating = reviewsData.reduce((sum, r) => sum + (r.rating || 0), 0) / reviewsData.length;
          }
        }

        // Calculer les statistiques
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        // Revenus totaux (bookings complétés)
        const completedBookings = allBookings.filter(
          (b) => b.status === "COMPLETED" && b.total_price
        );
        const totalRevenue = completedBookings.reduce((sum, b) => sum + (b.total_price || 0), 0);

        // Réservations à venir (CONFIRMED ou ACCEPTED)
        const upcoming = allBookings.filter(
          (b) => (b.status === "CONFIRMED" || b.status === "ACCEPTED") && new Date(b.booking_date) >= today
        );

        // Réservations aujourd'hui
        const todayBookings = upcoming.filter((b) => {
          const bookingDate = new Date(b.booking_date);
          return (
            bookingDate.getFullYear() === today.getFullYear() &&
            bookingDate.getMonth() === today.getMonth() &&
            bookingDate.getDate() === today.getDate()
          );
        });

        // Mettre à jour les statistiques
        setStats({
          totalRevenue,
          upcomingBookings: upcoming.length,
          averageRating,
          totalBookings: allBookings.length,
          pendingRequests: pendingBookings.length,
          todayBookings: todayBookings.length,
        });

        // Trier les prochaines réservations par date
        const sortedUpcoming = [...upcoming]
          .sort((a, b) => new Date(a.booking_date).getTime() - new Date(b.booking_date).getTime())
          .slice(0, 3);

        setUpcomingBookings(sortedUpcoming);
        setReviews(reviewsData);
      } catch (err: any) {
        console.error("Erreur lors du chargement du dashboard:", err);
        setError(err.response?.data?.message || "Impossible de charger les données du dashboard");
      } finally {
        setIsLoading(false);
      }
    };

    if (!isAuthLoading && isAuthenticated && user?.id) {
      loadDashboardData();
    }
  }, [isAuthenticated, user?.id, isAuthLoading]);

  // Afficher un loader pendant le chargement
  if (isLoading || isAuthLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Chargement du tableau de bord...</p>
        </div>
      </div>
    );
  }

  // Note: Les erreurs sont affichées dans le message d'erreur en haut de la page
  // Pas besoin de bloquer toute la page pour une erreur

  /**
   * Détermine la salutation selon l'heure de la journée
   * Bonjour : 0h - 17h59
   * Bonsoir : 18h - 23h59
   */
  const getGreeting = (): string => {
    const hour = new Date().getHours();
    return hour >= 18 ? "Bonsoir" : "Bonjour";
  };

  const firstName = user?.firstName || user?.first_name || "chef";

  return (
    <div className="space-y-8">
      {/* Message de bienvenue stylé */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-gradient-to-r from-blue-600/10 via-blue-500/10 to-blue-600/10 dark:from-blue-600/20 dark:via-blue-500/20 dark:to-blue-600/20 rounded-2xl p-6 lg:p-8 border border-blue-500/20"
      >
        <h1 className="font-trebuchet text-3xl lg:text-4xl font-bold text-foreground mb-2">
          {getGreeting()}, chef {firstName} 👨‍🍳
        </h1>
        <p className="text-lg text-muted-foreground">
          Bienvenue dans votre espace cuisinier
        </p>
      </motion.div>

      {/* Messages d'erreur */}
      {error && (
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Statistiques rapides */}
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
          <p className="text-xs text-green-600 dark:text-green-400 mt-2">
            Réservations complétées
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
          <p className="text-sm text-muted-foreground mb-1">Réservations à venir</p>
          <p className="text-2xl font-bold text-foreground">{stats.upcomingBookings}</p>
          <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
            {stats.todayBookings} aujourd'hui
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
              <FileText className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
          <p className="text-sm text-muted-foreground mb-1">Demandes en attente</p>
          <p className="text-2xl font-bold text-foreground">{stats.pendingRequests}</p>
          <p className="text-xs text-purple-600 dark:text-purple-400 mt-2">
            Nécessitent une réponse
          </p>
        </motion.div>
      </div>

      {/* Actions rapides et activités */}
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Actions rapides */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-card border border-border rounded-xl p-6"
        >
          <h2 className="font-cera text-xl font-bold text-foreground mb-4">
            Actions rapides
          </h2>
          <div className="space-y-3">
            <Link
              href="/dashboard/cook/requests"
              className="flex items-center gap-3 p-4 rounded-lg bg-accent hover:bg-accent/80 transition-colors"
            >
              <FileText className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <div className="flex-1">
                <p className="font-semibold text-foreground">Voir les demandes</p>
                <p className="text-sm text-muted-foreground">
                  {stats.pendingRequests} demande{stats.pendingRequests > 1 ? "s" : ""} en attente
                </p>
              </div>
            </Link>
            <Link
              href="/dashboard/cook/calendar"
              className="flex items-center gap-3 p-4 rounded-lg bg-accent hover:bg-accent/80 transition-colors"
            >
              <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <div className="flex-1">
                <p className="font-semibold text-foreground">Gérer mon agenda</p>
                <p className="text-sm text-muted-foreground">
                  Planifier vos disponibilités
                </p>
              </div>
            </Link>
            <Link
              href="/dashboard/cook/profile"
              className="flex items-center gap-3 p-4 rounded-lg bg-accent hover:bg-accent/80 transition-colors"
            >
              <ChefHat className="w-5 h-5 text-red-600 dark:text-red-400" />
              <div className="flex-1">
                <p className="font-semibold text-foreground">Mettre à jour mon profil</p>
                <p className="text-sm text-muted-foreground">
                  Optimiser votre visibilité
                </p>
              </div>
            </Link>
          </div>
        </motion.div>

        {/* Prochaines réservations */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-card border border-border rounded-xl p-6"
        >
          <h2 className="font-cera text-xl font-bold text-foreground mb-4">
            Prochaines réservations
          </h2>
          <div className="space-y-3">
            {upcomingBookings.length > 0 ? (
              upcomingBookings.map((booking, index) => (
                <Link
                  key={booking.id}
                  href={`/dashboard/cook/bookings/${booking.id}`}
                  className="flex items-center gap-3 p-4 rounded-lg bg-accent hover:bg-accent/80 transition-colors"
                >
                  <div className="w-12 h-12 rounded-lg bg-blue-500/10 dark:bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground truncate">
                      Réservation #{booking.id.slice(0, 8)}
                    </p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      <span>
                        {format(new Date(booking.booking_date), "d MMMM yyyy", { locale: fr })}
                        {booking.start_time && ` à ${booking.start_time.slice(0, 5)}`}
                      </span>
                    </div>
                    {booking.number_of_guests && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                        <Users className="w-4 h-4" />
                        <span>
                          {booking.number_of_guests} personne{booking.number_of_guests > 1 ? "s" : ""}
                        </span>
                      </div>
                    )}
                  </div>
                  {booking.total_price && (
                    <div className="text-right">
                      <p className="font-bold text-foreground">{booking.total_price.toFixed(2)} €</p>
                    </div>
                  )}
                </Link>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-8">
                Aucune réservation à venir
              </p>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
