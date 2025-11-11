"use client";

import { useState, useEffect } from "react";
import { X, Save, Bookmark, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  getSavedFilters,
  saveFilter,
  deleteFilter,
  type SavedFilter,
} from "@/lib/api/filters";
import type { CookFilters } from "@/types/cookFilters";

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

interface CooksFiltersProps {
  filters: CookFilters;
  onFiltersChange: (filters: CookFilters) => void;
}

/**
 * Composant de filtres avancés pour la recherche de cuisiniers
 */
export function CooksFilters({ filters, onFiltersChange }: CooksFiltersProps) {
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([]);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [filterName, setFilterName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Charger les filtres sauvegardés depuis l'API
  useEffect(() => {
    const loadSavedFilters = async () => {
      setIsLoading(true);
      try {
        const filters = await getSavedFilters();
        setSavedFilters(filters);
      } catch (error) {
        console.error("Erreur lors du chargement des filtres sauvegardés:", error);
        // En cas d'erreur, on continue sans les filtres sauvegardés
      } finally {
        setIsLoading(false);
      }
    };

    loadSavedFilters();
  }, []);

  const toggleSpecialty = (specialty: string) => {
    const newSpecialties = filters.specialties.includes(specialty)
      ? filters.specialties.filter((s) => s !== specialty)
      : [...filters.specialties, specialty];
    onFiltersChange({ ...filters, specialties: newSpecialties });
  };

  const clearFilters = () => {
    onFiltersChange({
      location: "",
      specialties: [],
      minBudget: 0,
      maxBudget: 1000,
      minRating: 0,
      availability: [],
      coordinates: null,
    });
  };

  const saveCurrentFilters = async () => {
    if (!filterName.trim()) return;
    
    setIsSaving(true);
    try {
      const { coordinates, ...filtersToSave } = filters;
      const newSavedFilter = await saveFilter({
        name: filterName.trim(),
        filters: { ...filtersToSave },
      });
      
      setSavedFilters([...savedFilters, newSavedFilter]);
      setFilterName("");
      setShowSaveDialog(false);
    } catch (error) {
      console.error("Erreur lors de la sauvegarde du filtre:", error);
      alert("Erreur lors de la sauvegarde du filtre. Veuillez réessayer.");
    } finally {
      setIsSaving(false);
    }
  };

  const loadSavedFilter = (savedFilter: SavedFilter) => {
    onFiltersChange({
      ...savedFilter.filters,
      coordinates: null,
    });
  };

  const deleteSavedFilter = async (filterId: string) => {
    try {
      await deleteFilter(filterId);
      setSavedFilters(savedFilters.filter((f) => f.id !== filterId));
    } catch (error) {
      console.error("Erreur lors de la suppression du filtre:", error);
      alert("Erreur lors de la suppression du filtre. Veuillez réessayer.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Localisation */}
      <div>
        <Label className="text-foreground mb-2 block">Localisation</Label>
        <Input
          type="text"
          placeholder="Ville ou code postal"
          value={filters.location}
          onChange={(e) =>
            onFiltersChange({
              ...filters,
              location: e.target.value,
              coordinates: null,
            })
          }
        />
      </div>

      {/* Spécialités */}
      <div>
        <Label className="text-foreground mb-2 block">Spécialités culinaires</Label>
        <div className="flex flex-wrap gap-2">
          {specialties.map((specialty) => (
            <button
              key={specialty}
              onClick={() => toggleSpecialty(specialty)}
              className={`
                px-4 py-2 rounded-full text-sm transition-colors
                ${
                  filters.specialties.includes(specialty)
                    ? "bg-blue-600 text-white"
                    : "bg-accent text-foreground hover:bg-accent/80"
                }
              `}
            >
              {specialty}
            </button>
          ))}
        </div>
      </div>

      {/* Budget */}
      <div>
        <Label className="text-foreground mb-2 block">
          Budget (€) : {filters.minBudget} - {filters.maxBudget} €
        </Label>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-xs text-muted-foreground mb-1 block">Minimum</Label>
            <Input
              type="number"
              min="0"
              value={filters.minBudget}
              onChange={(e) =>
                onFiltersChange({
                  ...filters,
                  minBudget: parseInt(e.target.value) || 0,
                })
              }
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground mb-1 block">Maximum</Label>
            <Input
              type="number"
              min="0"
              value={filters.maxBudget}
              onChange={(e) =>
                onFiltersChange({
                  ...filters,
                  maxBudget: parseInt(e.target.value) || 1000,
                })
              }
            />
          </div>
        </div>
      </div>

      {/* Note minimum */}
      <div>
        <Label className="text-foreground mb-2 block">
          Note minimum : {filters.minRating} ⭐
        </Label>
        <input
          type="range"
          min="0"
          max="5"
          step="0.5"
          value={filters.minRating}
          onChange={(e) =>
            onFiltersChange({
              ...filters,
              minRating: parseFloat(e.target.value),
            })
          }
          className="w-full"
        />
        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <span>0</span>
          <span>5</span>
        </div>
      </div>

      {/* Disponibilités */}
      <div>
        <Label className="text-foreground mb-3 block">Disponibilités</Label>
        
        {/* Options rapides */}
        <div className="flex flex-wrap gap-2 mb-4">
          {[
            { label: "Cette semaine", value: "this_week" },
            { label: "Ce week-end", value: "weekend" },
            { label: "Semaine prochaine", value: "next_week" },
            { label: "Ce mois", value: "this_month" },
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => {
                // Logique pour sélectionner une plage de dates
                // Pour l'instant, on ajoute juste l'option
                const newAvailability = filters.availability.includes(option.value)
                  ? filters.availability.filter((a) => a !== option.value)
                  : [...filters.availability.filter((a) => !a.startsWith("day_")), option.value];
                onFiltersChange({ ...filters, availability: newAvailability });
              }}
              className={`
                px-4 py-2 rounded-lg text-sm font-medium transition-all
                ${
                  filters.availability.includes(option.value)
                    ? "bg-blue-600 text-white shadow-md"
                    : "bg-accent text-foreground hover:bg-accent/80 border border-border"
                }
              `}
            >
              {option.label}
            </button>
          ))}
        </div>

        {/* Jours de la semaine - Design compact */}
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground mb-2 block">
            Ou sélectionnez des jours spécifiques :
          </Label>
          <div className="flex flex-wrap gap-2">
            {[
              { short: "L", full: "Lundi" },
              { short: "M", full: "Mardi" },
              { short: "M", full: "Mercredi" },
              { short: "J", full: "Jeudi" },
              { short: "V", full: "Vendredi" },
              { short: "S", full: "Samedi" },
              { short: "D", full: "Dimanche" },
            ].map((day, index) => {
              const dayKey = `day_${day.full}`;
              const isSelected = filters.availability.includes(dayKey);
              
              return (
                <button
                  key={day.full}
                  onClick={() => {
                    const newAvailability = isSelected
                      ? filters.availability.filter((a) => a !== dayKey)
                      : [...filters.availability.filter((a) => !a.startsWith("day_")), dayKey];
                    onFiltersChange({ ...filters, availability: newAvailability });
                  }}
                  className={`
                    relative w-10 h-10 rounded-lg text-sm font-semibold transition-all
                    flex items-center justify-center
                    ${
                      isSelected
                        ? "bg-blue-600 text-white shadow-md scale-105"
                        : "bg-accent text-foreground hover:bg-accent/80 border border-border"
                    }
                  `}
                  title={day.full}
                >
                  {day.short}
                  {index === 4 && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Filtres sauvegardés */}
      {isLoading ? (
        <div className="border-t border-border pt-4 flex items-center justify-center py-4">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : savedFilters.length > 0 ? (
        <div className="border-t border-border pt-4">
          <Label className="text-foreground mb-3 block">Filtres sauvegardés</Label>
          <div className="space-y-2">
            {savedFilters.map((saved) => (
              <div
                key={saved.id}
                className="flex items-center justify-between p-2 rounded-lg bg-accent hover:bg-accent/80 transition-colors"
              >
                <button
                  onClick={() => loadSavedFilter(saved)}
                  className="flex items-center gap-2 flex-1 text-left"
                >
                  <Bookmark className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-foreground">{saved.name}</span>
                </button>
                <button
                  onClick={() => deleteSavedFilter(saved.id)}
                  className="text-muted-foreground hover:text-destructive transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-border">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowSaveDialog(true)}
          className="flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          Sauvegarder ces filtres
        </Button>
        <Button variant="outline" onClick={clearFilters}>
          <X className="w-4 h-4 mr-2" />
          Réinitialiser
        </Button>
      </div>

      {/* Dialog de sauvegarde */}
      {showSaveDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-card border border-border rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="font-cera text-xl font-bold text-foreground mb-4">
              Sauvegarder les filtres
            </h3>
            <Input
              type="text"
              placeholder="Nom du filtre (ex: Cuisine italienne Paris)"
              value={filterName}
              onChange={(e) => setFilterName(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && saveCurrentFilters()}
              className="mb-4"
            />
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowSaveDialog(false);
                  setFilterName("");
                }}
                className="flex-1"
              >
                Annuler
              </Button>
              <Button
                onClick={saveCurrentFilters}
                disabled={!filterName.trim() || isSaving}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sauvegarde...
                  </>
                ) : (
                  "Sauvegarder"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

