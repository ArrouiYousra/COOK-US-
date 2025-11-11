"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  ChefHat,
  FileText,
  MessageSquare,
  Calendar,
  X,
  Loader2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { apiClient } from "@/lib/api/client";

interface SearchResult {
  id: string;
  type: "cook" | "request" | "message" | "booking";
  title: string;
  subtitle?: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

/**
 * Recherche globale dans le dashboard
 * Recherche dans : cuisiniers, demandes, messages, réservations
 */
export function GlobalSearch() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Fermer le dropdown si on clique en dehors
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Recherche en temps réel
  useEffect(() => {
    if (!searchQuery.trim()) {
      // Utiliser un callback pour éviter setState synchrone
      setTimeout(() => {
        setResults([]);
        setIsOpen(false);
      }, 0);
      return;
    }

    setIsLoading(true);
    setIsOpen(true);

    // Recherche avec l'API
    const timeoutId = setTimeout(async () => {
      const query = searchQuery.toLowerCase().trim();
      const foundResults: SearchResult[] = [];

      try {
        // Recherche dans les cuisiniers via l'API
        const response = await apiClient.getCookProfiles({
          limit: 20, // Récupérer plus de résultats pour filtrer côté client
        });

        if (response.profiles && Array.isArray(response.profiles)) {
          // Filtrer les résultats côté client selon la requête
          const filteredCooks = response.profiles.filter((cook: any) => {
            if (!cook.user) return false;
            const cookName = `${cook.user.first_name || ""} ${cook.user.last_name || ""}`.toLowerCase().trim();
            const location = (cook.user.city || "").toLowerCase();
            const headline = (cook.headline || "").toLowerCase();
            const specialties = (cook.specialties || []).map((s: string) => s.toLowerCase());
            
            return (
              cookName.includes(query) ||
              location.includes(query) ||
              headline.includes(query) ||
              specialties.some((s: string) => s.includes(query))
            );
          }).slice(0, 5); // Limiter à 5 résultats

          filteredCooks.forEach((cook: any) => {
            const cookName = `${cook.user.first_name || ""} ${cook.user.last_name || ""}`.trim();
            const specialties = cook.specialties || [];
            const location = cook.user.city || "";

            foundResults.push({
              id: cook.id,
              type: "cook",
              title: cookName || "Cuisinier",
              subtitle: specialties.length > 0 
                ? `${specialties.join(", ")}${location ? ` • ${location}` : ""}`
                : location || "",
              href: `/dashboard/client/cooks/${cook.id}`,
              icon: ChefHat,
            });
          });
        }
      } catch (error) {
        console.error("Erreur lors de la recherche de cuisiniers:", error);
        // En cas d'erreur, on continue sans résultats pour cette catégorie
      }

      // TODO: Recherche dans les demandes (à implémenter avec l'API)
      // TODO: Recherche dans les messages (à implémenter avec l'API)
      // TODO: Recherche dans les réservations (à implémenter avec l'API)

      setResults(foundResults);
      setIsLoading(false);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const handleSelectResult = (result: SearchResult) => {
    router.push(result.href);
    setSearchQuery("");
    setIsOpen(false);
  };

  const clearSearch = () => {
    setSearchQuery("");
    setIsOpen(false);
  };

  return (
    <div ref={searchRef} className="flex-1 max-w-md mr-4 relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Rechercher un cuisinier, une demande..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => searchQuery.trim() && setIsOpen(true)}
          className="pl-10 pr-10 bg-background"
        />
        {searchQuery && (
          <button
            onClick={clearSearch}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Dropdown de résultats */}
      <AnimatePresence>
        {isOpen && (searchQuery.trim() || results.length > 0) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto"
          >
            {isLoading ? (
              <div className="p-4 flex items-center justify-center">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : results.length > 0 ? (
              <div className="p-2">
                {results.map((result) => {
                  const Icon = result.icon;
                  return (
                    <button
                      key={`${result.type}-${result.id}`}
                      onClick={() => handleSelectResult(result)}
                      className={cn(
                        "w-full flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors text-left",
                        "group"
                      )}
                    >
                      <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center flex-shrink-0 group-hover:bg-blue-500/10 dark:group-hover:bg-blue-500/20 transition-colors">
                        <Icon className="w-5 h-5 text-muted-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate">
                          {result.title}
                        </p>
                        {result.subtitle && (
                          <p className="text-sm text-muted-foreground truncate">
                            {result.subtitle}
                          </p>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="p-4 text-center text-muted-foreground text-sm">
                Aucun résultat trouvé
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

