"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Search, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CooksGrid } from "@/components/dashboard/cooks/CooksGrid";
import { CooksFilters } from "@/components/dashboard/cooks/CooksFilters";
import { useSearchParams } from "next/navigation";
import type { CookFilters } from "@/types/cookFilters";

type SortOption = "rating" | "price_asc" | "price_desc" | "distance" | "availability";

/**
 * Page "Découvrir les Cuisiniers"
 * Recherche et filtrage des cuisiniers disponibles
 */
export default function CooksPage() {
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>("rating");
  const [filters, setFilters] = useState<CookFilters>({
    location: "",
    specialties: [],
    minBudget: 0,
    maxBudget: 1000,
    minRating: 0,
    availability: [],
    coordinates: null,
  });
  const previousParamsKeyRef = useRef<string>("");

  useEffect(() => {
    const paramsKey = searchParams.toString();

    if (paramsKey === previousParamsKeyRef.current) {
      return;
    }

    previousParamsKeyRef.current = paramsKey;

    const query = searchParams.get("q") ?? "";
    const locationParam = searchParams.get("location") ?? "";
    const specialtyParam = searchParams.get("specialty");
    const latParam = searchParams.get("lat");
    const lngParam = searchParams.get("lng");

    setSearchQuery(query);
    setFilters((prev) => ({
      ...prev,
      location: locationParam,
      specialties: specialtyParam ? [specialtyParam] : [],
      coordinates:
        latParam && lngParam
          ? {
              lat: Number.parseFloat(latParam),
              lng: Number.parseFloat(lngParam),
            }
          : null,
    }));

    if (specialtyParam || locationParam || query) {
      setShowFilters(false);
    }
  }, [searchParams]);

  // Filtrer les cuisiniers selon la recherche (le filtrage réel se fait dans CooksGrid)
  const handleFiltersChange = (newFilters: CookFilters) => {
    setFilters(newFilters);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-trebuchet text-3xl lg:text-4xl font-bold text-foreground mb-2">
            Découvrir les Cuisiniers
          </h1>
          <p className="text-muted-foreground">
            Trouvez le cuisinier parfait pour votre événement
          </p>
        </div>
      </div>

      {/* Barre de recherche et filtres */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Rechercher un cuisinier, une spécialité, une ville..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button
          variant={showFilters ? "default" : "outline"}
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2"
        >
          <SlidersHorizontal className="w-4 h-4" />
          Filtres
        </Button>
      </div>

      {/* Panneau de filtres */}
      {showFilters && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="bg-card border border-border rounded-xl p-6"
        >
          <CooksFilters filters={filters} onFiltersChange={handleFiltersChange} />
        </motion.div>
      )}

      {/* Options de tri */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Trier par :</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="px-3 py-1.5 text-sm border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="rating">Note (décroissante)</option>
            <option value="price_asc">Prix (croissant)</option>
            <option value="price_desc">Prix (décroissant)</option>
            <option value="distance">Distance</option>
            <option value="availability">Disponibilité</option>
          </select>
        </div>
      </div>

      {/* Grille de cuisiniers */}
      <CooksGrid searchQuery={searchQuery} filters={filters} sortBy={sortBy} />
    </div>
  );
}
