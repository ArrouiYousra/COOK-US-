"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CookCalendarProps {
  cookId: string;
}

/**
 * Calendrier interactif pour afficher les disponibilités d'un cuisinier
 */
export function CookCalendar({ cookId }: CookCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  // Générer les jours du mois
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay();

  // Mock data - À remplacer par les vraies disponibilités
  const availableDates = [
    5, 6, 7, 12, 13, 14, 19, 20, 21, 26, 27, 28,
  ];

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

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

  return (
    <div className="space-y-4">
      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="icon"
          onClick={goToPreviousMonth}
          aria-label="Mois précédent"
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <h3 className="font-cera text-xl font-semibold text-foreground">
          {monthNames[month]} {year}
        </h3>
        <Button
          variant="ghost"
          size="icon"
          onClick={goToNextMonth}
          aria-label="Mois suivant"
        >
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>

      {/* Calendrier */}
      <div className="border border-border rounded-lg overflow-hidden">
        {/* En-têtes des jours */}
        <div className="grid grid-cols-7 bg-accent">
          {["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"].map((day) => (
            <div
              key={day}
              className="p-3 text-center text-sm font-medium text-foreground"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Jours du mois */}
        <div className="grid grid-cols-7">
          {/* Jours vides avant le premier jour */}
          {Array.from({ length: startingDayOfWeek }).map((_, index) => (
            <div key={`empty-${index}`} className="aspect-square" />
          ))}

          {/* Jours du mois */}
          {Array.from({ length: daysInMonth }).map((_, index) => {
            const day = index + 1;
            const isAvailable = availableDates.includes(day);
            const isToday =
              day === new Date().getDate() &&
              month === new Date().getMonth() &&
              year === new Date().getFullYear();

            return (
              <motion.button
                key={day}
                whileHover={isAvailable ? { scale: 1.05 } : {}}
                whileTap={isAvailable ? { scale: 0.95 } : {}}
                disabled={!isAvailable}
                className={`
                  aspect-square p-2 text-sm transition-colors
                  ${isToday ? "bg-blue-600 text-white font-semibold" : ""}
                  ${
                    isAvailable
                      ? "hover:bg-accent cursor-pointer text-foreground"
                      : "text-muted-foreground cursor-not-allowed opacity-50"
                  }
                `}
              >
                <div className="flex flex-col items-center justify-center h-full">
                  <span>{day}</span>
                  {isAvailable && (
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1" />
                  )}
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Légende */}
      <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-green-500" />
          <span>Disponible</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-muted" />
          <span>Indisponible</span>
        </div>
      </div>
    </div>
  );
}

