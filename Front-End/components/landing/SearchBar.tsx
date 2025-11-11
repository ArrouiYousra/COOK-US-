"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, ChefHat, X, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { MapboxAutocomplete } from "@/components/mapbox/MapboxAutocomplete";

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
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSpecialty, setSelectedSpecialty] = useState<string | null>(null);
  const [location, setLocation] = useState("");
  const [showSpecialties, setShowSpecialties] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const locationDropdownRef = useRef<HTMLDivElement>(null);
  const [selectedLocationDetails, setSelectedLocationDetails] =
    useState<{
      address: string;
      city?: string;
      latitude?: number;
      longitude?: number;
      placeName?: string;
      postalCode?: string;
    } | null>(null);

  // Fermer le dropdown quand on clique à l'extérieur
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowSpecialties(false);
      }
      if (
        locationDropdownRef.current &&
        !locationDropdownRef.current.contains(event.target as Node)
      ) {
        // Le composant MapboxAutocomplete gère lui-même son dropdown, rien ici
      }
    };

    if (showSpecialties) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showSpecialties]);

  const buildSearchUrl = () => {
    const params = new URLSearchParams();
    const sanitizedQuery = searchQuery.trim();
    const sanitizedLocation = location.trim();

    const resolvedLocation =
      selectedLocationDetails?.city ||
      selectedLocationDetails?.placeName ||
      selectedLocationDetails?.address ||
      sanitizedLocation;

    if (sanitizedQuery.length > 0) {
      params.set("q", sanitizedQuery);
    }
    if (selectedSpecialty) {
      params.set("specialty", selectedSpecialty);
    }
    if (resolvedLocation) {
      params.set("location", resolvedLocation);
    }
    if (
      selectedLocationDetails?.latitude !== undefined &&
      selectedLocationDetails?.longitude !== undefined
    ) {
      params.set("lat", selectedLocationDetails.latitude.toString());
      params.set("lng", selectedLocationDetails.longitude.toString());
    }

    const queryString = params.toString();
    return `/dashboard/client/cooks${queryString ? `?${queryString}` : ""}`;
  };

  const handleSubmit = (event?: FormEvent<HTMLFormElement>) => {
    event?.preventDefault();
    setShowSpecialties(false);
    setIsFocused(false);
    router.push(buildSearchUrl());
  };

  return (
    <form onSubmit={handleSubmit}>
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
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label="Effacer la recherche par nom"
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
                  type="button"
                  onClick={() => setShowSpecialties((prev) => !prev)}
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
                      type="button"
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
                        type="button"
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
            <div className="flex-1" ref={locationDropdownRef}>
              <div className="relative">
                <MapboxAutocomplete
                  value={location}
                  onChange={(value) => {
                    setLocation(value);
                    if (!value) {
                      setSelectedLocationDetails(null);
                    }
                  }}
                  onSelect={(suggestion) => {
                    setLocation(
                      suggestion.city ?? suggestion.address ?? suggestion.placeName,
                    );
                    setSelectedLocationDetails({
                      address: suggestion.address,
                      city: suggestion.city,
                      latitude: suggestion.latitude,
                      longitude: suggestion.longitude,
                      placeName: suggestion.placeName,
                      postalCode: suggestion.postalCode,
                    });
                  }}
                  placeholder="Ville ou code postal"
                  country="FR"
                  className="[&>div>input]:py-3 [&>div>input]:pr-12 [&>div>input]:rounded-lg [&>div>input]:bg-background [&>div>input]:border [&>div>input]:border-border [&>div>input]:focus:border-blue-500 [&>div>input]:focus:ring-2 [&>div>input]:focus:ring-blue-500/20 [&>div>input]:outline-none [&>div>input]:transition-all [&>div>input]:text-foreground"
                />
                {location && (
                  <button
                    type="button"
                    onClick={() => {
                      setLocation("");
                      setSelectedLocationDetails(null);
                    }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label="Effacer la localisation"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Bouton de recherche */}
            <Button
              type="submit"
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
                    type="button"
                    key={specialty}
                    onClick={() => {
                      setSelectedSpecialty(specialty);
                      setShowSpecialties(false);
                      setIsFocused(false);

                      const params = new URLSearchParams();
                      const sanitizedQuery = searchQuery.trim();
                      const resolvedLocation =
                        selectedLocationDetails?.city ||
                        selectedLocationDetails?.placeName ||
                        selectedLocationDetails?.address ||
                        location.trim();

                      if (sanitizedQuery) {
                        params.set("q", sanitizedQuery);
                      }
                      params.set("specialty", specialty);
                      if (resolvedLocation) {
                        params.set("location", resolvedLocation);
                      }
                      if (
                        selectedLocationDetails?.latitude !== undefined &&
                        selectedLocationDetails?.longitude !== undefined
                      ) {
                        params.set(
                          "lat",
                          selectedLocationDetails.latitude.toString(),
                        );
                        params.set(
                          "lng",
                          selectedLocationDetails.longitude.toString(),
                        );
                      }

                      const queryString = params.toString();
                      router.push(
                        `/dashboard/client/cooks${
                          queryString ? `?${queryString}` : ""
                        }`,
                      );
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
    </form>
  );
}

