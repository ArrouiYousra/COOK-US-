"use client";

import { create } from "zustand";
import type { Notification, NotificationType } from "@/types/notifications";

interface NotificationStore extends NotificationState {
  addNotification: (notification: Notification) => void;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  removeNotification: (notificationId: string) => void;
  clearAll: () => void;
  setNotifications: (notifications: Notification[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

/**
 * Store Zustand pour la gestion des notifications
 * Gère les notifications en temps réel
 */
export const useNotificationStore = create<NotificationStore>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  error: null,

  addNotification: (notification) => {
    set((state) => ({
      notifications: [notification, ...state.notifications],
      unreadCount: notification.isRead ? state.unreadCount : state.unreadCount + 1,
    }));
  },

  markAsRead: async (notificationId) => {
    // Mise à jour optimiste de l'UI
    set((state) => {
      const updated = state.notifications.map((notif) =>
        notif.id === notificationId && !notif.isRead
          ? { ...notif, isRead: true, readAt: new Date().toISOString() }
          : notif
      );
      return {
        notifications: updated,
        unreadCount: Math.max(0, state.unreadCount - 1),
      };
    });

    // Appel API pour marquer comme lu
    try {
      const { apiClient } = await import("@/lib/api/client");
      await apiClient.markNotificationAsRead(notificationId);
    } catch (error) {
      console.error("Erreur lors du marquage de la notification comme lue:", error);
      // En cas d'erreur, on revert l'état optimiste
      set((state) => {
        const updated = state.notifications.map((notif) =>
          notif.id === notificationId
            ? { ...notif, isRead: false, readAt: undefined }
            : notif
        );
        return {
          notifications: updated,
          unreadCount: state.unreadCount + 1,
        };
      });
    }
  },

  markAllAsRead: async () => {
    // Mise à jour optimiste de l'UI
    set((state) => ({
      notifications: state.notifications.map((notif) =>
        !notif.isRead
          ? { ...notif, isRead: true, readAt: new Date().toISOString() }
          : notif
      ),
      unreadCount: 0,
    }));

    // Appel API pour marquer toutes comme lues
    try {
      const { apiClient } = await import("@/lib/api/client");
      await apiClient.markAllNotificationsAsRead();
    } catch (error) {
      console.error("Erreur lors du marquage de toutes les notifications comme lues:", error);
      // En cas d'erreur, on revert l'état optimiste
      set((state) => {
        const unreadCount = state.notifications.filter((n) => !n.isRead).length;
        return {
          notifications: state.notifications.map((notif) =>
            notif.isRead && !notif.readAt
              ? { ...notif, isRead: false, readAt: undefined }
              : notif
          ),
          unreadCount,
        };
      });
    }
  },

  removeNotification: (notificationId) => {
    set((state) => {
      const notification = state.notifications.find((n) => n.id === notificationId);
      return {
        notifications: state.notifications.filter((n) => n.id !== notificationId),
        unreadCount: notification && !notification.isRead
          ? Math.max(0, state.unreadCount - 1)
          : state.unreadCount,
      };
    });
  },

  clearAll: () => {
    set({
      notifications: [],
      unreadCount: 0,
    });
  },

  setNotifications: (notifications) => {
    const unreadCount = notifications.filter((n) => !n.isRead).length;
    set({ notifications, unreadCount });
  },

  setLoading: (loading) => {
    set({ isLoading: loading });
  },

  setError: (error) => {
    set({ error });
  },
}));

// Helper pour créer des notifications mock
export function createMockNotification(
  type: NotificationType,
  title: string,
  message: string,
  actionUrl?: string
): Notification {
  return {
    id: `notif-${Date.now()}-${Math.random()}`,
    userId: "current-user",
    type,
    title,
    message,
    actionUrl,
    isRead: false,
    createdAt: new Date().toISOString(),
  };
}
