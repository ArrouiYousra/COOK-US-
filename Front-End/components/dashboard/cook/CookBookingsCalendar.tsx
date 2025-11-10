"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { mockBookings } from "@/mockData";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from "date-fns";
import { fr } from "date-fns/locale";

/**
 * Calendrier des réservations du cuisinier
 */
export function CookBookingsCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Obtenir le premier jour du mois pour l'alignement
  const firstDayOfWeek = monthStart.getDay();
  const daysBeforeMonth = Array.from({ length: firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1 }, (_, i) => null);

  const previousMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));

  const getBookingsForDay = (date: Date) => {
    return mockBookings.filter((booking) => {
      const bookingDate = new Date(booking.date);
      return isSameDay(bookingDate, date);
    });
  };

  const dayNames = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-xl p-6 lg:p-8"
    >
      {/* Header du calendrier */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={previousMonth}
            className="h-9 w-9"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <h2 className="font-cera text-2xl font-bold text-foreground">
            {format(currentDate, "MMMM yyyy", { locale: fr })}
          </h2>
          <Button
            variant="outline"
            size="icon"
            onClick={nextMonth}
            className="h-9 w-9"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
        <Button
          variant="outline"
          onClick={() => setCurrentDate(new Date())}
          size="sm"
        >
          Aujourd'hui
        </Button>
      </div>

      {/* Grille du calendrier */}
      <div className="grid grid-cols-7 gap-2">
        {/* Noms des jours */}
        {dayNames.map((day) => (
          <div
            key={day}
            className="text-center text-sm font-semibold text-muted-foreground py-2"
          >
            {day}
          </div>
        ))}

        {/* Jours avant le mois */}
        {daysBeforeMonth.map((_, index) => (
          <div key={`empty-${index}`} className="aspect-square" />
        ))}

        {/* Jours du mois */}
        {daysInMonth.map((day) => {
          const bookings = getBookingsForDay(day);
          const isToday = isSameDay(day, new Date());
          const isCurrentMonth = isSameMonth(day, currentDate);

          return (
            <div
              key={day.toISOString()}
              className={`
                aspect-square border border-border rounded-lg p-2
                ${isToday ? "bg-blue-500/10 border-blue-500" : ""}
                ${!isCurrentMonth ? "opacity-30" : ""}
                ${bookings.length > 0 ? "bg-green-500/5" : ""}
              `}
            >
              <div className="flex flex-col h-full">
                <span
                  className={`
                    text-sm font-medium mb-1
                    ${isToday ? "text-blue-600 dark:text-blue-400" : "text-foreground"}
                  `}
                >
                  {format(day, "d")}
                </span>
                {bookings.length > 0 && (
                  <div className="flex-1 flex flex-col gap-1 overflow-hidden">
                    {bookings.slice(0, 2).map((booking) => (
                      <div
                        key={booking.id}
                        className={`
                          text-xs px-1 py-0.5 rounded truncate
                          ${
                            booking.status === "confirmed"
                              ? "bg-green-500/20 text-green-600 dark:text-green-400"
                              : booking.status === "pending"
                              ? "bg-yellow-500/20 text-yellow-600 dark:text-yellow-400"
                              : "bg-blue-500/20 text-blue-600 dark:text-blue-400"
                          }
                        `}
                        title={`${booking.time} - ${booking.totalPrice} €`}
                      >
                        {booking.time}
                      </div>
                    ))}
                    {bookings.length > 2 && (
                      <div className="text-xs text-muted-foreground">
                        +{bookings.length - 2}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Légende */}
      <div className="flex items-center gap-4 mt-6 pt-6 border-t border-border">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-green-500/20 border border-green-500/40" />
          <span className="text-xs text-muted-foreground">Confirmée</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-yellow-500/20 border border-yellow-500/40" />
          <span className="text-xs text-muted-foreground">En attente</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-blue-500/20 border border-blue-500/40" />
          <span className="text-xs text-muted-foreground">Terminée</span>
        </div>
      </div>
    </motion.div>
  );
}

