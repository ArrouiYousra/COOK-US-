"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Star, Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { formatDate } from "@/lib/utils";
import { apiClient } from "@/lib/api/client";
import { useAuthStore } from "@/stores/authStore";

type RatingFilter = "all" | "5" | "4" | "3" | "2" | "1";

interface Review {
  id: string;
  clientName: string;
  rating: number;
  comment: string | null;
  date: string;
  bookingId: string | null;
  createdAt: string;
}

/**
 * Page "Mes Avis"
 * Affiche tous les avis reçus par le cuisinier
 */
export default function CookReviewsPage() {
  const [ratingFilter, setRatingFilter] = useState<RatingFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [averageRating, setAverageRating] = useState<number | null>(null);
  const { user } = useAuthStore();

  // Charger les avis depuis l'API
  useEffect(() => {
    const loadReviews = async () => {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);
      try {
        // Charger les avis reçus par le cuisinier et les réservations en parallèle
        const [reviewsResponse, bookingsResponse] = await Promise.allSettled([
          apiClient.getReviewsByUser(user.id),
          apiClient.getBookings({ limit: 1000 }),
        ]);

        const reviewsData = reviewsResponse.status === "fulfilled"
          ? reviewsResponse.value.reviews
          : [];
        const bookings = bookingsResponse.status === "fulfilled"
          ? bookingsResponse.value.bookings
          : [];

        // Créer un map des réservations par ID pour accès rapide
        const bookingsMap = new Map(bookings.map((b: any) => [b.id, b]));

        // Transformer les avis pour correspondre au format attendu
        const transformedReviews: Review[] = reviewsData.map((review: any) => {
          const booking = review.booking_id ? bookingsMap.get(review.booking_id) : null;
          
          // Priorité : booking.client > reviewer (celui qui a écrit l'avis)
          let clientName = "Client";
          if (booking?.client?.first_name && booking?.client?.last_name) {
            clientName = `${booking.client.first_name} ${booking.client.last_name}`;
          } else if (booking?.client?.first_name) {
            clientName = booking.client.first_name;
          } else if (review.reviewer?.first_name && review.reviewer?.last_name) {
            clientName = `${review.reviewer.first_name} ${review.reviewer.last_name}`;
          } else if (review.reviewer?.first_name) {
            clientName = review.reviewer.first_name;
          }

          return {
            id: review.id,
            clientName,
            rating: review.rating,
            comment: review.comment,
            date: booking?.date || review.created_at,
            bookingId: review.booking_id,
            createdAt: review.created_at,
          };
        });

        // Trier par date (plus récent en premier)
        transformedReviews.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        setReviews(transformedReviews);

        // Mettre à jour la note moyenne
        if (reviewsResponse.status === "fulfilled") {
          setAverageRating(reviewsResponse.value.average_rating);
        } else if (transformedReviews.length > 0) {
          // Calculer la moyenne si l'API ne la fournit pas
          const sum = transformedReviews.reduce((acc, r) => acc + r.rating, 0);
          setAverageRating(sum / transformedReviews.length);
        }
      } catch (err: any) {
        console.error("Erreur lors du chargement des avis:", err);
        setError(err.response?.data?.message || "Impossible de charger les avis");
        setReviews([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadReviews();
  }, [user?.id]);

  const filteredReviews = reviews.filter((review) => {
    // Filtrer par note
    if (ratingFilter !== "all" && review.rating !== parseInt(ratingFilter)) {
      return false;
    }
    
    // Filtrer par recherche
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (
        !review.clientName.toLowerCase().includes(query) &&
        !review.comment?.toLowerCase().includes(query) &&
        !review.bookingId?.toLowerCase().includes(query)
      ) {
        return false;
      }
    }
    
    return true;
  });

  const ratingDistribution = {
    5: reviews.filter((r) => r.rating === 5).length,
    4: reviews.filter((r) => r.rating === 4).length,
    3: reviews.filter((r) => r.rating === 3).length,
    2: reviews.filter((r) => r.rating === 2).length,
    1: reviews.filter((r) => r.rating === 1).length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-trebuchet text-3xl lg:text-4xl font-bold text-foreground mb-2">
          Mes Avis
        </h1>
        <p className="text-muted-foreground">
          Consultez les avis laissés par vos clients
        </p>
      </div>

      {/* Statistiques */}
      <div className="grid md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border rounded-xl p-6"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-yellow-500/10 dark:bg-yellow-500/20 flex items-center justify-center">
              <Star className="w-5 h-5 text-yellow-600 dark:text-yellow-400 fill-yellow-600 dark:fill-yellow-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Note moyenne</p>
              <p className="text-2xl font-bold text-foreground">
                {isLoading ? "..." : averageRating !== null ? `${averageRating.toFixed(1)} / 5` : "N/A"}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card border border-border rounded-xl p-6"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 dark:bg-blue-500/20 flex items-center justify-center">
              <Star className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total d'avis</p>
              <p className="text-2xl font-bold text-foreground">
                {isLoading ? "..." : reviews.length}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card border border-border rounded-xl p-6"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-green-500/10 dark:bg-green-500/20 flex items-center justify-center">
              <Star className="w-5 h-5 text-green-600 dark:text-green-400 fill-green-600 dark:fill-green-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Avis 5 étoiles</p>
              <p className="text-2xl font-bold text-foreground">
                {isLoading ? "..." : ratingDistribution[5]}
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Filtres */}
      <div className="bg-card border border-border rounded-xl p-4 lg:p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Rechercher un avis..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {[
              { id: "all" as RatingFilter, label: "Tous" },
              { id: "5" as RatingFilter, label: "5 étoiles" },
              { id: "4" as RatingFilter, label: "4 étoiles" },
              { id: "3" as RatingFilter, label: "3 étoiles" },
              { id: "2" as RatingFilter, label: "2 étoiles" },
              { id: "1" as RatingFilter, label: "1 étoile" },
            ].map((filter) => (
              <button
                key={filter.id}
                onClick={() => setRatingFilter(filter.id)}
                className={`
                  px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors
                  ${
                    ratingFilter === filter.id
                      ? "bg-blue-600 text-white"
                      : "bg-accent text-foreground hover:bg-accent/80"
                  }
                `}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Liste des avis */}
      {isLoading ? (
        <div className="text-center py-12 bg-card border border-border rounded-xl">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Chargement des avis...</p>
        </div>
      ) : error ? (
        <div className="text-center py-12 bg-card border border-border rounded-xl">
          <p className="text-destructive">{error}</p>
        </div>
      ) : filteredReviews.length === 0 ? (
        <div className="text-center py-12 bg-card border border-border rounded-xl">
          <p className="text-muted-foreground">
            {reviews.length === 0
              ? "Aucun avis pour le moment"
              : "Aucun avis ne correspond à vos critères de recherche"}
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredReviews.map((review, index) => (
            <ReviewCard key={review.id} review={review} index={index} />
          ))}
        </div>
      )}
    </div>
  );
}

interface ReviewCardProps {
  review: Review;
  index: number;
}

function ReviewCard({ review, index }: ReviewCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      className="bg-card border border-border rounded-xl p-6 hover:shadow-lg transition-shadow"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="font-cera text-lg font-bold text-foreground">
              {review.clientName}
            </h3>
            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`w-4 h-4 ${
                    i < review.rating
                      ? "text-yellow-500 fill-yellow-500"
                      : "text-muted-foreground"
                  }`}
                />
              ))}
            </div>
          </div>
          {review.comment && (
            <p className="text-muted-foreground mb-2">{review.comment}</p>
          )}
          <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
            <span>{formatDate(review.date)}</span>
            {review.bookingId && (
              <>
                <span>•</span>
                <span>Réservation #{review.bookingId.slice(0, 8)}</span>
              </>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
