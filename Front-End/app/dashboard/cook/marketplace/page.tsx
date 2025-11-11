"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { CookProfile } from "@/types";
import {
  Calendar,
  Clock,
  Users,
  Euro,
  MapPin,
  Search,
  Loader2,
  AlertCircle,
  MessageSquare,
  User,
  Filter,
  X,
  Map,
  List,
  Navigation,
  ArrowUpDown,
  TrendingUp,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatDate, formatDateTime } from "@/lib/utils";
import { apiClient } from "@/lib/api/client";
import { useAuthStore } from "@/stores/authStore";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { CreateReservationModal } from "@/components/dashboard/reservations/CreateReservationModal";
import { MapboxMap } from "@/components/mapbox/MapboxMap";

interface PublicRequest {
  id: string;
  client?: { firstName?: string; lastName?: string; city?: string; avatarUrl?: string };
  special_requests?: string;
  address?: { address?: string; location?: { lat?: number; lng?: number; latitude?: number; longitude?: number } };
  booking_date?: string;
  start_time?: string;
  end_time?: string;
  number_of_guests?: number;
  need_groceries?: boolean;
  need_table_setting?: boolean;
  need_dishes?: boolean;
  created_at?: string;
  budget?: number;
  total_price?: number;
}

/**
 * Page "Marché" - Demandes publiques
 * Permet aux cuisiniers de voir et postuler aux demandes publiques des clients
 */
