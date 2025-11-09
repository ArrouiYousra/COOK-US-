"use client";

import { useState } from "react";
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
} from "lucide-react";
import { mockBookings } from "@/mockData";

/**
 * Page Statistiques et Insights
 * Graphiques de dépenses, tendances, historique
 */
export default function StatsPage() {
  const [timeRange, setTimeRange] = useState<"week" | "month" | "year" | "all">("month");

  // Calculer les statistiques
  const stats = {
    totalSpent: mockBookings.reduce((sum, b) => sum + b.totalPrice, 0),
    totalBookings: mockBookings.length,
    averageRating: 4.5, // TODO: Calculer depuis les reviews
    favoriteCuisine: "Cuisine française", // TODO: Calculer depuis l'historique
    monthlySpending: [120, 180, 150, 200, 170, 190],
    bookingsByMonth: [2, 3, 2, 4, 3, 4],
  };

  const timeRangeOptions = [
    { value: "week" as const, label: "7 jours" },
    { value: "month" as const, label: "30 jours" },
    { value: "year" as const, label: "12 mois" },
    { value: "all" as const, label: "Tout" },
  ];

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
            <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
          </div>
          <p className="text-sm text-muted-foreground mb-1">Total dépensé</p>
          <p className="text-2xl font-bold text-foreground">{stats.totalSpent} €</p>
          <p className="text-xs text-green-600 dark:text-green-400 mt-2">
            +12% vs mois dernier
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
            {stats.totalBookings} ce mois
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
            {stats.monthlySpending.map((amount, index) => {
              const maxAmount = Math.max(...stats.monthlySpending);
              const percentage = (amount / maxAmount) * 100;
              const monthNames = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin"];
              
              return (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{monthNames[index] || `M${index + 1}`}</span>
                    <span className="font-semibold text-foreground">{amount} €</span>
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
            })}
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
            {stats.bookingsByMonth.map((count, index) => {
              const maxCount = Math.max(...stats.bookingsByMonth);
              const percentage = (count / maxCount) * 100;
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
                      className="h-full bg-gradient-to-r from-purple-500 to-purple-600 rounded-full"
                    />
                  </div>
                </div>
              );
            })}
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
          <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <p className="text-sm text-blue-600 dark:text-blue-400">
              💡 Vous dépensez en moyenne {Math.round(stats.totalSpent / stats.totalBookings)} € par réservation. 
              Pensez à réserver en avance pour bénéficier de meilleurs tarifs !
            </p>
          </div>
          <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
            <p className="text-sm text-green-600 dark:text-green-400">
              ✨ Votre cuisine préférée est la {stats.favoriteCuisine}. 
              Découvrez d'autres cuisiniers spécialisés dans cette cuisine !
            </p>
          </div>
          <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/20">
            <p className="text-sm text-purple-600 dark:text-purple-400">
              🎯 Vous avez réservé {stats.totalBookings} fois. 
              Continuez à explorer de nouvelles expériences culinaires !
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

