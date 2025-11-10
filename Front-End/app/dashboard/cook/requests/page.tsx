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
  CheckCircle,
  XCircle,
  Loader2,
  AlertCircle,
  MessageSquare,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDate, formatDateTime } from "@/lib/utils";
import { apiClient } from "@/lib/api/client";
import { useAuthStore } from "@/stores/authStore";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

type RequestStatusFilter = "all" | "pending" | "accepted" | "rejected";

/**
 * Page "Demandes clients"
 * Liste des demandes de réservation reçues par le cuisinier
 */
export default function CookRequestsPage() {
  const router = useRouter();
  const { user, isAuthenticated, checkAuth, isLoading: isAuthLoading } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<RequestStatusFilter>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<any | null>(null);
  const [isActionDialogOpen, setIsActionDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<"accept" | "reject" | null>(null);
  const [rejectionMessage, setRejectionMessage] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // Vérifier l'authentification au montage
  useEffect(() => {
    const verifyAuth = async () => {
      if (!isAuthenticated && !isAuthLoading) {
        try {
          await checkAuth();
        } catch (error) {
          console.warn("Authentification échouée, redirection vers la page de connexion");
          router.push("/auth/login");
        }
      }
    };

    if (!isAuthLoading) {
      verifyAuth();
    }
  }, [isAuthenticated, checkAuth, router, isAuthLoading]);

  // Charger les demandes
  useEffect(() => {
    const loadRequests = async () => {
      if (isAuthLoading) return;
      if (!isAuthenticated || !user) return;

      setIsLoading(true);
      setError(null);

      try {
        // Récupérer toutes les réservations, puis filtrer côté client
        const response = await apiClient.getBookings({ limit: 1000 });
        const allBookings = response.bookings || [];

        // Filtrer pour ne garder que les bookings où le cuisinier est impliqué
        // Pour un cuisinier, ce sont les bookings où cook_profile_id correspond à son profil
        setBookings(allBookings);
      } catch (err: any) {
        console.error("Erreur lors du chargement des demandes:", err);
        setError(err.response?.data?.message || "Impossible de charger les demandes");
      } finally {
        setIsLoading(false);
      }
    };

    if (!isAuthLoading && isAuthenticated && user) {
      loadRequests();
    }
  }, [isAuthenticated, user, isAuthLoading]);

  // Filtrer les demandes
  const filteredBookings = bookings.filter((booking) => {
    // Filtre par statut
    if (statusFilter === "pending" && booking.status !== "PENDING") return false;
    if (statusFilter === "accepted" && !["ACCEPTED", "CONFIRMED"].includes(booking.status)) return false;
    if (statusFilter === "rejected" && booking.status !== "CANCELLED") return false;

    // Filtre par recherche
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const clientName = booking.client?.first_name && booking.client?.last_name
        ? `${booking.client.first_name} ${booking.client.last_name}`.toLowerCase()
        : "";
      const specialRequests = booking.special_requests?.toLowerCase() || "";
      const bookingId = booking.id?.toLowerCase() || "";

      if (
        !clientName.includes(query) &&
        !specialRequests.includes(query) &&
        !bookingId.includes(query)
      ) {
        return false;
      }
    }

    return true;
  });

  const handleAccept = (booking: any) => {
    setSelectedBooking(booking);
    setActionType("accept");
    setIsActionDialogOpen(true);
  };

  const handleReject = (booking: any) => {
    setSelectedBooking(booking);
    setActionType("reject");
    setRejectionMessage("");
    setIsActionDialogOpen(true);
  };

  const handleConfirmAction = async () => {
    if (!selectedBooking || !actionType) return;

    setIsProcessing(true);

    try {
      if (actionType === "accept") {
        await apiClient.acceptBooking(selectedBooking.id);
        setSuccessMessage("La demande de réservation a été acceptée avec succès.");
      } else if (actionType === "reject") {
        await apiClient.rejectBooking(selectedBooking.id);
        setSuccessMessage("La demande de réservation a été rejetée.");
      }

      // Recharger les demandes
      const response = await apiClient.getBookings({ limit: 1000 });
      setBookings(response.bookings || []);

      setIsActionDialogOpen(false);
      setSelectedBooking(null);
      setActionType(null);
      setRejectionMessage("");

      // Effacer le message de succès après 3 secondes
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      console.error("Erreur lors de l'action:", err);
      setError(err.response?.data?.message || "Une erreur est survenue");
      setTimeout(() => setError(null), 5000);
    } finally {
      setIsProcessing(false);
    }
  };

  // Afficher un loader pendant le chargement
  if (isLoading || isAuthLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Chargement des demandes...</p>
        </div>
      </div>
    );
  }

  // Afficher une erreur si nécessaire
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4 text-center">
          <AlertCircle className="w-8 h-8 text-destructive" />
          <p className="text-destructive">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-trebuchet text-3xl lg:text-4xl font-bold text-foreground mb-2">
          Demandes de Réservation
        </h1>
        <p className="text-muted-foreground">
          Gérez les demandes de réservation reçues de vos clients
        </p>
      </div>

      {/* Messages de succès/erreur */}
      {successMessage && (
        <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
          <p className="text-sm text-green-600 dark:text-green-400">{successMessage}</p>
        </div>
      )}

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
              placeholder="Rechercher par client, message ou ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filtres par statut */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {[
              { id: "all" as const, label: "Toutes" },
              { id: "pending" as const, label: "En attente" },
              { id: "accepted" as const, label: "Acceptées" },
              { id: "rejected" as const, label: "Rejetées" },
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
      {filteredBookings.length === 0 ? (
        <div className="text-center py-12 bg-card border border-border rounded-xl">
          <p className="text-muted-foreground">
            {bookings.length === 0
              ? "Aucune demande de réservation pour le moment"
              : "Aucune demande ne correspond à vos critères"}
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredBookings.map((booking, index) => (
            <RequestCard
              key={booking.id}
              booking={booking}
              index={index}
              onAccept={() => handleAccept(booking)}
              onReject={() => handleReject(booking)}
            />
          ))}
        </div>
      )}

      {/* Dialog de confirmation d'action */}
      <Dialog open={isActionDialogOpen} onOpenChange={setIsActionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === "accept" ? "Accepter la demande" : "Rejeter la demande"}
            </DialogTitle>
            <DialogDescription>
              {actionType === "accept"
                ? "Êtes-vous sûr de vouloir accepter cette demande de réservation ?"
                : "Voulez-vous rejeter cette demande de réservation ? Vous pouvez ajouter un message optionnel."}
            </DialogDescription>
          </DialogHeader>

          {actionType === "reject" && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="rejectionMessage">Message (optionnel)</Label>
                <Textarea
                  id="rejectionMessage"
                  placeholder="Expliquez pourquoi vous rejetez cette demande..."
                  value={rejectionMessage}
                  onChange={(e) => setRejectionMessage(e.target.value)}
                  rows={4}
                />
              </div>
            </div>
          )}

          <div className="flex gap-4 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setIsActionDialogOpen(false);
                setSelectedBooking(null);
                setActionType(null);
                setRejectionMessage("");
              }}
              disabled={isProcessing}
              className="flex-1"
            >
              Annuler
            </Button>
            <Button
              onClick={handleConfirmAction}
              disabled={isProcessing}
              className={`flex-1 ${
                actionType === "accept"
                  ? "bg-green-600 hover:bg-green-700 text-white"
                  : "bg-red-600 hover:bg-red-700 text-white"
              }`}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Traitement...
                </>
              ) : actionType === "accept" ? (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Accepter
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4 mr-2" />
                  Rejeter
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface RequestCardProps {
  booking: any;
  index: number;
  onAccept: () => void;
  onReject: () => void;
}

function RequestCard({ booking, index, onAccept, onReject }: RequestCardProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return (
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border border-yellow-500/20">
            En attente
          </span>
        );
      case "ACCEPTED":
      case "CONFIRMED":
        return (
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20">
            Acceptée
          </span>
        );
      case "CANCELLED":
        return (
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
            Rejetée/Annulée
          </span>
        );
      case "IN_PROGRESS":
        return (
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
            En cours
          </span>
        );
      case "COMPLETED":
        return (
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-500/10 text-gray-600 dark:text-gray-400 border border-gray-500/20">
            Terminée
          </span>
        );
      default:
        return null;
    }
  };

  const clientName =
    booking.client?.first_name && booking.client?.last_name
      ? `${booking.client.first_name} ${booking.client.last_name}`
      : booking.client?.email || "Client inconnu";

  const mealTypeLabels: Record<string, string> = {
    BREAKFAST: "Petit-déjeuner",
    LUNCH: "Déjeuner",
    DINNER: "Dîner",
    BRUNCH: "Brunch",
  };

  const mealType = mealTypeLabels[booking.meal_type] || booking.meal_type || "Non spécifié";

  return (
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
              Réservation #{booking.id.slice(0, 8)}
            </h3>
            {getStatusBadge(booking.status)}
          </div>
          {booking.special_requests && (
            <p className="text-muted-foreground mb-4">{booking.special_requests}</p>
          )}
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <User className="w-4 h-4" />
            <span className="font-medium text-foreground">Client :</span>
            <span>{clientName}</span>
          </div>
        </div>
      </div>

      {/* Détails */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 dark:bg-blue-500/20 flex items-center justify-center">
            <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <span>
            {booking.booking_date
              ? format(new Date(booking.booking_date), "d MMM yyyy", { locale: fr })
              : "Non spécifié"}
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <div className="w-8 h-8 rounded-lg bg-purple-500/10 dark:bg-purple-500/20 flex items-center justify-center">
            <Clock className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          </div>
          <span>
            {booking.start_time
              ? `${booking.start_time.slice(0, 5)} - ${booking.end_time?.slice(0, 5) || ""}`
              : mealType}
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <div className="w-8 h-8 rounded-lg bg-orange-500/10 dark:bg-orange-500/20 flex items-center justify-center">
            <Users className="w-4 h-4 text-orange-600 dark:text-orange-400" />
          </div>
          <span>
            {booking.number_of_guests || "N/A"} personne{booking.number_of_guests > 1 ? "s" : ""}
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <div className="w-8 h-8 rounded-lg bg-green-500/10 dark:bg-green-500/20 flex items-center justify-center">
            <Euro className="w-4 h-4 text-green-600 dark:text-green-400" />
          </div>
          <span>{booking.total_price ? `${booking.total_price.toFixed(2)} €` : "N/A"}</span>
        </div>
      </div>

      {booking.address && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
          <div className="w-8 h-8 rounded-lg bg-pink-500/10 dark:bg-pink-500/20 flex items-center justify-center">
            <MapPin className="w-4 h-4 text-pink-600 dark:text-pink-400" />
          </div>
          <span>{booking.address}</span>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-border">
        <div className="text-xs text-muted-foreground">
          {booking.created_at && (
            <span>Reçue le {formatDateTime(booking.created_at)}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {booking.status === "PENDING" && (
            <>
              <Button
                onClick={onReject}
                variant="outline"
                className="border-red-500 text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
              >
                <XCircle className="w-4 h-4 mr-2" />
                Rejeter
              </Button>
              <Button
                onClick={onAccept}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Accepter
              </Button>
            </>
          )}
          {booking.status === "ACCEPTED" || booking.status === "CONFIRMED" ? (
            <Button variant="outline" disabled>
              <CheckCircle className="w-4 h-4 mr-2" />
              Acceptée
            </Button>
          ) : null}
          {booking.status === "CANCELLED" && (
            <Button variant="outline" disabled>
              <XCircle className="w-4 h-4 mr-2" />
              Rejetée
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
