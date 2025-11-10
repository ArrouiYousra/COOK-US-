"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Star, Filter, MessageSquare, MessageCircle, Loader2 } from "lucide-react";
import { ClientReviewCard } from "@/components/dashboard/reviews/ClientReviewCard";
import { ReceivedReviewCard } from "@/components/dashboard/reviews/ReceivedReviewCard";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/lib/api/client";
import { useAuthStore } from "@/stores/authStore";

type TabType = "given" | "received";

/**
 * Page "Mes Avis"
 * Affiche les avis donnés par le client aux cuisiniers ET les avis reçus des cuisiniers
 */
export default function ClientReviewsPage() {
  const router = useRouter();
  const { user, isAuthenticated, checkAuth, isLoading: isAuthLoading } = useAuthStore();
  const [activeTab, setActiveTab] = useState<TabType>("given");
  const [filter, setFilter] = useState<"all" | "recommended" | "with-photos">("all");
  const [givenReviews, setGivenReviews] = useState<any[]>([]);
  const [receivedReviews, setReceivedReviews] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Vérifier l'authentification au montage
  useEffect(() => {
    const verifyAuth = async () => {
      if (!isAuthenticated) {
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

  // Charger les avis depuis l'API
  useEffect(() => {
    const loadReviews = async () => {
      if (isAuthLoading) return;
      if (!isAuthenticated || !user) return;

      setIsLoading(true);
      setError(null);
      try {
        // Charger les avis donnés (avis que le client a écrits pour les cuisiniers)
        const givenReviewsData = await apiClient.getMyReviews();
        
        // Charger les avis reçus (avis que les cuisiniers ont écrits pour le client)
        const receivedReviewsData = await apiClient.getReviewsByUser(user.id);

        // Enrichir les avis donnés avec les données des cuisiniers et des bookings
        // Le backend enrichit déjà avec reviewee (le cuisinier)
        const enrichedGivenReviews = await Promise.all(
          givenReviewsData.reviews.map(async (review: any) => {
            // Le reviewee est le cuisinier (car le client a écrit l'avis)
            const reviewee = review.reviewee;
            const bookingId = review.booking_id;

            // Charger les infos de la réservation
            let bookingData = null;
            if (bookingId) {
              try {
                const bookingsData = await apiClient.getBookings({ limit: 1000 });
                bookingData = bookingsData.bookings.find((b: any) => b.id === bookingId);
              } catch (err) {
                console.warn("Impossible de charger la réservation:", err);
              }
            }

            const cookName = reviewee?.first_name && reviewee?.last_name
              ? `${reviewee.first_name} ${reviewee.last_name}`
              : reviewee?.first_name || "Cuisinier";

            return {
              id: review.id,
              cookName,
              cookAvatar: reviewee?.avatar_url,
              rating: review.rating,
              detailedRatings: {
                // TODO: Les notes détaillées ne sont pas encore dans le schéma de la DB
                // Pour l'instant, on utilise des valeurs par défaut
                quality: review.rating,
                punctuality: review.rating,
                cleanliness: review.rating,
                communication: review.rating,
              },
              comment: review.comment || "",
              photos: [], // TODO: Les photos ne sont pas encore dans le schéma de la DB
              isRecommended: review.rating >= 4, // Considérer comme recommandé si note >= 4
              createdAt: review.created_at,
              bookingDate: bookingData?.booking_date || bookingData?.date || review.created_at,
            };
          })
        );

        // Enrichir les avis reçus avec les données des cuisiniers et des bookings
        // Le backend enrichit déjà avec reviewer (le cuisinier)
        const enrichedReceivedReviews = await Promise.all(
          receivedReviewsData.reviews.map(async (review: any) => {
            // Le reviewer est le cuisinier (car le cuisinier a écrit l'avis pour le client)
            const reviewer = review.reviewer;
            const bookingId = review.booking_id;

            // Charger les infos de la réservation
            let bookingData = null;
            if (bookingId) {
              try {
                const bookingsData = await apiClient.getBookings({ limit: 1000 });
                bookingData = bookingsData.bookings.find((b: any) => b.id === bookingId);
              } catch (err) {
                console.warn("Impossible de charger la réservation:", err);
              }
            }

            const cookName = reviewer?.first_name && reviewer?.last_name
              ? `${reviewer.first_name} ${reviewer.last_name}`
              : reviewer?.first_name || "Cuisinier";

            return {
              id: review.id,
              cookName,
              cookAvatar: reviewer?.avatar_url,
              rating: review.rating,
              comment: review.comment || "",
              createdAt: review.created_at,
              bookingDate: bookingData?.booking_date || bookingData?.date || review.created_at,
            };
          })
        );

        setGivenReviews(enrichedGivenReviews);
        setReceivedReviews(enrichedReceivedReviews);
        
        // Debug: vérifier les données chargées
        console.log("Avis donnés chargés:", enrichedGivenReviews.length);
        console.log("Avis reçus chargés:", enrichedReceivedReviews.length);
        console.log("Avis reçus avec rating >= 4:", enrichedReceivedReviews.filter((r) => r.rating >= 4).length);
      } catch (err: any) {
        console.error("Erreur lors du chargement des avis:", err);
        
        // Si l'erreur est 401, rediriger vers la connexion
        if (err.response?.status === 401 || err.message?.includes("Jeton d'authentification manquant")) {
          router.push("/auth/login");
          return;
        }
        
        setError(err.response?.data?.message || "Impossible de charger les avis");
        setGivenReviews([]);
        setReceivedReviews([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadReviews();
  }, [isAuthenticated, isAuthLoading, user, router]);

  // Filtrer les avis donnés
  const filteredGivenReviews = useMemo(() => {
    return givenReviews.filter((review) => {
      if (filter === "recommended") return review.isRecommended;
      if (filter === "with-photos") return review.photos && review.photos.length > 0;
      return true;
    });
  }, [givenReviews, filter]);

  // Calculer les statistiques
  const averageGivenRating = useMemo(() => {
    return givenReviews.length > 0
      ? givenReviews.reduce((sum, r) => sum + r.rating, 0) / givenReviews.length
      : 0;
  }, [givenReviews]);

  const averageReceivedRating = useMemo(() => {
    return receivedReviews.length > 0
      ? receivedReviews.reduce((sum, r) => sum + r.rating, 0) / receivedReviews.length
      : 0;
  }, [receivedReviews]);

  const recommendedCount = useMemo(() => {
    return givenReviews.filter((r) => r.isRecommended).length;
  }, [givenReviews]);

  const positiveReceivedCount = useMemo(() => {
    return receivedReviews.filter((r) => r.rating >= 4).length;
  }, [receivedReviews]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-trebuchet text-3xl lg:text-4xl font-bold text-foreground mb-2">
          Mes Avis
        </h1>
        <p className="text-muted-foreground">
          Les avis que vous avez laissés aux cuisiniers et ceux que vous avez reçus
        </p>
      </div>

      {/* Onglets */}
      <div className="flex items-center gap-2 border-b border-border">
        <button
          onClick={() => {
            setActiveTab("given");
            setFilter("all");
          }}
          className={`
            px-6 py-3 font-medium text-sm transition-colors relative
            ${
              activeTab === "given"
                ? "text-blue-600 dark:text-blue-400"
                : "text-muted-foreground hover:text-foreground"
            }
          `}
        >
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Avis donnés ({givenReviews.length})
          </div>
          {activeTab === "given" && (
            <motion.div
              layoutId="activeTab"
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400"
            />
          )}
        </button>
        <button
          onClick={() => {
            setActiveTab("received");
            setFilter("all");
          }}
          className={`
            px-6 py-3 font-medium text-sm transition-colors relative
            ${
              activeTab === "received"
                ? "text-blue-600 dark:text-blue-400"
                : "text-muted-foreground hover:text-foreground"
            }
          `}
        >
          <div className="flex items-center gap-2">
            <MessageCircle className="w-4 h-4" />
            Avis reçus ({receivedReviews.length})
          </div>
          {activeTab === "received" && (
            <motion.div
              layoutId="activeTab"
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400"
            />
          )}
        </button>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border rounded-xl p-6"
        >
          <div className="flex items-center gap-2 mb-2">
            <Star className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
            <p className="text-sm text-muted-foreground">
              {activeTab === "given" ? "Note moyenne donnée" : "Note moyenne reçue"}
            </p>
          </div>
          <p className="text-2xl font-bold text-foreground">
            {activeTab === "given"
              ? averageGivenRating.toFixed(1)
              : averageReceivedRating.toFixed(1)}{" "}
            / 5
          </p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card border border-border rounded-xl p-6"
        >
          <div className="flex items-center gap-2 mb-2">
            <Filter className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <p className="text-sm text-muted-foreground">Total d'avis</p>
          </div>
          <p className="text-2xl font-bold text-foreground">
            {activeTab === "given"
              ? givenReviews.length
              : receivedReviews.length}
          </p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card border border-border rounded-xl p-6"
        >
          <div className="flex items-center gap-2 mb-2">
            <Star className="w-5 h-5 text-green-600 dark:text-green-400" />
            <p className="text-sm text-muted-foreground">
              {activeTab === "given" 
                ? "Recommandations (4+ étoiles)" 
                : "Avis positifs (4+ étoiles)"}
            </p>
          </div>
          <p className="text-2xl font-bold text-foreground">
            {activeTab === "given"
              ? recommendedCount
              : positiveReceivedCount}
          </p>
        </motion.div>
      </div>

      {/* Filtres (seulement pour les avis donnés) */}
      {activeTab === "given" && (
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {[
            { id: "all" as const, label: "Tous" },
            { id: "recommended" as const, label: "Recommandés" },
            { id: "with-photos" as const, label: "Avec photos" },
          ].map((option) => (
            <button
              key={option.id}
              onClick={() => setFilter(option.id)}
              className={`
                px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors
                ${
                  filter === option.id
                    ? "bg-blue-600 text-white"
                    : "bg-accent text-foreground hover:bg-accent/80"
                }
              `}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}

      {/* Liste des avis */}
      {isAuthLoading || isLoading ? (
        <div className="flex items-center justify-center py-16 bg-card border border-border rounded-xl">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <div className="text-center py-12 bg-card border border-border rounded-xl">
          <p className="text-destructive">{error}</p>
        </div>
      ) : activeTab === "given" ? (
        filteredGivenReviews.length === 0 ? (
          <div className="text-center py-12 bg-card border border-border rounded-xl">
            <p className="text-muted-foreground">
              {givenReviews.length === 0
                ? "Vous n'avez pas encore laissé d'avis"
                : "Aucun avis ne correspond à ce filtre"}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredGivenReviews.map((review) => (
              <ClientReviewCard key={review.id} review={review} />
            ))}
          </div>
        )
      ) : receivedReviews.length === 0 ? (
        <div className="text-center py-12 bg-card border border-border rounded-xl">
          <p className="text-muted-foreground">
            Aucun avis reçu pour le moment
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {receivedReviews.map((review) => (
            <ReceivedReviewCard key={review.id} review={review} />
          ))}
        </div>
      )}
    </div>
  );
}
