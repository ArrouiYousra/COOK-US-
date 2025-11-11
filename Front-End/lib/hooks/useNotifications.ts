"use client";

import { useEffect, useRef, useCallback } from "react";
import { useNotificationStore } from "@/stores/notificationStore";
import { useAuthStore } from "@/stores/authStore";
import { apiClient } from "@/lib/api/client";
import type { Notification } from "@/types/notifications";
import { useNotificationToast } from "./useNotificationToast";

/**
 * Hook pour initialiser et gérer les notifications en temps réel
 * Charge les notifications depuis l'API et les met à jour périodiquement
 * TODO: Intégrer Socket.io ou Firebase pour les notifications en temps réel
 */
export function useNotifications() {
  const { user, isAuthenticated } = useAuthStore();
  const { setNotifications, setLoading, setError } = useNotificationStore();
  const { showNotificationToast } = useNotificationToast();
  const isLoadingRef = useRef(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const hasAuthErrorRef = useRef(false);
  const previousNotificationIdsRef = useRef<Set<string>>(new Set());

  // Utiliser useCallback pour stabiliser la fonction et éviter les re-renders
  const loadNotifications = useCallback(async () => {
    // Éviter les appels multiples simultanés
    if (isLoadingRef.current) return;
    
    // Si l'utilisateur n'est plus authentifié, arrêter le polling
    if (!user || !isAuthenticated) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }
      
      try {
        isLoadingRef.current = true;
        setLoading(true);
        setError(null);
      hasAuthErrorRef.current = false;

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

        // Détecter les nouvelles notifications
        const currentIds = new Set(mappedNotifications.map((n) => n.id));
        const previousIds = previousNotificationIdsRef.current;
        
        const newNotifications = mappedNotifications.filter(
          (notif) => !previousIds.has(notif.id) && !notif.isRead
        );

        // Afficher des toasts pour les nouvelles notifications
        newNotifications.forEach((notification) => {
          showNotificationToast(notification);
        });

        // Mettre à jour la référence des IDs
        previousNotificationIdsRef.current = currentIds;

        setNotifications(mappedNotifications);
    } catch (error: unknown) {
      // Si erreur 401 (Unauthorized), arrêter le polling
      const errorObj = error && typeof error === 'object' && 'response' in error 
        ? (error as { response?: { status?: number }; message?: string })
        : null;
      
      if (errorObj?.response?.status === 401 || errorObj?.message?.includes('Jeton d\'authentification manquant')) {
        console.warn("Erreur d'authentification lors du chargement des notifications, arrêt du polling");
        hasAuthErrorRef.current = true;
        setError("Session expirée. Veuillez vous reconnecter.");
        setNotifications([]);
        
        // Arrêter le polling
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        return;
      }
      
        console.error("Erreur lors du chargement des notifications:", error);
        setError("Impossible de charger les notifications");
        // En cas d'erreur, on garde un tableau vide plutôt que de planter
        setNotifications([]);
      } finally {
        setLoading(false);
        isLoadingRef.current = false;
      }
  }, [user, isAuthenticated, setNotifications, setLoading, setError]);

  useEffect(() => {
    if (!user || !isAuthenticated) {
      setNotifications([]);
      // Arrêter le polling si l'utilisateur n'est plus authentifié
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Réinitialiser le flag d'erreur d'authentification si l'utilisateur est authentifié
    hasAuthErrorRef.current = false;

    // Charger les notifications immédiatement
    loadNotifications();

    // Rafraîchir les notifications toutes les 30 secondes seulement si pas d'erreur d'authentification
    if (!intervalRef.current && !hasAuthErrorRef.current) {
      intervalRef.current = setInterval(() => {
        // Ne pas continuer le polling si on a une erreur d'authentification
        if (!hasAuthErrorRef.current) {
          loadNotifications();
        }
      }, 30000);
    }

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
    //   clearInterval(intervalRef.current);
    // };

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [user?.id, isAuthenticated, loadNotifications, setNotifications]);
}
