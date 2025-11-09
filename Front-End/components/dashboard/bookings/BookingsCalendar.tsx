"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { mockBookings } from "@/mockData";

/**
 * Calendrier global des réservations
 * Affiche toutes les réservations sur un calendrier mensuel
 */
export function BookingsCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Premier jour du mois
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay();

  // Ajuster pour que lundi = 0
  const adjustedStartingDay = startingDayOfWeek === 0 ? 6 : startingDayOfWeek - 1;

  // Filtrer les réservations du mois
  const monthBookings = mockBookings.filter((booking) => {
    const bookingDate = new Date(booking.date);
    return (
      bookingDate.getFullYear() === year &&
      bookingDate.getMonth() === month
    );
  });

  // Grouper les réservations par jour
  const bookingsByDay = monthBookings.reduce((acc, booking) => {
    const day = new Date(booking.date).getDate();
    if (!acc[day]) {
      acc[day] = [];
    }
    acc[day].push(booking);
    return acc;
  }, {} as Record<number, typeof mockBookings>);

  const monthNames = [
    "Janvier",
    "Février",
    "Mars",
    "Avril",
    "Mai",
    "Juin",
    "Juillet",
    "Août",
    "Septembre",
    "Octobre",
    "Novembre",
    "Décembre",
  ];

  const dayNames = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const today = new Date();
  const isToday = (day: number) => {
    return (
      day === today.getDate() &&
      month === today.getMonth() &&
      year === today.getFullYear()
    );
  };

  return (
    <div className="bg-card border border-border rounded-xl p-6 lg:p-8">
      {/* Header avec navigation */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h2 className="font-cera text-2xl font-bold text-foreground">
            {monthNames[month]} {year}
          </h2>
          <Button
            variant="outline"
            size="sm"
            onClick={goToToday}
            className="text-xs"
          >
            Aujourd'hui
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={goToPreviousMonth}
            className="h-8 w-8"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={goToNextMonth}
            className="h-8 w-8"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Calendrier */}
      <div className="grid grid-cols-7 gap-2">
        {/* En-têtes des jours */}
        {dayNames.map((day) => (
          <div
            key={day}
            className="text-center text-sm font-semibold text-muted-foreground py-2"
          >
            {day}
          </div>
        ))}

        {/* Jours vides au début */}
        {Array.from({ length: adjustedStartingDay }).map((_, index) => (
          <div key={`empty-${index}`} className="aspect-square" />
        ))}

        {/* Jours du mois */}
        {Array.from({ length: daysInMonth }).map((_, index) => {
          const day = index + 1;
          const dayBookings = bookingsByDay[day] || [];
          const isCurrentDay = isToday(day);

          return (
            <motion.div
              key={day}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: index * 0.01 }}
              className={`
                aspect-square border border-border rounded-lg p-2
                ${isCurrentDay ? "bg-blue-500/10 border-blue-500" : "bg-background"}
                ${dayBookings.length > 0 ? "hover:bg-accent cursor-pointer" : ""}
                transition-colors
              `}
            >
              <div className="flex flex-col h-full">
                {/* Numéro du jour */}
                <div
                  className={`
                    text-sm font-semibold mb-1
                    ${isCurrentDay ? "text-blue-600 dark:text-blue-400" : "text-foreground"}
                  `}
                >
                  {day}
                </div>

                {/* Réservations */}
                <div className="flex-1 overflow-hidden space-y-1">
                  {dayBookings.slice(0, 2).map((booking) => {
                    const statusColors = {
                      pending: "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400",
                      confirmed: "bg-green-500/20 text-green-700 dark:text-green-400",
                      done: "bg-blue-500/20 text-blue-700 dark:text-blue-400",
                      cancelled: "bg-red-500/20 text-red-700 dark:text-red-400",
                    };

                    return (
                      <Link
                        key={booking.id}
                        href={`/dashboard/client/bookings/${booking.id}`}
                        className={`
                          block text-xs px-1.5 py-0.5 rounded truncate
                          ${statusColors[booking.status as keyof typeof statusColors] || statusColors.pending}
                          hover:opacity-80 transition-opacity
                        `}
                        title={`${booking.cookName} - ${booking.time}`}
                      >
                        {booking.time}
                      </Link>
                    );
                  })}
                  {dayBookings.length > 2 && (
                    <div className="text-xs text-muted-foreground px-1.5">
                      +{dayBookings.length - 2}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Légende */}
      <div className="mt-6 pt-6 border-t border-border">
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-yellow-500/20 border border-yellow-500" />
            <span className="text-muted-foreground">En attente</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-green-500/20 border border-green-500" />
            <span className="text-muted-foreground">Confirmée</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-blue-500/20 border border-blue-500" />
            <span className="text-muted-foreground">Terminée</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-red-500/20 border border-red-500" />
            <span className="text-muted-foreground">Annulée</span>
          </div>
        </div>
      </div>
    </div>
  );
}