export default function MarketplacePage() {
  const router = useRouter();
  const { user, isAuthenticated, checkAuth, isLoading: isAuthLoading } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [publicRequests, setPublicRequests] = useState<PublicRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<PublicRequest | null>(null);
  const [isProposalModalOpen, setIsProposalModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const [cookLocation, setCookLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [cookProfile, setCookProfile] = useState<CookProfile | null>(null);
  const [distances, setDistances] = useState<Record<string, { distance: number; distance_km: string; duration_minutes: number }>>({});
  const [sortBy, setSortBy] = useState<"date" | "distance" | "guests" | "budget">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [maxDistance, setMaxDistance] = useState<number | null>(null); // Filtre par distance max
  const [minBudget, setMinBudget] = useState<number | null>(null); // Filtre par budget min
  const [maxBudget, setMaxBudget] = useState<number | null>(null); // Filtre par budget max

  // Vérifier l'authentification au montage
  useEffect(() => {
    const verifyAuth = async () => {
      if (!isAuthenticated && !isAuthLoading) {
        try {
          await checkAuth();
        } catch (error) {
          // Ne pas logger les erreurs 401 car c'est normal si l'utilisateur n'est pas connecté
          // checkAuth gère déjà la redirection en interne
        }
      }
    };

    if (!isAuthLoading) {
      verifyAuth();
    }
  }, [isAuthenticated, checkAuth, router, isAuthLoading]);

  // Charger le profil cuisinier et sa localisation
  useEffect(() => {
    const loadCookProfile = async () => {
      if (isAuthLoading || !isAuthenticated || !user) return;

      try {
        const profile = await apiClient.getMyProfile();
        if (profile.cookProfile) {
          setCookProfile(profile.cookProfile);
          // Récupérer la localisation du cuisinier depuis le profil
          if (profile.cookProfile.location) {
            const location = profile.cookProfile.location as { lat?: number; lng?: number; latitude?: number; longitude?: number };
            const lat = location.lat ?? location.latitude;
            const lng = location.lng ?? location.longitude;
            if (lat && lng) {
              setCookLocation({ lat, lng });
              // Utiliser le rayon de service comme distance max par défaut
              if (profile.cookProfile.service_radius) {
                setMaxDistance(profile.cookProfile.service_radius);
              }
            }
          }
          
          // Si pas de localisation dans le profil, essayer la géolocalisation du navigateur
          if (!profile.cookProfile.location && typeof window !== "undefined" && navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
              async (position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                setCookLocation({ lat, lng });
                
                // Optionnel : Sauvegarder la localisation dans le profil
                try {
                  // On peut sauvegarder plus tard, pour l'instant on utilise juste la géolocalisation
                  console.log("Localisation obtenue via géolocalisation:", { lat, lng });
                } catch (err) {
                  console.warn("Impossible de sauvegarder la localisation:", err);
                }
              },
              (error) => {
                console.warn("Erreur géolocalisation:", error.message);
                // On continue sans localisation
              },
              { timeout: 5000, enableHighAccuracy: false }
            );
          }
        }
      } catch (err) {
        console.error("Erreur lors du chargement du profil cuisinier:", err);
      }
    };

    if (!isAuthLoading && isAuthenticated && user) {
      loadCookProfile();
    }
  }, [isAuthLoading, isAuthenticated, user]);

  // Charger les demandes publiques
  useEffect(() => {
    const loadPublicRequests = async () => {
      if (isAuthLoading) return;
      if (!isAuthenticated || !user) return;

      setIsLoading(true);
      setError(null);

      try {
        const response = await apiClient.getPublicRequests({
          city: cityFilter || undefined,
          limit: 100,
        });
        const loadedRequests = response.bookings || [];
        setPublicRequests(loadedRequests);

        // Calculer les distances si on a la localisation du cuisinier
        if (cookLocation && cookLocation.lat && cookLocation.lng) {
          const distancePromises = loadedRequests
            .filter(req => req.address?.location)
            .map(async (request) => {
              try {
                const requestLocation = request.address?.location as { lat?: number; lng?: number; latitude?: number; longitude?: number } | undefined;
                if (!requestLocation) return null;
                
                const requestLat = requestLocation.lat ?? requestLocation.latitude;
                const requestLng = requestLocation.lng ?? requestLocation.longitude;

                if (!requestLat || !requestLng) return null;

                const distanceResult = await apiClient.calculateDistance(
                  [cookLocation.lat, cookLocation.lng],
                  [requestLat, requestLng],
                  "driving"
                );

                return {
                  requestId: request.id,
                  distance: distanceResult.result,
                };
              } catch (error) {
                console.error(`Erreur lors du calcul de la distance pour ${request.id}:`, error);
                return null;
              }
            });

          const distanceResults = await Promise.all(distancePromises);
          const distancesMap: Record<string, { distance: number; distance_km: string; duration_minutes: number }> = {};
          distanceResults.forEach((result) => {
            if (result && result.distance) {
              distancesMap[result.requestId] = {
                distance: result.distance.distance,
                distance_km: result.distance.distance_km,
                duration_minutes: result.distance.duration_minutes,
              };
            }
          });
          setDistances(distancesMap);
        }
      } catch (err: unknown) {
        console.error("Erreur lors du chargement des demandes publiques:", err);
        const errorMessage = err && typeof err === 'object' && 'response' in err && 
          typeof (err as { response?: { data?: { message?: string } } }).response === 'object' &&
          (err as { response?: { data?: { message?: string } } }).response?.data?.message
          ? (err as { response: { data: { message: string } } }).response.data.message
          : "Impossible de charger les demandes publiques";
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    if (!isAuthLoading && isAuthenticated && user) {
      loadPublicRequests();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthLoading, isAuthenticated, user, cityFilter, cookLocation]);

  // Filtrer et trier les demandes
  const filteredAndSortedRequests = useMemo(() => {
    let filtered = publicRequests.filter((request) => {
      // Filtre par recherche textuelle
    const searchLower = searchQuery.toLowerCase();
    const clientName = `${request.client?.firstName || ""} ${request.client?.lastName || ""}`.toLowerCase();
    const specialRequests = (request.special_requests || "").toLowerCase();
    const address = (request.address?.address || "").toLowerCase();
    
      const matchesSearch = !searchQuery || (
      clientName.includes(searchLower) ||
      specialRequests.includes(searchLower) ||
      address.includes(searchLower)
    );

      // Filtre par distance (seulement si localisation disponible)
      const distance = distances[request.id]?.distance;
      const matchesDistance = !cookLocation || !maxDistance || (distance !== undefined && distance <= maxDistance * 1000);

      // Filtre par budget (si disponible dans la demande)
      const requestBudget = request.budget || request.total_price || 0;
      const matchesMinBudget = !minBudget || requestBudget >= minBudget;
      const matchesMaxBudget = !maxBudget || requestBudget <= maxBudget;

      // Vérifier si la demande est dans le rayon de service du cuisinier (seulement si localisation disponible)
      const isInServiceRadius = !cookLocation || !cookProfile?.service_radius 
        ? true // Si pas de localisation, on accepte toutes les demandes
        : (distance !== undefined && distance <= (cookProfile.service_radius * 1000));

      return matchesSearch && matchesDistance && matchesMinBudget && matchesMaxBudget && isInServiceRadius;
    });

    // Trier les demandes
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case "distance":
          const distA = distances[a.id]?.distance || Infinity;
          const distB = distances[b.id]?.distance || Infinity;
          comparison = distA - distB;
          break;
        case "guests":
          const guestsA = a.number_of_guests || 0;
          const guestsB = b.number_of_guests || 0;
          comparison = guestsA - guestsB;
          break;
        case "budget":
          const budgetA = a.budget || a.total_price || 0;
          const budgetB = b.budget || b.total_price || 0;
          comparison = budgetA - budgetB;
          break;
        case "date":
        default:
          const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
          const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
          comparison = dateA - dateB;
          break;
      }
      
      return sortOrder === "asc" ? comparison : -comparison;
    });

    return filtered;
  }, [publicRequests, searchQuery, distances, maxDistance, minBudget, maxBudget, sortBy, sortOrder, cookProfile]);

  const handlePropose = (request: PublicRequest) => {
    setSelectedRequest(request);
    setIsProposalModalOpen(true);
  };

  const handleProposalSuccess = () => {
    // Recharger les demandes pour mettre à jour l'état
    const loadPublicRequests = async () => {
      try {
        const response = await apiClient.getPublicRequests({
          city: cityFilter || undefined,
          limit: 100,
        });
        setPublicRequests(response.bookings || []);
      } catch (err: unknown) {
        console.error("Erreur lors du rechargement:", err);
      }
    };
    loadPublicRequests();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-trebuchet text-3xl lg:text-4xl font-bold text-foreground mb-2">
          Marché des Demandes
        </h1>
        <p className="text-muted-foreground">
          Parcourez les demandes publiques et proposez vos services
        </p>
      </div>

      {/* Messages d'erreur */}
      {error && (
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Avertissement si pas de localisation */}
      {!cookLocation && cookProfile && (
        <div className="bg-yellow-500/10 border-yellow-500/20 border rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-foreground mb-1">Localisation non définie</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Pour utiliser les filtres de distance et voir la carte, vous devez définir votre localisation.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  onClick={async () => {
                    if (typeof window !== "undefined" && navigator.geolocation) {
                      navigator.geolocation.getCurrentPosition(
                        async (position) => {
                          const lat = position.coords.latitude;
                          const lng = position.coords.longitude;
                          setCookLocation({ lat, lng });
                        },
                        (error) => {
                          alert(`Erreur de géolocalisation : ${error.message}`);
                        },
                        { timeout: 10000, enableHighAccuracy: true }
                      );
                    } else {
                      alert("La géolocalisation n'est pas disponible dans votre navigateur.");
                    }
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <MapPin className="w-4 h-4 mr-2" />
                  Utiliser ma position actuelle
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => router.push("/dashboard/cook/profile")}
                >
                  Définir dans mon profil
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Suggestions intelligentes */}
      {cookProfile && filteredAndSortedRequests.length > 0 && cookLocation && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h3 className="font-semibold text-foreground">Suggestions pour vous</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
              <span className="text-muted-foreground">
                {filteredAndSortedRequests.filter(r => {
                  const dist = distances[r.id]?.distance;
                  return dist !== undefined && dist <= (cookProfile.service_radius * 1000);
                }).length} demande{filteredAndSortedRequests.length > 1 ? "s" : ""} dans votre rayon ({cookProfile.service_radius} km)
              </span>
            </div>
            {cookProfile.hourly_rate && (
              <div className="flex items-center gap-2">
                <Euro className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span className="text-muted-foreground">
                  Tarif horaire : {cookProfile.hourly_rate}€/h
                </span>
              </div>
            )}
            {cookProfile.max_guests && (
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span className="text-muted-foreground">
                  Capacité max : {cookProfile.max_guests} personnes
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Barre de recherche et filtres */}
      <div className="bg-card border border-border rounded-xl p-4 lg:p-6 space-y-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Recherche */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Rechercher par client, message ou adresse..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filtre par ville */}
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Filtrer par ville..."
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              className="w-48"
            />
            {cityFilter && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCityFilter("")}
                className="h-9 w-9 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>

          {/* Toggle vue Liste/Carte */}
          <div className="flex items-center gap-2 border border-border rounded-lg p-1">
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
              className="flex items-center gap-2"
            >
              <List className="w-4 h-4" />
              Liste
            </Button>
            <Button
              variant={viewMode === "map" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("map")}
              className="flex items-center gap-2"
            >
              <Map className="w-4 h-4" />
              Carte
            </Button>
          </div>
        </div>

        {/* Filtres avancés */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t border-border">
          {/* Filtre par distance */}
          <div>
            <Label className="text-xs text-muted-foreground mb-1 block flex items-center gap-2">
              Distance max (km)
              {!cookLocation && (
                <span className="text-xs text-yellow-600 dark:text-yellow-400" title="Localisation requise">
                  ⚠️
                </span>
              )}
            </Label>
            <Input
              type="number"
              placeholder={cookProfile?.service_radius ? `Rayon: ${cookProfile.service_radius}km` : "Toutes"}
              value={maxDistance || ""}
              onChange={(e) => setMaxDistance(e.target.value ? parseFloat(e.target.value) : null)}
              min="0"
              max="100"
              className="text-sm"
              disabled={!cookLocation}
              title={!cookLocation ? "Définissez votre localisation pour utiliser ce filtre" : ""}
            />
            {!cookLocation && (
              <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                Localisation requise
              </p>
            )}
          </div>

          {/* Filtre par budget min */}
          <div>
            <Label className="text-xs text-muted-foreground mb-1 block">Budget min (€)</Label>
            <Input
              type="number"
              placeholder="Min"
              value={minBudget || ""}
              onChange={(e) => setMinBudget(e.target.value ? parseFloat(e.target.value) : null)}
              min="0"
              className="text-sm"
            />
          </div>

          {/* Filtre par budget max */}
          <div>
            <Label className="text-xs text-muted-foreground mb-1 block">Budget max (€)</Label>
            <Input
              type="number"
              placeholder="Max"
              value={maxBudget || ""}
              onChange={(e) => setMaxBudget(e.target.value ? parseFloat(e.target.value) : null)}
              min="0"
              className="text-sm"
            />
          </div>

          {/* Tri */}
          <div>
            <Label className="text-xs text-muted-foreground mb-1 block">Trier par</Label>
            <div className="flex gap-2">
              <select
                value={sortBy}
                onChange={(e) => {
                const value = e.target.value;
                if (value === "date" || value === "distance" || value === "guests" || value === "budget") {
                  setSortBy(value);
                }
              }}
                className="flex-1 px-2 py-1.5 rounded-lg border border-border bg-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="date">Date</option>
                <option value="distance">Distance</option>
                <option value="guests">Invités</option>
                <option value="budget">Budget</option>
              </select>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                className="px-2"
              >
                <ArrowUpDown className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Liste des demandes ou Carte */}
      {filteredAndSortedRequests.length === 0 ? (
        <div className="text-center py-12 bg-card border border-border rounded-xl">
          <p className="text-muted-foreground">
            {publicRequests.length === 0
              ? "Aucune demande publique disponible pour le moment"
              : "Aucune demande ne correspond à vos critères"}
          </p>
        </div>
      ) : viewMode === "map" ? (
        cookLocation ? (
          <div className="bg-card border border-border rounded-xl overflow-hidden shadow-lg" style={{ height: "600px" }}>
          <MapboxMap
              center={[cookLocation.lat, cookLocation.lng]}
            zoom={11}
              markers={[
                {
                  id: "cook-location",
                  lat: cookLocation.lat,
                  lng: cookLocation.lng,
                  title: "Votre position",
                  description: "Votre localisation",
                  color: "#10b981",
                },
                ...filteredAndSortedRequests
              .filter((req) => req.address?.location)
                  .map((request) => {
                    const requestLocation = request.address?.location as { lat?: number; lng?: number; latitude?: number; longitude?: number } | undefined;
                    if (!requestLocation) return null;
                    
                    const requestLat = requestLocation.lat ?? requestLocation.latitude;
                    const requestLng = requestLocation.lng ?? requestLocation.longitude;
                    if (!requestLat || !requestLng) return null;
                    
                    const distance = distances[request.id];
                    const isInRadius = cookProfile?.service_radius && distance !== undefined
                      ? distance.distance <= (cookProfile.service_radius * 1000)
                      : true;
                    
                    return {
                id: request.id,
                      lat: requestLat,
                      lng: requestLng,
                title: `${request.client?.firstName || ""} ${request.client?.lastName || ""}`.trim() || "Client",
                      description: `${request.number_of_guests || 0} invité(s)${distance ? ` • ${distance.distance_km}` : ""}`,
                      color: isInRadius ? "#3b82f6" : "#ef4444",
                    };
                  })
                  .filter((marker): marker is NonNullable<typeof marker> => marker !== null),
              ]}
            height="100%"
              interactive={true}
            onMarkerClick={(marker) => {
                if (marker.id === "cook-location") return;
                const request = filteredAndSortedRequests.find((r) => r.id === marker.id);
              if (request) {
                handlePropose(request);
              }
            }}
          />
        </div>
        ) : (
          <div className="bg-card border border-border rounded-xl p-8 text-center">
            <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold text-foreground mb-2">Localisation requise</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Pour afficher la carte et utiliser les filtres de distance, vous devez définir votre localisation.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                onClick={async () => {
                  if (typeof window !== "undefined" && navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(
                      async (position) => {
                        const lat = position.coords.latitude;
                        const lng = position.coords.longitude;
                        setCookLocation({ lat, lng });
                        // Optionnel : Sauvegarder dans le profil
                        try {
                          await apiClient.updateMyProfile({
                            // Le backend devrait gérer la conversion en format PostGIS
                          });
                        } catch (err) {
                          console.warn("Impossible de sauvegarder la localisation:", err);
                        }
                      },
                      (error) => {
                        alert(`Erreur de géolocalisation : ${error.message}`);
                      },
                      { timeout: 10000, enableHighAccuracy: true }
                    );
                  } else {
                    alert("La géolocalisation n'est pas disponible dans votre navigateur.");
                  }
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <MapPin className="w-4 h-4 mr-2" />
                Utiliser ma position actuelle
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push("/dashboard/cook/profile")}
              >
                Définir dans mon profil
              </Button>
            </div>
          </div>
        )
      ) : (
        <div className="grid gap-4">
          {filteredAndSortedRequests.map((request, index) => (
            <RequestCard
              key={request.id}
              request={request}
              index={index}
              onPropose={() => handlePropose(request)}
              distance={distances[request.id]}
              cookProfile={cookProfile}
            />
          ))}
        </div>
      )}

      {/* Modal de proposition */}
      {selectedRequest && (
        <CreateReservationModal
          isOpen={isProposalModalOpen}
          onClose={() => {
            setIsProposalModalOpen(false);
            setSelectedRequest(null);
          }}
          bookingId={selectedRequest.id}
          bookingData={{
            number_of_guests: selectedRequest.number_of_guests,
            start_time: selectedRequest.start_time,
            end_time: selectedRequest.end_time,
            need_groceries: selectedRequest.need_groceries,
            need_table_setting: selectedRequest.need_table_setting,
            need_dishes: selectedRequest.need_dishes,
          }}
          onSuccess={handleProposalSuccess}
        />
      )}
    </div>
  );
}

interface RequestCardProps {
  request: PublicRequest;
  index: number;
  onPropose: () => void;
  distance?: { distance: number; distance_km: string; duration_minutes: number };
  cookProfile?: CookProfile | null;
}

function RequestCard({ request, index, onPropose, distance, cookProfile }: RequestCardProps) {
  const clientName = `${request.client?.firstName || ""} ${request.client?.lastName || ""}`.trim() || "Client";
  const bookingDate = request.booking_date ? new Date(request.booking_date) : null;
  const address = request.address?.address || "Adresse non spécifiée";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-card border border-border rounded-xl p-6 hover:shadow-lg transition-shadow"
    >
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Informations principales */}
        <div className="flex-1 space-y-4">
          {/* Header avec client */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                {request.client?.avatarUrl ? (
                  <img
                    src={request.client.avatarUrl}
                    alt={clientName}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <User className="w-6 h-6 text-white" />
                )}
              </div>
              <div>
                <h3 className="font-semibold text-foreground">{clientName}</h3>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {request.client?.city || "Ville non spécifiée"}
                </p>
              </div>
            </div>
          </div>

          {/* Détails de la demande */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {bookingDate && (
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span className="text-foreground">
                  {format(bookingDate, "EEEE d MMMM yyyy", { locale: fr })}
                </span>
              </div>
            )}
            {request.start_time && (
              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="text-foreground">
                  {request.start_time} {request.end_time ? `- ${request.end_time}` : ""}
                </span>
              </div>
            )}
            {request.number_of_guests && (
              <div className="flex items-center gap-2 text-sm">
                <Users className="w-4 h-4 text-muted-foreground" />
                <span className="text-foreground">{request.number_of_guests} invité(s)</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="w-4 h-4 text-muted-foreground" />
              <span className="text-foreground truncate">{address}</span>
            </div>
            {distance && (
              <div className="flex items-center gap-2 text-sm">
                <Navigation className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span className="text-blue-600 dark:text-blue-400 font-medium">
                  {distance.distance_km} ({distance.duration_minutes} min)
                </span>
                {cookProfile?.service_radius && distance.distance <= (cookProfile.service_radius * 1000) && (
                  <span className="px-2 py-0.5 rounded-full bg-green-500/10 text-green-600 dark:text-green-400 text-xs font-medium">
                    Dans votre rayon
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Demande spéciale */}
          {request.special_requests && (
            <div className="p-4 bg-accent rounded-lg">
              <p className="text-sm font-medium text-foreground mb-1">Demande spéciale :</p>
              <p className="text-sm text-muted-foreground">{request.special_requests}</p>
            </div>
          )}

          {/* Services requis */}
          {(request.need_groceries || request.need_table_setting || request.need_dishes) && (
            <div className="flex flex-wrap gap-2">
              {request.need_groceries && (
                <span className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-medium">
                  Courses
                </span>
              )}
              {request.need_table_setting && (
                <span className="px-3 py-1 rounded-full bg-green-500/10 text-green-600 dark:text-green-400 text-xs font-medium">
                  Mise en table
                </span>
              )}
              {request.need_dishes && (
                <span className="px-3 py-1 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 text-xs font-medium">
                  Vaisselle
                </span>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col justify-between gap-4 lg:w-48">
          <Button
            onClick={onPropose}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            Faire une proposition
          </Button>
          {request.created_at && (
          <p className="text-xs text-muted-foreground text-center">
            Publié le {format(new Date(request.created_at), "d MMM yyyy", { locale: fr })}
          </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}
