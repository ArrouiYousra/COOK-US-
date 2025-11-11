"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { Star, Heart, MapPin, Euro, Calendar, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { apiClient } from "@/lib/api/client";
import type { CookFilters } from "@/types/cookFilters";

type SortOption = "rating" | "price_asc" | "price_desc" | "distance" | "availability";

interface CooksGridProps {
  searchQuery: string;
  filters: CookFilters;
  sortBy?: SortOption;
}

interface CookProfile {
  id: string;
  user: {
    id: string;
    first_name: string;
    last_name: string;
    avatar_url: string | null;
    city: string | null;
  };
  headline: string | null;
  hourly_rate: number;
  average_rating: number | null;
  review_count: number | null;
  specialties?: string[];
  is_available?: boolean;
}

/**
 * Grille de cartes de cuisiniers
 * Affiche les résultats filtrés et recherchés depuis l'API
 */
export function CooksGrid({ searchQuery, filters, sortBy = "rating" }: CooksGridProps) {
  const [cooks, setCooks] = useState<CookProfile[]>([]);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(0);
  const [userCoordinates, setUserCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const limit = 12;

  // Charger les cuisiniers depuis l'API
  useEffect(() => {
    const loadCooks = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Préparer les paramètres de l'API
        const apiParams: {
          status?: string;
          city?: string;
          min_rating?: number;
          max_hourly_rate?: number;
          limit?: number;
          offset?: number;
        } = {
          status: "ACTIVE",
          limit,
          offset: page * limit,
        };

        // Appliquer les filtres
        if (filters.location) {
          apiParams.city = filters.location;
        }
        if (filters.minRating > 0) {
          apiParams.min_rating = filters.minRating;
        }
        if (filters.maxBudget < 1000) {
          apiParams.max_hourly_rate = filters.maxBudget;
        }

        console.log("Chargement des cuisiniers avec les paramètres:", apiParams);
        const response = await apiClient.getCookProfiles(apiParams);
        console.log("Réponse de l'API getCookProfiles:", response);

        // Vérifier que la réponse contient bien des profils
        if (!response || !Array.isArray(response.profiles)) {
          console.error("Réponse invalide de l'API:", response);
          throw new Error("Réponse invalide de l'API");
        }

        console.log(`Nombre de cuisiniers reçus: ${response.profiles.length}, Total: ${response.count}`);

        // Charger les favoris pour tous les cuisiniers (seulement si l'utilisateur est authentifié)
        const favoritesSet = new Set<string>();
        try {
          const favoritesPromises = response.profiles.map((cook) =>
            apiClient.checkFavorite(cook.id).catch(() => ({ isFavorite: false }))
          );
          const favoritesResults = await Promise.all(favoritesPromises);
          response.profiles.forEach((cook, index) => {
            if (favoritesResults[index]?.isFavorite) {
              favoritesSet.add(cook.id);
            }
          });
        } catch (error) {
          // Si l'utilisateur n'est pas authentifié, on continue sans les favoris
          console.warn("Impossible de charger les favoris:", error);
        }

        setCooks(response.profiles);
        setFavorites(favoritesSet);
        setCount(response.count || 0);
      } catch (err: any) {
        console.error("Erreur lors du chargement des cuisiniers:", err);
        console.error("Détails de l'erreur:", {
          message: err?.message,
          response: err?.response?.data,
          status: err?.response?.status,
        });
        const errorMessage = err?.response?.data?.message || err?.message || "Impossible de charger les cuisiniers. Veuillez réessayer.";
        setError(errorMessage);
        setCooks([]);
        setCount(0);
      } finally {
        setIsLoading(false);
      }
    };

    loadCooks();
  }, [filters.location, filters.minRating, filters.maxBudget, page]);

  // Filtrer et trier côté client (pour la recherche par nom et spécialités)
  useEffect(() => {
    if (filters.coordinates) {
      setUserCoordinates(filters.coordinates);
      return;
    }
    if (!navigator.geolocation) {
      setUserCoordinates(null);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserCoordinates({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      () => {
        setUserCoordinates(null);
      },
      {
        enableHighAccuracy: false,
        timeout: 5000,
        maximumAge: 0,
      },
    );
  }, [filters.coordinates]);

  const filteredAndSortedCooks = useMemo(() => {
    let filtered = [...cooks];

    const query = searchQuery.trim().toLowerCase();
    if (query.length > 0) {
      filtered = filtered.filter((cook) => {
        const firstName = cook.user.first_name?.toLowerCase() ?? "";
        const lastName = cook.user.last_name?.toLowerCase() ?? "";
        const fullName = `${firstName} ${lastName}`.trim();
        const headline = cook.headline?.toLowerCase() ?? "";
        const city = cook.user.city?.toLowerCase() ?? "";
        const specialties = (cook.specialties ?? []).map((spec) =>
          spec.toLowerCase(),
        );

        return (
          firstName.includes(query) ||
          lastName.includes(query) ||
          fullName.includes(query) ||
          headline.includes(query) ||
          city.includes(query) ||
          specialties.some((spec) => spec.includes(query))
        );
      });
    }

    if (filters.specialties.length > 0) {
      const selectedSpecialties = filters.specialties.map((spec) =>
        spec.toLowerCase(),
      );
      filtered = filtered.filter((cook) => {
        const cookSpecialties = (cook.specialties ?? []).map((spec) =>
          spec.toLowerCase(),
        );
        if (cookSpecialties.length === 0) {
          return false;
        }
        return selectedSpecialties.every((selected) =>
          cookSpecialties.some((spec) => spec.includes(selected)),
        );
      });
    }

    if (filters.minBudget > 0) {
      filtered = filtered.filter(
        (cook) => cook.hourly_rate >= filters.minBudget,
      );
    }

    if (filters.maxBudget < 1000) {
      filtered = filtered.filter(
        (cook) => cook.hourly_rate <= filters.maxBudget,
      );
    }

    const getDistanceScore = (
      cook: CookProfile,
      userCoords: { lat: number; lng: number } | null,
    ) => {
      if (!userCoords) {
        return cook.user.city ? 0 : Number.MAX_SAFE_INTEGER;
      }
      const homeCoords = filters.coordinates ?? userCoords;
      const dLat = ((cook as any).latitude ?? 0) - homeCoords.lat;
      const dLng = ((cook as any).longitude ?? 0) - homeCoords.lng;
      return Math.sqrt(dLat * dLat + dLng * dLng);
    };

    filtered.sort((a, b) => {
      switch (sortBy) {
        case "rating":
          return (b.average_rating || 0) - (a.average_rating || 0);
        case "price_asc":
          return a.hourly_rate - b.hourly_rate;
        case "price_desc":
          return b.hourly_rate - a.hourly_rate;
        case "distance":
          return (
            getDistanceScore(a, userCoordinates) -
            getDistanceScore(b, userCoordinates)
          );
        case "availability":
          if (a.is_available && !b.is_available) return -1;
          if (!a.is_available && b.is_available) return 1;
          return 0;
        default:
          return 0;
      }
    });

    return filtered;
  }, [
    cooks,
    searchQuery,
    filters.specialties,
    filters.minBudget,
    filters.maxBudget,
    sortBy,
  ]);

  const handleToggleFavorite = async (cookId: string, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    const isCurrentlyFavorite = favorites.has(cookId);
    const newFavorites = new Set(favorites);

    // Optimistic update
    if (isCurrentlyFavorite) {
      newFavorites.delete(cookId);
    } else {
      newFavorites.add(cookId);
    }
    setFavorites(newFavorites);

    try {
      if (isCurrentlyFavorite) {
        await apiClient.removeFavorite(cookId);
      } else {
        await apiClient.addFavorite(cookId);
      }
    } catch (error: any) {
      // Revert on error
      setFavorites(favorites);
      console.error("Erreur lors de la mise à jour des favoris:", error);
      
      // Vérifier si c'est une erreur d'authentification
      if (error?.message?.includes("Unauthorized") || error?.message?.includes("authenticated")) {
        alert("Vous devez être connecté pour ajouter des favoris.");
      } else {
        alert("Impossible de mettre à jour les favoris. Veuillez réessayer.");
      }
    }
  };

  if (isLoading && page === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive mb-4">{error}</p>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Réessayer
        </Button>
      </div>
    );
  }

  if (filteredAndSortedCooks.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">
          {searchQuery || filters.location || filters.minRating > 0 || filters.maxBudget < 1000
            ? "Aucun cuisinier ne correspond à vos critères."
            : cooks.length === 0
            ? "Aucun cuisinier disponible pour le moment. Veuillez réessayer plus tard."
            : "Aucun cuisinier ne correspond à votre recherche."}
        </p>
        {cooks.length === 0 && (
          <div className="mt-4">
            <Button variant="outline" onClick={() => window.location.reload()}>
              Actualiser
            </Button>
          </div>
        )}
        {(searchQuery || filters.location || filters.minRating > 0 || filters.maxBudget < 1000) && (
          <Button variant="outline" onClick={() => window.location.reload()}>
            Réinitialiser les filtres
          </Button>
        )}
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAndSortedCooks.map((cook, index) => (
          <CookCard
            key={cook.id}
            cook={cook}
            index={index}
            isFavorite={favorites.has(cook.id)}
            onToggleFavorite={handleToggleFavorite}
          />
        ))}
      </div>

      {/* Pagination */}
      {count > limit && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <Button
            variant="outline"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0 || isLoading}
          >
            Précédent
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page + 1} sur {Math.ceil(count / limit)}
          </span>
          <Button
            variant="outline"
            onClick={() => setPage((p) => p + 1)}
            disabled={page >= Math.ceil(count / limit) - 1 || isLoading}
          >
            Suivant
          </Button>
        </div>
      )}
    </>
  );
}

