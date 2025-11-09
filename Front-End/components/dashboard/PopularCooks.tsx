"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Star, ChefHat } from "lucide-react";
import { mockCooks } from "@/mockData";

/**
 * Section des cuisiniers populaires
 * Mini-cards avec photo, note moyenne, spécialités
 */
export function PopularCooks() {
  // Prendre les 3 premiers cuisiniers comme suggestions
  const popularCooks = mockCooks.slice(0, 3);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="bg-card border border-border rounded-xl p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-cera text-xl font-bold text-foreground">
          Cuisiniers populaires
        </h2>
        <Link
          href="/dashboard/client/cooks"
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          Voir tout
        </Link>
      </div>
      <div className="space-y-4">
        {popularCooks.map((cook, index) => (
          <motion.div
            key={cook.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
            whileHover={{ scale: 1.02 }}
            className="flex items-center gap-4 p-4 rounded-lg hover:bg-accent transition-all duration-200 hover:shadow-md cursor-pointer group"
          >
            <div className="relative w-16 h-16 rounded-full overflow-hidden flex-shrink-0 border-2 border-border group-hover:border-blue-500/50 transition-colors">
              {cook.avatarUrl ? (
                <Image
                  src={cook.avatarUrl}
                  alt={cook.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full bg-muted flex items-center justify-center">
                  <ChefHat className="w-8 h-8 text-muted-foreground" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground mb-1 truncate">
                {cook.name}
              </h3>
              <div className="flex items-center gap-2 mb-2">
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm font-medium text-foreground">
                    {cook.rating.toFixed(1)}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">
                  ({cook.reviewCount} avis)
                </span>
              </div>
              <p className="text-xs text-muted-foreground truncate">
                {cook.specialties.slice(0, 2).join(", ")}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

