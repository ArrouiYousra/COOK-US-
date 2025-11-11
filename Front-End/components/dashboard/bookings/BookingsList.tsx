"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { Calendar, Clock, Euro, ChevronRight, CheckCircle, XCircle, Hourglass, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDate, formatDateTime } from "@/lib/utils";
import { useBookingStore } from "@/stores/bookingStore";
import { apiClient } from "@/lib/api/client";

type BookingStatusFilter = "all" | "pending" | "confirmed" | "completed" | "cancelled";

interface BookingsListProps {
  statusFilter: BookingStatusFilter;
}

/**
 * Liste des réservations avec cartes
 * Affiche les réservations selon leur statut
 */
export function BookingsList({ statusFilter }: BookingsListProps) {
  const { bookings, fetchBookings, isLoadingBookings } = useBookingStore();
  const [enrichedBookings, setEnrichedBookings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Charger les bookings au montage
  useEffect(() => {
    const loadBookings = async () => {
      setIsLoading(true);
      try {
        // IMPORTANT: Réinitialiser le filtre de statut pour obtenir TOUS les bookings
        await fetchBookings({ limit: 1000, status: undefined });
      } catch (error) {
        console.error("Erreur lors du chargement des réservations:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadBookings();
  }, [fetchBookings]);

  // Filtrer les bookings pour exclure les demandes publiques (cook_profile_id = null)
  // Cette page est pour les "Réservations & Paiements", donc uniquement les réservations confirmées
  const confirmedBookings = useMemo(() => {
    return bookings.filter((b) => {
      const cookProfileId = b.cook_profile_id ?? (b as any).cook_profile_id ?? (b as any).cookId;
      return cookProfileId !== null && cookProfileId !== undefined && cookProfileId !== "";
    });
  }, [bookings]);

  // Enrichir les bookings avec les données des cuisiniers
  useEffect(() => {
    const enrichBookings = async () => {
      if (confirmedBookings.length === 0) {
        setEnrichedBookings([]);
        return;
      }

      try {
        // Enrichir avec les données des cuisiniers
        const cookIds = new Set<string>();
        confirmedBookings.forEach((booking: any) => {
          const cookId = booking.cook_profile_id ?? booking.cookId ?? booking.cook?.id;
          if (cookId) cookIds.add(cookId);
        });

        // Charger tous les profils de cuisiniers en une seule fois
        let cooksMap = new Map();
        if (cookIds.size > 0) {
          try {
            const allCooks = await apiClient.getCookProfiles({ limit: 1000 });
            allCooks.profiles.forEach((cook: any) => {
              const id = cook.id || cook.user?.id;
              if (id) cooksMap.set(id, cook);
            });
          } catch (error) {
            console.warn("Impossible de charger les profils des cuisiniers:", error);
          }
        }

        // Enrichir les bookings
        const enriched = confirmedBookings.map((booking: any) => {
          const cookId = booking.cook_profile_id ?? booking.cookId ?? booking.cook?.id;
          const cookData = cookId ? cooksMap.get(cookId) : null;

          // Mapper le statut
          let mappedStatus: "pending" | "confirmed" | "completed" | "cancelled" = "pending";
          if (booking.status === "confirmed" || booking.status === "proposition_accepted") {
            mappedStatus = "confirmed";
          } else if (booking.status === "completed" || booking.status === "done") {
            mappedStatus = "completed";
          } else if (booking.status === "cancelled") {
            mappedStatus = "cancelled";
          } else {
            mappedStatus = "pending";
          }

          return {
            ...booking,
            mappedStatus,
            cook: cookData
              ? {
                  id: cookData.id || cookData.user?.id,
                  name: cookData.user?.first_name && cookData.user?.last_name
                    ? `${cookData.user.first_name} ${cookData.user.last_name}`
                    : cookData.user?.first_name || "Cuisinier",
                  avatarUrl: cookData.user?.avatar_url,
                  rating: cookData.average_rating,
                }
              : booking.cook || {
                  id: cookId,
                  name: "Cuisinier",
                  avatarUrl: null,
                  rating: null,
                },
          };
        });

        setEnrichedBookings(enriched);
      } catch (error) {
        console.error("Erreur lors de l'enrichissement des réservations:", error);
        setEnrichedBookings([]);
      }
    };

    enrichBookings();
  }, [confirmedBookings]);

  // Filtrer les réservations selon le statut
  const filteredBookings = useMemo(() => {
    if (statusFilter === "all") return enrichedBookings;
    return enrichedBookings.filter((booking) => booking.mappedStatus === statusFilter);
  }, [enrichedBookings, statusFilter]);

  if (isLoading || isLoadingBookings) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (filteredBookings.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">
          Aucune réservation {statusFilter === "all" ? "" : statusFilter === "pending" ? "en attente" : statusFilter === "confirmed" ? "confirmée" : statusFilter === "completed" ? "terminée" : "annulée"}.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {filteredBookings.map((booking, index) => {
        if (!booking.cook) return null;

        return (
          <BookingCard key={booking.id} booking={booking} cook={booking.cook} index={index} />
        );
      })}
    </div>
  );
}

interface BookingCardProps {
  booking: any;
  cook: {
    id: string;
    name: string;
    avatarUrl?: string | null;
    rating?: number | null;
  };
  index: number;
}

function BookingCard({ booking, cook, index }: BookingCardProps) {
  const statusConfig = {
    pending: {
      label: "En attente",
      color: "text-yellow-600 dark:text-yellow-400",
      bgColor: "bg-yellow-500/10 dark:bg-yellow-500/20",
      borderColor: "border-yellow-500/20",
      icon: Hourglass,
    },
    confirmed: {
      label: "Confirmée",
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-500/10 dark:bg-green-500/20",
      borderColor: "border-green-500/20",
      icon: CheckCircle,
    },
    completed: {
      label: "Terminée",
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-500/10 dark:bg-blue-500/20",
      borderColor: "border-blue-500/20",
      icon: CheckCircle,
    },
    cancelled: {
      label: "Annulée",
      color: "text-red-600 dark:text-red-400",
      bgColor: "bg-red-500/10 dark:bg-red-500/20",
      borderColor: "border-red-500/20",
      icon: XCircle,
    },
  };

  const status = booking.mappedStatus || booking.status || "pending";
  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
  const StatusIcon = config.icon;

  // Formater l'heure
  const timeSlot = booking.time
    ? booking.time.includes(":")
      ? booking.time
      : `${booking.time}h`
    : "Non spécifié";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      className="bg-card border border-border rounded-xl p-6 hover:shadow-lg transition-shadow"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-4 flex-1">
          {/* Photo du chef */}
          <div className="relative w-16 h-16 rounded-full overflow-hidden flex-shrink-0 border-2 border-border">
            {cook.avatarUrl ? (
              <Image
                src={cook.avatarUrl}
                alt={cook.name}
                fill
                className="object-cover"
                unoptimized
              />
            ) : (
              <div className="w-full h-full bg-muted flex items-center justify-center">
                <span className="text-2xl">👨‍🍳</span>
              </div>
            )}
          </div>

          {/* Informations */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="font-cera text-xl font-bold text-foreground">
                {cook.name}
              </h3>
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium border flex items-center gap-1.5 ${config.bgColor} ${config.borderColor} ${config.color}`}
              >
                <StatusIcon className="w-3.5 h-3.5" />
                {config.label}
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 dark:bg-blue-500/20 flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <span>{formatDate(booking.date || booking.booking_date)}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <div className="w-8 h-8 rounded-lg bg-purple-500/10 dark:bg-purple-500/20 flex items-center justify-center">
                  <Clock className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                </div>
                <span>{timeSlot}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <div className="w-8 h-8 rounded-lg bg-green-500/10 dark:bg-green-500/20 flex items-center justify-center">
                  <Euro className="w-4 h-4 text-green-600 dark:text-green-400" />
                </div>
                <span className="font-semibold text-foreground">
                  {booking.totalPrice || booking.total_price || 0} €
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bouton Voir détails */}
        <Button
          asChild
          variant="outline"
          size="sm"
          className="ml-4"
        >
          <Link href={`/dashboard/client/bookings/${booking.id}`}>
            Voir détails
            <ChevronRight className="w-4 h-4 ml-1" />
          </Link>
        </Button>
      </div>
    </motion.div>
  );
}
