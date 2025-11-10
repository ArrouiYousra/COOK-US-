"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Calendar, Euro, Star, TrendingUp, Clock, Users, FileText, ChefHat } from "lucide-react";
import { mockBookings } from "@/mockData";

/**
 * Page Dashboard (Accueil) du cuisinier
 * Vue synthétique des activités et statistiques
 */
export default function CookDashboardPage() {
  // Calculer les statistiques (mock data - à remplacer par les vraies données)
  const stats = {
    totalRevenue: mockBookings.reduce((sum, b) => sum + b.totalPrice, 0),
    upcomingBookings: mockBookings.filter((b) => b.status === "confirmed").length,
    averageRating: 4.7,
    totalBookings: mockBookings.length,
    pendingRequests: 3,
    todayBookings: 2,
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-trebuchet text-3xl lg:text-4xl font-bold text-foreground mb-2">
          Tableau de bord
        </h1>
        <p className="text-muted-foreground">
          Bienvenue dans votre espace cuisinier
        </p>
      </div>

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
          <p className="text-2xl font-bold text-foreground">{stats.totalRevenue} €</p>
          <p className="text-xs text-green-600 dark:text-green-400 mt-2">
            +15% vs mois dernier
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
            {mockBookings
              .filter((b) => b.status === "confirmed")
              .slice(0, 3)
              .map((booking, index) => (
                <div
                  key={booking.id}
                  className="flex items-center gap-3 p-4 rounded-lg bg-accent"
                >
                  <div className="w-12 h-12 rounded-lg bg-blue-500/10 dark:bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground truncate">
                      Réservation #{booking.id.slice(0, 6)}
                    </p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      <span>{booking.date} à {booking.time}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                      <Users className="w-4 h-4" />
                      <span>{booking.numberOfGuests} personne{booking.numberOfGuests > 1 ? "s" : ""}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-foreground">{booking.totalPrice} €</p>
                  </div>
                </div>
              ))}
            {mockBookings.filter((b) => b.status === "confirmed").length === 0 && (
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

