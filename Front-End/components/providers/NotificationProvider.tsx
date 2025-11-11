"use client";

import { useEffect, useRef } from "react";
import { Toaster, toast } from "sonner";
import { useNotificationStore } from "@/stores/notificationStore";
import type { Notification } from "@/types/notifications";
import { Bell, ChefHat, MessageSquare, Calendar, CreditCard, CheckCircle2, XCircle, Info } from "lucide-react";

/**
 * Provider pour les notifications en temps réel
 * Gère les toasts, sonneries et badges
 */
export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { notifications, unreadCount } = useNotificationStore();
  const previousNotificationsRef = useRef<Set<string>>(new Set());
  const previousUnreadCountRef = useRef(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialiser l'audio pour les sonneries
  useEffect(() => {
    if (typeof window !== "undefined") {
      // Créer un audio context pour les sonneries
      audioRef.current = new Audio();
      audioRef.current.volume = 0.5;
    }
  }, []);

  // Fonction pour jouer une sonnerie
  const playNotificationSound = () => {
    if (audioRef.current && typeof window !== "undefined") {
      try {
        // Créer un son de notification simple avec Web Audio API
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = 800;
        oscillator.type = "sine";

        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
      } catch (error) {
        console.warn("Impossible de jouer la sonnerie:", error);
      }
    }
  };

  // Fonction pour obtenir l'icône selon le type de notification
  const getNotificationIcon = (type: Notification["type"]) => {
    switch (type) {
      case "BOOKING_REQUEST":
        return <ChefHat className="w-5 h-5" />;
      case "MESSAGE_RECEIVED":
        return <MessageSquare className="w-5 h-5" />;
      case "BOOKING_CONFIRMED":
        return <CheckCircle2 className="w-5 h-5" />;
      case "PAYMENT_RECEIVED":
        return <CreditCard className="w-5 h-5" />;
      case "BOOKING_CANCELLED":
        return <XCircle className="w-5 h-5" />;
      default:
        return <Bell className="w-5 h-5" />;
    }
  };

  // Fonction pour obtenir la couleur selon le type
  const getNotificationColor = (type: Notification["type"]) => {
    switch (type) {
      case "BOOKING_REQUEST":
        return "blue";
      case "MESSAGE_RECEIVED":
        return "green";
      case "BOOKING_CONFIRMED":
        return "purple";
      case "PAYMENT_RECEIVED":
        return "yellow";
      case "BOOKING_CANCELLED":
        return "red";
      default:
        return "default";
    }
  };

  // Détecter les nouvelles notifications et afficher des toasts
  useEffect(() => {
    const currentNotificationIds = new Set(notifications.map((n) => n.id));
    const previousIds = previousNotificationsRef.current;

    // Trouver les nouvelles notifications
    const newNotifications = notifications.filter(
      (notif) => !previousIds.has(notif.id) && !notif.isRead
    );

    // Afficher un toast pour chaque nouvelle notification
    if (newNotifications.length > 0) {
      newNotifications.forEach((notification) => {
        const icon = getNotificationIcon(notification.type);
        const color = getNotificationColor(notification.type);

        // Jouer la sonnerie seulement pour la première notification
        if (newNotifications.indexOf(notification) === 0) {
          playNotificationSound();
        }

        // Afficher le toast
        toast(notification.title, {
          description: notification.message,
          icon: icon,
          duration: 5000,
          action: notification.actionUrl
            ? {
                label: "Voir",
                onClick: () => {
                  if (typeof window !== "undefined" && notification.actionUrl) {
                    window.location.href = notification.actionUrl;
                  }
                },
              }
            : undefined,
          className: `toast-${color}`,
        });
      });
    }

    // Mettre à jour la référence
    previousNotificationsRef.current = currentNotificationIds;
  }, [notifications]);

  // Détecter les changements dans le nombre de notifications non lues
  useEffect(() => {
    if (unreadCount > previousUnreadCountRef.current && unreadCount > 0) {
      // Il y a de nouvelles notifications non lues
      // La sonnerie et le toast sont déjà gérés par l'effet précédent
    }
    previousUnreadCountRef.current = unreadCount;
  }, [unreadCount]);

  return (
    <>
      {children}
      <Toaster
        position="top-right"
        richColors
        expand={true}
        closeButton
        toastOptions={{
          className: "toast-custom",
          style: {
            background: "var(--background)",
            border: "1px solid var(--border)",
            color: "var(--foreground)",
          },
        }}
      />
    </>
  );
}

