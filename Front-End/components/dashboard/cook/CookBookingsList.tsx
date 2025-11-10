"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  Calendar,
  Clock,
  Users,
  Euro,
  MapPin,
  Eye,
  CheckCircle,
  XCircle,
  Hourglass,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDate, formatDateTime } from "@/lib/utils";
import { mockBookings } from "@/mockData";

interface CookBookingsListProps {
  statusFilter: "all" | "pending" | "confirmed" | "completed" | "cancelled";
}

/**
 * Liste des réservations du cuisinier
 */
export function CookBookingsList({ statusFilter }: CookBookingsListProps) {
  // Filtrer les réservations selon le statut
  const filteredBookings = mockBookings.filter((booking) => {
    if (statusFilter === "all") return true;
    return booking.status === statusFilter;
  });

  if (filteredBookings.length === 0) {
    return (
      <div className="text-center py-12 bg-card border border-border rounded-xl">
        <p className="text-muted-foreground">
          Aucune réservation {statusFilter === "all" ? "" : statusFilter === "pending" ? "en attente" : statusFilter === "confirmed" ? "confirmée" : statusFilter === "completed" ? "terminée" : "annulée"}.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {filteredBookings.map((booking, index) => (
        <BookingCard key={booking.id} booking={booking} index={index} />
      ))}
    </div>
  );
}

interface BookingCardProps {
  booking: typeof mockBookings[0];
  index: number;
}

function BookingCard({ booking, index }: BookingCardProps) {
  const statusConfig = {
    pending: {
      label: "En attente",
      color: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20",
      icon: Hourglass,
    },
    confirmed: {
      label: "Confirmée",
      color: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20",
      icon: CheckCircle,
    },
    done: {
      label: "Terminée",
      color: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
      icon: CheckCircle,
    },
    cancelled: {
      label: "Annulée",
      color: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
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
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="font-cera text-xl font-bold text-foreground">
              Réservation #{booking.id.slice(0, 8)}
            </h3>
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium border flex items-center gap-2 ${config.color}`}
            >
              <StatusIcon className="w-3 h-3" />
              {config.label}
            </span>
          </div>
          <p className="text-muted-foreground mb-2">
            Client : {booking.clientName || "Client"}
          </p>
        </div>
      </div>

      {/* Détails */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 dark:bg-blue-500/20 flex items-center justify-center">
            <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <span>{formatDate(booking.date)}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <div className="w-8 h-8 rounded-lg bg-purple-500/10 dark:bg-purple-500/20 flex items-center justify-center">
            <Clock className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          </div>
          <span>{booking.time}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <div className="w-8 h-8 rounded-lg bg-orange-500/10 dark:bg-orange-500/20 flex items-center justify-center">
            <Users className="w-4 h-4 text-orange-600 dark:text-orange-400" />
          </div>
          <span>{booking.numberOfGuests} personne{booking.numberOfGuests > 1 ? "s" : ""}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <div className="w-8 h-8 rounded-lg bg-green-500/10 dark:bg-green-500/20 flex items-center justify-center">
            <Euro className="w-4 h-4 text-green-600 dark:text-green-400" />
          </div>
          <span className="font-semibold text-foreground">{booking.totalPrice} €</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-2 pt-4 border-t border-border">
        <Button asChild variant="outline" size="sm">
          <Link href={`/dashboard/cook/bookings/${booking.id}`}>
            <Eye className="w-4 h-4 mr-2" />
            Voir détails
          </Link>
        </Button>
      </div>
    </motion.div>
  );
}

