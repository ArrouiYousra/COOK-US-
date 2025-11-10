"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Calendar, List, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CookBookingsList } from "@/components/dashboard/cook/CookBookingsList";
import { CookBookingsCalendar } from "@/components/dashboard/cook/CookBookingsCalendar";

type BookingStatusFilter = "all" | "pending" | "confirmed" | "completed" | "cancelled";
type ViewMode = "list" | "calendar";

/**
 * Page "Mes Réservations"
 * Gestion de toutes les réservations du cuisinier
 */
export default function CookBookingsPage() {
  const [statusFilter, setStatusFilter] = useState<BookingStatusFilter>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("list");

  const statusFilters = [
    { id: "all" as BookingStatusFilter, label: "Toutes", count: 15 },
    { id: "pending" as BookingStatusFilter, label: "En attente", count: 3 },
    { id: "confirmed" as BookingStatusFilter, label: "Confirmées", count: 8 },
    { id: "completed" as BookingStatusFilter, label: "Terminées", count: 3 },
    { id: "cancelled" as BookingStatusFilter, label: "Annulées", count: 1 },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-trebuchet text-3xl lg:text-4xl font-bold text-foreground mb-2">
            Mes Réservations
          </h1>
          <p className="text-muted-foreground">
            Gérez toutes vos réservations et suivez vos prestations
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
        <CookBookingsCalendar />
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
          <CookBookingsList statusFilter={statusFilter} />
        </>
      )}
    </div>
  );
}

