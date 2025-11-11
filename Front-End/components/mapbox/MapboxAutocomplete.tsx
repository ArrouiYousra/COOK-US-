"use client";

import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Loader2, MapPin, X } from "lucide-react";
import { apiClient } from "@/lib/api/client";
import { motion, AnimatePresence } from "framer-motion";

interface AddressSuggestion {
  id: string;
  placeName: string;
  address: string;
  latitude: number;
  longitude: number;
  city?: string;
  postalCode?: string;
  country?: string;
}

interface MapboxAutocompleteProps {
  value: string;
  onChange: (address: string, coordinates?: { lat: number; lng: number }) => void;
  placeholder?: string;
  className?: string;
  country?: string;
  onSelect?: (suggestion: AddressSuggestion) => void;
}

/**
 * Composant d'autocomplete d'adresses avec Mapbox
 * Style Uber-like avec suggestions en temps réel
 */
export function MapboxAutocomplete({
  value,
  onChange,
  placeholder = "Rechercher une adresse...",
  className = "",
  country,
  onSelect,
}: MapboxAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // Recherche d'adresses avec debounce
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (!value || value.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setIsLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const response = await apiClient.searchAddresses(value, country);
        setSuggestions(response.suggestions || []);
        setShowSuggestions(true);
      } catch (error) {
        console.error("Erreur lors de la recherche d'adresses:", error);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [value, country]);

  const handleSelect = (suggestion: AddressSuggestion) => {
    onChange(suggestion.placeName, {
      lat: suggestion.latitude,
      lng: suggestion.longitude,
    });
    setShowSuggestions(false);
    setSelectedIndex(-1);
    if (onSelect) {
      onSelect(suggestion);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev < suggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === "Enter" && selectedIndex >= 0) {
      e.preventDefault();
      handleSelect(suggestions[selectedIndex]);
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  };

  // Scroll vers la suggestion sélectionnée
  useEffect(() => {
    if (selectedIndex >= 0 && suggestionsRef.current) {
      const selectedElement = suggestionsRef.current.children[selectedIndex] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: "nearest", behavior: "smooth" });
      }
    }
  }, [selectedIndex]);

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => {
            if (suggestions.length > 0) {
              setShowSuggestions(true);
            }
          }}
          onBlur={() => {
            // Délai pour permettre le clic sur une suggestion
            setTimeout(() => setShowSuggestions(false), 200);
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={`pl-10 ${value ? "pr-10" : ""}`}
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground animate-spin" />
        )}
        {value && !isLoading && (
          <button
            type="button"
            onClick={() => {
              onChange("");
              setSuggestions([]);
              setShowSuggestions(false);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Suggestions */}
      <AnimatePresence>
        {showSuggestions && suggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            ref={suggestionsRef}
            className="absolute z-50 w-full mt-2 bg-card border border-border rounded-lg shadow-lg max-h-64 overflow-y-auto"
          >
            {suggestions.map((suggestion, index) => (
              <button
                key={suggestion.id}
                type="button"
                onClick={() => handleSelect(suggestion)}
                onMouseEnter={() => setSelectedIndex(index)}
                className={`
                  w-full px-4 py-3 text-left hover:bg-accent transition-colors
                  ${selectedIndex === index ? "bg-accent" : ""}
                  ${index !== suggestions.length - 1 ? "border-b border-border" : ""}
                `}
              >
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">
                      {suggestion.address}
                    </p>
                    <p className="text-sm text-muted-foreground truncate">
                      {suggestion.placeName}
                    </p>
                    {suggestion.city && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {suggestion.city}
                        {suggestion.postalCode && `, ${suggestion.postalCode}`}
                      </p>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}



