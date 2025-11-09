"use client";

import { useState, useRef, useEffect } from "react";
import { Search, MapPin, ChefHat, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

const specialties = [
  "Cuisine française",
  "Cuisine italienne",
  "Cuisine asiatique",
  "Cuisine méditerranéenne",
  "Cuisine végétarienne",
  "Pâtisserie",
  "Cuisine du monde",
  "Cuisine healthy",
];

/**
 * Barre de recherche avancée
 * Recherche par : spécialité, nom du chef, localisation
 */
export function SearchBar() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSpecialty, setSelectedSpecialty] = useState<string | null>(null);
  const [location, setLocation] = useState("");
  const [showSpecialties, setShowSpecialties] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fermer le dropdown quand on clique à l'extérieur
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowSpecialties(false);
      }
    };

    if (showSpecialties) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showSpecialties]);

  const handleSearch = () => {
    // TODO: Implémenter la recherche avec les filtres
    const params = new URLSearchParams();
    if (searchQuery) params.set("q", searchQuery);
    if (selectedSpecialty) params.set("specialty", selectedSpecialty);
    if (location) params.set("location", location);
    
    window.location.href = `/cooks?${params.toString()}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.5 }}
      className="w-full max-w-5xl mx-auto"
    >
      <div className="bg-background/95 backdrop-blur-md rounded-2xl shadow-2xl border border-border p-4 lg:p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Recherche par nom de chef */}
          <div className="flex-1 relative">
            <div className="relative">
              <ChefHat className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Rechercher un chef..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                className="w-full pl-12 pr-4 py-3 rounded-lg bg-background border border-border focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-foreground"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* Spécialité */}
          <div className="relative flex-1" ref={dropdownRef}>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <button
                onClick={() => setShowSpecialties(!showSpecialties)}
                className="w-full pl-12 pr-4 py-3 rounded-lg bg-background border border-border hover:border-blue-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-left text-foreground"
              >
                {selectedSpecialty || "Toutes les spécialités"}
              </button>
            </div>

            <AnimatePresence>
              {showSpecialties && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute top-full left-0 right-0 mt-2 bg-background border border-border rounded-lg shadow-xl z-50 max-h-64 overflow-y-auto"
                >
                  <button
                    onClick={() => {
                      setSelectedSpecialty(null);
                      setShowSpecialties(false);
                    }}
                    className="w-full px-4 py-2 text-left hover:bg-accent transition-colors text-foreground"
                  >
                    Toutes les spécialités
                  </button>
                  {specialties.map((specialty) => (
                    <button
                      key={specialty}
                      onClick={() => {
                        setSelectedSpecialty(specialty);
                        setShowSpecialties(false);
                      }}
                      className={`w-full px-4 py-2 text-left hover:bg-accent transition-colors ${
                        selectedSpecialty === specialty
                          ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                          : "text-foreground"
                      }`}
                    >
                      {specialty}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Localisation */}
          <div className="flex-1 relative">
            <div className="relative">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Ville ou code postal"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-lg bg-background border border-border focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-foreground"
              />
            </div>
          </div>

          {/* Bouton de recherche */}
          <Button
            onClick={handleSearch}
            size="lg"
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 whitespace-nowrap"
          >
            <Search className="h-5 w-5 mr-2" />
            Rechercher
          </Button>
        </div>

        {/* Suggestions rapides */}
        {isFocused && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 pt-4 border-t border-border"
          >
            <p className="text-sm text-muted-foreground mb-2">Suggestions :</p>
            <div className="flex flex-wrap gap-2">
              {specialties.slice(0, 4).map((specialty) => (
                <button
                  key={specialty}
                  onClick={() => {
                    setSelectedSpecialty(specialty);
                    setShowSpecialties(false);
                  }}
                  className="px-3 py-1 text-sm rounded-full bg-accent hover:bg-accent/80 text-foreground transition-colors"
                >
                  {specialty}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

