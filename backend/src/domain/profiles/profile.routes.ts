import { Router } from "express";
import {
  getMyProfile,
  updateMyProfile,
  getUserProfile,
  getCookProfiles,
} from "./profile.controllers";
import { authGuard } from "@core/middleware";

const router = Router();

/**
 * @swagger
 * /api/profiles/me:
 *   get:
 *     summary: Get current user's profile
 *     tags: [Profiles]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user profile with cook or client profile
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   type: object
 *                 cookProfile:
 *                   type: object
 *                   nullable: true
 *                 clientProfile:
 *                   type: object
 *                   nullable: true
 *       401:
 *         description: Unauthorized
 */
router.get("/me", authGuard, getMyProfile);

/**
 * @swagger
 * /api/profiles/me:
 *   put:
 *     summary: Update current user's profile
 *     tags: [Profiles]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               first_name:
 *                 type: string
 *               last_name:
 *                 type: string
 *               phone:
 *                 type: string
 *               date_of_birth:
 *                 type: string
 *               address:
 *                 type: string
 *               city:
 *                 type: string
 *               postal_code:
 *                 type: string
 *               country:
 *                 type: string
 *               avatar_url:
 *                 type: string
 *               language:
 *                 type: string
 *               currency:
 *                 type: string
 *               notifications_enabled:
 *                 type: boolean
 *               email_notifications:
 *                 type: boolean
 *               sms_notifications:
 *                 type: boolean
 *               headline:
 *                 type: string
 *                 description: For cook profiles
 *               bio:
 *                 type: string
 *                 description: For cook profiles
 *               experience:
 *                 type: string
 *                 description: For cook profiles
 *               video_intro_url:
 *                 type: string
 *                 description: For cook profiles
 *               service_radius:
 *                 type: number
 *                 description: For cook profiles
 *               hourly_rate:
 *                 type: number
 *                 description: For cook profiles
 *               minimum_booking_hours:
 *                 type: number
 *                 description: For cook profiles
 *               can_do_groceries:
 *                 type: boolean
 *                 description: For cook profiles
 *               can_set_table:
 *                 type: boolean
 *                 description: For cook profiles
 *               can_do_dishes:
 *                 type: boolean
 *                 description: For cook profiles
 *               max_guests:
 *                 type: number
 *                 description: For cook profiles
 *               employment_status:
 *                 type: string
 *                 enum: [AUTO_ENTREPRENEUR, PORTAGE_SALARIAL, MICRO_ENTREPRISE, ASSOCIATION]
 *                 description: For cook profiles
 *               siret_number:
 *                 type: string
 *                 description: For cook profiles
 *               insurance_number:
 *                 type: string
 *                 description: For cook profiles
 *               insurance_expiry_date:
 *                 type: string
 *                 format: date
 *                 description: For cook profiles
 *               id_card_url:
 *                 type: string
 *                 description: For cook profiles - URL of ID card document
 *               insurance_cert_url:
 *                 type: string
 *                 description: For cook profiles - URL of insurance certificate document
 *               kbis_url:
 *                 type: string
 *                 description: For cook profiles - URL of KBIS document
 *               is_available:
 *                 type: boolean
 *                 description: For cook profiles
 *               availability_note:
 *                 type: string
 *                 description: For cook profiles
 *               household_size:
 *                 type: number
 *                 description: For client profiles
 *               pet_friendly:
 *                 type: boolean
 *                 description: For client profiles
 *               smoking_allowed:
 *                 type: boolean
 *                 description: For client profiles
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       401:
 *         description: Unauthorized
 *       400:
 *         description: Bad request
 */
router.put("/me", authGuard, updateMyProfile);

/**
 * @swagger
 * /api/profiles/cooks:
 *   get:
 *     summary: Get list of cook profiles with filters
 *     tags: [Profiles]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING_APPROVAL, ACTIVE, PAUSED, SUSPENDED, REJECTED]
 *         description: Filter by cook status
 *       - in: query
 *         name: city
 *         schema:
 *           type: string
 *         description: Filter by city
 *       - in: query
 *         name: min_rating
 *         schema:
 *           type: number
 *         description: Minimum average rating
 *       - in: query
 *         name: max_hourly_rate
 *         schema:
 *           type: number
 *         description: Maximum hourly rate
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of results per page
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Pagination offset
 *     responses:
 *       200:
 *         description: List of cook profiles
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 profiles:
 *                   type: array
 *                   items:
 *                     type: object
 *                 count:
 *                   type: integer
 *                 limit:
 *                   type: integer
 *                 offset:
 *                   type: integer
 */
router.get("/cooks", getCookProfiles);

/**
 * @swagger
 * /api/profiles/{id}:
 *   get:
 *     summary: Get user profile by ID (public)
 *     tags: [Profiles]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User profile (sensitive data removed)
 *       404:
 *         description: User not found
 */
router.get("/:id", getUserProfile);

export default router;
