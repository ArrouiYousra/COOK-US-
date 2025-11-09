"use client";

import { useEffect } from "react";
import { mockBookings } from "@/mockData";

/**
 * Hook pour gérer les rappels automatiques des réservations
 * Vérifie les réservations à venir et envoie des rappels selon les préférences
 */
export function useBookingReminders() {
  useEffect(() => {
    // TODO: Récupérer les préférences de rappels depuis l'API
    const remindersEnabled = true;
    const hours24Enabled = true;
    const hours1Enabled = true;
    const reminderMethod = "both"; // "app" | "email" | "both"

    if (!remindersEnabled) return;

    const checkReminders = () => {
      const now = new Date();
      const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
      const twentyFourHoursLater = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      // Filtrer les réservations confirmées à venir
      const upcomingBookings = mockBookings.filter((booking) => {
        if (booking.status !== "confirmed") return false;
        
        const bookingDateTime = new Date(`${booking.date}T${booking.time.split(" ")[0]}`);
        return bookingDateTime > now && bookingDateTime <= twentyFourHoursLater;
      });

      upcomingBookings.forEach((booking) => {
        const bookingDateTime = new Date(`${booking.date}T${booking.time.split(" ")[0]}`);
        const timeUntilBooking = bookingDateTime.getTime() - now.getTime();
        const hoursUntilBooking = timeUntilBooking / (1000 * 60 * 60);

        // Rappel 24h avant
        if (
          hours24Enabled &&
          hoursUntilBooking <= 24 &&
          hoursUntilBooking > 23 &&
          !booking.reminder24hSent
        ) {
          sendReminder(booking, "24h", reminderMethod);
          // TODO: Marquer comme envoyé dans la base de données
          // booking.reminder24hSent = true;
        }

        // Rappel 1h avant
        if (
          hours1Enabled &&
          hoursUntilBooking <= 1 &&
          hoursUntilBooking > 0.9 &&
          !booking.reminder1hSent
        ) {
          sendReminder(booking, "1h", reminderMethod);
          // TODO: Marquer comme envoyé dans la base de données
          // booking.reminder1hSent = true;
        }
      });
    };

    // Vérifier toutes les minutes
    const interval = setInterval(checkReminders, 60 * 1000);
    checkReminders(); // Vérifier immédiatement

    return () => clearInterval(interval);
  }, []);
}

function sendReminder(
  booking: typeof mockBookings[0],
  type: "24h" | "1h",
  method: "app" | "email" | "both"
) {
  const message = type === "24h"
    ? `Rappel : Votre réservation avec ${booking.cookName} est prévue demain à ${booking.time}`
    : `Rappel : Votre réservation avec ${booking.cookName} est prévue dans 1 heure`;

  // Notification dans l'application
  if (method === "app" || method === "both") {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification("Rappel de réservation", {
        body: message,
        icon: "/favicon.ico",
        tag: `booking-reminder-${booking.id}-${type}`,
      });
    } else if ("Notification" in window && Notification.permission !== "denied") {
      Notification.requestPermission().then((permission) => {
        if (permission === "granted") {
          new Notification("Rappel de réservation", {
            body: message,
            icon: "/favicon.ico",
            tag: `booking-reminder-${booking.id}-${type}`,
          });
        }
      });
    }
  }

  // Email (à implémenter avec l'API)
  if (method === "email" || method === "both") {
    // TODO: Appel API pour envoyer l'email
    // await apiClient.sendReminderEmail(booking.id, type);
    console.log(`Email reminder sent for booking ${booking.id} (${type})`);
  }
}