interface CookCardProps {
  cook: CookProfile;
  index: number;
  isFavorite: boolean;
  onToggleFavorite: (cookId: string, event: React.MouseEvent) => void;
}

function CookCard({ cook, index, isFavorite, onToggleFavorite }: CookCardProps) {
  const fullName = `${cook.user.first_name} ${cook.user.last_name}`;
  const rating = cook.average_rating || 0;
  const reviewCount = cook.review_count || 0;
  const city = cook.user.city || "Ville non renseignée";
  const specialties = cook.specialties || ["Cuisine variée"];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      whileHover={{ y: -4 }}
      className="bg-card border border-border rounded-xl overflow-hidden hover:shadow-lg transition-shadow"
    >
      {/* Photo */}
      <div className="relative w-full h-64">
        {cook.user.avatar_url ? (
          <Image
            src={cook.user.avatar_url}
            alt={fullName}
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center">
            <span className="text-4xl">👨‍🍳</span>
          </div>
        )}
        {/* Badge favori */}
        <button
          onClick={(e) => onToggleFavorite(cook.id, e)}
          className="absolute top-4 right-4 p-2 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background transition-colors z-10"
          aria-label={isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
        >
          <Heart
            className={`w-5 h-5 transition-colors ${
              isFavorite
                ? "fill-red-500 text-red-500"
                : "text-muted-foreground hover:text-red-500"
            }`}
          />
        </button>
      </div>

      {/* Contenu */}
      <div className="p-6">
        {/* Nom et note */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="font-cera text-xl font-bold text-foreground mb-1">
              {fullName}
            </h3>
            <div className="flex items-center gap-2">
              {rating > 0 ? (
                <>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm font-medium text-foreground">
                      {rating.toFixed(1)}
                    </span>
                  </div>
                  {reviewCount > 0 && (
                    <span className="text-xs text-muted-foreground">
                      ({reviewCount} avis)
                    </span>
                  )}
                </>
              ) : (
                <span className="text-xs text-muted-foreground">Aucun avis</span>
              )}
            </div>
          </div>
        </div>

        {/* Headline */}
        {cook.headline && (
          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
            {cook.headline}
          </p>
        )}

        {/* Spécialités */}
        <div className="flex flex-wrap gap-2 mb-4">
          {specialties.slice(0, 2).map((specialty, idx) => (
            <span
              key={specialty}
              className={cn(
                "px-2 py-1 text-xs rounded-full font-medium",
                idx === 0
                  ? "bg-orange-500/10 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400"
                  : "bg-purple-500/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400"
              )}
            >
              {specialty}
            </span>
          ))}
          {specialties.length > 2 && (
            <span className="px-2 py-1 text-xs rounded-full bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 font-medium">
              +{specialties.length - 2}
            </span>
          )}
        </div>

        {/* Tarif */}
        <div className="flex items-center gap-2 mb-4 text-sm text-muted-foreground">
          <div className="w-8 h-8 rounded-lg bg-green-500/10 dark:bg-green-500/20 flex items-center justify-center">
            <Euro className="w-4 h-4 text-green-600 dark:text-green-400" />
          </div>
          <span>
            <span className="font-semibold text-foreground">
              {cook.hourly_rate} €
            </span>{" "}
            / heure
          </span>
        </div>

        {/* Localisation */}
        <div className="flex items-center gap-2 mb-4 text-sm text-muted-foreground">
          <div className="w-8 h-8 rounded-lg bg-pink-500/10 dark:bg-pink-500/20 flex items-center justify-center">
            <MapPin className="w-4 h-4 text-pink-600 dark:text-pink-400" />
          </div>
          <span>{city}</span>
        </div>

        {/* Disponibilités */}
        <div className="flex items-center gap-2 mb-4 text-sm text-muted-foreground">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 dark:bg-indigo-500/20 flex items-center justify-center">
            <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          </div>
          <span>
            {cook.is_available !== false ? "Disponible" : "Indisponible"}
          </span>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-4 border-t border-border">
          <Button
            asChild
            variant="outline"
            className="flex-1"
          >
            <Link href={`/dashboard/client/cooks/${cook.id}`}>
              Voir profil
            </Link>
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
