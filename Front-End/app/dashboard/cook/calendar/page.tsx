"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Calendar as CalendarIcon,
  Clock,
  Plus,
  X,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  CheckCircle,
  Ban,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  getDay,
  startOfWeek,
  endOfWeek,
} from "date-fns";
import { fr } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiClient } from "@/lib/api/client";
import { useAuthStore } from "@/stores/authStore";

type DayOfWeek = "MONDAY" | "TUESDAY" | "WEDNESDAY" | "THURSDAY" | "FRIDAY" | "SATURDAY" | "SUNDAY";
type MealType = "BREAKFAST" | "LUNCH" | "DINNER" | "BRUNCH";

interface Availability {
  id: string;
  day_of_week: DayOfWeek;
  meal_type: MealType;
  start_time: string;
  end_time: string;
  is_active: boolean;
}

const DAY_OF_WEEK_MAP: Record<number, DayOfWeek> = {
  1: "MONDAY",
  2: "TUESDAY",
  3: "WEDNESDAY",
  4: "THURSDAY",
  5: "FRIDAY",
  6: "SATURDAY",
  0: "SUNDAY",
};

const DAY_OF_WEEK_LABELS: Record<DayOfWeek, string> = {
  MONDAY: "Lundi",
  TUESDAY: "Mardi",
  WEDNESDAY: "Mercredi",
  THURSDAY: "Jeudi",
  FRIDAY: "Vendredi",
  SATURDAY: "Samedi",
  SUNDAY: "Dimanche",
};

const MEAL_TYPE_LABELS: Record<MealType, string> = {
  BREAKFAST: "Petit-déjeuner",
  LUNCH: "Déjeuner",
  DINNER: "Dîner",
  BRUNCH: "Brunch",
};

/**
 * Page "Mon Agenda"
 * Gestion des disponibilités du cuisinier
 */
