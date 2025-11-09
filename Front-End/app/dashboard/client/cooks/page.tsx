"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Filter, MapPin, ArrowUpDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CooksFilters } from "@/components/dashboard/cooks/CooksFilters";
import { CooksGrid } from "@/components/dashboard/cooks/CooksGrid";

/**
 * Page "Cuisiniers"
 * Vue de recherche et découverte de cuisiniers
 */
type SortOption = "rating" | "price_asc" | "price_desc" | "distance" | "availability";

export default function CooksPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>("rating");
  const [filters, setFilters] = useState({
    location: "",
    specialties: [] as string[],
    minBudget: 0,
    maxBudget: 1000,
    minRating: 0,
    availability: [] as string[],
  });

  const sortOptions: Array<{ value: SortOption; label: string }> = [
    { value: "rating", label: "Note (plus haute)" },
    { value: "price_asc", label: "Prix (croissant)" },
    { value: "price_desc", label: "Prix (décroissant)" },
    { value: "distance", label: "Distance" },
    { value: "availability", label: "Disponibilité" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-trebuchet text-3xl lg:text-4xl font-bold text-foreground mb-2">
          Découvrez nos cuisiniers
        </h1>
        <p className="text-muted-foreground">
          Trouvez le chef parfait pour votre repas
        </p>
      </div>

      {/* Barre de recherche et filtres */}
      <div className="bg-card border border-border rounded-xl p-4 lg:p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Recherche */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Rechercher un cuisinier..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Bouton filtres */}
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="whitespace-nowrap"
          >
            <Filter className="w-4 h-4 mr-2" />
            Filtres
            {(filters.location ||
              filters.specialties.length > 0 ||
              filters.minBudget > 0 ||
              filters.maxBudget < 1000 ||
              filters.minRating > 0 ||
              filters.availability.length > 0) && (
              <span className="ml-2 px-2 py-0.5 rounded-full bg-blue-600 text-white text-xs">
                Actifs
              </span>
            )}
          </Button>
        </div>

        {/* Panneau de filtres */}
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 pt-4 border-t border-border"
          >
            <CooksFilters filters={filters} onFiltersChange={setFilters} />
          </motion.div>
        )}
      </div>

      {/* Tri et résultats */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {/* TODO: Afficher le nombre réel de résultats */}
            Résultats
          </p>
          <div className="flex items-center gap-2">
            <ArrowUpDown className="w-4 h-4 text-muted-foreground" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <CooksGrid searchQuery={searchQuery} filters={filters} sortBy={sortBy} />
      </div>
    </div>
  );
}

