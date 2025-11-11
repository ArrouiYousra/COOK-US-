import { Router } from "express";
import {
  createTransaction,
  getMyTransactions,
  getTransactionById,
  getAllTransactions,
  updateTransactionStatus,
} from "./transaction.controllers";
import { authGuard } from "@core/middleware";

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Transaction:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         type:
 *           type: string
 *           enum: [BOOKING_PAYMENT, REFUND, PAYOUT, PLATFORM_FEE, BONUS, PENALTY]
 *         status:
 *           type: string
 *           enum: [PENDING, COMPLETED, FAILED, CANCELLED]
 *         booking_id:
 *           type: string
 *           format: uuid
 *           nullable: true
 *         from_user_id:
 *           type: string
 *           format: uuid
 *           nullable: true
 *         to_user_id:
 *           type: string
 *           format: uuid
 *           nullable: true
 *         amount:
 *           type: number
 *         currency:
 *           type: string
 *         stripe_payment_id:
 *           type: string
 *           nullable: true
 *         stripe_transfer_id:
 *           type: string
 *           nullable: true
 *         stripe_refund_id:
 *           type: string
 *           nullable: true
 *         description:
 *           type: string
 *           nullable: true
 *         metadata:
 *           type: object
 *           nullable: true
 *         completed_at:
 *           type: string
 *           format: date-time
 *           nullable: true
 *         failure_reason:
 *           type: string
 *           nullable: true
 *         created_at:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/transactions:
 *   post:
 *     summary: Create a new transaction (admin only)
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *               - amount
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [BOOKING_PAYMENT, REFUND, PAYOUT, PLATFORM_FEE, BONUS, PENALTY]
 *               booking_id:
 *                 type: string
 *                 format: uuid
 *               from_user_id:
 *                 type: string
 *                 format: uuid
 *               to_user_id:
 *                 type: string
 *                 format: uuid
 *               amount:
 *                 type: number
 *               currency:
 *                 type: string
 *               stripe_payment_id:
 *                 type: string
 *               stripe_transfer_id:
 *                 type: string
 *               stripe_refund_id:
 *                 type: string
 *               description:
 *                 type: string
 *               metadata:
 *                 type: object
 *     responses:
 *       201:
 *         description: Transaction created successfully
 *       400:
 *         description: Bad Request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Only admins can create
 */
router.post("/", authGuard, createTransaction);

/**
 * @swagger
 * /api/transactions/me:
 *   get:
 *     summary: Get current user's transactions
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Transactions retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get("/me", authGuard, getMyTransactions);

/**
 * @swagger
 * /api/transactions/all:
 *   get:
 *     summary: Get all transactions (admin only)
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, COMPLETED, FAILED, CANCELLED]
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [BOOKING_PAYMENT, REFUND, PAYOUT, PLATFORM_FEE, BONUS, PENALTY]
 *     responses:
 *       200:
 *         description: Transactions retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Only admins can access
 */
router.get("/all", authGuard, getAllTransactions);

/**
 * @swagger
 * /api/transactions/{transactionId}:
 *   get:
 *     summary: Get a transaction by ID
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: transactionId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Transaction retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Transaction not found
 */
router.get("/:transactionId", authGuard, getTransactionById);

/**
 * @swagger
 * /api/transactions/{transactionId}/status:
 *   put:
 *     summary: Update transaction status (admin only)
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: transactionId
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
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [PENDING, COMPLETED, FAILED, CANCELLED]
 *               failure_reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Transaction status updated successfully
 *       400:
 *         description: Bad Request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Only admins can update
 */
router.put("/:transactionId/status", authGuard, updateTransactionStatus);

export default router;
