"use client";

import { useEffect, useRef } from "react";
import { useNotificationStore } from "@/stores/notificationStore";
import { useAuthStore } from "@/stores/authStore";
import { apiClient } from "@/lib/api/client";
import type { Notification } from "@/types/notifications";

/**
 * Hook pour initialiser et gérer les notifications en temps réel
 * Charge les notifications depuis l'API et les met à jour périodiquement
 * TODO: Intégrer Socket.io ou Firebase pour les notifications en temps réel
 */
export function useNotifications() {
  const { user, isAuthenticated } = useAuthStore();
  const { setNotifications, setLoading, setError } = useNotificationStore();
  const isLoadingRef = useRef(false);

  useEffect(() => {
    if (!user || !isAuthenticated) {
      setNotifications([]);
      return;
    }

    const loadNotifications = async () => {
      // Éviter les appels multiples simultanés
      if (isLoadingRef.current) return;
      
      try {
        isLoadingRef.current = true;
        setLoading(true);
        setError(null);

        const response = await apiClient.getNotifications({
          limit: 50, // Charger les 50 dernières notifications
          offset: 0,
        });

        // Mapper les données de l'API au format Notification
        const mappedNotifications: Notification[] = (response.notifications || []).map(
          (notif: any) => ({
            id: notif.id,
            userId: notif.user_id,
            type: notif.type as Notification["type"],
            title: notif.title || "Notification",
            message: notif.message || "",
            actionUrl: notif.action_url || undefined,
            metadata: notif.metadata || {},
            isRead: notif.is_read || false,
            readAt: notif.read_at || undefined,
            createdAt: notif.created_at || new Date().toISOString(),
          })
        );

        setNotifications(mappedNotifications);
      } catch (error) {
        console.error("Erreur lors du chargement des notifications:", error);
        setError("Impossible de charger les notifications");
        // En cas d'erreur, on garde un tableau vide plutôt que de planter
        setNotifications([]);
      } finally {
        setLoading(false);
        isLoadingRef.current = false;
      }
    };

    // Charger les notifications immédiatement
    loadNotifications();

    // Rafraîchir les notifications toutes les 30 secondes
    const interval = setInterval(loadNotifications, 30000);

    // TODO: Intégrer Socket.io ou Firebase pour les notifications en temps réel
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
    //   clearInterval(interval);
    // };

    return () => {
      clearInterval(interval);
    };
  }, [user, isAuthenticated, setNotifications, setLoading, setError]);
}
