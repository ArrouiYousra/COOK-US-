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
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface CookBookingsListProps {
  statusFilter: "all" | "pending" | "confirmed" | "completed" | "cancelled";
  bookings: any[];
}

/**
 * Liste des réservations du cuisinier
 */
export function CookBookingsList({ statusFilter, bookings }: CookBookingsListProps) {
  // Filtrer les réservations selon le statut
  const filteredBookings = bookings.filter((booking) => {
    if (statusFilter === "all") return true;
    if (statusFilter === "pending") return booking.status === "PENDING";
    if (statusFilter === "confirmed") return ["ACCEPTED", "CONFIRMED"].includes(booking.status);
    if (statusFilter === "completed") return booking.status === "COMPLETED";
    if (statusFilter === "cancelled") return booking.status === "CANCELLED";
    return true;
  });

  if (filteredBookings.length === 0) {
    return (
      <div className="text-center py-12 bg-card border border-border rounded-xl">
        <p className="text-muted-foreground">
          Aucune réservation{" "}
          {statusFilter === "all"
            ? ""
            : statusFilter === "pending"
            ? "en attente"
            : statusFilter === "confirmed"
            ? "confirmée"
            : statusFilter === "completed"
            ? "terminée"
            : "annulée"}
          .
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
  booking: any;
  index: number;
}

function BookingCard({ booking, index }: BookingCardProps) {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case "PENDING":
        return {
          label: "En attente",
          color: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20",
          icon: Hourglass,
        };
      case "ACCEPTED":
      case "CONFIRMED":
        return {
          label: "Confirmée",
          color: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20",
          icon: CheckCircle,
        };
      case "COMPLETED":
        return {
          label: "Terminée",
          color: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
          icon: CheckCircle,
        };
      case "CANCELLED":
        return {
          label: "Annulée",
          color: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
          icon: XCircle,
        };
      case "IN_PROGRESS":
        return {
          label: "En cours",
          color: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
          icon: Hourglass,
        };
      default:
        return {
          label: "Inconnu",
          color: "bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20",
          icon: Hourglass,
        };
    }
  };

  const config = getStatusConfig(booking.status);
  const StatusIcon = config.icon;

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
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium border flex items-center gap-2 ${config.color}`}
            >
              <StatusIcon className="w-3 h-3" />
              {config.label}
            </span>
          </div>
          <p className="text-muted-foreground mb-2">Client : {clientName}</p>
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
              ? `${booking.start_time.slice(0, 5)}${booking.end_time ? ` - ${booking.end_time.slice(0, 5)}` : ""}`
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
          <span className="font-semibold text-foreground">
            {booking.total_price ? `${booking.total_price.toFixed(2)} €` : "N/A"}
          </span>
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
