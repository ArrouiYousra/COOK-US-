import { Router } from 'express';
import {
  createPaymentIntent,
  getPaymentIntent,
  createRefund,
  getRefund,
} from './payment.controllers';
import { handleStripeWebhook } from './payment.webhook';
import { authGuard } from '@core/middleware';

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     PaymentIntent:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         client_secret:
 *           type: string
 *         amount:
 *           type: number
 *         currency:
 *           type: string
 *         status:
 *           type: string
 *           enum: [requires_payment_method, requires_confirmation, requires_action, processing, requires_capture, canceled, succeeded]
 */

/**
 * @swagger
 * /api/payments/intent:
 *   post:
 *     summary: Create a payment intent for a booking
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - booking_id
 *             properties:
 *               booking_id:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: Payment intent created successfully
 *       400:
 *         description: Bad Request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.post('/intent', authGuard, createPaymentIntent);

/**
 * @swagger
 * /api/payments/intent/{paymentIntentId}:
 *   get:
 *     summary: Get a payment intent by ID
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: paymentIntentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Payment intent retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get('/intent/:paymentIntentId', authGuard, getPaymentIntent);

/**
 * @swagger
 * /api/payments/refund:
 *   post:
 *     summary: Create a refund (admin only)
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - payment_intent_id
 *             properties:
 *               payment_intent_id:
 *                 type: string
 *               amount:
 *                 type: number
 *               reason:
 *                 type: string
 *                 enum: [duplicate, fraudulent, requested_by_customer]
 *     responses:
 *       200:
 *         description: Refund created successfully
 *       400:
 *         description: Bad Request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Only admins can create refunds
 */
router.post('/refund', authGuard, createRefund);

/**
 * @swagger
 * /api/payments/refund/{refundId}:
 *   get:
 *     summary: Get a refund by ID (admin only)
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: refundId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Refund retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Only admins can view refunds
 */
router.get('/refund/:refundId', authGuard, getRefund);

/**
 * Webhook endpoint for Stripe (no auth required, uses signature verification)
 * IMPORTANT: This route should be placed before other routes to avoid conflicts
 */
router.post('/webhook', handleStripeWebhook);

export default router;

