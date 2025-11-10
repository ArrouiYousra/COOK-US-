"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { Star, ThumbsUp, MessageSquare } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface ClientReviewCardProps {
  review: {
    id: string;
    cookName: string;
    cookAvatar?: string;
    rating: number;
    detailedRatings?: {
      quality?: number;
      punctuality?: number;
      cleanliness?: number;
      communication?: number;
    };
    comment?: string;
    photos?: string[];
    isRecommended?: boolean;
    createdAt: string;
    bookingDate: string;
  };
}

/**
 * Carte d'avis donné par le client à un cuisinier
 * Affiche l'avis avec les détails et la recommandation
 */
export function ClientReviewCard({ review }: ClientReviewCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-xl p-6 hover:shadow-lg transition-shadow"
    >
      <div className="flex items-start gap-4 mb-4">
        {/* Avatar du cuisinier */}
        <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-border flex-shrink-0">
          {review.cookAvatar ? (
            <Image
              src={review.cookAvatar}
              alt={review.cookName}
              fill
              className="object-cover"
              unoptimized
            />
          ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center">
              <span className="text-xl">👨‍🍳</span>
            </div>
          )}
        </div>

        {/* Infos */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h3 className="font-cera text-lg font-bold text-foreground mb-1">
                {review.cookName}
              </h3>
              <div className="flex items-center gap-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${
                      i < review.rating
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-muted-foreground"
                    }`}
                  />
                ))}
                <span className="text-sm text-muted-foreground ml-1">
                  {formatDate(review.createdAt)}
                </span>
              </div>
            </div>
            {review.isRecommended && (
              <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20">
                <ThumbsUp className="w-4 h-4 text-green-600 dark:text-green-400" />
                <span className="text-xs font-medium text-green-600 dark:text-green-400">
                  Recommandé
                </span>
              </div>
            )}
          </div>

          {/* Notes détaillées */}
          {review.detailedRatings && (
            <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
              {review.detailedRatings.quality && (
                <div className="text-muted-foreground">
                  Qualité: {review.detailedRatings.quality}/5
                </div>
              )}
              {review.detailedRatings.punctuality && (
                <div className="text-muted-foreground">
                  Ponctualité: {review.detailedRatings.punctuality}/5
                </div>
              )}
              {review.detailedRatings.cleanliness && (
                <div className="text-muted-foreground">
                  Propreté: {review.detailedRatings.cleanliness}/5
                </div>
              )}
              {review.detailedRatings.communication && (
                <div className="text-muted-foreground">
                  Communication: {review.detailedRatings.communication}/5
                </div>
              )}
            </div>
          )}

          {/* Commentaire */}
          {review.comment && (
            <p className="text-sm text-muted-foreground leading-relaxed mb-3">
              {review.comment}
            </p>
          )}

          {/* Photos */}
          {review.photos && review.photos.length > 0 && (
            <div className="grid grid-cols-3 gap-2 mb-3">
              {review.photos.slice(0, 3).map((photo, index) => (
                <div
                  key={index}
                  className="relative aspect-square rounded-lg overflow-hidden border border-border"
                >
                  <Image
                    src={photo}
                    alt={`Photo ${index + 1}`}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
              ))}
            </div>
          )}

          {/* Date de réservation */}
          <p className="text-xs text-muted-foreground">
            Réservation du {formatDate(review.bookingDate)}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
