"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Calendar, Clock, Users, Euro, MapPin, Eye, Edit, Trash2, Copy, Loader2, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { PropositionsModal } from "./PropositionsModal";
import { EditRequestModal } from "./EditRequestModal";
import { DeleteRequestDialog } from "./DeleteRequestDialog";
import { useBookingStore } from "@/stores/bookingStore";
import { apiClient } from "@/lib/api/client";
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
    <div className="grid gap-4">
      {requests.map((request, index) => (
        <RequestCard key={request.id} request={request} index={index} reloadData={reloadData} />
      ))}
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

  const statusConfig = {
    pending: {
      label: "En attente",
      color: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20",
    },
    confirmed: {
      label: "Confirmée",
      color: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20",
    },
    completed: {
      label: "Terminée",
      color: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
    },
  };

  const config = statusConfig[request.status as keyof typeof statusConfig];

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
            <div className="flex items-center gap-3 mb-2">
              <h3 className="font-cera text-xl font-bold text-foreground">
                {request.title}
              </h3>
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium border ${config.color}`}
              >
                {config.label}
              </span>
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

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <div className="flex items-center gap-2">
            {request.status === "pending" && (
              <Button
                variant="outline"
                size="sm"
                asChild
              >
                <Link href={`/dashboard/client/requests/${request.id}/proposals`}>
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Voir les propositions {request.proposalCount > 0 && `(${request.proposalCount})`}
                </Link>
              </Button>
            )}
            {request.status === "confirmed" && request.cookName && (
              <div className="text-sm">
                <span className="text-muted-foreground">Chef : </span>
                <span className="font-medium text-foreground">{request.cookName}</span>
                {request.cookRating && (
                  <span className="ml-2 text-yellow-600 dark:text-yellow-400">
                    ⭐ {request.cookRating}
                  </span>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            {/* Bouton dupliquer (tous statuts) */}
            <Button
              variant="ghost"
              size="sm"
              onClick={async () => {
                setIsDuplicating(true);
                // TODO: Appel API pour dupliquer la demande
                // await apiClient.duplicateRequest(request.id);
                // Rediriger vers la page de création avec les données pré-remplies
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
            >
              <Copy className="w-4 h-4 mr-2" />
              Dupliquer
            </Button>
            {request.status === "pending" && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowEditModal(true)}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Modifier
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => setShowDeleteDialog(true)}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Supprimer
                </Button>
              </>
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
