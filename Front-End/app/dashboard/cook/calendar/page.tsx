"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Calendar as CalendarIcon, Clock, Plus, X, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, addDays } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

// Mock data - À remplacer par les vraies données
const mockAvailabilities = [
  {
    id: "1",
    date: "2024-12-28",
    startTime: "09:00",
    endTime: "12:00",
    isRecurring: false,
  },
  {
    id: "2",
    date: "2024-12-28",
    startTime: "18:00",
    endTime: "22:00",
    isRecurring: false,
  },
];

/**
 * Page "Mon Agenda"
 * Gestion des disponibilités du cuisinier
 */
export default function CookCalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newAvailability, setNewAvailability] = useState({
    startTime: "",
    endTime: "",
    isRecurring: false,
    recurringDays: [] as string[],
  });

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const firstDayOfWeek = monthStart.getDay();
  const daysBeforeMonth = Array.from(
    { length: firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1 },
    (_, i) => null
  );

  const previousMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));

  const getAvailabilitiesForDay = (date: Date) => {
    return mockAvailabilities.filter((avail) => {
      const availDate = new Date(avail.date);
      return isSameDay(availDate, date);
    });
  };

  const handleAddAvailability = () => {
    if (!selectedDate) return;
    // TODO: Appel API pour ajouter la disponibilité
    console.log("Ajouter disponibilité:", { selectedDate, ...newAvailability });
    setIsAddModalOpen(false);
    setSelectedDate(null);
    setNewAvailability({ startTime: "", endTime: "", isRecurring: false, recurringDays: [] });
  };

  const dayNames = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-trebuchet text-3xl lg:text-4xl font-bold text-foreground mb-2">
            Mon Agenda
          </h1>
          <p className="text-muted-foreground">
            Gérez vos disponibilités et planifiez vos prestations
          </p>
        </div>
        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              <Plus className="w-4 h-4 mr-2" />
              Ajouter une disponibilité
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Ajouter une disponibilité</DialogTitle>
              <DialogDescription>
                {selectedDate
                  ? `Pour le ${format(selectedDate, "d MMMM yyyy", { locale: fr })}`
                  : "Sélectionnez une date dans le calendrier"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Heure de début</Label>
                  <Input
                    type="time"
                    value={newAvailability.startTime}
                    onChange={(e) =>
                      setNewAvailability({
                        ...newAvailability,
                        startTime: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <Label>Heure de fin</Label>
                  <Input
                    type="time"
                    value={newAvailability.endTime}
                    onChange={(e) =>
                      setNewAvailability({
                        ...newAvailability,
                        endTime: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="recurring"
                  checked={newAvailability.isRecurring}
                  onChange={(e) =>
                    setNewAvailability({
                      ...newAvailability,
                      isRecurring: e.target.checked,
                    })
                  }
                  className="rounded"
                />
                <Label htmlFor="recurring" className="cursor-pointer">
                  Répéter chaque semaine
                </Label>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1"
                >
                  Annuler
                </Button>
                <Button
                  onClick={handleAddAvailability}
                  disabled={!newAvailability.startTime || !newAvailability.endTime}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Ajouter
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Calendrier */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-border rounded-xl p-6 lg:p-8"
      >
        {/* Navigation */}
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

        {/* Grille */}
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
            const availabilities = getAvailabilitiesForDay(day);
            const isToday = isSameDay(day, new Date());
            const isCurrentMonth = isSameMonth(day, currentDate);

            return (
              <button
                key={day.toISOString()}
                onClick={() => {
                  setSelectedDate(day);
                  setIsAddModalOpen(true);
                }}
                className={`
                  aspect-square border border-border rounded-lg p-2 text-left
                  hover:bg-accent transition-colors
                  ${isToday ? "bg-blue-500/10 border-blue-500" : ""}
                  ${!isCurrentMonth ? "opacity-30" : ""}
                  ${availabilities.length > 0 ? "bg-green-500/5" : ""}
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
                  {availabilities.length > 0 && (
                    <div className="flex-1 flex flex-col gap-1 overflow-hidden">
                      {availabilities.map((avail) => (
                        <div
                          key={avail.id}
                          className="text-xs px-1 py-0.5 rounded bg-green-500/20 text-green-600 dark:text-green-400 truncate"
                          title={`${avail.startTime} - ${avail.endTime}`}
                        >
                          {avail.startTime}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* Liste des disponibilités */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-card border border-border rounded-xl p-6"
      >
        <h2 className="font-cera text-xl font-bold text-foreground mb-4">
          Disponibilités à venir
        </h2>
        <div className="space-y-2">
          {mockAvailabilities.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Aucune disponibilité planifiée
            </p>
          ) : (
            mockAvailabilities.map((avail) => (
              <div
                key={avail.id}
                className="flex items-center justify-between p-4 rounded-lg bg-accent"
              >
                <div className="flex items-center gap-3">
                  <CalendarIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <div>
                    <p className="font-semibold text-foreground">
                      {format(new Date(avail.date), "d MMMM yyyy", { locale: fr })}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {avail.startTime} - {avail.endTime}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    // TODO: Supprimer la disponibilité
                    console.log("Supprimer:", avail.id);
                  }}
                  className="text-red-600 hover:text-red-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            ))
          )}
        </div>
      </motion.div>
    </div>
  );
}

