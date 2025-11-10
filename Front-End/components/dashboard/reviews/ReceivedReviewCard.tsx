"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { Star, ChefHat } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface ReceivedReviewCardProps {
  review: {
    id: string;
    cookName: string;
    cookAvatar?: string;
    rating: number;
    comment?: string;
    createdAt: string;
    bookingDate: string;
  };
}

/**
 * Carte d'avis reçu par le client d'un cuisinier
 * Affiche l'avis que le cuisinier a laissé au client
 */
export function ReceivedReviewCard({ review }: ReceivedReviewCardProps) {
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
              <ChefHat className="w-8 h-8 text-muted-foreground" />
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
            <div className="px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20">
              <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                Reçu
              </span>
            </div>
          </div>

          {/* Commentaire */}
          {review.comment && (
            <p className="text-sm text-muted-foreground leading-relaxed mb-3">
              {review.comment}
            </p>
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
