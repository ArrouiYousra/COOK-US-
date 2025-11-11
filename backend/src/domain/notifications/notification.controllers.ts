import { type Response } from "express";
import { type AuthRequest } from "@core/middleware";
import { NotificationStore } from "@stores/notification.store";

export const getMyNotifications = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: "Unauthorized",
        message: "User not authenticated",
      });
      return;
    }

    const { is_read, type, limit, offset } = req.query;

    const filters: {
      is_read?: boolean;
      type?: string;
      limit?: number;
      offset?: number;
    } = {};

    if (is_read !== undefined) {
      filters.is_read = is_read === "true";
    }

    if (type) {
      filters.type = type as string;
    }

    if (limit) {
      filters.limit = parseInt(limit as string, 10);
    }

    if (offset) {
      filters.offset = parseInt(offset as string, 10);
    }

    const result = await NotificationStore.getNotificationsByUser(
      req.user.id,
      filters,
    );
    const unreadCount = await NotificationStore.getUnreadCount(req.user.id);

    res.status(200).json({
      notifications: result.notifications,
      count: result.count,
      unread_count: unreadCount,
      limit: filters.limit || 10,
      offset: filters.offset || 0,
    });
  } catch (error) {
    console.error("Get notifications error:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to get notifications",
    });
  }
};

export const getNotificationById = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: "Unauthorized",
        message: "User not authenticated",
      });
      return;
    }

    const { notificationId } = req.params;
    if (!notificationId) {
      res.status(400).json({
        error: "Bad Request",
        message: "Notification ID is required",
      });
      return;
    }

    const notification =
      await NotificationStore.getNotificationById(notificationId);
    if (!notification) {
      res.status(404).json({
        error: "Not Found",
        message: "Notification not found",
      });
      return;
    }

    // Verify ownership
    if (notification.user_id !== req.user.id) {
      res.status(403).json({
        error: "Forbidden",
        message: "You can only view your own notifications",
      });
      return;
    }

    res.status(200).json({
      notification,
    });
  } catch (error) {
    console.error("Get notification error:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to get notification",
    });
  }
};

export const markAsRead = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: "Unauthorized",
        message: "User not authenticated",
      });
      return;
    }

    const { notificationId } = req.params;
    if (!notificationId) {
      res.status(400).json({
        error: "Bad Request",
        message: "Notification ID is required",
      });
      return;
    }

    const notification = await NotificationStore.markAsRead(
      notificationId,
      req.user.id,
    );

    res.status(200).json({
      message: "Notification marked as read",
      notification,
    });
  } catch (error) {
    console.error("Mark as read error:", error);
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Failed to mark notification as read";

    if (
      errorMessage.includes("not found") ||
      errorMessage.includes("only mark")
    ) {
      res.status(400).json({
        error: "Bad Request",
        message: errorMessage,
      });
      return;
    }

    res.status(500).json({
      error: "Internal Server Error",
      message: errorMessage,
    });
  }
};

export const markAllAsRead = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: "Unauthorized",
        message: "User not authenticated",
      });
      return;
    }

    await NotificationStore.markAllAsRead(req.user.id);

    res.status(200).json({
      message: "All notifications marked as read",
    });
  } catch (error) {
    console.error("Mark all as read error:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to mark all notifications as read",
    });
  }
};

export const markAsUnread = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: "Unauthorized",
        message: "User not authenticated",
      });
      return;
    }

    const { notificationId } = req.params;
    if (!notificationId) {
      res.status(400).json({
        error: "Bad Request",
        message: "Notification ID is required",
      });
      return;
    }

    const notification = await NotificationStore.markAsUnread(
      notificationId,
      req.user.id,
    );

    res.status(200).json({
      message: "Notification marked as unread",
      notification,
    });
  } catch (error) {
    console.error("Mark as unread error:", error);
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Failed to mark notification as unread";

    if (
      errorMessage.includes("not found") ||
      errorMessage.includes("only mark")
    ) {
      res.status(400).json({
        error: "Bad Request",
        message: errorMessage,
      });
      return;
    }

    res.status(500).json({
      error: "Internal Server Error",
      message: errorMessage,
    });
  }
};

export const deleteNotification = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: "Unauthorized",
        message: "User not authenticated",
      });
      return;
    }

    const { notificationId } = req.params;
    if (!notificationId) {
      res.status(400).json({
        error: "Bad Request",
        message: "Notification ID is required",
      });
      return;
    }

    await NotificationStore.deleteNotification(notificationId, req.user.id);

    res.status(200).json({
      message: "Notification deleted successfully",
    });
  } catch (error) {
    console.error("Delete notification error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to delete notification";

    if (
      errorMessage.includes("not found") ||
      errorMessage.includes("only delete")
    ) {
      res.status(400).json({
        error: "Bad Request",
        message: errorMessage,
      });
      return;
    }

    res.status(500).json({
      error: "Internal Server Error",
      message: errorMessage,
    });
  }
};

export const getUnreadCount = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: "Unauthorized",
        message: "User not authenticated",
      });
      return;
    }

    const count = await NotificationStore.getUnreadCount(req.user.id);

    res.status(200).json({
      unread_count: count,
    });
  } catch (error) {
    console.error("Get unread count error:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to get unread count",
    });
  }
};
