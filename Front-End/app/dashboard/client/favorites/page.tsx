"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Heart, Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { FavoritesList } from "@/components/dashboard/favorites/FavoritesList";
import { apiClient } from "@/lib/api/client";
import { useAuthStore } from "@/stores/authStore";

/**
 * Page "Favoris"
 * Liste des chefs ou plats enregistrés en favoris
 */
export default function FavoritesPage() {
  const router = useRouter();
  const { isAuthenticated, checkAuth, isLoading: isAuthLoading } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [favorites, setFavorites] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Vérifier l'authentification au montage
  useEffect(() => {
    const verifyAuth = async () => {
      if (!isAuthenticated) {
        try {
          await checkAuth();
        } catch (error) {
          // Si l'authentification échoue, rediriger vers la page de connexion
          console.warn("Authentification échouée, redirection vers la page de connexion");
          router.push("/auth/login");
        }
      }
    };

    // Ne vérifier que si on n'est pas déjà en train de charger
    if (!isAuthLoading) {
      verifyAuth();
    }
  }, [isAuthenticated, checkAuth, router, isAuthLoading]);

  // Charger les favoris depuis l'API
  useEffect(() => {
    const loadFavorites = async () => {
      // Attendre que l'authentification soit vérifiée
      if (isAuthLoading) return;
      if (!isAuthenticated) return;

      setIsLoading(true);
      setError(null);
      try {
        const data = await apiClient.getFavorites();
        
        // Enrichir avec les profils complets des cuisiniers pour obtenir plus de données
        const cookIds = data.favorites
          .filter((fav: any) => fav.cook !== null)
          .map((fav: any) => fav.cook?.profile_id || fav.cook_profile_id)
          .filter((id: string) => id);

        let enrichedCooksMap = new Map();
        if (cookIds.length > 0) {
          try {
            const cookProfiles = await apiClient.getCookProfiles({ limit: 1000 });
            cookProfiles.profiles.forEach((profile: any) => {
              const id = profile.id;
              if (id) enrichedCooksMap.set(id, profile);
            });
          } catch (error) {
            console.warn("Impossible de charger les profils complets des cuisiniers:", error);
          }
        }

        // Transformer les favoris pour correspondre au format attendu
        const transformedFavorites = data.favorites
          .filter((fav: any) => fav.cook !== null) // Filtrer les favoris sans cuisinier
          .map((fav: any) => {
            const cook = fav.cook;
            const cookName = cook.first_name && cook.last_name
              ? `${cook.first_name} ${cook.last_name}`
              : cook.first_name || "Cuisinier";

            // Récupérer le profil enrichi si disponible
            const enrichedProfile = enrichedCooksMap.get(fav.cook_profile_id || cook.profile_id);
            
            // Extraire les spécialités depuis le headline ou le bio
            const specialties: string[] = [];
            if (cook.headline) {
              // Le headline peut contenir plusieurs spécialités séparées par des virgules
              specialties.push(...cook.headline.split(',').map((s: string) => s.trim()).filter(Boolean));
            }
            if (enrichedProfile?.user?.headline && !specialties.includes(enrichedProfile.user.headline)) {
              specialties.push(enrichedProfile.user.headline);
            }

            return {
              id: fav.cook_profile_id || fav.cook?.profile_id,
              cookId: fav.cook?.user_id || fav.cook_profile_id,
              name: cookName,
              avatarUrl: cook.avatar_url,
              rating: cook.average_rating || enrichedProfile?.average_rating || 0,
              reviewCount: enrichedProfile?.review_count || 0,
              specialties: specialties.length > 0 ? specialties : ["Cuisine variée"],
              location: {
                city: cook.city || enrichedProfile?.user?.city || "Ville non spécifiée",
              },
              pricePerPerson: cook.hourly_rate || enrichedProfile?.hourly_rate || 0,
              favoriteId: fav.id, // ID du favori pour la suppression
            };
          });

        setFavorites(transformedFavorites);
      } catch (err: any) {
        console.error("Erreur lors du chargement des favoris:", err);
        
        // Si l'erreur est 401 (Unauthorized), l'utilisateur n'est pas authentifié
        if (err.response?.status === 401 || err.message?.includes("Jeton d'authentification manquant")) {
          console.warn("Utilisateur non authentifié, redirection vers la page de connexion");
          // Rediriger directement vers la page de connexion
          router.push("/auth/login");
          return;
        }
        
        setError(err.response?.data?.message || "Impossible de charger les favoris");
        setFavorites([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadFavorites();
  }, [isAuthenticated, isAuthLoading, checkAuth, router]);

  // Filtrer les favoris selon la recherche
  const filteredFavorites = useMemo(() => {
    if (!searchQuery.trim()) return favorites;
    
    const query = searchQuery.toLowerCase();
    return favorites.filter((cook) =>
      cook.name.toLowerCase().includes(query) ||
      cook.specialties.some((s: string) =>
        s.toLowerCase().includes(query)
      ) ||
      cook.location.city.toLowerCase().includes(query)
    );
  }, [favorites, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-trebuchet text-3xl lg:text-4xl font-bold text-foreground mb-2">
            Mes Favoris
          </h1>
          <p className="text-muted-foreground">
            Gérez vos chefs et plats favoris
          </p>
        </div>
      </div>

      {/* Barre de recherche */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Rechercher un chef ou une spécialité..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Liste des favoris */}
      {isAuthLoading || isLoading ? (
        <div className="flex items-center justify-center py-16 bg-card border border-border rounded-xl">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : !isAuthenticated ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-16 bg-card border border-border rounded-xl"
        >
          <p className="text-muted-foreground mb-4">Veuillez vous connecter pour voir vos favoris</p>
        </motion.div>
      ) : error ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-16 bg-card border border-border rounded-xl"
        >
          <p className="text-destructive mb-4">{error}</p>
        </motion.div>
      ) : filteredFavorites.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-16 bg-card border border-border rounded-xl"
        >
          <Heart className="w-16 h-16 text-muted-foreground mb-4" />
          <p className="text-lg font-semibold text-foreground mb-2">
            {searchQuery ? "Aucun résultat" : "Aucun favori"}
          </p>
          <p className="text-sm text-muted-foreground text-center max-w-md">
            {searchQuery
              ? "Essayez avec d'autres mots-clés"
              : "Ajoutez des chefs à vos favoris pour les retrouver facilement"}
          </p>
        </motion.div>
      ) : (
        <FavoritesList 
          favorites={filteredFavorites} 
          onFavoriteRemoved={async () => {
            // Recharger les favoris après suppression
            try {
              const data = await apiClient.getFavorites();
              
              // Enrichir avec les profils complets
              const cookIds = data.favorites
                .filter((fav: any) => fav.cook !== null)
                .map((fav: any) => fav.cook?.profile_id || fav.cook_profile_id)
                .filter((id: string) => id);

              let enrichedCooksMap = new Map();
              if (cookIds.length > 0) {
                try {
                  const cookProfiles = await apiClient.getCookProfiles({ limit: 1000 });
                  cookProfiles.profiles.forEach((profile: any) => {
                    const id = profile.id;
                    if (id) enrichedCooksMap.set(id, profile);
                  });
                } catch (error) {
                  console.warn("Impossible de charger les profils complets:", error);
                }
              }

              const transformedFavorites = data.favorites
                .filter((fav: any) => fav.cook !== null)
                .map((fav: any) => {
                  const cook = fav.cook;
                  const cookName = cook.first_name && cook.last_name
                    ? `${cook.first_name} ${cook.last_name}`
                    : cook.first_name || "Cuisinier";

                  const enrichedProfile = enrichedCooksMap.get(fav.cook_profile_id || cook.profile_id);
                  
                  const specialties: string[] = [];
                  if (cook.headline) {
                    specialties.push(...cook.headline.split(',').map((s: string) => s.trim()).filter(Boolean));
                  }
                  if (enrichedProfile?.user?.headline && !specialties.includes(enrichedProfile.user.headline)) {
                    specialties.push(enrichedProfile.user.headline);
                  }

                  return {
                    id: fav.cook_profile_id || fav.cook?.profile_id,
                    cookId: fav.cook?.user_id || fav.cook_profile_id,
                    name: cookName,
                    avatarUrl: cook.avatar_url,
                    rating: cook.average_rating || enrichedProfile?.average_rating || 0,
                    reviewCount: enrichedProfile?.review_count || 0,
                    specialties: specialties.length > 0 ? specialties : ["Cuisine variée"],
                    location: {
                      city: cook.city || enrichedProfile?.user?.city || "Ville non spécifiée",
                    },
                    pricePerPerson: cook.hourly_rate || enrichedProfile?.hourly_rate || 0,
                    favoriteId: fav.id,
                  };
                });
              setFavorites(transformedFavorites);
            } catch (err) {
              console.error("Erreur lors du rechargement des favoris:", err);
            }
          }} 
        />
      )}
    </div>
  );
}
