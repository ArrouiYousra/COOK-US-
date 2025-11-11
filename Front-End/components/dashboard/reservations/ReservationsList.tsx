"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import {
  CheckCircle2,
  XCircle,
  Clock,
  Euro,
  MessageSquare,
  Star,
  ShoppingCart,
  UtensilsCrossed,
  Loader2,
  AlertCircle,
  Navigation,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatDateTime } from "@/lib/utils";
import type { Reservation, ReservationStatus } from "@/types";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import Link from "next/link";

interface ReservationsListProps {
  reservations: Reservation[];
  isLoading?: boolean;
  onAccept?: (reservationId: string) => void;
  onReject?: (reservationId: string) => void;
  showActions?: boolean; // Pour afficher les boutons accepter/refuser (côté client)
  distances?: Record<string, { distance: number; distance_km: string; duration_minutes: number }>; // Distances calculées
  bookingId?: string; // ID du booking pour le bouton "Discuter"
}

/**
 * Liste des propositions (réservations) pour une demande publique
 * Utilisé côté client pour voir et gérer les propositions reçues
 */
export function ReservationsList({
  reservations,
  isLoading = false,
  onAccept,
  onReject,
  showActions = true,
  distances = {},
  bookingId,
}: ReservationsListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

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

  const handleAccept = async (reservationId: string) => {
    if (!onAccept) return;
    setProcessingId(reservationId);
    try {
      await onAccept(reservationId);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (reservationId: string) => {
    if (!onReject) return;
    setProcessingId(reservationId);
    try {
      await onReject(reservationId);
    } finally {
      setProcessingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (reservations.length === 0) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground">Aucune proposition reçue pour le moment</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {reservations.map((reservation) => {
        const statusConfig = getStatusConfig(reservation.status);
        const StatusIcon = statusConfig.icon;
        const isExpanded = expandedId === reservation.id;
        const isProcessing = processingId === reservation.id;
        const canAccept = reservation.status === "PENDING" && showActions;
        const canReject = reservation.status === "PENDING" && showActions;

        return (
          <motion.div
            key={reservation.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-border rounded-xl p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-start justify-between gap-4">
              {/* Infos cuisinier */}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  {reservation.cook?.user?.avatar_url ? (
                    <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-border">
                      <Image
                        src={reservation.cook.user.avatar_url}
                        alt={`${reservation.cook.user.first_name} ${reservation.cook.user.last_name}`}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center border-2 border-border">
                      <span className="text-lg font-semibold">
                        {reservation.cook?.user?.first_name?.[0] || "C"}
                      </span>
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">
                      {reservation.cook?.user
                        ? `${reservation.cook.user.first_name} ${reservation.cook.user.last_name}`
                        : "Cuisinier"}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {reservation.cook?.headline || "Cuisinier professionnel"}
                    </p>
                  </div>
                  <Badge className={statusConfig.color}>
                    <StatusIcon className="w-3 h-3 mr-1" />
                    {statusConfig.label}
                  </Badge>
                </div>

                {/* Prix et note */}
                <div className="flex items-center gap-4 mb-3 flex-wrap">
                  <div className="flex items-center gap-1">
                    <Euro className="w-4 h-4 text-muted-foreground" />
                    <span className="text-2xl font-bold">{reservation.proposed_price.toFixed(2)}</span>
                    <span className="text-muted-foreground">€</span>
                  </div>
                  {reservation.cook?.average_rating && (
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                      <span className="font-semibold">{reservation.cook.average_rating.toFixed(1)}</span>
                    </div>
                  )}
                  {reservation.proposed_hours && (
                    <div className="text-sm text-muted-foreground">
                      {reservation.proposed_hours}h
                      {reservation.proposed_hourly_rate && ` × ${reservation.proposed_hourly_rate}€/h`}
                    </div>
                  )}
                  {distances[reservation.id] && (
                    <div className="flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/20 px-2 py-1 rounded-full">
                      <Navigation className="w-4 h-4" />
                      <span className="font-medium">{distances[reservation.id].distance_km}</span>
                      <span className="text-xs text-muted-foreground">
                        ({distances[reservation.id].duration_minutes} min)
                      </span>
                    </div>
                  )}
                </div>

                {/* Services inclus */}
                {(reservation.can_do_groceries ||
                  reservation.can_set_table ||
                  reservation.can_do_dishes) && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {reservation.can_do_groceries && (
                      <Badge variant="outline" className="text-xs">
                        <ShoppingCart className="w-3 h-3 mr-1" />
                        Courses
                      </Badge>
                    )}
                    {reservation.can_set_table && (
                      <Badge variant="outline" className="text-xs">
                        <UtensilsCrossed className="w-3 h-3 mr-1" />
                        Mise de table
                      </Badge>
                    )}
                    {reservation.can_do_dishes && (
                      <Badge variant="outline" className="text-xs">
                        <UtensilsCrossed className="w-3 h-3 mr-1" />
                        Vaisselle
                      </Badge>
                    )}
                  </div>
                )}

                {/* Message */}
                {reservation.message && (
                  <div className="mb-3">
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {reservation.message}
                    </p>
                  </div>
                )}

                {/* Date de création */}
                <p className="text-xs text-muted-foreground">
                  Proposé le {format(new Date(reservation.created_at), "d MMMM yyyy 'à' HH:mm", { locale: fr })}
                </p>
              </div>

              {/* Actions */}
              {showActions && (
                <div className="flex flex-col gap-2">
                  {reservation.status === "ACCEPTED" && reservation.cook?.user?.id && (
                    <Button
                      size="sm"
                      asChild
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Link href={`/dashboard/client/messages?cook=${reservation.cook.user.id}&booking=${bookingId || ''}`}>
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Discuter
                      </Link>
                    </Button>
                  )}
                  {canAccept && (
                    <Button
                      size="sm"
                      onClick={() => handleAccept(reservation.id)}
                      disabled={isProcessing}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {isProcessing ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          Accepter
                        </>
                      )}
                    </Button>
                  )}
                  {canReject && (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleReject(reservation.id)}
                      disabled={isProcessing}
                    >
                      {isProcessing ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <XCircle className="w-4 h-4 mr-2" />
                          Refuser
                        </>
                      )}
                    </Button>
                  )}
                </div>
              )}
            </div>

            {/* Message complet (expandable) */}
            {reservation.message && reservation.message.length > 100 && (
              <div className="mt-4 pt-4 border-t border-border">
                <button
                  onClick={() => setExpandedId(isExpanded ? null : reservation.id)}
                  className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
                >
                  {isExpanded ? "Voir moins" : "Voir le message complet"}
                </button>
                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="mt-2 text-sm text-muted-foreground"
                  >
                    {reservation.message}
                  </motion.div>
                )}
              </div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}



