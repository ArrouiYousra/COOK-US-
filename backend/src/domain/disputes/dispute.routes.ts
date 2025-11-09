import { Router } from 'express';
import {
  createDispute,
  getMyDisputes,
  getDisputeById,
  updateDispute,
  resolveDispute,
  closeDispute,
  getAllDisputes,
} from './dispute.controllers';
import { authGuard } from '@core/middleware';

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Dispute:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         booking_id:
 *           type: string
 *           format: uuid
 *         raised_by:
 *           type: string
 *           format: uuid
 *         reason:
 *           type: string
 *           enum: [SERVICE_NOT_PROVIDED, POOR_QUALITY, LATE_ARRIVAL, HYGIENE_ISSUE, DAMAGE, PAYMENT_ISSUE, OTHER]
 *         description:
 *           type: string
 *         status:
 *           type: string
 *           enum: [OPEN, IN_REVIEW, RESOLVED, CLOSED]
 *         resolution:
 *           type: string
 *           nullable: true
 *         resolved_at:
 *           type: string
 *           format: date-time
 *           nullable: true
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 *     CreateDispute:
 *       type: object
 *       required:
 *         - booking_id
 *         - reason
 *         - description
 *       properties:
 *         booking_id:
 *           type: string
 *           format: uuid
 *         reason:
 *           type: string
 *           enum: [SERVICE_NOT_PROVIDED, POOR_QUALITY, LATE_ARRIVAL, HYGIENE_ISSUE, DAMAGE, PAYMENT_ISSUE, OTHER]
 *         description:
 *           type: string
 */

/**
 * @swagger
 * /api/disputes:
 *   post:
 *     summary: Create a new dispute
 *     tags: [Disputes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateDispute'
 *     responses:
 *       201:
 *         description: Dispute created successfully
 *       400:
 *         description: Bad Request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.post('/', authGuard, createDispute);

/**
 * @swagger
 * /api/disputes/me:
 *   get:
 *     summary: Get current user's disputes
 *     tags: [Disputes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Disputes retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/me', authGuard, getMyDisputes);

/**
 * @swagger
 * /api/disputes/all:
 *   get:
 *     summary: Get all disputes (admin only)
 *     tags: [Disputes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [OPENED, IN_REVIEW, RESOLVED, CLOSED]
 *     responses:
 *       200:
 *         description: Disputes retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Only admins can access
 */
router.get('/all', authGuard, getAllDisputes);

/**
 * @swagger
 * /api/disputes/{disputeId}:
 *   get:
 *     summary: Get a dispute by ID
 *     tags: [Disputes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: disputeId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Dispute retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Dispute not found
 */
router.get('/:disputeId', authGuard, getDisputeById);

/**
 * @swagger
 * /api/disputes/{disputeId}:
 *   put:
 *     summary: Update a dispute
 *     tags: [Disputes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: disputeId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               description:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [OPEN, IN_REVIEW, RESOLVED, CLOSED]
 *     responses:
 *       200:
 *         description: Dispute updated successfully
 *       400:
 *         description: Bad Request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.put('/:disputeId', authGuard, updateDispute);

/**
 * @swagger
 * /api/disputes/{disputeId}/resolve:
 *   post:
 *     summary: Resolve a dispute (admin only)
 *     tags: [Disputes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: disputeId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - resolution
 *             properties:
 *               resolution:
 *                 type: string
 *               refund_amount:
 *                 type: number
 *     responses:
 *       200:
 *         description: Dispute resolved successfully
 *       400:
 *         description: Bad Request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Only admins can resolve
 */
router.post('/:disputeId/resolve', authGuard, resolveDispute);

/**
 * @swagger
 * /api/disputes/{disputeId}/close:
 *   post:
 *     summary: Close a dispute
 *     tags: [Disputes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: disputeId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Dispute closed successfully
 *       400:
 *         description: Bad Request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.post('/:disputeId/close', authGuard, closeDispute);

// Dispute messages routes removed - not in SQL schema

export default router;

