"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { User, Calendar, Star, ChefHat, MapPin, Mail, Phone } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { mockBookings } from "@/mockData";
import Link from "next/link";
import { Button } from "@/components/ui/button";

/**
 * Page de profil client publique
 * Affiche les informations du client, son historique, ses préférences
 */
export default function ClientProfilePage() {
  const { user } = useAuthStore();

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Veuillez vous connecter pour voir votre profil</p>
      </div>
    );
  }

  // Calculer les statistiques
  const stats = {
    totalBookings: mockBookings.length,
    totalSpent: mockBookings.reduce((sum, b) => sum + b.totalPrice, 0),
    averageRating: 4.5, // TODO: Calculer depuis les reviews données
    favoriteCuisines: ["Cuisine française", "Cuisine italienne"],
    memberSince: "2024-01-15",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-trebuchet text-3xl lg:text-4xl font-bold text-foreground mb-2">
          Mon Profil
        </h1>
        <p className="text-muted-foreground">
          Votre profil public et vos informations
        </p>
      </div>

      {/* Profil principal */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-border rounded-xl p-6 lg:p-8"
      >
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Photo et infos de base */}
          <div className="flex flex-col items-center lg:items-start">
            <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-border mb-4">
              {user.avatarUrl ? (
                <Image
                  src={user.avatarUrl}
                  alt={`${user.firstName || ""} ${user.lastName || ""}`.trim() || "Profil"}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full bg-muted flex items-center justify-center">
                  <User className="w-16 h-16 text-muted-foreground" />
                </div>
              )}
            </div>
            <h2 className="font-cera text-2xl font-bold text-foreground mb-2">
              {`${user.firstName || ""} ${user.lastName || ""}`.trim() || "Utilisateur"}
            </h2>
            <p className="text-muted-foreground mb-4">Membre depuis {new Date(stats.memberSince).toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}</p>
            <Button asChild variant="outline" size="sm">
              <Link href="/dashboard/client/settings">
                Modifier mon profil
              </Link>
            </Button>
          </div>

          {/* Statistiques */}
          <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center lg:text-left">
              <div className="w-12 h-12 rounded-lg bg-blue-500/10 dark:bg-blue-500/20 flex items-center justify-center mx-auto lg:mx-0 mb-3">
                <Calendar className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <p className="text-2xl font-bold text-foreground mb-1">{stats.totalBookings}</p>
              <p className="text-sm text-muted-foreground">Réservations</p>
            </div>
            <div className="text-center lg:text-left">
              <div className="w-12 h-12 rounded-lg bg-green-500/10 dark:bg-green-500/20 flex items-center justify-center mx-auto lg:mx-0 mb-3">
                <ChefHat className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <p className="text-2xl font-bold text-foreground mb-1">{stats.totalSpent} €</p>
              <p className="text-sm text-muted-foreground">Total dépensé</p>
            </div>
            <div className="text-center lg:text-left">
              <div className="w-12 h-12 rounded-lg bg-yellow-500/10 dark:bg-yellow-500/20 flex items-center justify-center mx-auto lg:mx-0 mb-3">
                <Star className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <p className="text-2xl font-bold text-foreground mb-1">{stats.averageRating.toFixed(1)}</p>
              <p className="text-sm text-muted-foreground">Note moyenne</p>
            </div>
          </div>
        </div>

        {/* Informations de contact */}
        <div className="mt-8 pt-8 border-t border-border grid grid-cols-1 md:grid-cols-2 gap-4">
          {user.email && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 dark:bg-purple-500/20 flex items-center justify-center">
                <Mail className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="text-sm font-medium text-foreground">{user.email}</p>
              </div>
            </div>
          )}
          {user.phone && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-pink-500/10 dark:bg-pink-500/20 flex items-center justify-center">
                <Phone className="w-5 h-5 text-pink-600 dark:text-pink-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Téléphone</p>
                <p className="text-sm font-medium text-foreground">{user.phone}</p>
              </div>
            </div>
          )}
          {user.address && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-orange-500/10 dark:bg-orange-500/20 flex items-center justify-center">
                <MapPin className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Adresse</p>
                <p className="text-sm font-medium text-foreground">{user.address}</p>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Cuisines préférées */}
      {stats.favoriteCuisines.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card border border-border rounded-xl p-6 lg:p-8"
        >
          <h3 className="font-cera text-xl font-bold text-foreground mb-4">
            Cuisines préférées
          </h3>
          <div className="flex flex-wrap gap-2">
            {stats.favoriteCuisines.map((cuisine) => (
              <span
                key={cuisine}
                className="px-4 py-2 rounded-full bg-accent text-foreground text-sm font-medium"
              >
                {cuisine}
              </span>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}

