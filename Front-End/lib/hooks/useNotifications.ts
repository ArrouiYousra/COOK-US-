"use client";

import { useEffect, useRef, useCallback } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { useNotificationStore } from "@/stores/notificationStore";
import { useAuthStore } from "@/stores/authStore";
import { apiClient } from "@/lib/api/client";
import type { Notification } from "@/types/notifications";
import { getSupabaseClient } from "@/lib/supabase/client";

/**
 * Hook pour initialiser et gérer les notifications en temps réel.
 * Charge les notifications depuis l'API puis s'abonne aux changements Supabase Realtime.
 */
export function useNotifications() {
  const { user, isAuthenticated } = useAuthStore();
  const { setNotifications, setLoading, setError, addNotification } =
    useNotificationStore();
  const isLoadingRef = useRef(false);
  const channelRef = useRef<RealtimeChannel | null>(null);

  const mapNotification = useCallback((notif: any): Notification => ({
    id: notif.id,
    userId: notif.user_id,
    type: notif.type as Notification["type"],
    title: notif.title || "Notification",
    message: notif.message || "",
    actionUrl: notif.action_url || undefined,
    metadata: notif.metadata ?? undefined,
    isRead: Boolean(notif.is_read),
    readAt: notif.read_at || undefined,
    createdAt: notif.created_at || new Date().toISOString(),
  }), []);

  const loadNotifications = useCallback(async () => {
    if (isLoadingRef.current) return;
    if (!user || !isAuthenticated) {
      setNotifications([]);
      return;
    }

    try {
      isLoadingRef.current = true;
      setLoading(true);
      setError(null);

      const response = await apiClient.getNotifications({ limit: 50, offset: 0 });
      const mapped = (response.notifications || []).map(mapNotification);
      setNotifications(mapped);
    } catch (error: unknown) {
      const status =
        error &&
        typeof error === "object" &&
        "response" in error &&
        (error as { response?: { status?: number } }).response?.status;

      if (status === 401) {
        setError("Session expirée. Veuillez vous reconnecter.");
        setNotifications([]);
      } else {
        console.error("Erreur lors du chargement des notifications:", error);
        setError("Impossible de charger les notifications");
      }
    } finally {
      setLoading(false);
      isLoadingRef.current = false;
    }
  }, [
    user,
    isAuthenticated,
    setNotifications,
    setLoading,
    setError,
    mapNotification,
  ]);

  useEffect(() => {
    if (!user || !isAuthenticated) {
      setNotifications([]);
      channelRef.current?.unsubscribe();
      channelRef.current = null;
      return;
    }

    loadNotifications();

    const supabase = getSupabaseClient();
    const channel = supabase
      .channel(`notifications:user:${user.id}`, {
        config: { broadcast: { ack: true } },
      })
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newNotification = mapNotification(payload.new);
          addNotification(newNotification);
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          loadNotifications();
        },
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          loadNotifications();
        },
      )
      .subscribe((status) => {
        if (status === "CHANNEL_ERROR") {
          console.error(
            "Erreur d'abonnement Supabase Realtime pour les notifications",
          );
        }
      });

    channelRef.current = channel;

    return () => {
      channel.unsubscribe();
      if (channelRef.current === channel) {
        channelRef.current = null;
      }
    };
  }, [
    user?.id,
    isAuthenticated,
    loadNotifications,
    setNotifications,
    addNotification,
    mapNotification,
  ]);

  useEffect(() => {
    return () => {
      channelRef.current?.unsubscribe();
      channelRef.current = null;
    };
  }, []);
}
