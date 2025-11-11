"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Calendar, Clock, Users, Euro, MapPin, Eye, Edit, Trash2, Copy, Loader2, MessageSquare, CheckCircle2, XCircle, AlertCircle, CreditCard, ChefHat, Sparkles, ArrowRight, Bell, Map, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { PropositionsModal } from "./PropositionsModal";
import { EditRequestModal } from "./EditRequestModal";
import { DeleteRequestDialog } from "./DeleteRequestDialog";
import { useBookingStore } from "@/stores/bookingStore";
import { apiClient } from "@/lib/api/client";
import { MapboxMap } from "@/components/mapbox/MapboxMap";
import Link from "next/link";

interface RequestsListProps {
  status: "pending" | "confirmed" | "completed";
}

/**
 * Liste des demandes avec cartes
 * Affiche les demandes selon leur statut
 */
export function RequestsList({ status }: RequestsListProps) {
  const { bookings, proposals, fetchBookings, fetchProposals, isLoadingBookings, isLoadingProposals } = useBookingStore();
  const [isLoading, setIsLoading] = useState(true);
  const [requests, setRequests] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  
  // Fonction pour recharger les données
  const reloadData = async () => {
    await Promise.all([
      fetchBookings({ limit: 100 }),
      fetchProposals({ filter: "pending", limit: 100 }),
    ]);
  };

  // Charger les données au montage et quand le statut change
  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoading(true);
      try {
        console.log("🔄 [RequestsList] Chargement des données, statut:", status);
        // Charger les bookings et propositions en parallèle
        // IMPORTANT: Réinitialiser le filtre de statut pour obtenir TOUS les bookings
        await Promise.all([
          fetchBookings({ limit: 1000, status: undefined }),
          fetchProposals({ filter: "pending", limit: 100 }),
        ]);
        // Attendre un peu pour que le store se mette à jour
        await new Promise(resolve => setTimeout(resolve, 100));
        const currentBookings = useBookingStore.getState().bookings;
        console.log("✅ [RequestsList] Données chargées:", {
          bookings: currentBookings.length,
          proposals: proposals.length,
          bookingsDetails: currentBookings.map(b => ({
            id: b.id?.slice(0, 8),
            status: b.status,
            cook_profile_id: b.cook_profile_id ?? (b as any).cook_profile_id
          }))
        });
      } catch (error) {
        console.error("❌ [RequestsList] Erreur lors du chargement initial:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, fetchBookings, fetchProposals]); // Recharger quand le statut change
  
  // Recharger aussi quand les bookings changent dans le store
  useEffect(() => {
    console.log("📊 [RequestsList] Bookings dans le store ont changé:", bookings.length);
  }, [bookings.length]);

  // Filtrer et transformer les données avec useMemo pour éviter les re-renders inutiles
  const filteredRequests = useMemo(() => {
    // Attendre que le chargement soit terminé
    if (isLoadingBookings || isLoadingProposals) {
      return [];
    }

    // Debug: Afficher les bookings reçus
    console.log(`[RequestsList] ========== DÉBUT FILTRAGE ==========`);
    console.log(`[RequestsList] Statut demandé: "${status}", ${bookings.length} bookings reçus du store`);
    
    if (bookings.length === 0) {
      console.warn("[RequestsList] ⚠️ AUCUN BOOKING REÇU DU STORE!");
    } else {
      console.log("[RequestsList] Tous les bookings reçus:", bookings.map(b => {
        const cookId = b.cook_profile_id ?? (b as any).cook_profile_id ?? (b as any).cookId ?? "NON_DÉFINI";
        return {
          id: b.id?.slice(0, 8) || "NO_ID",
          status: b.status || "NO_STATUS",
          cook_profile_id: cookId,
          cook_profile_id_type: typeof cookId,
          cook_profile_id_is_null: cookId === null,
          cook_profile_id_is_undefined: cookId === undefined,
          booking_date: b.booking_date || (b as any).date || "NO_DATE",
        };
      }));
    }

    // Transformer les données selon le statut demandé
    let requests: any[] = [];

    if (status === "pending") {
      // Bookings en attente (proposition_pending, payment_pending, pending, PENDING)
      // IMPORTANT: Pour "Mes demandes", on veut UNIQUEMENT les demandes publiques (sans cuisinier assigné)
      const pendingBookings = bookings.filter(
        (b) => {
          const statusValue = b.status || "";
          const statusLower = statusValue.toLowerCase();
          
          // Vérifier si c'est une demande publique (sans cuisinier assigné)
          // Essayer plusieurs façons de récupérer cook_profile_id car Supabase peut le retourner différemment
          const cookProfileId = 
            b.cook_profile_id !== undefined ? b.cook_profile_id :
            (b as any).cook_profile_id !== undefined ? (b as any).cook_profile_id :
            (b as any).cookId !== undefined ? (b as any).cookId :
            null;
          
          // Vérifier si pas de cuisinier (null, undefined, ou chaîne vide)
          const hasNoCook = 
            cookProfileId === null || 
            cookProfileId === undefined || 
            cookProfileId === "" ||
            String(cookProfileId).trim() === "";
          
          // Vérifier si le statut est en attente
          const isPendingStatus = 
            statusLower === "proposition_pending" || 
            statusLower === "payment_pending" || 
            statusLower === "pending" ||
            statusValue === "PENDING";
          
          const shouldInclude = hasNoCook && isPendingStatus;
          
          // Log détaillé pour déboguer
          if (isPendingStatus) {
            console.log(`[RequestsList] Booking ${b.id}: status=${statusValue}, cook_profile_id=${cookProfileId}, hasNoCook=${hasNoCook}, shouldInclude=${shouldInclude}`);
          }
          
          // Pour "Mes demandes", on veut UNIQUEMENT les demandes publiques (sans cuisinier) avec statut PENDING
          // Les bookings avec un cuisinier assigné vont dans "Mes propositions" ou "Mes réservations"
          return shouldInclude;
        }
      );
      
      // Debug: Afficher les bookings filtrés
      console.log(`[RequestsList] ========== RÉSULTAT FILTRAGE ==========`);
      console.log(`[RequestsList] Bookings filtrés (pending): ${pendingBookings.length} sur ${bookings.length}`);
      
      if (pendingBookings.length === 0 && bookings.length > 0) {
        console.error("[RequestsList] ❌ AUCUN BOOKING N'A PASSÉ LE FILTRE!");
        console.log("[RequestsList] Analyse détaillée de chaque booking:");
        bookings.forEach((b, index) => {
          const statusValue = b.status || "";
          const statusLower = statusValue.toLowerCase();
          const cookProfileId = 
            b.cook_profile_id !== undefined ? b.cook_profile_id :
            (b as any).cook_profile_id !== undefined ? (b as any).cook_profile_id :
            (b as any).cookId !== undefined ? (b as any).cookId :
            null;
          const hasNoCook = 
            cookProfileId === null || 
            cookProfileId === undefined || 
            cookProfileId === "" ||
            String(cookProfileId).trim() === "";
          const isPendingStatus = 
            statusLower === "proposition_pending" || 
            statusLower === "payment_pending" || 
            statusLower === "pending" ||
            statusValue === "PENDING";
          
          console.log(`[RequestsList] Booking #${index + 1} (${b.id?.slice(0, 8)}):`, {
            status: statusValue,
            isPendingStatus,
            cook_profile_id: cookProfileId,
            hasNoCook,
            shouldInclude: hasNoCook && isPendingStatus,
            reason: !isPendingStatus ? "Statut ne correspond pas" : !hasNoCook ? "A un cuisinier assigné" : "DEVRAIT ÊTRE INCLUS"
          });
        });
      } else if (pendingBookings.length > 0) {
        console.log("[RequestsList] ✅ Bookings qui passent le filtre:", 
          pendingBookings.map(b => ({ 
            id: b.id?.slice(0, 8), 
            status: b.status, 
            cook_profile_id: b.cook_profile_id ?? (b as any).cook_profile_id,
            booking_date: b.booking_date || (b as any).date
          }))
        );
      }
      
      // Transformer les bookings en format request
      requests = pendingBookings.map((booking) => {
        // Compter les propositions pour ce booking
        const proposalCount = proposals.filter((p) => p.id === booking.id || p.requestId === booking.id).length;
        
        // Formater l'heure si disponible
        const timeSlot = booking.time 
          ? booking.time.includes(":") 
            ? booking.time 
            : `${booking.time}h`
          : booking.start_time && booking.end_time
          ? `${booking.start_time} - ${booking.end_time}`
          : "Non spécifié";
        
        // Extraire le titre et la description depuis special_requests
        const specialRequests = booking.specialRequests || booking.special_requests || "";
        const lines = specialRequests.split("\n\n");
        const title = lines[0] || (booking as any).title || "Demande de repas";
        const description = lines.slice(1).join("\n\n") || (booking as any).description || "Aucune description";
        
        return {
          id: booking.id,
          title,
          description,
          date: booking.date || booking.booking_date,
          timeSlot,
          guestCount: booking.numberOfGuests || booking.number_of_guests,
          budget: booking.totalPrice || booking.total_price || booking.budget || 0,
          address: (booking as any).address || (booking as any).location?.address || "Adresse non spécifiée",
          status: "pending",
          proposalCount,
        };
      });
    } else if (status === "confirmed") {
      // Bookings confirmés - mais pour "Mes demandes", on veut seulement ceux qui étaient des demandes publiques
      // qui ont été acceptées (maintenant avec un cuisinier assigné)
      const confirmedBookings = bookings.filter((b) => {
        const statusLower = (b.status || "").toLowerCase();
        const isConfirmed = statusLower === "confirmed" || b.status === "CONFIRMED" || b.status === "ACCEPTED";
        // Pour "Mes demandes confirmées", on veut les demandes publiques qui ont été acceptées
        // On peut les identifier par le fait qu'elles ont maintenant un cuisinier mais étaient initialement publiques
        // Pour l'instant, on affiche tous les bookings confirmés du client
        return isConfirmed;
      });
      
      requests = confirmedBookings.map((booking) => {
        // Récupérer les infos du cuisinier si disponibles
        const cook = (booking as any).cook || {};
        const cookName = cook.first_name && cook.last_name 
          ? `${cook.first_name} ${cook.last_name}` 
          : cook.name || (booking as any).cookName || "Cuisinier";
        const cookRating = cook.average_rating || cook.rating || (booking as any).cookRating;
        
        const timeSlot = booking.time 
          ? booking.time.includes(":") 
            ? booking.time 
            : `${booking.time}h`
          : booking.start_time && booking.end_time
          ? `${booking.start_time} - ${booking.end_time}`
          : "Non spécifié";
        
        return {
          id: booking.id,
          title: (booking as any).title || booking.specialRequests || "Repas confirmé",
          description: booking.specialRequests || (booking as any).description || "Aucune description",
          date: booking.date || booking.booking_date,
          timeSlot,
          guestCount: booking.numberOfGuests || booking.number_of_guests,
          budget: booking.totalPrice || booking.total_price || booking.budget || 0,
          address: (booking as any).address || (booking as any).location?.address || "Adresse non spécifiée",
          status: "confirmed",
          cookName,
          cookRating,
        };
      });
    } else if (status === "completed") {
      // Bookings terminés - pour "Mes demandes", on veut les demandes publiques qui ont été complétées
      const completedBookings = bookings.filter((b) => {
        const statusLower = (b.status || "").toLowerCase();
        return statusLower === "done" || statusLower === "completed" || b.status === "COMPLETED";
      });
      
      requests = completedBookings.map((booking) => {
        const cook = (booking as any).cook || {};
        const cookName = cook.first_name && cook.last_name 
          ? `${cook.first_name} ${cook.last_name}` 
          : cook.name || (booking as any).cookName || "Cuisinier";
        const cookRating = cook.average_rating || cook.rating || (booking as any).cookRating;
        
        const timeSlot = booking.time 
          ? booking.time.includes(":") 
            ? booking.time 
            : `${booking.time}h`
          : booking.start_time && booking.end_time
          ? `${booking.start_time} - ${booking.end_time}`
          : "Non spécifié";
        
        return {
          id: booking.id,
          title: (booking as any).title || booking.specialRequests || "Repas terminé",
          description: booking.specialRequests || (booking as any).description || "Aucune description",
          date: booking.date || booking.booking_date,
          timeSlot,
          guestCount: booking.numberOfGuests || booking.number_of_guests,
          budget: booking.totalPrice || booking.total_price || booking.budget || 0,
          address: (booking as any).address || (booking as any).location?.address || "Adresse non spécifiée",
          status: "completed",
          cookName,
          cookRating,
        };
      });
    }

    return requests;
  }, [bookings, proposals, status, isLoadingBookings, isLoadingProposals]);

  // Mettre à jour requests quand filteredRequests change
  useEffect(() => {
    setRequests(filteredRequests);
  }, [filteredRequests]);

  if (isLoading || isLoadingBookings || isLoadingProposals) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Calculer les coordonnées pour la carte
  const mapMarkers = useMemo(() => {
    return requests
      .filter((req) => {
        const address = req.address || (req as any).location?.address;
        const location = (req as any).address?.location || (req as any).location?.location;
        return address && location;
      })
      .map((request) => {
        const location = (request as any).address?.location || (request as any).location?.location;
        const locationObj = location as { lat?: number; lng?: number; latitude?: number; longitude?: number } | undefined;
        if (!locationObj) return null;

        const lat = locationObj.lat ?? locationObj.latitude;
        const lng = locationObj.lng ?? locationObj.longitude;
        if (!lat || !lng) return null;

        const statusLower = (request.status || "").toLowerCase();
        let color = "#3b82f6"; // Bleu par défaut
        if (statusLower === "confirmed" || statusLower === "proposition_accepted") {
          color = "#10b981"; // Vert
        } else if (statusLower === "completed" || statusLower === "done") {
          color = "#6b7280"; // Gris
        } else if (statusLower === "cancelled") {
          color = "#ef4444"; // Rouge
        }

        return {
          id: request.id,
          lat,
          lng,
          title: request.title || "Demande de repas",
          description: `${request.guestCount || 0} personne(s) • ${request.budget || 0}€`,
          color,
        };
      })
      .filter((marker): marker is NonNullable<typeof marker> => marker !== null);
  }, [requests]);

  // Calculer le centre de la carte (moyenne des coordonnées)
  const mapCenter = useMemo(() => {
    if (mapMarkers.length === 0) return [48.8566, 2.3522] as [number, number]; // Paris par défaut
    const avgLat = mapMarkers.reduce((sum, m) => sum + m.lat, 0) / mapMarkers.length;
    const avgLng = mapMarkers.reduce((sum, m) => sum + m.lng, 0) / mapMarkers.length;
    return [avgLat, avgLng] as [number, number];
  }, [mapMarkers]);

  if (requests.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">
          Aucune demande {status === "pending" ? "en attente" : status === "confirmed" ? "confirmée" : "terminée"}.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toggle Vue Liste/Carte */}
      {requests.length > 0 && (
        <div className="flex items-center justify-end">
          <div className="flex items-center gap-2 border border-border rounded-lg p-1 bg-card">
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
      )}

      {/* Vue Carte ou Liste */}
      {viewMode === "map" ? (
        mapMarkers.length > 0 ? (
          <div className="bg-card border border-border rounded-xl overflow-hidden shadow-lg" style={{ height: "600px" }}>
            <MapboxMap
              center={mapCenter}
              zoom={11}
              markers={mapMarkers}
              height="100%"
              interactive={true}
              onMarkerClick={(marker) => {
                const request = requests.find((r) => r.id === marker.id);
                if (request) {
                  // Scroll vers la demande dans la liste ou ouvrir les détails
                  const element = document.getElementById(`request-${request.id}`);
                  if (element) {
                    element.scrollIntoView({ behavior: "smooth", block: "center" });
                    setViewMode("list");
                  }
                }
              }}
            />
          </div>
        ) : (
          <div className="bg-card border border-border rounded-xl p-8 text-center">
            <Map className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              Aucune adresse disponible pour afficher la carte
            </p>
          </div>
        )
      ) : (
        <div className="grid gap-4">
          {requests.map((request, index) => (
            <div key={request.id} id={`request-${request.id}`}>
              <RequestCard request={request} index={index} reloadData={reloadData} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface RequestCardProps {
  request: any;
  index: number;
  reloadData: () => Promise<void>;
}

function RequestCard({ request, index, reloadData }: RequestCardProps) {
  const [showPropositions, setShowPropositions] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDuplicating, setIsDuplicating] = useState(false);

  const getStatusConfig = (status: string) => {
    const statusLower = status.toLowerCase();
    
    if (statusLower === "pending" || statusLower === "proposition_pending" || statusLower === "payment_pending") {
      return {
        label: "En attente de propositions",
      color: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20",
        icon: Clock,
        step: 1,
        totalSteps: 5,
      };
    }
    if (statusLower === "confirmed" || statusLower === "proposition_accepted") {
      return {
      label: "Confirmée",
      color: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20",
        icon: CheckCircle2,
        step: 3,
        totalSteps: 5,
      };
    }
    if (statusLower === "completed" || statusLower === "done") {
      return {
      label: "Terminée",
      color: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
        icon: CheckCircle2,
        step: 5,
        totalSteps: 5,
      };
    }
    if (statusLower === "cancelled") {
      return {
        label: "Annulée",
        color: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
        icon: XCircle,
        step: 0,
        totalSteps: 5,
  };
    }
    
    return {
      label: status,
      color: "bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20",
      icon: AlertCircle,
      step: 1,
      totalSteps: 5,
    };
  };

  const statusConfig = getStatusConfig(request.status);
  const StatusIcon = statusConfig.icon;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: index * 0.1 }}
        className="bg-card border border-border rounded-xl p-6 hover:shadow-lg transition-shadow"
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <h3 className="font-cera text-xl font-bold text-foreground">
                {request.title}
              </h3>
              <span
                className={`px-3 py-1.5 rounded-full text-xs font-medium border flex items-center gap-1.5 ${statusConfig.color}`}
              >
                <StatusIcon className="w-3.5 h-3.5" />
                {statusConfig.label}
              </span>
              {request.proposalCount > 0 && request.status === "pending" && (
                <span className="px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-medium flex items-center gap-1.5 animate-pulse">
                  <Bell className="w-3.5 h-3.5" />
                  {request.proposalCount} nouvelle{request.proposalCount > 1 ? "s" : ""} proposition{request.proposalCount > 1 ? "s" : ""}
                </span>
              )}
            </div>
            <p className="text-muted-foreground mb-4">{request.description}</p>
          </div>
        </div>

        {/* Détails */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 dark:bg-blue-500/20 flex items-center justify-center">
              <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <span>{formatDate(request.date)}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 dark:bg-purple-500/20 flex items-center justify-center">
              <Clock className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            </div>
            <span>{request.timeSlot}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="w-8 h-8 rounded-lg bg-orange-500/10 dark:bg-orange-500/20 flex items-center justify-center">
              <Users className="w-4 h-4 text-orange-600 dark:text-orange-400" />
            </div>
            <span>{request.guestCount} personne{request.guestCount > 1 ? "s" : ""}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="w-8 h-8 rounded-lg bg-green-500/10 dark:bg-green-500/20 flex items-center justify-center">
              <Euro className="w-4 h-4 text-green-600 dark:text-green-400" />
            </div>
            <span>{request.budget} €</span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
          <div className="w-8 h-8 rounded-lg bg-pink-500/10 dark:bg-pink-500/20 flex items-center justify-center">
            <MapPin className="w-4 h-4 text-pink-600 dark:text-pink-400" />
          </div>
          <span>{request.address}</span>
        </div>

        {/* Timeline du flux */}
        {statusConfig.step > 0 && (
          <div className="mb-4 p-4 bg-accent/50 rounded-lg border border-border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-muted-foreground">Progression</span>
              <span className="text-xs text-muted-foreground">
                Étape {statusConfig.step} sur {statusConfig.totalSteps}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((step) => {
                const isCompleted = step <= statusConfig.step;
                const isCurrent = step === statusConfig.step;
                
                return (
                  <div key={step} className="flex items-center flex-1">
                    <div className="flex items-center gap-2 flex-1">
                      <div
                        className={`
                          w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all
                          ${isCompleted
                            ? "bg-green-500 text-white"
                            : "bg-muted text-muted-foreground"
                          }
                          ${isCurrent ? "ring-2 ring-green-500 ring-offset-2" : ""}
                        `}
                      >
                        {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : step}
                      </div>
                      {step < 5 && (
                        <div
                          className={`flex-1 h-1 rounded-full transition-all ${
                            isCompleted ? "bg-green-500" : "bg-muted"
                          }`}
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
              <span>Publication</span>
              <span>Propositions</span>
              <span>Acceptation</span>
              <span>Paiement</span>
              <span>Service</span>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <div className="flex items-center gap-2 flex-wrap">
            {request.status === "pending" && (
              <>
              <Button
                  variant="default"
                size="sm"
                asChild
                  className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Link href={`/dashboard/client/requests/${request.id}/proposals`}>
                    {request.proposalCount > 0 ? (
                      <>
                        <Bell className="w-4 h-4 mr-2 animate-pulse" />
                        Voir les propositions ({request.proposalCount})
                      </>
                    ) : (
                      <>
                  <MessageSquare className="w-4 h-4 mr-2" />
                        Voir les propositions
                      </>
                    )}
                </Link>
              </Button>
                {request.proposalCount > 0 && (
                  <div className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/20 px-2 py-1 rounded-full">
                    <Sparkles className="w-3 h-3" />
                    Nouvelles propositions disponibles
                  </div>
                )}
              </>
            )}
            {request.status === "confirmed" && request.cookName && (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-sm bg-green-50 dark:bg-green-950/20 px-3 py-1.5 rounded-lg border border-green-200 dark:border-green-800">
                  <ChefHat className="w-4 h-4 text-green-600 dark:text-green-400" />
                  <div>
                    <span className="text-muted-foreground text-xs">Chef assigné : </span>
                <span className="font-medium text-foreground">{request.cookName}</span>
                {request.cookRating && (
                  <span className="ml-2 text-yellow-600 dark:text-yellow-400">
                    ⭐ {request.cookRating}
                  </span>
                )}
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                >
                  <Link href={`/dashboard/client/bookings/${request.id}`}>
                    <Eye className="w-4 h-4 mr-2" />
                    Voir les détails
                  </Link>
                </Button>
              </div>
            )}
            {request.status === "completed" && (
              <div className="flex items-center gap-2">
                <div className="text-sm text-muted-foreground">
                  Service terminé
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                >
                  <Link href={`/dashboard/client/bookings/${request.id}`}>
                    <Eye className="w-4 h-4 mr-2" />
                    Voir l'historique
                  </Link>
                </Button>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Actions rapides selon le statut */}
            {request.status === "pending" && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowEditModal(true)}
                  className="flex items-center gap-2"
                >
                  <Edit className="w-4 h-4" />
                  Modifier
                </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={async () => {
                setIsDuplicating(true);
                const queryParams = new URLSearchParams({
                  duplicate: request.id,
                  title: request.title,
                  description: request.description,
                  date: request.date,
                  timeSlot: request.timeSlot,
                  guestCount: request.guestCount.toString(),
                  budget: request.budget.toString(),
                  address: request.address,
                });
                window.location.href = `/dashboard/client/requests/new?${queryParams.toString()}`;
                setTimeout(() => setIsDuplicating(false), 500);
              }}
              disabled={isDuplicating}
                  className="flex items-center gap-2"
            >
                  <Copy className="w-4 h-4" />
              Dupliquer
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => setShowDeleteDialog(true)}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Supprimer
                </Button>
              </>
            )}
            {(request.status === "confirmed" || request.status === "completed") && (
              <Button
                variant="ghost"
                size="sm"
                onClick={async () => {
                  setIsDuplicating(true);
                  const queryParams = new URLSearchParams({
                    duplicate: request.id,
                    title: request.title,
                    description: request.description,
                    date: request.date,
                    timeSlot: request.timeSlot,
                    guestCount: request.guestCount.toString(),
                    budget: request.budget.toString(),
                    address: request.address,
                  });
                  window.location.href = `/dashboard/client/requests/new?${queryParams.toString()}`;
                  setTimeout(() => setIsDuplicating(false), 500);
                }}
                disabled={isDuplicating}
                className="flex items-center gap-2"
              >
                <Copy className="w-4 h-4" />
                Réutiliser
              </Button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Modal des propositions */}
      {showPropositions && (
        <PropositionsModal
          requestId={request.id}
          isOpen={showPropositions}
          onClose={() => setShowPropositions(false)}
        />
      )}

      {/* Modal de modification */}
      <EditRequestModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        request={request}
      />

      {/* Dialog de suppression */}
      <DeleteRequestDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={async () => {
          setIsDeleting(true);
          try {
            // Annuler la réservation via l'API
            await apiClient.cancelBooking(request.id, "CLIENT_REQUEST", "Demande annulée par le client");
            // Recharger les données
            await reloadData();
          } catch (error) {
            console.error("Erreur lors de l'annulation de la demande:", error);
            alert("Erreur lors de l'annulation de la demande. Veuillez réessayer.");
          } finally {
            setIsDeleting(false);
            setShowDeleteDialog(false);
          }
        }}
        requestTitle={request.title}
        hasProposals={request.proposalCount ? request.proposalCount > 0 : false}
        proposalCount={request.proposalCount}
        isDeleting={isDeleting}
      />
    </>
  );
}
