"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Star, Filter, MessageSquare, MessageCircle } from "lucide-react";
import { ClientReviewCard } from "@/components/dashboard/reviews/ClientReviewCard";
import { ReceivedReviewCard } from "@/components/dashboard/reviews/ReceivedReviewCard";
import { Button } from "@/components/ui/button";

// Mock data - Avis donnés par le client aux cuisiniers
const mockClientReviews = [
  {
    id: "1",
    cookName: "Marie Martin",
    cookAvatar: undefined,
    rating: 5,
    detailedRatings: {
      quality: 5,
      punctuality: 5,
      cleanliness: 5,
      communication: 4,
    },
    comment: "Excellente expérience ! La cuisine était délicieuse et le service impeccable.",
    photos: [],
    isRecommended: true,
    createdAt: "2024-12-26T10:00:00Z",
    bookingDate: "2024-12-20T19:00:00Z",
  },
  {
    id: "2",
    cookName: "Sophie Dubois",
    cookAvatar: undefined,
    rating: 4,
    detailedRatings: {
      quality: 4,
      punctuality: 5,
      cleanliness: 4,
      communication: 4,
    },
    comment: "Très bon repas, cuisinier ponctuel et professionnel.",
    photos: [],
    isRecommended: true,
    createdAt: "2024-12-15T14:00:00Z",
    bookingDate: "2024-12-10T19:00:00Z",
  },
];

// Mock data - Avis reçus par le client des cuisiniers
const mockReceivedReviews = [
  {
    id: "1",
    cookName: "Marie Martin",
    cookAvatar: undefined,
    rating: 5,
    comment: "Client très agréable, ponctuel et respectueux. Excellente communication tout au long de la réservation.",
    createdAt: "2024-12-21T10:00:00Z",
    bookingDate: "2024-12-20T19:00:00Z",
  },
  {
    id: "2",
    cookName: "Sophie Dubois",
    cookAvatar: undefined,
    rating: 4,
    comment: "Très bon client, ambiance conviviale. Je recommande !",
    createdAt: "2024-12-11T14:00:00Z",
    bookingDate: "2024-12-10T19:00:00Z",
  },
];

type TabType = "given" | "received";

/**
 * Page "Mes Avis"
 * Affiche les avis donnés par le client aux cuisiniers ET les avis reçus des cuisiniers
 */
export default function ClientReviewsPage() {
  const [activeTab, setActiveTab] = useState<TabType>("given");
  const [filter, setFilter] = useState<"all" | "recommended" | "with-photos">("all");

  const filteredGivenReviews = mockClientReviews.filter((review) => {
    if (filter === "recommended") return review.isRecommended;
    if (filter === "with-photos") return review.photos && review.photos.length > 0;
    return true;
  });

  const averageGivenRating =
    mockClientReviews.length > 0
      ? mockClientReviews.reduce((sum, r) => sum + r.rating, 0) / mockClientReviews.length
      : 0;

  const averageReceivedRating =
    mockReceivedReviews.length > 0
      ? mockReceivedReviews.reduce((sum, r) => sum + r.rating, 0) / mockReceivedReviews.length
      : 0;

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
            Avis donnés ({mockClientReviews.length})
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
            Avis reçus ({mockReceivedReviews.length})
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
              ? mockClientReviews.length
              : mockReceivedReviews.length}
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
              {activeTab === "given" ? "Recommandations" : "Avis positifs (4+)"}
            </p>
          </div>
          <p className="text-2xl font-bold text-foreground">
            {activeTab === "given"
              ? mockClientReviews.filter((r) => r.isRecommended).length
              : mockReceivedReviews.filter((r) => r.rating >= 4).length}
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
      {activeTab === "given" ? (
        filteredGivenReviews.length === 0 ? (
          <div className="text-center py-12 bg-card border border-border rounded-xl">
            <p className="text-muted-foreground">
              Aucun avis ne correspond à ce filtre
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredGivenReviews.map((review) => (
              <ClientReviewCard key={review.id} review={review} />
            ))}
          </div>
        )
      ) : mockReceivedReviews.length === 0 ? (
        <div className="text-center py-12 bg-card border border-border rounded-xl">
          <p className="text-muted-foreground">
            Aucun avis reçu pour le moment
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {mockReceivedReviews.map((review) => (
            <ReceivedReviewCard key={review.id} review={review} />
          ))}
        </div>
      )}
    </div>
  );
}

