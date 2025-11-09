"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Calendar, Clock, Users, Euro, MapPin, Eye, Edit, Trash2, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { PropositionsModal } from "./PropositionsModal";
import { EditRequestModal } from "./EditRequestModal";
import { DeleteRequestDialog } from "./DeleteRequestDialog";

// Mock data - À remplacer par les vraies données
const mockRequests = {
  pending: [
    {
      id: "1",
      title: "Dîner romantique pour 2",
      description: "Cuisine française, menu surprise",
      date: "2024-01-20",
      timeSlot: "Dîner (19h-21h)",
      guestCount: 2,
      budget: 150,
      address: "123 Rue de la Paix, 75001 Paris",
      status: "pending",
      proposalCount: 3,
    },
    {
      id: "2",
      title: "Brunch dominical",
      description: "Pancakes, œufs bénédictine, fruits frais",
      date: "2024-01-21",
      timeSlot: "Midi (12h-14h)",
      guestCount: 4,
      budget: 200,
      address: "45 Avenue des Champs, 75008 Paris",
      status: "pending",
      proposalCount: 1,
    },
  ],
  confirmed: [
    {
      id: "3",
      title: "Repas de famille",
      description: "Cuisine italienne traditionnelle",
      date: "2024-01-15",
      timeSlot: "Dîner (19h-21h)",
      guestCount: 6,
      budget: 300,
      address: "78 Boulevard Saint-Germain, 75006 Paris",
      status: "confirmed",
      cookName: "Sophie Dubois",
      cookRating: 4.8,
    },
  ],
  completed: [
    {
      id: "4",
      title: "Anniversaire surprise",
      description: "Menu gastronomique 5 services",
      date: "2024-01-10",
      timeSlot: "Dîner (19h-21h)",
      guestCount: 8,
      budget: 500,
      address: "12 Rue de Rivoli, 75004 Paris",
      status: "completed",
      cookName: "Marie Martin",
      cookRating: 4.9,
    },
  ],
};

interface RequestsListProps {
  status: "pending" | "confirmed" | "completed";
}

/**
 * Liste des demandes avec cartes
 * Affiche les demandes selon leur statut
 */
export function RequestsList({ status }: RequestsListProps) {
  const requests = mockRequests[status] || [];

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
          // TODO: Appel API pour supprimer la demande
          // await deleteRequest(request.id);
          console.log("Suppression de la demande:", request.id);
          setTimeout(() => {
            setIsDeleting(false);
            setShowDeleteDialog(false);
          }, 1000);
        }}
        requestTitle={request.title}
        hasProposals={request.proposalCount ? request.proposalCount > 0 : false}
        proposalCount={request.proposalCount}
        isDeleting={isDeleting}
      />
    </>
  );
}

