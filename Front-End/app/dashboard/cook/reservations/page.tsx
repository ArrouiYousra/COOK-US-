"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Loader2, AlertCircle, Clock, CheckCircle2, XCircle, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiClient } from "@/lib/api/client";
import { useAuthStore } from "@/stores/authStore";
import type { Reservation, ReservationStatus } from "@/types";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/**
 * Page pour voir mes propositions (cuisinier)
 * Affiche toutes les propositions que le cuisinier a faites sur des demandes publiques
 */
export default function MyReservationsPage() {
  const router = useRouter();
  const { user, isAuthenticated, checkAuth, isLoading: isAuthLoading } = useAuthStore();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<ReservationStatus | "all">("all");

  // Vérifier l'authentification
  useEffect(() => {
    const verifyAuth = async () => {
      if (!isAuthenticated && !isAuthLoading) {
        try {
          await checkAuth();
        } catch (error) {
          router.push("/auth/login");
        }
      }
    };

    if (!isAuthLoading) {
      verifyAuth();
    }
  }, [isAuthenticated, checkAuth, router, isAuthLoading]);

  // Charger les propositions
  useEffect(() => {
    const loadReservations = async () => {
      if (isAuthLoading || !isAuthenticated || !user) return;

      setIsLoading(true);
      setError(null);

      try {
        const response = await apiClient.getMyReservations(
          statusFilter === "all" ? undefined : statusFilter
        );
        setReservations(response.reservations || []);
      } catch (err: any) {
        console.error("Erreur lors du chargement des propositions:", err);
        setError(err.response?.data?.message || "Impossible de charger vos propositions");
      } finally {
        setIsLoading(false);
      }
    };

    if (!isAuthLoading && isAuthenticated && user) {
      loadReservations();
    }
  }, [isAuthLoading, isAuthenticated, user, statusFilter]);

  const getStatusConfig = (status: ReservationStatus) => {
    switch (status) {
      case "PENDING":
        return {
          label: "En attente",
          color: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20",
          icon: Clock,
        };
      case "ACCEPTED":
        return {
          label: "Acceptée",
          color: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20",
          icon: CheckCircle2,
        };
      case "REJECTED":
        return {
          label: "Refusée",
          color: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
          icon: XCircle,
        };
      case "CANCELLED":
        return {
          label: "Annulée",
          color: "bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20",
          icon: XCircle,
        };
      case "EXPIRED":
        return {
          label: "Expirée",
          color: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20",
          icon: AlertCircle,
        };
      default:
        return {
          label: status,
          color: "bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20",
          icon: Clock,
        };
    }
  };

  // Calculer les statistiques
  const stats = {
    total: reservations.length,
    pending: reservations.filter((r) => r.status === "PENDING").length,
    accepted: reservations.filter((r) => r.status === "ACCEPTED").length,
    rejected: reservations.filter((r) => r.status === "REJECTED").length,
    cancelled: reservations.filter((r) => r.status === "CANCELLED").length,
    expired: reservations.filter((r) => r.status === "EXPIRED").length,
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
          Mes Propositions
        </h1>
        <p className="text-muted-foreground">
          Gérez toutes vos propositions sur les demandes publiques
        </p>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
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
          <p className="text-2xl font-bold text-gray-600 dark:text-gray-400">{stats.cancelled}</p>
          <p className="text-sm text-muted-foreground">Annulées</p>
        </div>
        <div className="bg-orange-500/10 border-orange-500/20 border rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{stats.expired}</p>
          <p className="text-sm text-muted-foreground">Expirées</p>
        </div>
      </div>

      {/* Filtre */}
      <div className="flex items-center gap-4">
        <Filter className="w-5 h-5 text-muted-foreground" />
        <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as any)}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filtrer par statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            <SelectItem value="PENDING">En attente</SelectItem>
            <SelectItem value="ACCEPTED">Acceptées</SelectItem>
            <SelectItem value="REJECTED">Refusées</SelectItem>
            <SelectItem value="CANCELLED">Annulées</SelectItem>
            <SelectItem value="EXPIRED">Expirées</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Erreur */}
      {error && (
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Liste des propositions */}
      {reservations.length === 0 ? (
        <div className="text-center py-12 bg-card border border-border rounded-xl">
          <AlertCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            {statusFilter === "all"
              ? "Vous n'avez pas encore fait de propositions"
              : `Aucune proposition avec le statut "${statusFilter}"`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {reservations.map((reservation) => {
            const statusConfig = getStatusConfig(reservation.status);
            const StatusIcon = statusConfig.icon;

            return (
              <motion.div
                key={reservation.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card border border-border rounded-xl p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <Badge className={statusConfig.color}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {statusConfig.label}
                      </Badge>
                      <span className="text-2xl font-bold">{reservation.proposed_price.toFixed(2)}€</span>
                      {reservation.proposed_hours && (
                        <span className="text-sm text-muted-foreground">
                          ({reservation.proposed_hours}h
                          {reservation.proposed_hourly_rate && ` × ${reservation.proposed_hourly_rate}€/h`})
                        </span>
                      )}
                    </div>

                    {reservation.message && (
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                        {reservation.message}
                      </p>
                    )}

                    <p className="text-xs text-muted-foreground">
                      Proposé le {format(new Date(reservation.created_at), "d MMMM yyyy 'à' HH:mm", { locale: fr })}
                      {reservation.expires_at && reservation.status === "PENDING" && (
                        <> • Expire le {format(new Date(reservation.expires_at), "d MMMM yyyy 'à' HH:mm", { locale: fr })}</>
                      )}
                    </p>

                    {reservation.accepted_at && (
                      <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                        ✓ Acceptée le {format(new Date(reservation.accepted_at), "d MMMM yyyy 'à' HH:mm", { locale: fr })}
                      </p>
                    )}
                    {reservation.rejected_at && (
                      <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                        ✗ Refusée le {format(new Date(reservation.rejected_at), "d MMMM yyyy 'à' HH:mm", { locale: fr })}
                        {reservation.rejection_reason && ` - ${reservation.rejection_reason}`}
                      </p>
                    )}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/dashboard/cook/marketplace`)}
                  >
                    Voir la demande
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}


