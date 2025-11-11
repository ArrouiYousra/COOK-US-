import { Router } from "express";
import {
  getMyAvailabilities,
  getCookAvailabilities,
  createAvailability,
  updateAvailability,
  deleteAvailability,
  getMyBlockedDates,
  createBlockedDate,
  deleteBlockedDate,
} from "./availability.controllers";
import { authGuard } from "@core/middleware";

const router = Router();

/**
 * @swagger
 * /api/availabilities/me:
 *   get:
 *     summary: Get my availabilities (cook)
 *     tags: [Availabilities]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of availabilities
 *       403:
 *         description: Forbidden (only cooks)
 */
router.get("/me", authGuard, getMyAvailabilities);

/**
 * @swagger
 * /api/availabilities/cook/{cookId}:
 *   get:
 *     summary: Get availabilities for a cook (public, only active)
 *     tags: [Availabilities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: cookId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of active availabilities
 */
router.get("/cook/:cookId", authGuard, getCookAvailabilities);

/**
 * @swagger
 * /api/availabilities:
 *   post:
 *     summary: Create an availability (cook)
 *     tags: [Availabilities]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - day_of_week
 *               - meal_type
 *               - start_time
 *               - end_time
 *             properties:
 *               day_of_week:
 *                 type: string
 *                 enum: [MONDAY, TUESDAY, WEDNESDAY, THURSDAY, FRIDAY, SATURDAY, SUNDAY]
 *               meal_type:
 *                 type: string
 *                 enum: [BREAKFAST, LUNCH, DINNER, BRUNCH]
 *               start_time:
 *                 type: string
 *                 format: time
 *                 example: "09:00:00"
 *               end_time:
 *                 type: string
 *                 format: time
 *                 example: "12:00:00"
 *               is_active:
 *                 type: boolean
 *                 default: true
 *     responses:
 *       201:
 *         description: Availability created successfully
 *       400:
 *         description: Bad request (already exists)
 */
router.post("/", authGuard, createAvailability);

/**
 * @swagger
 * /api/availabilities/{availabilityId}:
 *   put:
 *     summary: Update an availability (cook)
 *     tags: [Availabilities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: availabilityId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               day_of_week:
 *                 type: string
 *                 enum: [MONDAY, TUESDAY, WEDNESDAY, THURSDAY, FRIDAY, SATURDAY, SUNDAY]
 *               meal_type:
 *                 type: string
 *                 enum: [BREAKFAST, LUNCH, DINNER, BRUNCH]
 *               start_time:
 *                 type: string
 *                 format: time
 *               end_time:
 *                 type: string
 *                 format: time
 *               is_active:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Availability updated successfully
 */
router.put("/:availabilityId", authGuard, updateAvailability);

/**
 * @swagger
 * /api/availabilities/{availabilityId}:
 *   delete:
 *     summary: Delete an availability (cook)
 *     tags: [Availabilities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: availabilityId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Availability deleted successfully
 */
router.delete("/:availabilityId", authGuard, deleteAvailability);

/**
 * @swagger
 * /api/availabilities/blocked-dates/me:
 *   get:
 *     summary: Get my blocked dates (cook)
 *     tags: [Availabilities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: from_date
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: to_date
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: List of blocked dates
 */
router.get("/blocked-dates/me", authGuard, getMyBlockedDates);

/**
 * @swagger
 * /api/availabilities/blocked-dates:
 *   post:
 *     summary: Block a date (cook)
 *     tags: [Availabilities]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - date
 *             properties:
 *               date:
 *                 type: string
 *                 format: date
 *                 example: "2025-01-15"
 *               reason:
 *                 type: string
 *     responses:
 *       201:
 *         description: Blocked date created successfully
 *       400:
 *         description: Bad request (already blocked)
 */
router.post("/blocked-dates", authGuard, createBlockedDate);

/**
 * @swagger
 * /api/availabilities/blocked-dates/{blockedDateId}:
 *   delete:
 *     summary: Unblock a date (cook)
 *     tags: [Availabilities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: blockedDateId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Blocked date deleted successfully
 */
router.delete("/blocked-dates/:blockedDateId", authGuard, deleteBlockedDate);

export default router;
