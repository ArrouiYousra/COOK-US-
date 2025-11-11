"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Availability {
  day_of_week: string;
  meal_type: string;
  start_time: string;
  end_time: string;
}

interface CookCalendarProps {
  availabilities: Availability[];
}

const dayOrder = [
  "SUNDAY",
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
];

const dayLabels = [
  "Dimanche",
  "Lundi",
  "Mardi",
  "Mercredi",
  "Jeudi",
  "Vendredi",
  "Samedi",
];

const shortDayLabels = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];

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

const dayIndexMap: Record<string, number> = {
  SUNDAY: 0,
  MONDAY: 1,
  TUESDAY: 2,
  WEDNESDAY: 3,
  THURSDAY: 4,
  FRIDAY: 5,
  SATURDAY: 6,
};

const formatTime = (value: string) => {
  if (!value) return "";
  const [hours, minutes] = value.split(":");
  return `${hours}h${minutes}`;
};

/**
 * Calendrier / planning des disponibilités d'un cuisinier
 */
export function CookCalendar({ availabilities }: CookCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const availabilityByDay = useMemo(() => {
    const map = new Map<number, Availability[]>();
    availabilities.forEach((availability) => {
      const key =
        dayIndexMap[availability.day_of_week?.toUpperCase?.() ?? ""] ?? null;
      if (key === null) {
        return;
      }
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key)!.push(availability);
    });
    return map;
  }, [availabilities]);

  // Générer les jours du mois
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay();

  const daysWithAvailability = useMemo(() => {
    const set = new Set<number>();
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dayIndex = date.getDay();
      if (availabilityByDay.has(dayIndex)) {
        set.add(day);
      }
    }
    return set;
  }, [availabilityByDay, daysInMonth, month, year]);

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  return (
    <div className="space-y-6">
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
          {shortDayLabels.map((day) => (
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
          {Array.from({ length: startingDayOfWeek }).map((_, index) => (
            <div key={`empty-${index}`} className="aspect-square" />
          ))}

          {Array.from({ length: daysInMonth }).map((_, index) => {
            const day = index + 1;
            const date = new Date(year, month, day);
            const dayIndex = date.getDay();
            const dayAvailability = availabilityByDay.get(dayIndex);
            const hasAvailability = daysWithAvailability.has(day);
            const isToday =
              day === new Date().getDate() &&
              month === new Date().getMonth() &&
              year === new Date().getFullYear();

            return (
              <motion.div
                key={day}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: index * 0.005 }}
                className={`
                  aspect-square p-2 text-sm transition-colors border border-border/30
                  ${isToday ? "bg-blue-600 text-white font-semibold" : ""}
                  ${
                    hasAvailability
                      ? "bg-blue-500/10 text-foreground"
                      : "text-muted-foreground"
                  }
                `}
              >
                <div className="flex flex-col items-center justify-center h-full gap-1 text-center">
                  <span>{day}</span>
                  {dayAvailability && (
                    <div className="flex flex-col gap-1 text-[10px] leading-tight text-blue-600 dark:text-blue-400">
                      {dayAvailability.slice(0, 2).map((item, i) => (
                        <span key={`${day}-${i}`}>
                          {item.meal_type.replace(/_/g, " ").toLowerCase()} ·{" "}
                          {formatTime(item.start_time)}-
                          {formatTime(item.end_time)}
                        </span>
                      ))}
                      {dayAvailability.length > 2 && (
                        <span className="text-[9px] text-muted-foreground">
                          + {dayAvailability.length - 2} créneau(x)
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Résumé par jour */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Calendar className="w-4 h-4" />
          <span className="text-sm">
            Disponibilités récurrentes (basées sur les créneaux publics)
          </span>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          {dayOrder.map((dayKey, index) => {
            const entries = availabilityByDay.get(index);
            return (
              <div
                key={dayKey}
                className="border border-border rounded-lg p-4 space-y-2"
              >
                <h4 className="font-semibold text-foreground text-sm uppercase tracking-wide">
                  {dayLabels[index]}
                </h4>
                {entries && entries.length > 0 ? (
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    {entries.map((item, itemIndex) => (
                      <li key={`${dayKey}-${itemIndex}`}>
                        <span className="font-medium text-foreground">
                          {item.meal_type.replace(/_/g, " ").toLowerCase()} :
                        </span>{" "}
                        {formatTime(item.start_time)} - {formatTime(item.end_time)}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Pas de disponibilité publiée
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

