import { format, isToday, isYesterday } from "date-fns";
import { fr } from "date-fns/locale";

/**
 * Formate l'heure d'un message de manière intelligente
 * Aujourd'hui : "14:30"
 * Hier : "Hier 14:30"
 * Cette semaine : "Lundi 14:30"
 * Plus ancien : "15 janvier 14:30"
 */
export function formatMessageTime(timestamp: Date): string {
  const now = new Date();
  const messageDate = new Date(timestamp);
  const diffInHours = (now.getTime() - messageDate.getTime()) / (1000 * 60 * 60);

  // Aujourd'hui : afficher l'heure (ex: "14:30")
  if (isToday(messageDate)) {
    return format(messageDate, "HH:mm");
  }

  // Hier : afficher "Hier 14:30"
  if (isYesterday(messageDate)) {
    return `Hier ${format(messageDate, "HH:mm")}`;
  }

  // Moins de 7 jours : afficher le jour et l'heure (ex: "Lundi 14:30")
  if (diffInHours < 168) {
    return format(messageDate, "EEEE HH:mm", { locale: fr });
  }

  // Plus ancien : afficher la date complète (ex: "15 janvier 14:30")
  return format(messageDate, "d MMMM HH:mm", { locale: fr });
}

