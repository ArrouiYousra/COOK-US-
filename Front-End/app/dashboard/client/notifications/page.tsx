"use client";

import { motion } from "framer-motion";
import { Bell, CheckCheck, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNotificationStore } from "@/stores/notificationStore";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import type { Notification } from "@/types/notifications";
import {
  ChefHat,
  MessageSquare,
  Calendar,
  CreditCard,
  X,
  BookOpen,
  UserCheck,
  UserX,
  Info,
} from "lucide-react";

/**
 * Page "Notifications"
 * Vue complète de toutes les notifications avec gestion
 */
export default function NotificationsPage() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, removeNotification } =
    useNotificationStore();

  const getNotificationIcon = (type: Notification["type"]) => {
    switch (type) {
      case "BOOKING_REQUEST":
        return { icon: ChefHat, color: "text-blue-600 dark:text-blue-400" };
      case "MESSAGE_RECEIVED":
        return { icon: MessageSquare, color: "text-green-600 dark:text-green-400" };
      case "BOOKING_CONFIRMED":
        return { icon: Calendar, color: "text-purple-600 dark:text-purple-400" };
      case "PAYMENT_RECEIVED":
        return { icon: CreditCard, color: "text-yellow-600 dark:text-yellow-400" };
      case "BOOKING_CANCELLED":
        return { icon: X, color: "text-red-600 dark:text-red-400" };
      case "REVIEW_RECEIVED":
        return { icon: BookOpen, color: "text-orange-600 dark:text-orange-400" };
      default:
        return { icon: Bell, color: "text-muted-foreground" };
    }
  };

  const getNotificationBgColor = (type: Notification["type"]) => {
    switch (type) {
      case "BOOKING_REQUEST":
        return "bg-blue-500/10 dark:bg-blue-500/20";
      case "MESSAGE_RECEIVED":
        return "bg-green-500/10 dark:bg-green-500/20";
      case "BOOKING_CONFIRMED":
        return "bg-purple-500/10 dark:bg-purple-500/20";
      case "PAYMENT_RECEIVED":
        return "bg-yellow-500/10 dark:bg-yellow-500/20";
      case "BOOKING_CANCELLED":
        return "bg-red-500/10 dark:bg-red-500/20";
      case "REVIEW_RECEIVED":
        return "bg-orange-500/10 dark:bg-orange-500/20";
      default:
        return "bg-muted";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-trebuchet text-3xl lg:text-4xl font-bold text-foreground mb-2">
            Notifications
          </h1>
          <p className="text-muted-foreground">
            {unreadCount > 0
              ? `${unreadCount} notification${unreadCount > 1 ? "s" : ""} non lue${unreadCount > 1 ? "s" : ""}`
              : "Toutes vos notifications"}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            onClick={markAllAsRead}
            className="flex items-center gap-2"
          >
            <CheckCheck className="w-4 h-4" />
            Tout marquer comme lu
          </Button>
        )}
      </div>

      {/* Liste des notifications */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {notifications.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-yellow-500/10 dark:bg-yellow-500/20 flex items-center justify-center mx-auto mb-4">
              <Bell className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
            </div>
            <p className="text-muted-foreground text-lg mb-2">
              Aucune notification
            </p>
            <p className="text-sm text-muted-foreground">
              Vous serez notifié lorsque de nouvelles activités se produiront
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {notifications.map((notification, index) => {
              const { icon: Icon, color } = getNotificationIcon(notification.type);
              const bgColor = getNotificationBgColor(notification.type);

              return (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className={`
                    p-6 hover:bg-accent transition-colors
                    ${!notification.isRead ? "bg-blue-500/5 dark:bg-blue-500/10" : ""}
                  `}
                >
                  <div className="flex items-start gap-4">
                    {/* Icône */}
                    <div
                      className={`flex-shrink-0 w-12 h-12 rounded-lg ${bgColor} flex items-center justify-center`}
                    >
                      <Icon className={`w-6 h-6 ${color}`} />
                    </div>

                    {/* Contenu */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3
                              className={`font-semibold text-base ${
                                !notification.isRead
                                  ? "text-foreground"
                                  : "text-muted-foreground"
                              }`}
                            >
                              {notification.title}
                            </h3>
                            {!notification.isRead && (
                              <div className="w-2 h-2 rounded-full bg-blue-600 flex-shrink-0 mt-1.5" />
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mb-3">
                            {notification.message}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>
                              {formatDistanceToNow(new Date(notification.createdAt), {
                                addSuffix: true,
                                locale: fr,
                              })}
                            </span>
                            {notification.actionUrl && (
                              <a
                                href={notification.actionUrl}
                                className="text-blue-600 dark:text-blue-400 hover:underline"
                              >
                                Voir les détails →
                              </a>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {!notification.isRead && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => markAsRead(notification.id)}
                              className="h-8 w-8 p-0"
                              aria-label="Marquer comme lu"
                            >
                              <CheckCheck className="w-4 h-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeNotification(notification.id)}
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                            aria-label="Supprimer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

