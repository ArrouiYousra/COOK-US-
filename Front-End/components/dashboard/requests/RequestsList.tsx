"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Calendar, Clock, Users, Euro, MapPin, Eye, Edit, Trash2, Copy, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { PropositionsModal } from "./PropositionsModal";
import { EditRequestModal } from "./EditRequestModal";
import { DeleteRequestDialog } from "./DeleteRequestDialog";
import { useBookingStore } from "@/stores/bookingStore";
import { apiClient } from "@/lib/api/client";

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

  useEffect(() => {
    const loadRequests = async () => {
      setIsLoading(true);
      try {
        // Charger les bookings et propositions en parallèle
        await Promise.all([
          fetchBookings({ limit: 100 }),
          fetchProposals({ filter: "pending", limit: 100 }),
        ]);

        // Transformer les données selon le statut demandé
        let filteredRequests: any[] = [];

        if (status === "pending") {
          // Bookings en attente (proposition_pending, payment_pending) + propositions en attente
          const pendingBookings = bookings.filter(
            (b) => b.status === "proposition_pending" || b.status === "payment_pending" || b.status === "pending"
          );
          
          // Transformer les bookings en format request
          filteredRequests = pendingBookings.map((booking) => {
            // Compter les propositions pour ce booking
            const proposalCount = proposals.filter((p) => p.id === booking.id || p.requestId === booking.id).length;
            
            // Formater l'heure si disponible
            const timeSlot = booking.time 
              ? booking.time.includes(":") 
                ? booking.time 
                : `${booking.time}h`
              : "Non spécifié";
            
            return {
              id: booking.id,
              title: (booking as any).title || booking.specialRequests || "Demande de repas",
              description: booking.specialRequests || (booking as any).description || "Aucune description",
              date: booking.date,
              timeSlot,
              guestCount: booking.numberOfGuests,
              budget: booking.totalPrice,
              address: (booking as any).address || (booking as any).location?.address || "Adresse non spécifiée",
              status: "pending",
              proposalCount,
            };
          });
        } else if (status === "confirmed") {
          // Bookings confirmés
          const confirmedBookings = bookings.filter((b) => b.status === "confirmed");
          
          filteredRequests = confirmedBookings.map((booking) => {
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
              : "Non spécifié";
            
            return {
              id: booking.id,
              title: (booking as any).title || booking.specialRequests || "Repas confirmé",
              description: booking.specialRequests || (booking as any).description || "Aucune description",
              date: booking.date,
              timeSlot,
              guestCount: booking.numberOfGuests,
              budget: booking.totalPrice,
              address: (booking as any).address || (booking as any).location?.address || "Adresse non spécifiée",
              status: "confirmed",
              cookName,
              cookRating,
            };
          });
        } else if (status === "completed") {
          // Bookings terminés
          const completedBookings = bookings.filter((b) => b.status === "done" || b.status === "completed");
          
          filteredRequests = completedBookings.map((booking) => {
            const cook = (booking as any).cook || {};
            const cookName = cook.first_name && cook.last_name 
              ? `${cook.first_name} ${cook.last_name}` 
              : cook.name || (booking as any).cookName || "Cuisinier";
            const cookRating = cook.average_rating || cook.rating || (booking as any).cookRating;
            
            const timeSlot = booking.time 
              ? booking.time.includes(":") 
                ? booking.time 
                : `${booking.time}h`
              : "Non spécifié";
            
            return {
              id: booking.id,
              title: (booking as any).title || booking.specialRequests || "Repas terminé",
              description: booking.specialRequests || (booking as any).description || "Aucune description",
              date: booking.date,
              timeSlot,
              guestCount: booking.numberOfGuests,
              budget: booking.totalPrice,
              address: (booking as any).address || (booking as any).location?.address || "Adresse non spécifiée",
              status: "completed",
              cookName,
              cookRating,
            };
          });
        }

        setRequests(filteredRequests);
      } catch (error) {
        console.error("Erreur lors du chargement des demandes:", error);
        setRequests([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]); // Recharger uniquement quand le statut change

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
        <RequestCard key={request.id} request={request} index={index} />
      ))}
    </div>
  );
}

interface RequestCardProps {
  request: any;
  index: number;
}

function RequestCard({ request, index }: RequestCardProps) {
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
            {request.status === "pending" && request.proposalCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPropositions(true)}
              >
                <Eye className="w-4 h-4 mr-2" />
                Voir les propositions ({request.proposalCount})
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
