"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Calendar, List, Filter, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CookBookingsList } from "@/components/dashboard/cook/CookBookingsList";
import { CookBookingsCalendar } from "@/components/dashboard/cook/CookBookingsCalendar";
import { apiClient } from "@/lib/api/client";
import { useAuthStore } from "@/stores/authStore";

type BookingStatusFilter = "all" | "pending" | "confirmed" | "completed" | "cancelled";
type ViewMode = "list" | "calendar";

/**
 * Page "Mes Réservations"
 * Gestion de toutes les réservations du cuisinier
 */
export default function CookBookingsPage() {
  const router = useRouter();
  const { user, isAuthenticated, checkAuth, isLoading: isAuthLoading } = useAuthStore();
  const [statusFilter, setStatusFilter] = useState<BookingStatusFilter>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [statusCounts, setStatusCounts] = useState({
    all: 0,
    pending: 0,
    confirmed: 0,
    completed: 0,
    cancelled: 0,
  });

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

  // Charger les réservations
  useEffect(() => {
    const loadBookings = async () => {
      if (isAuthLoading) return;
      if (!isAuthenticated || !user) return;

      setIsLoading(true);
      setError(null);

      try {
        const response = await apiClient.getBookings({ limit: 1000 });
        const allBookings = response.bookings || [];
        setBookings(allBookings);

        // Calculer les compteurs par statut
        const counts = {
          all: allBookings.length,
          pending: allBookings.filter((b) => b.status === "pending" || b.status === "proposition_pending" || b.status === "payment_pending").length,
          confirmed: allBookings.filter((b) => b.status === "confirmed" || b.status === "proposition_accepted").length,
          completed: allBookings.filter((b) => b.status === "done").length,
          cancelled: allBookings.filter((b) => b.status === "cancelled").length,
        };
        setStatusCounts(counts);
      } catch (err: any) {
        console.error("Erreur lors du chargement des réservations:", err);
        setError(err.response?.data?.message || "Impossible de charger les réservations");
      } finally {
        setIsLoading(false);
      }
    };

    if (!isAuthLoading && isAuthenticated && user) {
      loadBookings();
    }
  }, [isAuthenticated, user, isAuthLoading]);

  const statusFilters = [
    { id: "all" as BookingStatusFilter, label: "Toutes", count: statusCounts.all },
    { id: "pending" as BookingStatusFilter, label: "En attente", count: statusCounts.pending },
    { id: "confirmed" as BookingStatusFilter, label: "Confirmées", count: statusCounts.confirmed },
    { id: "completed" as BookingStatusFilter, label: "Terminées", count: statusCounts.completed },
    { id: "cancelled" as BookingStatusFilter, label: "Annulées", count: statusCounts.cancelled },
  ];

  // Afficher un loader pendant le chargement
  if (isLoading || isAuthLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Chargement des réservations...</p>
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
        <CookBookingsCalendar bookings={bookings} />
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
          <CookBookingsList statusFilter={statusFilter} bookings={bookings} />
        </>
      )}
    </div>
  );
}
