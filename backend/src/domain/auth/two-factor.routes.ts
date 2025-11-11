import { Router } from "express";
import { authGuard } from "@core/middleware";
import {
  enable2FA,
  verifyAndEnable2FA,
  disable2FA,
  verify2FAToken,
} from "./two-factor.controllers";

const router = Router();

/**
 * @swagger
 * /api/auth/2fa/enable:
 *   post:
 *     summary: Initiate 2FA setup (generates secret and QR code)
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - password
 *             properties:
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: 2FA setup initiated, QR code returned
 *       401:
 *         description: Unauthorized or invalid password
 */
router.post("/enable", authGuard, enable2FA);

/**
 * @swagger
 * /api/auth/2fa/verify:
 *   post:
 *     summary: Verify and enable 2FA (after scanning QR code)
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *             properties:
 *               token:
 *                 type: string
 *                 description: 6-digit TOTP code
 *     responses:
 *       200:
 *         description: 2FA enabled successfully
 *       400:
 *         description: Invalid token
 */
router.post("/verify", authGuard, verifyAndEnable2FA);

/**
 * @swagger
 * /api/auth/2fa/disable:
 *   post:
 *     summary: Disable 2FA
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - password
 *             properties:
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: 2FA disabled successfully
 *       401:
 *         description: Unauthorized or invalid password
 */
router.post("/disable", authGuard, disable2FA);

/**
 * @swagger
 * /api/auth/2fa/verify-token:
 *   post:
 *     summary: Verify a 2FA token (for login)
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *             properties:
 *               token:
 *                 type: string
 *                 description: 6-digit TOTP code
 *     responses:
 *       200:
 *         description: Token verified successfully
 *       400:
 *         description: Invalid token
 */
router.post("/verify-token", authGuard, verify2FAToken);

export default router;
