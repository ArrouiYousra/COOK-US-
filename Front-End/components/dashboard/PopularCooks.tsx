"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Star, ChefHat, Loader2 } from "lucide-react";
import { apiClient } from "@/lib/api/client";

interface CookProfile {
  id: string;
  user_id: string;
  headline: string;
  average_rating: number | null;
  hourly_rate: number;
  user?: {
    id: string;
    first_name: string;
    last_name: string;
    avatar_url?: string;
    city?: string;
  };
}

/**
 * Section des cuisiniers populaires
 * Mini-cards avec photo, note moyenne, spécialités
 */
export function PopularCooks() {
  const [popularCooks, setPopularCooks] = useState<CookProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadPopularCooks = async () => {
      try {
        setIsLoading(true);
        // Récupérer les cuisiniers actifs, triés par note moyenne (les plus populaires)
        const response = await apiClient.getCookProfiles({
          status: "ACTIVE",
          min_rating: 4.0, // Au moins 4 étoiles
          limit: 3,
          offset: 0,
        });
        
        // Filtrer les profils qui ont bien un utilisateur (sécurité supplémentaire)
        const validCooks = response.profiles.filter((cook) => cook.user);
        setPopularCooks(validCooks);
      } catch (error: any) {
        console.error("Erreur lors du chargement des cuisiniers populaires:", error);
        // Ne pas afficher d'erreur à l'utilisateur, juste un tableau vide
        setPopularCooks([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadPopularCooks();
  }, []);

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
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : popularCooks.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            Aucun cuisinier populaire pour le moment
          </p>
        ) : (
          popularCooks.map((cook, index) => {
            const cookName = cook.user
              ? `${cook.user.first_name} ${cook.user.last_name}`
              : "Cuisinier";
            const avatarUrl = cook.user?.avatar_url;
            
            return (
              <Link
                key={cook.id}
                href={`/dashboard/client/cooks/${cook.id}`}
              >
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  whileHover={{ scale: 1.02 }}
                  className="flex items-center gap-4 p-4 rounded-lg hover:bg-accent transition-all duration-200 hover:shadow-md cursor-pointer group"
                >
                  <div className="relative w-16 h-16 rounded-full overflow-hidden flex-shrink-0 border-2 border-border group-hover:border-blue-500/50 transition-colors">
                    {avatarUrl ? (
                      <Image
                        src={avatarUrl}
                        alt={cookName}
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
                      {cookName}
                    </h3>
                    <div className="flex items-center gap-2 mb-2">
                      {cook.average_rating !== null && (
                        <>
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            <span className="text-sm font-medium text-foreground">
                              {cook.average_rating.toFixed(1)}
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {cook.headline}
                    </p>
                  </div>
                </motion.div>
              </Link>
            );
          })
        )}
      </div>
    </motion.div>
  );
}

