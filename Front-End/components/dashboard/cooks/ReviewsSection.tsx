"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { Star } from "lucide-react";
import { formatDate } from "@/lib/utils";

import type { Review } from "@/types";

interface ReviewWithUser extends Review {
  userName: string;
  userAvatar?: string;
}

interface ReviewsSectionProps {
  cookId: string;
  reviews: ReviewWithUser[];
}

/**
 * Section des avis clients pour un cuisinier
 */
export function ReviewsSection({ cookId, reviews }: ReviewsSectionProps) {
  if (reviews.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-card border border-border rounded-xl p-6 lg:p-8 text-center"
      >
        <p className="text-muted-foreground">
          Aucun avis pour le moment. Soyez le premier à laisser un commentaire !
        </p>
      </motion.div>
    );
  }

  // Calculer la moyenne des notes
  const averageRating =
    reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="bg-card border border-border rounded-xl p-6 lg:p-8"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-cera text-2xl font-bold text-foreground mb-2">
            Notes & Avis clients
          </h2>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
              <span className="text-lg font-semibold text-foreground">
                {averageRating.toFixed(1)}
              </span>
            </div>
            <span className="text-muted-foreground">
              ({reviews.length} avis)
            </span>
          </div>
        </div>
      </div>

      {/* Liste des avis */}
      <div className="space-y-6">
        {reviews.map((review, index) => (
          <motion.div
            key={review.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
            className="border-b border-border pb-6 last:border-0 last:pb-0"
          >
            <div className="flex items-start gap-4">
              {/* Avatar */}
              <div className="relative w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
                {review.userAvatar ? (
                  <Image
                    src={review.userAvatar}
                    alt={review.userName}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-muted flex items-center justify-center">
                    <span className="text-lg">
                      {review.userName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>

              {/* Contenu */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h4 className="font-semibold text-foreground mb-1">
                      {review.userName}
                    </h4>
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
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(review.createdAt)}
                  </span>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  {review.comment}
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

