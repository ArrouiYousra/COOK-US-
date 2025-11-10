"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Calendar,
  Clock,
  Users,
  Euro,
  MapPin,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDate } from "@/lib/utils";
import { ProposeToRequestModal } from "@/components/dashboard/cook/ProposeToRequestModal";

// Mock data - À remplacer par les vraies données
const mockClientRequests = [
  {
    id: "1",
    clientName: "Sophie Martin",
    title: "Dîner romantique pour 2",
    description: "Cuisine française, menu surprise pour un anniversaire",
    date: "2024-12-28",
    timeSlot: "Dîner (19h-21h)",
    numberOfGuests: 2,
    budget: 150,
    address: "123 Rue de la Paix, 75001 Paris",
    createdAt: "2024-12-26T10:00:00Z",
    status: "pending",
    hasApplied: false,
  },
  {
    id: "2",
    clientName: "Pierre Dubois",
    title: "Brunch dominical",
    description: "Pancakes, œufs bénédictine, fruits frais",
    date: "2024-12-29",
    timeSlot: "Midi (12h-14h)",
    numberOfGuests: 4,
    budget: 200,
    address: "45 Avenue des Champs, 75008 Paris",
    createdAt: "2024-12-25T14:00:00Z",
    status: "pending",
    hasApplied: true,
  },
  {
    id: "3",
    clientName: "Marie Laurent",
    title: "Repas de famille",
    description: "Cuisine italienne traditionnelle",
    date: "2025-01-05",
    timeSlot: "Dîner (19h-21h)",
    numberOfGuests: 6,
    budget: 300,
    address: "78 Boulevard Saint-Germain, 75006 Paris",
    createdAt: "2024-12-24T09:00:00Z",
    status: "pending",
    hasApplied: false,
  },
];

type RequestStatusFilter = "all" | "pending" | "applied" | "accepted" | "rejected";

/**
 * Page "Demandes clients"
 * Liste des demandes publiques des clients auxquelles le cuisinier peut répondre
 */
export default function CookRequestsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<RequestStatusFilter>("all");
  const [selectedRequest, setSelectedRequest] = useState<string | null>(null);
  const [isProposeModalOpen, setIsProposeModalOpen] = useState(false);

  const filteredRequests = mockClientRequests.filter((request) => {
    // Filtre par recherche
    if (
      searchQuery &&
      !request.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !request.description.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !request.clientName.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }

    // Filtre par statut
    if (statusFilter === "applied" && !request.hasApplied) return false;
    if (statusFilter === "pending" && request.hasApplied) return false;
    if (statusFilter !== "all" && statusFilter !== "pending" && statusFilter !== "applied") {
      return false; // TODO: Gérer accepted/rejected
    }

    return true;
  });

  const handlePropose = (requestId: string) => {
    setSelectedRequest(requestId);
    setIsProposeModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-trebuchet text-3xl lg:text-4xl font-bold text-foreground mb-2">
          Demandes Clients
        </h1>
        <p className="text-muted-foreground">
          Découvrez les demandes et proposez vos services
        </p>
      </div>

      {/* Barre de recherche et filtres */}
      <div className="bg-card border border-border rounded-xl p-4 lg:p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Recherche */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Rechercher une demande..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filtres par statut */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {[
              { id: "all" as const, label: "Toutes" },
              { id: "pending" as const, label: "Nouvelles" },
              { id: "applied" as const, label: "Mes propositions" },
            ].map((filter) => (
              <button
                key={filter.id}
                onClick={() => setStatusFilter(filter.id)}
                className={`
                  px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors
                  ${
                    statusFilter === filter.id
                      ? "bg-blue-600 text-white"
                      : "bg-accent text-foreground hover:bg-accent/80"
                  }
                `}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Liste des demandes */}
      {filteredRequests.length === 0 ? (
        <div className="text-center py-12 bg-card border border-border rounded-xl">
          <p className="text-muted-foreground">
            Aucune demande ne correspond à vos critères
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredRequests.map((request, index) => (
            <RequestCard
              key={request.id}
              request={request}
              index={index}
              onPropose={() => handlePropose(request.id)}
            />
          ))}
        </div>
      )}

      {/* Modal de proposition */}
      {isProposeModalOpen && selectedRequest && (
        <ProposeToRequestModal
          requestId={selectedRequest}
          request={mockClientRequests.find((r) => r.id === selectedRequest)!}
          isOpen={isProposeModalOpen}
          onClose={() => {
            setIsProposeModalOpen(false);
            setSelectedRequest(null);
          }}
        />
      )}
    </div>
  );
}

interface RequestCardProps {
  request: typeof mockClientRequests[0];
  index: number;
  onPropose: () => void;
}

function RequestCard({ request, index, onPropose }: RequestCardProps) {
  return (
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
            {request.hasApplied && (
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                Proposition envoyée
              </span>
            )}
          </div>
          <p className="text-muted-foreground mb-4">{request.description}</p>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <span className="font-medium text-foreground">Client :</span>
            <span>{request.clientName}</span>
          </div>
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
          <span>{request.numberOfGuests} personne{request.numberOfGuests > 1 ? "s" : ""}</span>
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
        <div className="text-xs text-muted-foreground">
          Publiée le {formatDate(request.createdAt)}
        </div>
        <div className="flex items-center gap-2">
          {!request.hasApplied ? (
            <Button
              onClick={onPropose}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Faire une proposition
            </Button>
          ) : (
            <Button variant="outline" disabled>
              <CheckCircle className="w-4 h-4 mr-2" />
              Proposition envoyée
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

