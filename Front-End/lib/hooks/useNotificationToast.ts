"use client";

import { toast } from "sonner";
import type { Notification } from "@/types/notifications";
import { Bell, ChefHat, MessageSquare, CreditCard, CheckCircle2, XCircle } from "lucide-react";
import React from "react";

/**
 * Hook pour afficher des toasts de notification
 */
export function useNotificationToast() {
  const getNotificationIcon = (type: Notification["type"]): React.ReactNode => {
    switch (type) {
      case "BOOKING_REQUEST":
        return React.createElement(ChefHat, { className: "w-5 h-5" });
      case "MESSAGE_RECEIVED":
        return React.createElement(MessageSquare, { className: "w-5 h-5" });
      case "BOOKING_CONFIRMED":
        return React.createElement(CheckCircle2, { className: "w-5 h-5" });
      case "PAYMENT_RECEIVED":
        return React.createElement(CreditCard, { className: "w-5 h-5" });
      case "BOOKING_CANCELLED":
        return React.createElement(XCircle, { className: "w-5 h-5" });
      default:
        return React.createElement(Bell, { className: "w-5 h-5" });
    }
  };

  const showNotificationToast = (notification: Notification) => {
    const icon = getNotificationIcon(notification.type);

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
    });
  };

  const showSuccessToast = (message: string, description?: string) => {
    toast.success(message, {
      description,
      duration: 3000,
    });
  };

  const showErrorToast = (message: string, description?: string) => {
    toast.error(message, {
      description,
      duration: 5000,
    });
  };

  const showInfoToast = (message: string, description?: string) => {
    toast.info(message, {
      description,
      duration: 4000,
    });
  };

  return {
    showNotificationToast,
    showSuccessToast,
    showErrorToast,
    showInfoToast,
  };
}

