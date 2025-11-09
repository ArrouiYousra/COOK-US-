import { Router } from 'express';
import {
  sendMessage,
  updateMessage,
  getConversations,
  getMessages,
  markAsRead,
  deleteMessage,
  archiveMessage,
  pinMessage,
  searchMessages,
  archiveConversation,
  deleteConversation,
  pinConversation,
  blockUser,
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
 *               content:
 *                 type: string
 *               message_type:
 *                 type: string
 *                 enum: [TEXT, IMAGE, FILE]
 *                 default: TEXT
 *     responses:
 *       201:
 *         description: Message sent successfully
 *       400:
 *         description: Bad request
 *       403:
 *         description: User is blocked
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
 *     summary: Delete a message (soft delete - only for you)
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
 *         description: Message not found
 */
router.delete('/:messageId', authGuard, deleteMessage);

/**
 * @swagger
 * /api/messages/{messageId}/archive:
 *   put:
 *     summary: Archive or unarchive a message
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
 *               - archived
 *             properties:
 *               archived:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Message archived/unarchived successfully
 */
router.put('/:messageId/archive', authGuard, archiveMessage);

/**
 * @swagger
 * /api/messages/{messageId}/pin:
 *   put:
 *     summary: Pin or unpin a message
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
 *               - pinned
 *             properties:
 *               pinned:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Message pinned/unpinned successfully
 */
router.put('/:messageId/pin', authGuard, pinMessage);

/**
 * @swagger
 * /api/messages/search:
 *   get:
 *     summary: Search messages
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Search query
 *       - in: query
 *         name: conversation_id
 *         schema:
 *           type: string
 *         description: Optional - search within a specific conversation
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
 *         description: Search results
 */
router.get('/search', authGuard, searchMessages);

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
 *       - in: query
 *         name: include_archived
 *         schema:
 *           type: boolean
 *           default: false
 *     responses:
 *       200:
 *         description: List of conversations with other user info
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
 */
router.put('/conversations/:conversationId/read', authGuard, markAsRead);

/**
 * @swagger
 * /api/messages/conversations/{conversationId}/archive:
 *   put:
 *     summary: Archive or unarchive a conversation
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: conversationId
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
 *               - archived
 *             properties:
 *               archived:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Conversation archived/unarchived successfully
 */
router.put('/conversations/:conversationId/archive', authGuard, archiveConversation);

/**
 * @swagger
 * /api/messages/conversations/{conversationId}:
 *   delete:
 *     summary: Delete a conversation (soft delete - only for you)
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
 *         description: Conversation deleted successfully
 */
router.delete('/conversations/:conversationId', authGuard, deleteConversation);

/**
 * @swagger
 * /api/messages/conversations/{conversationId}/pin:
 *   put:
 *     summary: Pin or unpin a conversation
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: conversationId
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
 *               - pinned
 *             properties:
 *               pinned:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Conversation pinned/unpinned successfully
 */
router.put('/conversations/:conversationId/pin', authGuard, pinConversation);

/**
 * @swagger
 * /api/messages/conversations/{conversationId}/block:
 *   put:
 *     summary: Block or unblock a user in a conversation
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: conversationId
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
 *               - blocked
 *             properties:
 *               blocked:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: User blocked/unblocked successfully
 */
router.put('/conversations/:conversationId/block', authGuard, blockUser);

export default router;
