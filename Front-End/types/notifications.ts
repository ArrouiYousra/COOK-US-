/**
 * Types pour le système de notifications
 */

export type NotificationType =
  | "BOOKING_REQUEST" // Proposition reçue
  | "BOOKING_ACCEPTED"
  | "BOOKING_CONFIRMED" // Réservation confirmée
  | "BOOKING_CANCELLED"
  | "BOOKING_REMINDER"
  | "REVIEW_RECEIVED"
  | "MESSAGE_RECEIVED" // Message nouveau
  | "PAYMENT_RECEIVED"; // Paiement réussi

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  actionUrl?: string;
  metadata?: Record<string, unknown>;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
}

export interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
}

