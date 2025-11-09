import { Router } from 'express';
import {
  createBooking,
  getBookings,
  getBookingById,
  acceptBooking,
  rejectBooking,
  cancelBooking,
  getMyProposals,
} from './booking.controllers';
import { authGuard } from '@core/middleware';

const router = Router();

/**
 * @swagger
 * /api/bookings:
 *   post:
 *     summary: Create a new booking (client proposes to cook)
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - cook_profile_id
 *               - booking_date
 *             properties:
 *               cook_profile_id:
 *                 type: string
 *               booking_date:
 *                 type: string
 *                 format: date
 *                 example: "2025-01-15"
 *               meal_type:
 *                 type: string
 *                 enum: [BREAKFAST, LUNCH, DINNER, BRUNCH]
 *               start_time:
 *                 type: string
 *                 format: time
 *                 example: "18:00:00"
 *               end_time:
 *                 type: string
 *                 format: time
 *                 example: "20:00:00"
 *               number_of_guests:
 *                 type: integer
 *               need_groceries:
 *                 type: boolean
 *               need_table_setting:
 *                 type: boolean
 *               need_dishes:
 *                 type: boolean
 *               dietary_restrictions:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [VEGETARIAN, VEGAN, GLUTEN_FREE, LACTOSE_FREE, HALAL, KOSHER, LOW_CARB, KETO, PALEO, DIABETIC]
 *               allergies:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [PEANUTS, TREE_NUTS, MILK, EGGS, FISH, SHELLFISH, SOY, WHEAT, SESAME, MUSTARD, CELERY, LUPIN, SULFITES]
 *               special_requests:
 *                 type: string
 *               ingredients_available:
 *                 type: string
 *               address_id:
 *                 type: string
 *                 description: Reference to addresses table
 *     responses:
 *       201:
 *         description: Booking created successfully
 *       400:
 *         description: Bad request
 *       403:
 *         description: Forbidden (only clients can create bookings)
 */
router.post('/', authGuard, createBooking);

/**
 * @swagger
 * /api/bookings/my-proposals:
 *   get:
 *     summary: Get client proposals with simplified filters (pending, accepted, rejected)
 *     description: Returns client's booking proposals with stats. Use filter=pending|accepted|rejected to filter results.
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: filter
 *         schema:
 *           type: string
 *           enum: [pending, accepted, rejected]
 *           description: Filter proposals by status (pending = PENDING, accepted = ACCEPTED/CONFIRMED, rejected = CANCELLED)
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
 *         description: List of proposals with stats
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 bookings:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Booking'
 *                 count:
 *                   type: integer
 *                 stats:
 *                   type: object
 *                   properties:
 *                     pending:
 *                       type: integer
 *                     accepted:
 *                       type: integer
 *                     rejected:
 *                       type: integer
 *                 filter:
 *                   type: string
 *                 limit:
 *                   type: integer
 *                 offset:
 *                   type: integer
 *       403:
 *         description: Forbidden (only clients can view their proposals)
 */
router.get('/my-proposals', authGuard, getMyProposals);

/**
 * @swagger
 * /api/bookings:
 *   get:
 *     summary: Get list of bookings for current user
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, ACCEPTED, CONFIRMED, IN_PROGRESS, COMPLETED, CANCELLED, DISPUTED]
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
 *         description: List of bookings
 */
router.get('/', authGuard, getBookings);

/**
 * @swagger
 * /api/bookings/{id}:
 *   get:
 *     summary: Get booking details by ID
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Booking details
 *       403:
 *         description: Forbidden (not your booking)
 *       404:
 *         description: Booking not found
 */
router.get('/:id', authGuard, getBookingById);

/**
 * @swagger
 * /api/bookings/{id}/accept:
 *   put:
 *     summary: Accept a booking (cook or client)
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Booking accepted successfully
 *       400:
 *         description: Bad request
 *       404:
 *         description: Booking not found
 */
router.put('/:id/accept', authGuard, acceptBooking);

/**
 * @swagger
 * /api/bookings/{id}/reject:
 *   put:
 *     summary: Reject a booking (cook or client) - only for PENDING status
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Booking rejected successfully
 *       400:
 *         description: Bad request (can only reject PENDING bookings)
 *       404:
 *         description: Booking not found
 */
router.put('/:id/reject', authGuard, rejectBooking);

/**
 * @swagger
 * /api/bookings/{id}/cancel:
 *   put:
 *     summary: Cancel a booking (cook or client)
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 enum: [CLIENT_REQUEST, COOK_UNAVAILABLE, EMERGENCY, WEATHER, OTHER]
 *               cancellation_note:
 *                 type: string
 *     responses:
 *       200:
 *         description: Booking cancelled successfully
 *       400:
 *         description: Bad request
 *       404:
 *         description: Booking not found
 */
router.put('/:id/cancel', authGuard, cancelBooking);

export default router;

