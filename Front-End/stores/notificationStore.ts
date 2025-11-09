"use client";

import { create } from "zustand";
import type { Notification, NotificationType } from "@/types/notifications";

interface NotificationStore extends NotificationState {
  addNotification: (notification: Notification) => void;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
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

  markAsRead: (notificationId) => {
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
    // TODO: Appel API pour marquer comme lu
    // await apiClient.markNotificationAsRead(notificationId);
  },

  markAllAsRead: () => {
    set((state) => ({
      notifications: state.notifications.map((notif) =>
        !notif.isRead
          ? { ...notif, isRead: true, readAt: new Date().toISOString() }
          : notif
      ),
      unreadCount: 0,
    }));
    // TODO: Appel API pour marquer toutes comme lues
    // await apiClient.markAllNotificationsAsRead();
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

