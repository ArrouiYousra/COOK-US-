"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Heart, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { FavoritesList } from "@/components/dashboard/favorites/FavoritesList";
import { mockCooks } from "@/mockData";

/**
 * Page "Favoris"
 * Liste des chefs ou plats enregistrés en favoris
 */
export default function FavoritesPage() {
  const [searchQuery, setSearchQuery] = useState("");

  // Mock data - À remplacer par les vraies données
  // Pour l'instant, on prend les 3 premiers cuisiniers comme favoris
  const favoriteCooks = mockCooks.slice(0, 3);

  const filteredFavorites = favoriteCooks.filter((cook) =>
    cook.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cook.specialties.some((s) =>
      s.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

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
      {filteredFavorites.length === 0 ? (
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
        <FavoritesList favorites={filteredFavorites} />
      )}
    </div>
  );
}

