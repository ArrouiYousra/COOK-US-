"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bell,
  X,
  Check,
  CheckCheck,
  ChefHat,
  MessageSquare,
  CreditCard,
  Calendar,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNotificationStore } from "@/stores/notificationStore";
import type { Notification } from "@/types/notifications";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

/**
 * Dropdown des notifications
 * Affiche les notifications en temps réel avec actions
 */
export function NotificationsDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { notifications, unreadCount, markAsRead, markAllAsRead } =
    useNotificationStore();

  // Fermer le dropdown quand on clique à l'extérieur
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const getNotificationIcon = (type: Notification["type"]) => {
    switch (type) {
      case "BOOKING_REQUEST":
        return ChefHat;
      case "MESSAGE_RECEIVED":
        return MessageSquare;
      case "BOOKING_CONFIRMED":
        return Calendar;
      case "PAYMENT_RECEIVED":
        return CreditCard;
      default:
        return Bell;
    }
  };

  const getNotificationColor = (type: Notification["type"]) => {
    switch (type) {
      case "BOOKING_REQUEST":
        return "bg-blue-500/10 text-blue-600 dark:text-blue-400";
      case "MESSAGE_RECEIVED":
        return "bg-green-500/10 text-green-600 dark:text-green-400";
      case "BOOKING_CONFIRMED":
        return "bg-purple-500/10 text-purple-600 dark:text-purple-400";
      case "PAYMENT_RECEIVED":
        return "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.isRead) {
      await markAsRead(notification.id);
    }
    setIsOpen(false);
  };

  return (
    <div 
      className="relative" 
      ref={dropdownRef}
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      {/* Bouton de notification */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => {
          router.push("/dashboard/client/notifications");
        }}
        className="relative"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs font-semibold flex items-center justify-center"
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </motion.span>
        )}
      </Button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 top-full mt-2 w-96 max-w-[calc(100vw-2rem)] bg-card border border-border rounded-xl shadow-2xl z-50 max-h-[600px] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="font-cera text-lg font-bold text-foreground">
                Notifications
              </h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={markAllAsRead}
                    className="text-xs"
                  >
                    <CheckCheck className="w-4 h-4 mr-1" />
                    Tout marquer comme lu
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsOpen(false)}
                  className="h-8 w-8"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Liste des notifications */}
            <div className="flex-1 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    Aucune notification
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {notifications.map((notification) => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      onClick={() => handleNotificationClick(notification)}
                      getIcon={getNotificationIcon}
                      getColor={getNotificationColor}
                    />
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface NotificationItemProps {
  notification: Notification;
  onClick: () => void;
  getIcon: (type: Notification["type"]) => typeof Bell;
  getColor: (type: Notification["type"]) => string;
}

function NotificationItem({
  notification,
  onClick,
  getIcon,
  getColor,
}: NotificationItemProps) {
  const Icon = getIcon(notification.type);
  const colorClass = getColor(notification.type);

  const content = notification.actionUrl ? (
    <Link
      href={notification.actionUrl}
      onClick={onClick}
      className="block w-full"
    >
      <NotificationContent
        notification={notification}
        Icon={Icon}
        colorClass={colorClass}
      />
    </Link>
  ) : (
    <div onClick={onClick} className="cursor-pointer">
      <NotificationContent
        notification={notification}
        Icon={Icon}
        colorClass={colorClass}
      />
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className={`
        p-4 transition-colors
        ${!notification.isRead ? "bg-blue-500/5 dark:bg-blue-500/10" : "bg-card"}
        hover:bg-accent
      `}
    >
      {content}
    </motion.div>
  );
}

interface NotificationContentProps {
  notification: Notification;
  Icon: typeof Bell;
  colorClass: string;
}

function NotificationContent({
  notification,
  Icon,
  colorClass,
}: NotificationContentProps) {
  return (
    <div className="flex gap-3">
      {/* Icône */}
      <div className={`flex-shrink-0 w-10 h-10 rounded-lg ${colorClass} flex items-center justify-center`}>
        <Icon className="w-5 h-5" />
      </div>

      {/* Contenu */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h4
            className={`font-semibold text-sm ${
              !notification.isRead
                ? "text-foreground"
                : "text-muted-foreground"
            }`}
          >
            {notification.title}
          </h4>
          {!notification.isRead && (
            <div className="w-2 h-2 rounded-full bg-blue-600 flex-shrink-0 mt-1.5" />
          )}
        </div>
        <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
          {notification.message}
        </p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="w-3 h-3" />
          <span>
            {formatDistanceToNow(new Date(notification.createdAt), {
              addSuffix: true,
              locale: fr,
            })}
          </span>
        </div>
      </div>
    </div>
  );
}

