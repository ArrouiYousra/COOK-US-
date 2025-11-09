import { Router } from 'express';
import {
  sendMessage,
  getConversations,
  getMessages,
  markAsRead,
  updateMessage,
  deleteMessage,
} from './message.controllers';
import { authGuard } from '@core/middleware';

const router = Router();

/**
 * @swagger
 * /api/messages:
 *   post:
 *     summary: Send a message to another user
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - recipient_id
 *               - content
 *             properties:
 *               recipient_id:
 *                 type: string
 *                 description: ID of the user to send message to
 *               content:
 *                 type: string
 *               message_type:
 *                 type: string
 *                 enum: [TEXT, IMAGE, SYSTEM]
 *                 default: TEXT
 *               attachment_url:
 *                 type: string
 *                 description: URL for image attachment (if message_type is IMAGE)
 *               booking_id:
 *                 type: string
 *                 description: Optional - link conversation to a booking
 *     responses:
 *       201:
 *         description: Message sent successfully
 *       400:
 *         description: Bad request
 *       404:
 *         description: Recipient not found
 */
router.post('/', authGuard, sendMessage);

/**
 * @swagger
 * /api/messages/{messageId}:
 *   put:
 *     summary: Update a message (edit content)
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: messageId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *     responses:
 *       200:
 *         description: Message updated successfully
 *       404:
 *         description: Message not found or unauthorized
 */
router.put('/:messageId', authGuard, updateMessage);

/**
 * @swagger
 * /api/messages/{messageId}:
 *   delete:
 *     summary: Delete a message (only your own messages)
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: messageId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Message deleted successfully
 *       404:
 *         description: Message not found or unauthorized
 */
router.delete('/:messageId', authGuard, deleteMessage);

/**
 * @swagger
 * /api/messages/conversations:
 *   get:
 *     summary: Get all conversations for current user
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *         description: List of conversations with other user info and unread count
 */
router.get('/conversations', authGuard, getConversations);

/**
 * @swagger
 * /api/messages/conversations/{conversationId}:
 *   get:
 *     summary: Get messages for a conversation
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *     responses:
 *       200:
 *         description: List of messages (automatically marks as read)
 *       404:
 *         description: Conversation not found or unauthorized
 */
router.get('/conversations/:conversationId', authGuard, getMessages);

/**
 * @swagger
 * /api/messages/conversations/{conversationId}/read:
 *   put:
 *     summary: Mark all messages in a conversation as read
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Messages marked as read
 *       404:
 *         description: Conversation not found or unauthorized
 */
router.put('/conversations/:conversationId/read', authGuard, markAsRead);

export default router;
