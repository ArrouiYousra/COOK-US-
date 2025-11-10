"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FileText, Calendar, Heart, Euro, Loader2 } from "lucide-react";
import { useBookingStore } from "@/stores/bookingStore";
import { apiClient } from "@/lib/api/client";

interface Stats {
  activeRequests: number;
  confirmedBookings: number;
  favoriteCooks: number;
  totalSpent: number;
}

/**
 * Cartes de statistiques rapides
 */
export function StatsCards() {
  const { proposalsStats, bookings, fetchProposals, fetchBookings } = useBookingStore();
  const [favoritesCount, setFavoritesCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  // Charger toutes les données nécessaires
  useEffect(() => {
    const loadData = async () => {
      try {
        // Charger les propositions pour avoir les stats (demandes actives)
        await fetchProposals({ filter: "pending" });
        
        // Charger les bookings confirmés pour le total dépensé
        await fetchBookings({ status: "CONFIRMED" });
        
        // Charger les favoris
        const favoritesResponse = await apiClient.getFavorites();
        setFavoritesCount(favoritesResponse.count);
      } catch (error) {
        console.error("Erreur lors du chargement des données:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [fetchProposals, fetchBookings]);

  // Calculer le total dépensé depuis les bookings confirmés
  const totalSpent = bookings
    .filter((booking) => booking.status === "CONFIRMED")
    .reduce((sum, booking) => sum + (booking.totalPrice || 0), 0);

  const stats = [
    {
      label: "Demandes actives",
      value: proposalsStats.pending.toString(),
      icon: FileText,
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-500/10 dark:bg-blue-500/20",
    },
    {
      label: "Réservations confirmées",
      value: bookings.filter((b) => b.status === "CONFIRMED").length.toString(),
      icon: Calendar,
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-500/10 dark:bg-green-500/20",
    },
    {
      label: "Chefs favoris",
      value: isLoading ? "..." : favoritesCount.toString(),
      icon: Heart,
      color: "text-pink-600 dark:text-pink-400",
      bgColor: "bg-pink-500/10 dark:bg-pink-500/20",
    },
    {
      label: "Total dépensé",
      value: `${totalSpent.toLocaleString("fr-FR")} €`,
      icon: Euro,
      color: "text-purple-600 dark:text-purple-400",
      bgColor: "bg-purple-500/10 dark:bg-purple-500/20",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            className="bg-card border border-border rounded-xl p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 rounded-lg ${stat.bgColor} flex items-center justify-center`}>
                {isLoading && stat.label === "Chefs favoris" ? (
                  <Loader2 className={`w-6 h-6 ${stat.color} animate-spin`} />
                ) : (
                  <Icon className={`w-6 h-6 ${stat.color}`} />
                )}
              </div>
            </div>
            <p className="text-2xl lg:text-3xl font-bold text-foreground mb-1">
              {stat.value}
            </p>
            <p className="text-sm text-muted-foreground">{stat.label}</p>
          </motion.div>
        );
      })}
    </div>
  );
}