export default function CookCalendarPage() {
  const router = useRouter();
  const { user, isAuthenticated, checkAuth, isLoading: isAuthLoading } = useAuthStore();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [availabilities, setAvailabilities] = useState<Availability[]>([]);
  const [blockedDates, setBlockedDates] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isBlockDateModalOpen, setIsBlockDateModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [newAvailability, setNewAvailability] = useState({
    day_of_week: "" as DayOfWeek | "",
    meal_type: "" as MealType | "",
    startTime: "",
    endTime: "",
    is_active: true,
  });
  const [blockDateData, setBlockDateData] = useState({
    date: "",
    reason: "",
  });

  // Vérifier l'authentification au montage (une seule fois)
  useEffect(() => {
    if (isAuthLoading) return;
    
    const verifyAuth = async () => {
      if (!isAuthenticated) {
        try {
          await checkAuth();
        } catch (error) {
          console.warn("Authentification échouée, redirection vers la page de connexion");
          // Utiliser router.replace pour éviter d'ajouter une entrée dans l'historique
          router.replace("/auth/login");
        }
      }
    };

    verifyAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Exécuter une seule fois au montage

  // Charger les données
  useEffect(() => {
    const loadData = async () => {
      if (isAuthLoading) return;
      if (!isAuthenticated || !user) return;

      setIsLoading(true);
      setError(null);

      try {
        const monthStart = startOfMonth(currentDate);
        const monthEnd = endOfMonth(currentDate);

        const [availabilitiesResponse, blockedDatesResponse, bookingsResponse] = await Promise.allSettled([
          apiClient.getMyAvailabilities(),
          apiClient.getMyBlockedDates({
            from_date: format(monthStart, "yyyy-MM-dd"),
            to_date: format(monthEnd, "yyyy-MM-dd"),
          }),
          apiClient.getBookings({ limit: 1000 }),
        ]);

        if (availabilitiesResponse.status === "fulfilled") {
          setAvailabilities(availabilitiesResponse.value.availabilities || []);
        }

        if (blockedDatesResponse.status === "fulfilled") {
          setBlockedDates(blockedDatesResponse.value.blocked_dates || []);
        }

        if (bookingsResponse.status === "fulfilled") {
          setBookings(bookingsResponse.value.bookings || []);
        }
      } catch (err: any) {
        console.error("Erreur lors du chargement des données:", err);
        setError(err.response?.data?.message || "Impossible de charger les données");
      } finally {
        setIsLoading(false);
      }
    };

    if (!isAuthLoading && isAuthenticated && user?.id) {
      loadData();
    }
  }, [isAuthenticated, user?.id, isAuthLoading, currentDate]);

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

  // Obtenir les disponibilités pour un jour donné
  const getAvailabilitiesForDay = (date: Date) => {
    const dayOfWeek = DAY_OF_WEEK_MAP[getDay(date)];
    return availabilities.filter(
      (avail) => avail.day_of_week === dayOfWeek && avail.is_active
    );
  };

  // Vérifier si une date est bloquée
  const isDateBlocked = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    return blockedDates.some((bd) => bd.date === dateStr);
  };

  // Obtenir les réservations pour un jour donné
  const getBookingsForDay = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    return bookings.filter((booking) => {
      if (!booking.booking_date) return false;
      const bookingDateStr = format(new Date(booking.booking_date), "yyyy-MM-dd");
      return bookingDateStr === dateStr;
    });
  };

  const handleAddAvailability = async () => {
    if (!newAvailability.day_of_week || !newAvailability.meal_type || !newAvailability.startTime || !newAvailability.endTime) {
      setError("Veuillez remplir tous les champs");
      return;
    }

    try {
      await apiClient.createAvailability({
        day_of_week: newAvailability.day_of_week,
        meal_type: newAvailability.meal_type,
        start_time: `${newAvailability.startTime}:00`,
        end_time: `${newAvailability.endTime}:00`,
        is_active: newAvailability.is_active,
      });

      // Recharger les disponibilités
      const response = await apiClient.getMyAvailabilities();
      setAvailabilities(response.availabilities || []);

      setIsAddModalOpen(false);
      setNewAvailability({
        day_of_week: "" as DayOfWeek | "",
        meal_type: "" as MealType | "",
        startTime: "",
        endTime: "",
        is_active: true,
      });
      setSuccessMessage("Disponibilité ajoutée avec succès");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      console.error("Erreur lors de l'ajout de la disponibilité:", err);
      setError(err.response?.data?.message || "Impossible d'ajouter la disponibilité");
      setTimeout(() => setError(null), 5000);
    }
  };

  const handleDeleteAvailability = async (availabilityId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette disponibilité ?")) return;

    try {
      await apiClient.deleteAvailability(availabilityId);
      const response = await apiClient.getMyAvailabilities();
      setAvailabilities(response.availabilities || []);
      setSuccessMessage("Disponibilité supprimée avec succès");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      console.error("Erreur lors de la suppression:", err);
      setError(err.response?.data?.message || "Impossible de supprimer la disponibilité");
      setTimeout(() => setError(null), 5000);
    }
  };

  const handleBlockDate = async () => {
    if (!blockDateData.date) {
      setError("Veuillez sélectionner une date");
      return;
    }

    try {
      await apiClient.createBlockedDate({
        date: blockDateData.date,
        reason: blockDateData.reason || undefined,
      });

      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);
      const response = await apiClient.getMyBlockedDates({
        from_date: format(monthStart, "yyyy-MM-dd"),
        to_date: format(monthEnd, "yyyy-MM-dd"),
      });
      setBlockedDates(response.blocked_dates || []);

      setIsBlockDateModalOpen(false);
      setBlockDateData({ date: "", reason: "" });
      setSelectedDate(null);
      setSuccessMessage("Date bloquée avec succès");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      console.error("Erreur lors du blocage de la date:", err);
      setError(err.response?.data?.message || "Impossible de bloquer la date");
      setTimeout(() => setError(null), 5000);
    }
  };

  const handleUnblockDate = async (blockedDateId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir débloquer cette date ?")) return;

    try {
      await apiClient.deleteBlockedDate(blockedDateId);
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);
      const response = await apiClient.getMyBlockedDates({
        from_date: format(monthStart, "yyyy-MM-dd"),
        to_date: format(monthEnd, "yyyy-MM-dd"),
      });
      setBlockedDates(response.blocked_dates || []);
      setSuccessMessage("Date débloquée avec succès");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      console.error("Erreur lors du déblocage:", err);
      setError(err.response?.data?.message || "Impossible de débloquer la date");
      setTimeout(() => setError(null), 5000);
    }
  };

  const dayNames = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

  // Afficher un loader pendant le chargement
  if (isLoading || isAuthLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Chargement du calendrier...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-trebuchet text-3xl lg:text-4xl font-bold text-foreground mb-2">
            Mon Agenda
          </h1>
          <p className="text-muted-foreground">
            Gérez vos disponibilités récurrentes et vos dates bloquées
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => {
              setSelectedDate(null);
              setIsBlockDateModalOpen(true);
            }}
          >
            <Ban className="w-4 h-4 mr-2" />
            Bloquer une date
          </Button>
          <Button
            className="bg-blue-600 hover:bg-blue-700 text-white"
            onClick={() => setIsAddModalOpen(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Ajouter une disponibilité
          </Button>
        </div>
      </div>

      {/* Messages de succès/erreur */}
      {successMessage && (
        <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
          <p className="text-sm text-green-600 dark:text-green-400">{successMessage}</p>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Calendrier */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-border rounded-xl p-6 lg:p-8"
      >
        {/* Navigation */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={previousMonth} className="h-9 w-9">
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <h2 className="font-cera text-2xl font-bold text-foreground">
              {format(currentDate, "MMMM yyyy", { locale: fr })}
            </h2>
            <Button variant="outline" size="icon" onClick={nextMonth} className="h-9 w-9">
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
          <Button variant="outline" onClick={() => setCurrentDate(new Date())} size="sm">
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
            const dayAvailabilities = getAvailabilitiesForDay(day);
            const dayBookings = getBookingsForDay(day);
            const isBlocked = isDateBlocked(day);
            const isToday = isSameDay(day, new Date());
            const isCurrentMonth = isSameMonth(day, currentDate);

            return (
              <div
                key={day.toISOString()}
                className={`
                  aspect-square border border-border rounded-lg p-2 text-left
                  ${isToday ? "bg-blue-500/10 border-blue-500" : ""}
                  ${!isCurrentMonth ? "opacity-30" : ""}
                  ${isBlocked ? "bg-red-500/10 border-red-500/50" : ""}
                  ${dayAvailabilities.length > 0 && !isBlocked ? "bg-green-500/5" : ""}
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
                  <div className="flex-1 flex flex-col gap-1 overflow-hidden">
                    {isBlocked && (
                      <div className="text-xs px-1 py-0.5 rounded bg-red-500/20 text-red-600 dark:text-red-400 truncate">
                        Bloqué
                      </div>
                    )}
                    {!isBlocked && dayAvailabilities.length > 0 && (
                      <div className="text-xs px-1 py-0.5 rounded bg-green-500/20 text-green-600 dark:text-green-400 truncate">
                        {dayAvailabilities.length} dispo.
                      </div>
                    )}
                    {dayBookings.length > 0 && (
                      <div className="text-xs px-1 py-0.5 rounded bg-blue-500/20 text-blue-600 dark:text-blue-400 truncate">
                        {dayBookings.length} réserv.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Liste des disponibilités récurrentes */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-card border border-border rounded-xl p-6"
      >
        <h2 className="font-cera text-xl font-bold text-foreground mb-4">
          Disponibilités récurrentes
        </h2>
        <div className="space-y-2">
          {availabilities.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Aucune disponibilité récurrente planifiée
            </p>
          ) : (
            availabilities.map((avail) => (
              <div
                key={avail.id}
                className="flex items-center justify-between p-4 rounded-lg bg-accent"
              >
                <div className="flex items-center gap-3">
                  <CalendarIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <div>
                    <p className="font-semibold text-foreground">
                      {DAY_OF_WEEK_LABELS[avail.day_of_week as DayOfWeek]} - {MEAL_TYPE_LABELS[avail.meal_type as MealType]}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {avail.start_time.slice(0, 5)} - {avail.end_time.slice(0, 5)}
                      {!avail.is_active && " (Désactivée)"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteAvailability(avail.id)}
                  className="text-red-600 hover:text-red-700"
                  title="Supprimer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            ))
          )}
        </div>
      </motion.div>

      {/* Liste des dates bloquées */}
      {blockedDates.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-card border border-border rounded-xl p-6"
        >
          <h2 className="font-cera text-xl font-bold text-foreground mb-4">
            Dates bloquées ({format(currentDate, "MMMM yyyy", { locale: fr })})
          </h2>
          <div className="space-y-2">
            {blockedDates.map((bd) => (
              <div
                key={bd.id}
                className="flex items-center justify-between p-4 rounded-lg bg-accent"
              >
                <div className="flex items-center gap-3">
                  <Ban className="w-5 h-5 text-red-600 dark:text-red-400" />
                  <div>
                    <p className="font-semibold text-foreground">
                      {format(new Date(bd.date), "d MMMM yyyy", { locale: fr })}
                    </p>
                    {bd.reason && (
                      <p className="text-sm text-muted-foreground">{bd.reason}</p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleUnblockDate(bd.id)}
                  className="text-red-600 hover:text-red-700"
                  title="Débloquer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Dialog d'ajout de disponibilité */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter une disponibilité récurrente</DialogTitle>
            <DialogDescription>
              Cette disponibilité sera répétée chaque semaine pour le jour et le type de repas sélectionnés.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Jour de la semaine *</Label>
              <Select
                value={newAvailability.day_of_week}
                onValueChange={(value) =>
                  setNewAvailability({ ...newAvailability, day_of_week: value as DayOfWeek })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un jour" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(DAY_OF_WEEK_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Type de repas *</Label>
              <Select
                value={newAvailability.meal_type}
                onValueChange={(value) =>
                  setNewAvailability({ ...newAvailability, meal_type: value as MealType })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un type de repas" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(MEAL_TYPE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Heure de début *</Label>
                <Input
                  type="time"
                  value={newAvailability.startTime}
                  onChange={(e) =>
                    setNewAvailability({ ...newAvailability, startTime: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>Heure de fin *</Label>
                <Input
                  type="time"
                  value={newAvailability.endTime}
                  onChange={(e) =>
                    setNewAvailability({ ...newAvailability, endTime: e.target.value })
                  }
                />
              </div>
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
                disabled={
                  !newAvailability.day_of_week ||
                  !newAvailability.meal_type ||
                  !newAvailability.startTime ||
                  !newAvailability.endTime
                }
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              >
                Ajouter
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de blocage de date */}
      <Dialog open={isBlockDateModalOpen} onOpenChange={setIsBlockDateModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bloquer une date</DialogTitle>
            <DialogDescription>
              Cette date sera indisponible pour les réservations, même si vous avez des disponibilités récurrentes ce jour-là.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Date *</Label>
              <Input
                type="date"
                value={blockDateData.date || (selectedDate ? format(selectedDate, "yyyy-MM-dd") : "")}
                onChange={(e) => setBlockDateData({ ...blockDateData, date: e.target.value })}
                min={format(new Date(), "yyyy-MM-dd")}
              />
            </div>
            <div>
              <Label>Raison (optionnel)</Label>
              <Input
                type="text"
                placeholder="Ex: Vacances, événement personnel..."
                value={blockDateData.reason}
                onChange={(e) => setBlockDateData({ ...blockDateData, reason: e.target.value })}
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsBlockDateModalOpen(false);
                  setBlockDateData({ date: "", reason: "" });
                  setSelectedDate(null);
                }}
                className="flex-1"
              >
                Annuler
              </Button>
              <Button
                onClick={handleBlockDate}
                disabled={!blockDateData.date}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              >
                Bloquer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
