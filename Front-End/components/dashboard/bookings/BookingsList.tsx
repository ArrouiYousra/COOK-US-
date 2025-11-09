"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { Calendar, Clock, Euro, ChevronRight, CheckCircle, XCircle, Hourglass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDate, formatDateTime } from "@/lib/utils";
import { mockCooks, mockBookings } from "@/mockData";

type BookingStatusFilter = "all" | "pending" | "confirmed" | "completed" | "cancelled";

interface BookingsListProps {
  statusFilter: BookingStatusFilter;
}

/**
 * Liste des réservations avec cartes
 * Affiche les réservations selon leur statut
 */
export function BookingsList({ statusFilter }: BookingsListProps) {
  // Filtrer les réservations selon le statut
  const filteredBookings = mockBookings.filter((booking) => {
    if (statusFilter === "all") return true;
    return booking.status === statusFilter;
  });

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
        const cook = mockCooks.find((c) => c.id === booking.cookId);
        if (!cook) return null;

        return (
          <BookingCard key={booking.id} booking={booking} cook={cook} index={index} />
        );
      })}
    </div>
  );
}

interface BookingCardProps {
  booking: typeof mockBookings[0];
  cook: typeof mockCooks[0];
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
    done: {
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

  const config = statusConfig[booking.status] || statusConfig.pending;
  const StatusIcon = config.icon;

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
                <span>{formatDate(booking.date)}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <div className="w-8 h-8 rounded-lg bg-purple-500/10 dark:bg-purple-500/20 flex items-center justify-center">
                  <Clock className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                </div>
                <span>{booking.time}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <div className="w-8 h-8 rounded-lg bg-green-500/10 dark:bg-green-500/20 flex items-center justify-center">
                  <Euro className="w-4 h-4 text-green-600 dark:text-green-400" />
                </div>
                <span className="font-semibold text-foreground">
                  {booking.totalPrice} €
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

