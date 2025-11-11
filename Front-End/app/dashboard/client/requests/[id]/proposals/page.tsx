"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2, AlertCircle, CheckCircle2, XCircle, Map, List, Navigation, Filter, ArrowUpDown, TrendingUp, Star, MessageSquare, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ReservationsList } from "@/components/dashboard/reservations/ReservationsList";
import { apiClient } from "@/lib/api/client";
import { useAuthStore } from "@/stores/authStore";
import { useAuthGuard } from "@/lib/hooks/useAuthGuard";
import { useNotificationToast } from "@/lib/hooks/useNotificationToast";
import type { Reservation } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { MapboxMap } from "@/components/mapbox/MapboxMap";
import Link from "next/link";

/**
 * Page pour afficher et gérer les propositions reçues pour une demande publique
 * Côté client
 * PROTÉGÉE : Nécessite une authentification
 */
export default function RequestProposalsPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const { isAuthenticated, isLoading: isAuthLoading } = useAuthGuard();
  const bookingId = params.id as string;

  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [stats, setStats] = useState<{ total: number; pending: number; accepted: number; rejected: number; expired: number } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [booking, setBooking] = useState<{ booking_date?: string; address?: { address?: string } } | null>(null);
  const [selectedReservationId, setSelectedReservationId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [isAcceptDialogOpen, setIsAcceptDialogOpen] = useState(false);
  const [reservationToAccept, setReservationToAccept] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const { showSuccessToast, showErrorToast, showInfoToast } = useNotificationToast();
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const [sortBy, setSortBy] = useState<"price" | "distance" | "rating" | "date">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [distances, setDistances] = useState<Record<string, { distance: number; distance_km: string; duration_minutes: number }>>({});
  const [bookingAddress, setBookingAddress] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedReservationForRoute, setSelectedReservationForRoute] = useState<string | null>(null); // ID de la réservation sélectionnée pour afficher l'itinéraire

  // NE PAS AFFICHER LE CONTENU SI L'UTILISATEUR N'EST PAS AUTHENTIFIÉ
  // Le useAuthGuard redirige automatiquement vers /auth/login si non authentifié
  if (isAuthLoading || !isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  // Charger les propositions
  useEffect(() => {
    const loadData = async () => {
      if (isAuthLoading || !isAuthenticated || !user || !bookingId) return;

      setIsLoading(true);
      setError(null);

      try {
        // Charger le booking
        const bookingResponse = await apiClient.getBookingById(bookingId);
        setBooking(bookingResponse.booking);

        // Charger les propositions
        const response = await apiClient.getReservationsByBookingId(bookingId);
        const loadedReservations = response.reservations || [];
        setReservations(loadedReservations);
        setStats(response.stats || null);

        // Récupérer l'adresse du booking pour calculer les distances
        let bookingAddr: { lat: number; lng: number } | null = null;
        if (bookingResponse.booking?.address?.location) {
          const location = bookingResponse.booking.address.location;
          const locationObj = location as { lat?: number; lng?: number; latitude?: number; longitude?: number };
          bookingAddr = {
            lat: locationObj.lat ?? locationObj.latitude ?? 0,
            lng: locationObj.lng ?? locationObj.longitude ?? 0,
          };
          if (bookingAddr.lat !== 0 && bookingAddr.lng !== 0) {
            setBookingAddress(bookingAddr);
          }
        } else if (bookingResponse.booking?.address_id) {
          // TODO: Charger l'adresse depuis l'API si nécessaire
        }

        // Calculer les distances pour chaque proposition
        if (bookingAddr && bookingAddr.lat !== 0 && bookingAddr.lng !== 0) {
          const distancePromises = loadedReservations
            .filter(r => {
              const cookLoc = (r.cook as { location?: { lat?: number; lng?: number; latitude?: number; longitude?: number } })?.location;
              return !!cookLoc;
            })
            .map(async (reservation) => {
              try {
                const cookLocation = (reservation.cook as { location?: { lat?: number; lng?: number; latitude?: number; longitude?: number } })?.location;
                if (!cookLocation) return null;

                const cookLat = cookLocation.lat ?? cookLocation.latitude;
                const cookLng = cookLocation.lng ?? cookLocation.longitude;

                if (!cookLat || !cookLng || !bookingAddr) return null;

                const distanceResult = await apiClient.calculateDistance(
                  [bookingAddr.lat, bookingAddr.lng],
                  [cookLat, cookLng],
                  "driving"
                );

                return {
                  reservationId: reservation.id,
                  distance: distanceResult.result,
                };
              } catch (error) {
                console.error(`Erreur lors du calcul de la distance pour ${reservation.id}:`, error);
                return null;
              }
            });

          const distanceResults = await Promise.all(distancePromises);
          const distancesMap: Record<string, { distance: number; distance_km: string; duration_minutes: number }> = {};
          distanceResults.forEach((result) => {
            if (result && result.distance) {
              distancesMap[result.reservationId] = {
                distance: result.distance.distance,
                distance_km: result.distance.distance_km,
                duration_minutes: result.distance.duration_minutes,
              };
            }
          });
          setDistances(distancesMap);
        }
      } catch (err: unknown) {
        console.error("Erreur lors du chargement des propositions:", err);
        const errorMessage = err && typeof err === 'object' && 'response' in err && 
          typeof (err as { response?: { data?: { message?: string } } }).response === 'object' &&
          (err as { response?: { data?: { message?: string } } }).response?.data?.message
          ? (err as { response: { data: { message: string } } }).response.data.message
          : "Impossible de charger les propositions";
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    if (!isAuthLoading && isAuthenticated && user && bookingId) {
      loadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthLoading, isAuthenticated, user, bookingId]);

  const handleAcceptClick = (reservationId: string) => {
    setReservationToAccept(reservationId);
    setIsAcceptDialogOpen(true);
  };

  const handleConfirmAccept = async () => {
    if (!reservationToAccept) return;

    setIsProcessing(true);
    setIsAcceptDialogOpen(false);
    
    try {
      const response = await apiClient.acceptReservation(reservationToAccept);
      
      showSuccessToast(
        "Proposition acceptée !",
        `Acompte à payer : ${response.depositAmount.toFixed(2)}€ (30%). Vous allez être redirigé vers la page de paiement.`
      );
      
      // Recharger les données
      const reservationsResponse = await apiClient.getReservationsByBookingId(bookingId);
      setReservations(reservationsResponse.reservations || []);
      setStats(reservationsResponse.stats || null);
      
      // Rediriger vers la page de paiement ou de détails du booking après un court délai
      setTimeout(() => {
      router.push(`/dashboard/client/bookings/${bookingId}`);
      }, 1500);
    } catch (err: unknown) {
      console.error("Erreur lors de l'acceptation:", err);
      const errorMessage = err && typeof err === 'object' && 'response' in err && 
        typeof (err as { response?: { data?: { message?: string } } }).response === 'object' &&
        (err as { response?: { data?: { message?: string } } }).response?.data?.message
        ? (err as { response: { data: { message: string } } }).response.data.message
        : "Erreur lors de l'acceptation de la proposition";
      showErrorToast("Erreur", errorMessage);
    } finally {
      setIsProcessing(false);
      setReservationToAccept(null);
    }
  };

  const handleReject = (reservationId: string) => {
    setSelectedReservationId(reservationId);
    setRejectionReason("");
    setIsRejectDialogOpen(true);
  };

  const handleConfirmReject = async () => {
    if (!selectedReservationId) return;

    setIsProcessing(true);
    try {
      await apiClient.rejectReservation(selectedReservationId, rejectionReason || undefined);
      setIsRejectDialogOpen(false);
      setSelectedReservationId(null);
      setRejectionReason("");
      
      showSuccessToast("Proposition refusée", "La proposition a été refusée avec succès.");
      
      // Recharger les données
      const response = await apiClient.getReservationsByBookingId(bookingId);
      setReservations(response.reservations || []);
      setStats(response.stats || null);
    } catch (err: unknown) {
      console.error("Erreur lors du refus:", err);
      const errorMessage = err && typeof err === 'object' && 'response' in err && 
        typeof (err as { response?: { data?: { message?: string } } }).response === 'object' &&
        (err as { response?: { data?: { message?: string } } }).response?.data?.message
        ? (err as { response: { data: { message: string } } }).response.data.message
        : "Erreur lors du refus de la proposition";
      showErrorToast("Erreur", errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  // Trier les propositions
  const sortedReservations = useMemo(() => {
    const sorted = [...reservations];
    
    sorted.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case "price":
          comparison = a.proposed_price - b.proposed_price;
          break;
        case "distance":
          const distA = distances[a.id]?.distance || Infinity;
          const distB = distances[b.id]?.distance || Infinity;
          comparison = distA - distB;
          break;
        case "rating":
          const ratingA = a.cook?.average_rating || 0;
          const ratingB = b.cook?.average_rating || 0;
          comparison = ratingB - ratingA; // Plus haute note en premier
          break;
        case "date":
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
      }
      
      return sortOrder === "asc" ? comparison : -comparison;
    });
    
    return sorted;
  }, [reservations, sortBy, sortOrder, distances]);

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
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour
        </Button>
        <div>
          <h1 className="font-trebuchet text-3xl lg:text-4xl font-bold text-foreground mb-2">
            Propositions reçues
          </h1>
          <p className="text-muted-foreground">
            {booking && booking.booking_date && (
              <>Demande du {new Date(booking.booking_date).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}</>
            )}
          </p>
        </div>
      </div>

      {/* Statistiques */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-card border border-border rounded-lg p-4 text-center">
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-sm text-muted-foreground">Total</p>
          </div>
          <div className="bg-yellow-500/10 border-yellow-500/20 border rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.pending}</p>
            <p className="text-sm text-muted-foreground">En attente</p>
          </div>
          <div className="bg-green-500/10 border-green-500/20 border rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.accepted}</p>
            <p className="text-sm text-muted-foreground">Acceptées</p>
          </div>
          <div className="bg-red-500/10 border-red-500/20 border rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.rejected}</p>
            <p className="text-sm text-muted-foreground">Refusées</p>
          </div>
          <div className="bg-gray-500/10 border-gray-500/20 border rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-gray-600 dark:text-gray-400">{stats.expired}</p>
            <p className="text-sm text-muted-foreground">Expirées</p>
          </div>
        </div>
      )}

      {/* Erreur */}
      {error && (
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Filtres et tri */}
      <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
          {/* Tri */}
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Trier par :</span>
            <select
              value={sortBy}
              onChange={(e) => {
                const value = e.target.value;
                if (value === "price" || value === "distance" || value === "rating" || value === "date") {
                  setSortBy(value);
                }
              }}
              className="px-3 py-1.5 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="date">Date de proposition</option>
              <option value="price">Prix</option>
              <option value="distance">Distance</option>
              <option value="rating">Note</option>
            </select>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
              className="flex items-center gap-2"
            >
              <ArrowUpDown className="w-4 h-4" />
              {sortOrder === "asc" ? "Croissant" : "Décroissant"}
            </Button>
          </div>

          {/* Vue Liste/Carte - Plus visible */}
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground hidden sm:inline">Vue :</span>
            <div className="flex items-center gap-2 border border-border rounded-lg p-1 bg-background">
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("list")}
                className="flex items-center gap-2"
              >
                <List className="w-4 h-4" />
                <span className="hidden sm:inline">Liste</span>
              </Button>
              <Button
                variant={viewMode === "map" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("map")}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white data-[state=active]:bg-blue-700"
              >
                <Map className="w-4 h-4" />
                <span className="hidden sm:inline">Carte</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Vue Carte ou Liste */}
      {viewMode === "map" ? (
        bookingAddress ? (
          <div className="space-y-4">
            {/* Contrôles de la carte */}
            {selectedReservationForRoute && (() => {
              const reservation = sortedReservations.find(r => r.id === selectedReservationForRoute);
              if (!reservation) return null;
              const distance = distances[reservation.id];
              return (
                <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Navigation className="w-5 h-5 text-green-600 dark:text-green-400" />
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        Itinéraire vers : {reservation.cook?.user?.first_name} {reservation.cook?.user?.last_name}
                      </p>
                      {distance && (
                        <p className="text-xs text-muted-foreground">
                          {distance.distance_km} • {distance.duration_minutes} min
                        </p>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedReservationForRoute(null)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              );
            })()}
            <div className="bg-card border border-border rounded-xl overflow-hidden shadow-lg" style={{ height: "600px" }}>
              <MapboxMap
                center={[bookingAddress.lat, bookingAddress.lng]}
                zoom={11}
                markers={[
                  {
                    id: "booking-address",
                    lat: bookingAddress.lat,
                    lng: bookingAddress.lng,
                    title: "Votre adresse",
                    description: booking?.address?.address || "Adresse de la demande",
                    color: "#3b82f6",
                  },
                  ...sortedReservations
                    .filter(r => {
                      const cookLoc = (r.cook as { location?: { lat?: number; lng?: number; latitude?: number; longitude?: number } })?.location;
                      return !!cookLoc;
                    })
                    .map((reservation) => {
                      const cookLocation = (reservation.cook as { location?: { lat?: number; lng?: number; latitude?: number; longitude?: number } })?.location;
                      if (!cookLocation) return null;
                      
                      const cookLat = cookLocation.lat ?? cookLocation.latitude;
                      const cookLng = cookLocation.lng ?? cookLocation.longitude;
                      if (!cookLat || !cookLng) return null;
                      
                      const distance = distances[reservation.id];
                      
                      return {
                        id: reservation.id,
                        lat: cookLat,
                        lng: cookLng,
                        title: `${reservation.cook?.user?.first_name || "Cuisinier"} ${reservation.cook?.user?.last_name || ""}`,
                        description: `${reservation.proposed_price.toFixed(2)}€${distance ? ` • ${distance.distance_km} • ${distance.duration_minutes} min` : ""}`,
                        color: reservation.status === "PENDING" ? "#10b981" : "#6b7280",
                        distance: distance?.distance_km,
                        duration: distance?.duration_minutes,
                      };
                    })
                    .filter((marker): marker is NonNullable<typeof marker> => marker !== null),
                ]}
                route={(() => {
                  if (!selectedReservationForRoute) return undefined;
                  const reservation = sortedReservations.find(r => r.id === selectedReservationForRoute);
                  if (!reservation?.cook) return undefined;
                  const cookLoc = (reservation.cook as { location?: { lat?: number; lng?: number; latitude?: number; longitude?: number } })?.location;
                  if (!cookLoc) return undefined;
                  const cookLat = cookLoc.lat ?? cookLoc.latitude;
                  const cookLng = cookLoc.lng ?? cookLoc.longitude;
                  if (!cookLat || !cookLng) return undefined;
                  return {
                    origin: [bookingAddress.lat, bookingAddress.lng] as [number, number],
                    destination: [cookLat, cookLng] as [number, number],
                    color: "#10b981",
                  };
                })()}
                onMarkerClick={(marker) => {
                  if (marker.id === "booking-address") return;
                  // Sélectionner la réservation pour afficher l'itinéraire
                  setSelectedReservationForRoute(marker.id);
                }}
                height="100%"
                interactive={true}
              />
            </div>
          </div>
        ) : (
          <div className="bg-card border border-border rounded-xl p-8 text-center">
            <Map className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              Adresse de la demande non disponible pour afficher la carte
            </p>
          </div>
        )
      ) : (
        <div className="space-y-4">
          {/* Comparaison rapide */}
          {sortedReservations.length > 1 && (
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h3 className="font-semibold text-foreground">Comparaison rapide</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-card border border-border rounded-lg p-3">
                  <p className="text-xs text-muted-foreground mb-1">Prix le plus bas</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {Math.min(...sortedReservations.map(r => r.proposed_price)).toFixed(2)}€
                  </p>
                </div>
                <div className="bg-card border border-border rounded-lg p-3">
                  <p className="text-xs text-muted-foreground mb-1">Meilleure note</p>
                  <div className="flex items-center gap-1">
                    <Star className="w-5 h-5 fill-yellow-500 text-yellow-500" />
                    <p className="text-2xl font-bold">
                      {Math.max(...sortedReservations.map(r => r.cook?.average_rating || 0)).toFixed(1)}
                    </p>
                  </div>
                </div>
                <div className="bg-card border border-border rounded-lg p-3">
                  <p className="text-xs text-muted-foreground mb-1">Plus proche</p>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {Object.keys(distances).length > 0
                      ? Math.min(...Object.values(distances).map(d => d.distance)).toFixed(1) + " km"
                      : "N/A"}
                  </p>
                </div>
              </div>
        </div>
      )}

      {/* Liste des propositions */}
      <ReservationsList
            reservations={sortedReservations}
        isLoading={isLoading}
            onAccept={handleAcceptClick}
        onReject={handleReject}
        showActions={true}
            distances={distances}
            bookingId={bookingId}
          />
        </div>
      )}

      {/* Dialog de confirmation d'acceptation */}
      <Dialog open={isAcceptDialogOpen} onOpenChange={setIsAcceptDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              Confirmer l'acceptation
            </DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir accepter cette proposition ? Les autres propositions seront automatiquement refusées.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={() => setIsAcceptDialogOpen(false)} disabled={isProcessing}>
              Annuler
            </Button>
            <Button onClick={handleConfirmAccept} disabled={isProcessing} className="bg-green-600 hover:bg-green-700">
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Traitement...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Confirmer
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de refus */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Refuser la proposition</DialogTitle>
            <DialogDescription>
              Vous êtes sur le point de refuser cette proposition. Vous pouvez ajouter une raison (optionnel).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label htmlFor="rejectionReason">Raison du refus (optionnel)</Label>
              <Textarea
                id="rejectionReason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Ex: Le prix ne correspond pas à mon budget..."
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setIsRejectDialogOpen(false)} disabled={isProcessing}>
                Annuler
              </Button>
              <Button variant="destructive" onClick={handleConfirmReject} disabled={isProcessing}>
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Traitement...
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4 mr-2" />
                    Confirmer le refus
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}


