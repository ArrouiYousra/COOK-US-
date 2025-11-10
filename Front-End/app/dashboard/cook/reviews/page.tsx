"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Star, Filter, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { formatDate } from "@/lib/utils";

// Mock data - À remplacer par les vraies données
const mockReviews = [
  {
    id: "1",
    clientName: "Sophie Martin",
    rating: 5,
    comment: "Excellent cuisinier ! Le repas était délicieux et le service impeccable.",
    date: "2024-12-20",
    bookingId: "booking-1",
  },
  {
    id: "2",
    clientName: "Pierre Dubois",
    rating: 4,
    comment: "Très bon repas, je recommande !",
    date: "2024-12-18",
    bookingId: "booking-2",
  },
  {
    id: "3",
    clientName: "Marie Laurent",
    rating: 5,
    comment: "Un chef exceptionnel, nous avons passé un moment merveilleux.",
    date: "2024-12-15",
    bookingId: "booking-3",
  },
];

type RatingFilter = "all" | "5" | "4" | "3" | "2" | "1";

/**
 * Page "Mes Avis"
 * Affiche tous les avis reçus par le cuisinier
 */
export default function CookReviewsPage() {
  const [ratingFilter, setRatingFilter] = useState<RatingFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredReviews = mockReviews.filter((review) => {
    if (ratingFilter !== "all" && review.rating !== parseInt(ratingFilter)) {
      return false;
    }
    if (
      searchQuery &&
      !review.clientName.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !review.comment.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  const averageRating =
    mockReviews.reduce((sum, r) => sum + r.rating, 0) / mockReviews.length;

  const ratingDistribution = {
    5: mockReviews.filter((r) => r.rating === 5).length,
    4: mockReviews.filter((r) => r.rating === 4).length,
    3: mockReviews.filter((r) => r.rating === 3).length,
    2: mockReviews.filter((r) => r.rating === 2).length,
    1: mockReviews.filter((r) => r.rating === 1).length,
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
                {averageRating.toFixed(1)} / 5
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
              <p className="text-2xl font-bold text-foreground">{mockReviews.length}</p>
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
              <p className="text-2xl font-bold text-foreground">{ratingDistribution[5]}</p>
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
      {filteredReviews.length === 0 ? (
        <div className="text-center py-12 bg-card border border-border rounded-xl">
          <p className="text-muted-foreground">Aucun avis trouvé</p>
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
  review: typeof mockReviews[0];
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
          <p className="text-muted-foreground mb-2">{review.comment}</p>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>{formatDate(review.date)}</span>
            <span>•</span>
            <span>Réservation #{review.bookingId.slice(0, 8)}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

