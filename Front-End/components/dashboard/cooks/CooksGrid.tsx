"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { Star, Heart, MapPin, Euro, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { mockCooks } from "@/mockData";

type SortOption = "rating" | "price_asc" | "price_desc" | "distance" | "availability";

interface CooksGridProps {
  searchQuery: string;
  filters: {
    location: string;
    specialties: string[];
    minBudget: number;
    maxBudget: number;
    minRating: number;
    availability: string[];
  };
  sortBy?: SortOption;
}

/**
 * Grille de cartes de cuisiniers
 * Affiche les résultats filtrés et recherchés
 */
export function CooksGrid({ searchQuery, filters, sortBy = "rating" }: CooksGridProps) {
  // Filtrage et tri des cuisiniers
  const filteredAndSortedCooks = useMemo(() => {
    let filtered = mockCooks.filter((cook) => {
      // Recherche par nom
      if (
        searchQuery &&
        !cook.name.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        return false;
      }

      // Filtre par spécialités
      if (
        filters.specialties.length > 0 &&
        !filters.specialties.some((s) => cook.specialties.includes(s))
      ) {
        return false;
      }

      // Filtre par budget
      if (
        cook.pricePerPerson < filters.minBudget ||
        cook.pricePerPerson > filters.maxBudget
      ) {
        return false;
      }

      // Filtre par note
      if (cook.rating < filters.minRating) {
        return false;
      }

      return true;
    });

    // Tri des résultats
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "rating":
          return b.rating - a.rating;
        case "price_asc":
          return a.pricePerPerson - b.pricePerPerson;
        case "price_desc":
          return b.pricePerPerson - a.pricePerPerson;
        case "distance":
          // TODO: Calculer la distance réelle
          return 0;
        case "availability":
          // TODO: Trier par disponibilité
          return 0;
        default:
          return 0;
      }
    });

    return filtered;
  }, [searchQuery, filters, sortBy]);

  if (filteredAndSortedCooks.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">
          Aucun cuisinier ne correspond à vos critères.
        </p>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Réinitialiser les filtres
        </Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {filteredAndSortedCooks.map((cook, index) => (
        <CookCard key={cook.id} cook={cook} index={index} />
      ))}
    </div>
  );
}

interface CookCardProps {
  cook: typeof mockCooks[0];
  index: number;
}

function CookCard({ cook, index }: CookCardProps) {
  const [isFavorite, setIsFavorite] = useState(false);

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
        {cook.avatarUrl ? (
          <Image
            src={cook.avatarUrl}
            alt={cook.name}
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
          onClick={() => setIsFavorite(!isFavorite)}
          className="absolute top-4 right-4 p-2 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background transition-colors"
          aria-label="Ajouter aux favoris"
        >
          <Heart
            className={`w-5 h-5 ${
              isFavorite
                ? "fill-red-500 text-red-500"
                : "text-muted-foreground"
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
              {cook.name}
            </h3>
            <div className="flex items-center gap-2">
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
          </div>
        </div>

        {/* Spécialités */}
        <div className="flex flex-wrap gap-2 mb-4">
          {cook.specialties.slice(0, 2).map((specialty, idx) => (
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
          {cook.specialties.length > 2 && (
            <span className="px-2 py-1 text-xs rounded-full bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 font-medium">
              +{cook.specialties.length - 2}
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
              {cook.pricePerPerson} €
            </span>{" "}
            / personne
          </span>
        </div>

        {/* Localisation */}
        <div className="flex items-center gap-2 mb-4 text-sm text-muted-foreground">
          <div className="w-8 h-8 rounded-lg bg-pink-500/10 dark:bg-pink-500/20 flex items-center justify-center">
            <MapPin className="w-4 h-4 text-pink-600 dark:text-pink-400" />
          </div>
          <span>{cook.location.city}</span>
        </div>

        {/* Disponibilités */}
        <div className="flex items-center gap-2 mb-4 text-sm text-muted-foreground">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 dark:bg-indigo-500/20 flex items-center justify-center">
            <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          </div>
          <span>Disponible cette semaine</span>
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

