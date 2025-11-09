"use client";

import { useEffect } from "react";
import { useNotificationStore, createMockNotification } from "@/stores/notificationStore";
import { useAuthStore } from "@/stores/authStore";

/**
 * Hook pour initialiser et gérer les notifications en temps réel
 * TODO: Intégrer Socket.io ou Firebase pour les notifications en temps réel
 */
export function useNotifications() {
  const { user } = useAuthStore();
  const { setNotifications, addNotification } = useNotificationStore();

  useEffect(() => {
    if (!user) return;

    // TODO: Initialiser la connexion Socket.io ou Firebase
    // const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL);
    // socket.on('notification', (notification) => {
    //   addNotification(notification);
    // });

    // Mock data pour le développement
    const mockNotifications = [
      createMockNotification(
        "BOOKING_REQUEST",
        "Nouvelle proposition reçue",
        "Marie Martin vous a proposé ses services pour votre demande du 25 décembre",
        "/dashboard/client/requests"
      ),
      createMockNotification(
        "MESSAGE_RECEIVED",
        "Nouveau message",
        "Thomas Dubois vous a envoyé un message",
        "/dashboard/client/messages?cook=3"
      ),
      createMockNotification(
        "BOOKING_CONFIRMED",
        "Réservation confirmée",
        "Votre réservation avec Sophie Dubois pour le 25 décembre est confirmée",
        "/dashboard/client/bookings"
      ),
      createMockNotification(
        "PAYMENT_RECEIVED",
        "Paiement réussi",
        "Votre paiement de 140€ pour la réservation du 25 décembre a été traité avec succès",
        "/dashboard/client/bookings"
      ),
    ];

    // Charger les notifications initiales (mock data pour le développement)
    // TODO: Remplacer par un appel API réel
    // const notifications = await apiClient.getNotifications();
    // setNotifications(notifications);
    setNotifications(mockNotifications);

    // TODO: Intégrer Socket.io pour les notifications en temps réel
    // Exemple avec Socket.io :
    // const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL, {
    //   auth: { token: getToken() }
    // });
    // socket.on('notification', (notification: Notification) => {
    //   addNotification(notification);
    // });
    // socket.on('connect', () => {
    //   console.log('Connected to notification server');
    // });
    // return () => {
    //   socket.disconnect();
    // };

    // Pour le développement uniquement : simuler de nouvelles notifications
    // Supprimer en production
    if (process.env.NODE_ENV === "development") {
      // Ne pas créer d'interval automatique pour éviter le spam
      // Les notifications mock sont déjà chargées ci-dessus
    }
  }, [user, setNotifications, addNotification]);
}

