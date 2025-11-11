import { supabaseAdmin } from "@config/supabaseClient";
import type {
  Notification,
  CreateNotificationDTO,
} from "../types/database.types";

export class NotificationStore {
  /**
   * Create a notification
   */
  static async createNotification(
    notificationData: CreateNotificationDTO,
  ): Promise<Notification> {
    const { data, error } = await supabaseAdmin
      .from("notifications")
      .insert({
        user_id: notificationData.user_id,
        type: notificationData.type,
        title: notificationData.title || null,
        message: notificationData.message || null,
        action_url: notificationData.action_url || null,
        metadata: notificationData.metadata || null,
        is_read: false,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create notification: ${error.message}`);
    }

    return data as Notification;
  }

  /**
   * Get notification by ID
   */
  static async getNotificationById(
    notificationId: string,
  ): Promise<Notification | null> {
    const { data, error } = await supabaseAdmin
      .from("notifications")
      .select("*")
      .eq("id", notificationId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null;
      }
      throw new Error(`Failed to get notification: ${error.message}`);
    }

    return data as Notification;
  }

  /**
   * Get all notifications for a user
   */
  static async getNotificationsByUser(
    userId: string,
    filters?: {
      is_read?: boolean;
      type?: string;
      limit?: number;
      offset?: number;
    },
  ): Promise<{ notifications: Notification[]; count: number }> {
    let query = supabaseAdmin
      .from("notifications")
      .select("*", { count: "exact" })
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (filters?.is_read !== undefined) {
      query = query.eq("is_read", filters.is_read);
    }

    if (filters?.type) {
      query = query.eq("type", filters.type);
    }

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    if (filters?.offset) {
      query = query.range(
        filters.offset,
        filters.offset + (filters.limit || 10) - 1,
      );
    }

    const { data, error, count } = await query;

    if (error) {
      throw new Error(`Failed to get notifications: ${error.message}`);
    }

    return {
      notifications: (data as Notification[]) || [],
      count: count || 0,
    };
  }

  /**
   * Mark notification as read
   */
  static async markAsRead(
    notificationId: string,
    userId: string,
  ): Promise<Notification> {
    // Verify ownership
    const notification = await this.getNotificationById(notificationId);
    if (!notification) {
      throw new Error("Notification not found");
    }

    if (notification.user_id !== userId) {
      throw new Error("You can only mark your own notifications as read");
    }

    const { data, error } = await supabaseAdmin
      .from("notifications")
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
      })
      .eq("id", notificationId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to mark notification as read: ${error.message}`);
    }

    return data as Notification;
  }

  /**
   * Mark notification as unread
   */
  static async markAsUnread(
    notificationId: string,
    userId: string,
  ): Promise<Notification> {
    const notification = await this.getNotificationById(notificationId);
    if (!notification) {
      throw new Error("Notification not found");
    }

    if (notification.user_id !== userId) {
      throw new Error("You can only mark your own notifications as unread");
    }

    const { data, error } = await supabaseAdmin
      .from("notifications")
      .update({
        is_read: false,
        read_at: null,
      })
      .eq("id", notificationId)
      .select()
      .single();

    if (error) {
      throw new Error(
        `Failed to mark notification as unread: ${error.message}`,
      );
    }

    return data as Notification;
  }

  /**
   * Mark all notifications as read for a user
   */
  static async markAllAsRead(userId: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from("notifications")
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
      })
      .eq("user_id", userId)
      .eq("is_read", false);

    if (error) {
      throw new Error(
        `Failed to mark all notifications as read: ${error.message}`,
      );
    }
  }

  /**
   * Delete a notification
   */
  static async deleteNotification(
    notificationId: string,
    userId: string,
  ): Promise<void> {
    // Verify ownership
    const notification = await this.getNotificationById(notificationId);
    if (!notification) {
      throw new Error("Notification not found");
    }

    if (notification.user_id !== userId) {
      throw new Error("You can only delete your own notifications");
    }

    const { error } = await supabaseAdmin
      .from("notifications")
      .delete()
      .eq("id", notificationId);

    if (error) {
      throw new Error(`Failed to delete notification: ${error.message}`);
    }
  }

  /**
   * Get unread count for a user
   */
  static async getUnreadCount(userId: string): Promise<number> {
    const { count, error } = await supabaseAdmin
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("is_read", false);

    if (error) {
      throw new Error(`Failed to get unread count: ${error.message}`);
    }

    return count || 0;
  }
}
