"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Calendar, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BookingsList } from "@/components/dashboard/bookings/BookingsList";
import { BookingsCalendar } from "@/components/dashboard/bookings/BookingsCalendar";
import { useBookingStore } from "@/stores/bookingStore";

type BookingStatusFilter = "all" | "pending" | "confirmed" | "completed" | "cancelled";
type ViewMode = "list" | "calendar";

/**
 * Page "Réservations & Paiements"
 * Gestion de toutes les réservations et paiements du client
 */
export default function BookingsPage() {
  const [statusFilter, setStatusFilter] = useState<BookingStatusFilter>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const { bookings, fetchBookings, isLoadingBookings } = useBookingStore();
  const [counts, setCounts] = useState({
    all: 0,
    pending: 0,
    confirmed: 0,
    completed: 0,
    cancelled: 0,
  });

  // Charger les bookings au montage
  useEffect(() => {
    fetchBookings({ limit: 1000 });
  }, [fetchBookings]);

  // Calculer les compteurs dynamiquement
  useEffect(() => {
    const allCount = bookings.length;
    const pendingCount = bookings.filter(
      (b) => b.status === "proposition_pending" || b.status === "payment_pending" || b.status === "pending"
    ).length;
    const confirmedCount = bookings.filter(
      (b) => b.status === "confirmed" || b.status === "proposition_accepted"
    ).length;
    const completedCount = bookings.filter((b) => b.status === "completed" || b.status === "done").length;
    const cancelledCount = bookings.filter((b) => b.status === "cancelled").length;

    setCounts({
      all: allCount,
      pending: pendingCount,
      confirmed: confirmedCount,
      completed: completedCount,
      cancelled: cancelledCount,
    });
  }, [bookings]);

  const statusFilters = [
    { id: "all" as BookingStatusFilter, label: "Toutes", count: counts.all },
    { id: "pending" as BookingStatusFilter, label: "En attente", count: counts.pending },
    { id: "confirmed" as BookingStatusFilter, label: "Confirmées", count: counts.confirmed },
    { id: "completed" as BookingStatusFilter, label: "Terminées", count: counts.completed },
    { id: "cancelled" as BookingStatusFilter, label: "Annulées", count: counts.cancelled },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-trebuchet text-3xl lg:text-4xl font-bold text-foreground mb-2">
            Réservations & Paiements
          </h1>
          <p className="text-muted-foreground">
            Gérez toutes vos réservations et suivez vos paiements
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === "list" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("list")}
          >
            <List className="w-4 h-4 mr-2" />
            Liste
          </Button>
          <Button
            variant={viewMode === "calendar" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("calendar")}
          >
            <Calendar className="w-4 h-4 mr-2" />
            Calendrier
          </Button>
        </div>
      </div>

      {/* Vue calendrier ou liste */}
      {viewMode === "calendar" ? (
        <BookingsCalendar />
      ) : (
        <>
          {/* Filtres par statut */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {statusFilters.map((filter) => (
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
                {filter.count > 0 && (
                  <span
                    className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                      statusFilter === filter.id
                        ? "bg-white/20 text-white"
                        : "bg-background text-foreground"
                    }`}
                  >
                    {filter.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Liste des réservations */}
          <BookingsList statusFilter={statusFilter} />
        </>
      )}
    </div>
  );
}
