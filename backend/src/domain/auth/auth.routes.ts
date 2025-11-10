import { Router } from 'express';
import {
  register,
  registerClient,
  registerCook,
  login,
  logout,
  getCurrentUser,
  refreshToken,
  forgotPassword,
  resetPassword,
  changePassword,
  updateEmail,
  deleteAccount,
  resendVerification,
  oauthGoogle,
  oauthApple,
} from './auth.controllers';
import twoFactorRoutes from './two-factor.routes';
import { authGuard } from '@core/middleware';

const router = Router();

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - first_name
 *               - last_name
 *             properties:
 *               email:
 *                 type: string
 *                 example: client@test.com
 *               password:
 *                 type: string
 *                 example: password123
 *               first_name:
 *                 type: string
 *                 example: John
 *               last_name:
 *                 type: string
 *                 example: Doe
 *               role:
 *                 type: string
 *                 enum: [CLIENT, COOK, ADMIN]
 *                 example: CLIENT
 *               phone:
 *                 type: string
 *               headline:
 *                 type: string
 *                 description: Required if role is COOK
 *               hourly_rate:
 *                 type: number
 *                 description: Required if role is COOK
 *               employment_status:
 *                 type: string
 *                 enum: [AUTO_ENTREPRENEUR, PORTAGE_SALARIAL, MICRO_ENTREPRISE, ASSOCIATION]
 *                 description: Required if role is COOK
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Bad request
 */
router.post('/register', register);

/**
 * @swagger
 * /api/auth/register/client:
 *   post:
 *     summary: Register a new client
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterClientInput'
 *     responses:
 *       201:
 *         description: Client registered successfully
 *       400:
 *         description: Bad request
 */
router.post('/register/client', registerClient);

/**
 * @swagger
 * /api/auth/register/cook:
 *   post:
 *     summary: Register a new cook
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterCookInput'
 *     responses:
 *       201:
 *         description: Cook registered successfully
 *       400:
 *         description: Bad request
 */
router.post('/register/cook', registerCook);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: client@test.com
 *               password:
 *                 type: string
 *                 example: password123
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 user:
 *                   type: object
 *                 accessToken:
 *                   type: string
 *                 refreshToken:
 *                   type: string
 *       401:
 *         description: Authentication failed
 */
router.post('/login', login);

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Refresh access token
 *     description: Use a refresh token to get a new access token and refresh token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 example: "v1.abc123def456..."
 *                 description: The refresh token obtained from login
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Token refreshed successfully"
 *                 session:
 *                   type: object
 *                 accessToken:
 *                   type: string
 *                   example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                 refreshToken:
 *                   type: string
 *                   example: "v1.abc123def456..."
 *       400:
 *         description: Bad request - refresh token is required
 *       401:
 *         description: Token refresh failed - invalid or expired refresh token
 */
router.post('/refresh', refreshToken);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logout user
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 *       401:
 *         description: Unauthorized
 */
router.post('/logout', authGuard, logout);

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get current user
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user information
 *       401:
 *         description: Unauthorized
 */
router.get('/me', authGuard, getCurrentUser);

/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     summary: Request password reset
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 example: client@test.com
 *     responses:
 *       200:
 *         description: Password reset email sent (if email exists)
 *       400:
 *         description: Bad request
 */
router.post('/forgot-password', forgotPassword);

/**
 * @swagger
 * /api/auth/resend-verification:
 *   post:
 *     summary: Resend email verification
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 example: client@test.com
 *     responses:
 *       200:
 *         description: Verification email sent (if email exists and is not verified)
 *       400:
 *         description: Bad request
 */
router.post('/resend-verification', resendVerification);

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     summary: Reset password with token
 *     tags: [Auth]
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
 *                 example: newpassword123
 *                 description: New password (token is handled via email link redirect)
 *     responses:
 *       200:
 *         description: Password reset successfully
 *       400:
 *         description: Bad request or invalid token
 */
router.post('/reset-password', resetPassword);

/**
 * @swagger
 * /api/auth/change-password:
 *   put:
 *     summary: Change password (requires authentication)
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
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 example: oldpassword123
 *               newPassword:
 *                 type: string
 *                 example: newpassword123
 *     responses:
 *       200:
 *         description: Password changed successfully
 *       401:
 *         description: Unauthorized or incorrect current password
 *       400:
 *         description: Bad request
 */
router.put('/change-password', authGuard, changePassword);

/**
 * @swagger
 * /api/auth/update-email:
 *   put:
 *     summary: Update email address (requires authentication)
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
 *               - newEmail
 *               - password
 *             properties:
 *               newEmail:
 *                 type: string
 *                 example: newemail@test.com
 *               password:
 *                 type: string
 *                 example: password123
 *                 description: Current password to confirm
 *     responses:
 *       200:
 *         description: Email updated successfully
 *       401:
 *         description: Unauthorized or incorrect password
 *       400:
 *         description: Bad request or email already in use
 */
router.put('/update-email', authGuard, updateEmail);

/**
 * @swagger
 * /api/auth/delete-account:
 *   delete:
 *     summary: Delete account (requires authentication)
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
 *                 example: password123
 *                 description: Password to confirm account deletion
 *     responses:
 *       200:
 *         description: Account deleted successfully
 *       401:
 *         description: Unauthorized or incorrect password
 *       400:
 *         description: Bad request
 */
router.delete('/delete-account', authGuard, deleteAccount);

/**
 * @swagger
 * /api/auth/oauth/google:
 *   post:
 *     summary: Initiate Google OAuth login
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [CLIENT, COOK]
 *                 example: CLIENT
 *     responses:
 *       200:
 *         description: OAuth redirect URL
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 redirectUrl:
 *                   type: string
 *                   example: "https://accounts.google.com/oauth/authorize?..."
 *       500:
 *         description: OAuth initiation failed
 */
router.post('/oauth/google', oauthGoogle);

/**
 * @swagger
 * /api/auth/oauth/apple:
 *   post:
 *     summary: Initiate Apple OAuth login
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [CLIENT, COOK]
 *                 example: CLIENT
 *     responses:
 *       200:
 *         description: OAuth redirect URL
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 redirectUrl:
 *                   type: string
 *                   example: "https://appleid.apple.com/auth/authorize?..."
 *       500:
 *         description: OAuth initiation failed
 */
router.post('/oauth/apple', oauthApple);

// 2FA routes
router.use('/2fa', twoFactorRoutes);

export default router;

