import { Router } from 'express';
import {
  getMyNotifications,
  getNotificationById,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getUnreadCount,
} from './notification.controllers';
import { registerFcmToken, removeFcmToken } from './fcm-token.controllers';
import {
  getNotificationPreferences,
  updateNotificationPreferences,
} from './notification-preferences.controllers';
import { authGuard } from '@core/middleware';

const router = Router();

/**
 * @swagger
 * /api/notifications:
 *   get:
 *     summary: Get my notifications
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: is_read
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [BOOKING_REQUEST, BOOKING_ACCEPTED, BOOKING_CONFIRMED, BOOKING_CANCELLED, BOOKING_REMINDER, REVIEW_RECEIVED, MESSAGE_RECEIVED, PAYMENT_RECEIVED, DISPUTE_OPENED, PROFILE_APPROVED, PROFILE_REJECTED, SYSTEM]
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *     responses:
 *       200:
 *         description: List of notifications with unread count
 */
router.get('/', authGuard, getMyNotifications);

/**
 * @swagger
 * /api/notifications/unread-count:
 *   get:
 *     summary: Get unread notifications count
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Unread count
 */
router.get('/unread-count', authGuard, getUnreadCount);

/**
 * @swagger
 * /api/notifications/{notificationId}:
 *   get:
 *     summary: Get notification by ID
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: notificationId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Notification found
 *       403:
 *         description: Forbidden (not your notification)
 */
router.get('/:notificationId', authGuard, getNotificationById);

/**
 * @swagger
 * /api/notifications/{notificationId}/read:
 *   put:
 *     summary: Mark notification as read
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: notificationId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Notification marked as read
 */
router.put('/:notificationId/read', authGuard, markAsRead);

/**
 * @swagger
 * /api/notifications/read-all:
 *   put:
 *     summary: Mark all notifications as read
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All notifications marked as read
 */
router.put('/read-all', authGuard, markAllAsRead);

/**
 * @swagger
 * /api/notifications/{notificationId}:
 *   delete:
 *     summary: Delete a notification
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: notificationId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Notification deleted successfully
 */
router.delete('/:notificationId', authGuard, deleteNotification);

/**
 * @swagger
 * /api/notifications/fcm-token:
 *   post:
 *     summary: Register FCM token for push notifications
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fcm_token
 *             properties:
 *               fcm_token:
 *                 type: string
 *     responses:
 *       200:
 *         description: FCM token registered successfully
 */
router.post('/fcm-token', authGuard, registerFcmToken);

/**
 * @swagger
 * /api/notifications/fcm-token:
 *   delete:
 *     summary: Remove FCM token (logout, app uninstall)
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: FCM token removed successfully
 */
router.delete('/fcm-token', authGuard, removeFcmToken);

/**
 * @swagger
 * /api/notifications/preferences:
 *   get:
 *     summary: Get detailed notification preferences
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Notification preferences retrieved successfully
 */
router.get('/preferences', authGuard, getNotificationPreferences);

/**
 * @swagger
 * /api/notifications/preferences:
 *   put:
 *     summary: Update detailed notification preferences
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               booking_request:
 *                 type: object
 *                 properties:
 *                   email:
 *                     type: boolean
 *                   sms:
 *                     type: boolean
 *                   push:
 *                     type: boolean
 *     responses:
 *       200:
 *         description: Notification preferences updated successfully
 */
router.put('/preferences', authGuard, updateNotificationPreferences);

export default router;

