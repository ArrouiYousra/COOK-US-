"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import {
  User,
  Calendar,
  Star,
  ChefHat,
  MapPin,
  Loader2,
  AlertTriangle,
  Heart,
  UtensilsCrossed,
  Shield,
  Eye,
} from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { apiClient } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

/**
 * Page de profil client publique
 * Affiche exactement comment le profil apparaît aux yeux des chefs
 * Montre : disputes, notes reçues, préférences, historique, statistiques
 * Masque : email, téléphone, adresse complète (données sensibles)
 */
export default function ClientProfilePage() {
  const { user, isAuthenticated, checkAuth } = useAuthStore();
  const [publicProfile, setPublicProfile] = useState<any>(null);
  const [receivedReviews, setReceivedReviews] = useState<any[]>([]);
  const [disputes, setDisputes] = useState<any[]>([]);
  const [preferences, setPreferences] = useState({
    dietaryRestrictions: [] as string[],
    allergies: [] as string[],
    favoriteCuisines: [] as string[],
  });
  const [bookings, setBookings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Charger toutes les données du profil public
  useEffect(() => {
    const loadPublicProfile = async () => {
      if (!user || !isAuthenticated) {
        try {
          await checkAuth();
        } catch (error) {
          setIsLoading(false);
          return;
        }
      }

      if (!user?.id) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        // Charger le profil public (comme les chefs le voient)
        const profileData = await apiClient.getUserProfile(user.id);
        setPublicProfile(profileData);

        // Charger les avis reçus (ce que les chefs ont écrit sur le client)
        const reviewsData = await apiClient.getReviewsByUser(user.id);
        setReceivedReviews(reviewsData.reviews || []);

        // Charger les disputes
        try {
          const disputesData = await apiClient.getMyDisputes();
          setDisputes(disputesData.disputes || []);
        } catch (err) {
          console.warn("Impossible de charger les disputes:", err);
          setDisputes([]);
        }

        // Charger les préférences
        try {
          const [restrictionsData, allergiesData, cuisinesData] = await Promise.allSettled([
            apiClient.getDietaryRestrictions(),
            apiClient.getAllergies(),
            apiClient.getFavoriteCuisines(),
          ]);

          setPreferences({
            dietaryRestrictions:
              restrictionsData.status === "fulfilled"
                ? restrictionsData.value.restrictions.map((r: any) => r.restriction)
                : [],
            allergies:
              allergiesData.status === "fulfilled"
                ? allergiesData.value.allergies.map((a: any) => a.allergy)
                : [],
            favoriteCuisines:
              cuisinesData.status === "fulfilled"
                ? cuisinesData.value.cuisines.map((c: any) => c.cuisine)
                : [],
          });
        } catch (err) {
          console.warn("Impossible de charger les préférences:", err);
        }

        // Charger l'historique de réservations (publiques)
        const bookingsData = await apiClient.getBookings({ limit: 50 });
        setBookings(bookingsData.bookings || []);
      } catch (err: any) {
        console.error("Erreur lors du chargement du profil public:", err);
        setError("Impossible de charger le profil public");
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      loadPublicProfile();
    }
  }, [user, isAuthenticated, checkAuth]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !user || !publicProfile) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">
          {error || "Veuillez vous connecter pour voir votre profil"}
        </p>
      </div>
    );
  }

  const clientProfile = publicProfile.clientProfile || {};
  const safeUser = publicProfile.user || user;

  // Calculer les statistiques
  const stats = {
    totalBookings: clientProfile.total_bookings || bookings.length,
    averageRatingGiven: clientProfile.average_rating_given || 0,
    averageRatingReceived:
      receivedReviews.length > 0
        ? receivedReviews.reduce((sum, r) => sum + (r.rating || 0), 0) / receivedReviews.length
        : 0,
    disputesCount: disputes.length,
    openDisputesCount: disputes.filter((d) => d.status === "OPEN" || d.status === "OPENED").length,
  };

  // Formater les valeurs enum
  const formatEnum = (value: string) => {
    return value
      .split("_")
      .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
      .join(" ");
  };

  return (
    <div className="space-y-6">
      {/* Header avec indication que c'est la vue publique */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Eye className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h1 className="font-trebuchet text-3xl lg:text-4xl font-bold text-foreground">
              Mon Profil Public
            </h1>
          </div>
          <p className="text-muted-foreground">
            Voici comment votre profil apparaît aux yeux des chefs
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/dashboard/client/settings">Modifier mon profil</Link>
        </Button>
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
              {safeUser.avatar_url || safeUser.avatarUrl ? (
                <Image
                  src={safeUser.avatar_url || safeUser.avatarUrl}
                  alt={`${safeUser.first_name || safeUser.firstName || ""} ${safeUser.last_name || safeUser.lastName || ""}`.trim() || "Profil"}
                  fill
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <div className="w-full h-full bg-muted flex items-center justify-center">
                  <User className="w-16 h-16 text-muted-foreground" />
                </div>
              )}
            </div>
            <h2 className="font-cera text-2xl font-bold text-foreground mb-2">
              {`${safeUser.first_name || safeUser.firstName || ""} ${safeUser.last_name || safeUser.lastName || ""}`.trim() || "Utilisateur"}
            </h2>
            {safeUser.city && (
              <div className="flex items-center gap-2 text-muted-foreground mb-4">
                <MapPin className="w-4 h-4" />
                <span>{safeUser.city}</span>
              </div>
            )}
            <p className="text-sm text-muted-foreground mb-4">
              Membre depuis{" "}
              {safeUser.created_at || safeUser.createdAt
                ? new Date(safeUser.created_at || safeUser.createdAt).toLocaleDateString("fr-FR", {
                    month: "long",
                    year: "numeric",
                  })
                : "récemment"}
            </p>
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
              <div className="w-12 h-12 rounded-lg bg-yellow-500/10 dark:bg-yellow-500/20 flex items-center justify-center mx-auto lg:mx-0 mb-3">
                <Star className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <p className="text-2xl font-bold text-foreground mb-1">
                {stats.averageRatingReceived > 0
                  ? stats.averageRatingReceived.toFixed(1)
                  : "—"}
              </p>
              <p className="text-sm text-muted-foreground">Note moyenne reçue</p>
            </div>
            <div className="text-center lg:text-left">
              <div className="w-12 h-12 rounded-lg bg-red-500/10 dark:bg-red-500/20 flex items-center justify-center mx-auto lg:mx-0 mb-3">
                <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <p className="text-2xl font-bold text-foreground mb-1">{stats.disputesCount}</p>
              <p className="text-sm text-muted-foreground">
                Disputes {stats.openDisputesCount > 0 && `(${stats.openDisputesCount} ouvertes)`}
              </p>
            </div>
          </div>
        </div>

        {/* Informations du profil client */}
        <div className="mt-8 pt-8 border-t border-border grid grid-cols-1 md:grid-cols-3 gap-4">
          {clientProfile.household_size && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 dark:bg-purple-500/20 flex items-center justify-center">
                <User className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Taille du foyer</p>
                <p className="text-sm font-medium text-foreground">
                  {clientProfile.household_size} {clientProfile.household_size === 1 ? "personne" : "personnes"}
                </p>
              </div>
            </div>
          )}
          {clientProfile.pet_friendly !== undefined && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/10 dark:bg-green-500/20 flex items-center justify-center">
                <Heart className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Animaux acceptés</p>
                <p className="text-sm font-medium text-foreground">
                  {clientProfile.pet_friendly ? "Oui" : "Non"}
                </p>
              </div>
            </div>
          )}
          {clientProfile.smoking_allowed !== undefined && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-orange-500/10 dark:bg-orange-500/20 flex items-center justify-center">
                <Shield className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Fumeur accepté</p>
                <p className="text-sm font-medium text-foreground">
                  {clientProfile.smoking_allowed ? "Oui" : "Non"}
                </p>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Avis reçus (ce que les chefs ont écrit sur le client) */}
      {receivedReviews.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card border border-border rounded-xl p-6 lg:p-8"
        >
          <h3 className="font-cera text-xl font-bold text-foreground mb-4 flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
            Avis reçus ({receivedReviews.length})
          </h3>
          <div className="space-y-4">
            {receivedReviews.slice(0, 5).map((review) => (
              <div
                key={review.id}
                className="p-4 rounded-lg bg-accent/50 border border-border"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < (review.rating || 0)
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-muted-foreground"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm font-medium text-foreground">
                      {review.reviewer?.first_name || review.reviewer?.firstName || ""}{" "}
                      {review.reviewer?.last_name || review.reviewer?.lastName || ""}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(review.created_at || review.createdAt), {
                      addSuffix: true,
                      locale: fr,
                    })}
                  </span>
                </div>
                {review.comment && (
                  <p className="text-sm text-muted-foreground">{review.comment}</p>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Disputes */}
      {disputes.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card border border-border rounded-xl p-6 lg:p-8"
        >
          <h3 className="font-cera text-xl font-bold text-foreground mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
            Disputes ({disputes.length})
          </h3>
          <div className="space-y-3">
            {disputes.map((dispute) => (
              <div
                key={dispute.id}
                className={`p-4 rounded-lg border ${
                  dispute.status === "OPEN" || dispute.status === "OPENED"
                    ? "bg-red-500/10 border-red-500/20"
                    : "bg-accent/50 border-border"
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-semibold text-foreground">
                      {formatEnum(dispute.reason || "")}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">{dispute.description}</p>
                  </div>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      dispute.status === "OPEN" || dispute.status === "OPENED"
                        ? "bg-red-500/20 text-red-600 dark:text-red-400"
                        : dispute.status === "RESOLVED"
                        ? "bg-green-500/20 text-green-600 dark:text-green-400"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {formatEnum(dispute.status || "")}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(dispute.created_at || dispute.createdAt), {
                    addSuffix: true,
                    locale: fr,
                  })}
                </p>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Préférences */}
      {(preferences.dietaryRestrictions.length > 0 ||
        preferences.allergies.length > 0 ||
        preferences.favoriteCuisines.length > 0) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-card border border-border rounded-xl p-6 lg:p-8"
        >
          <h3 className="font-cera text-xl font-bold text-foreground mb-4 flex items-center gap-2">
            <UtensilsCrossed className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            Préférences alimentaires
          </h3>
          <div className="space-y-4">
            {preferences.favoriteCuisines.length > 0 && (
              <div>
                <p className="text-sm font-medium text-foreground mb-2">Cuisines préférées</p>
                <div className="flex flex-wrap gap-2">
                  {preferences.favoriteCuisines.map((cuisine) => (
                    <span
                      key={cuisine}
                      className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-sm font-medium"
                    >
                      {formatEnum(cuisine)}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {preferences.dietaryRestrictions.length > 0 && (
              <div>
                <p className="text-sm font-medium text-foreground mb-2">Restrictions alimentaires</p>
                <div className="flex flex-wrap gap-2">
                  {preferences.dietaryRestrictions.map((restriction) => (
                    <span
                      key={restriction}
                      className="px-3 py-1 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 text-sm font-medium"
                    >
                      {formatEnum(restriction)}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {preferences.allergies.length > 0 && (
              <div>
                <p className="text-sm font-medium text-foreground mb-2">Allergies</p>
                <div className="flex flex-wrap gap-2">
                  {preferences.allergies.map((allergy) => (
                    <span
                      key={allergy}
                      className="px-3 py-1 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 text-sm font-medium"
                    >
                      {formatEnum(allergy)}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Historique de réservations (publiques) */}
      {bookings.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-card border border-border rounded-xl p-6 lg:p-8"
        >
          <h3 className="font-cera text-xl font-bold text-foreground mb-4 flex items-center gap-2">
            <ChefHat className="w-5 h-5 text-green-600 dark:text-green-400" />
            Historique de réservations ({bookings.length})
          </h3>
          <div className="space-y-3">
            {bookings.slice(0, 10).map((booking) => (
              <Link
                key={booking.id}
                href={`/dashboard/client/bookings/${booking.id}`}
                className="block p-4 rounded-lg bg-accent/50 border border-border hover:bg-accent transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">
                      {booking.date || booking.booking_date
                        ? new Date(booking.date || booking.booking_date).toLocaleDateString(
                            "fr-FR",
                            {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                            }
                          )
                        : "Date non spécifiée"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {booking.cook?.user?.first_name || booking.cook?.user?.firstName || ""}{" "}
                      {booking.cook?.user?.last_name || booking.cook?.user?.lastName || "Cuisinier"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-foreground">
                      {booking.total_price || booking.totalPrice || 0} €
                    </p>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        booking.status === "completed" || booking.status === "done"
                          ? "bg-green-500/20 text-green-600 dark:text-green-400"
                          : booking.status === "confirmed"
                          ? "bg-blue-500/20 text-blue-600 dark:text-blue-400"
                          : "bg-yellow-500/20 text-yellow-600 dark:text-yellow-400"
                      }`}
                    >
                      {formatEnum(booking.status || "")}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </motion.div>
      )}

      {/* Note moyenne donnée par le client */}
      {stats.averageRatingGiven > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-card border border-border rounded-xl p-6 lg:p-8"
        >
          <h3 className="font-cera text-xl font-bold text-foreground mb-4 flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
            Note moyenne donnée
          </h3>
          <div className="flex items-center gap-4">
            <div className="text-4xl font-bold text-foreground">
              {stats.averageRatingGiven.toFixed(1)}
            </div>
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-6 h-6 ${
                    i < Math.round(stats.averageRatingGiven)
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-muted-foreground"
                  }`}
                />
              ))}
            </div>
            <p className="text-sm text-muted-foreground">
              Basée sur vos avis donnés aux cuisiniers
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
}