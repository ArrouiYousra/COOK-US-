"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDate, formatDateTime } from "@/lib/utils";
import { apiClient } from "@/lib/api/client";
import { useAuthStore } from "@/stores/authStore";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { CreateReservationModal } from "@/components/dashboard/reservations/CreateReservationModal";
import { MapboxMap } from "@/components/mapbox/MapboxMap";

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
  const [publicRequests, setPublicRequests] = useState<any[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
  const [isProposalModalOpen, setIsProposalModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "map">("list");

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
        setPublicRequests(response.bookings || []);
      } catch (err: any) {
        console.error("Erreur lors du chargement des demandes publiques:", err);
        setError(err.response?.data?.message || "Impossible de charger les demandes publiques");
      } finally {
        setIsLoading(false);
      }
    };

    if (!isAuthLoading && isAuthenticated && user) {
      loadPublicRequests();
    }
  }, [isAuthLoading, isAuthenticated, user, cityFilter]);

  // Filtrer les demandes par recherche
  const filteredRequests = publicRequests.filter((request) => {
    const searchLower = searchQuery.toLowerCase();
    const clientName = `${request.client?.firstName || ""} ${request.client?.lastName || ""}`.toLowerCase();
    const specialRequests = (request.special_requests || "").toLowerCase();
    const address = (request.address?.address || "").toLowerCase();
    
    return (
      clientName.includes(searchLower) ||
      specialRequests.includes(searchLower) ||
      address.includes(searchLower)
    );
  });

  const handlePropose = (request: any) => {
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
      } catch (err: any) {
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

      {/* Barre de recherche et filtres */}
      <div className="bg-card border border-border rounded-xl p-4 lg:p-6">
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
      </div>

      {/* Liste des demandes ou Carte */}
      {filteredRequests.length === 0 ? (
        <div className="text-center py-12 bg-card border border-border rounded-xl">
          <p className="text-muted-foreground">
            {publicRequests.length === 0
              ? "Aucune demande publique disponible pour le moment"
              : "Aucune demande ne correspond à vos critères"}
          </p>
        </div>
      ) : viewMode === "map" ? (
        <div className="bg-card border border-border rounded-xl overflow-hidden" style={{ height: "600px" }}>
          <MapboxMap
            center={
              filteredRequests[0]?.address?.location
                ? [filteredRequests[0].address.location.lat, filteredRequests[0].address.location.lng]
                : [48.8566, 2.3522]
            }
            zoom={11}
            markers={filteredRequests
              .filter((req) => req.address?.location)
              .map((request) => ({
                id: request.id,
                lat: request.address.location.lat,
                lng: request.address.location.lng,
                title: `${request.client?.firstName || ""} ${request.client?.lastName || ""}`.trim() || "Client",
                description: request.special_requests || "",
                color: "#3b82f6",
              }))}
            height="100%"
            onMarkerClick={(marker) => {
              const request = filteredRequests.find((r) => r.id === marker.id);
              if (request) {
                handlePropose(request);
              }
            }}
          />
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredRequests.map((request, index) => (
            <RequestCard
              key={request.id}
              request={request}
              index={index}
              onPropose={() => handlePropose(request)}
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
  request: any;
  index: number;
  onPropose: () => void;
}

function RequestCard({ request, index, onPropose }: RequestCardProps) {
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
          <p className="text-xs text-muted-foreground text-center">
            Publié le {format(new Date(request.created_at), "d MMM yyyy", { locale: fr })}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
