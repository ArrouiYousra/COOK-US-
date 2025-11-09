import { Router } from 'express';
import {
  createBooking,
  getBookings,
  getBookingById,
  acceptBooking,
  rejectBooking,
  cancelBooking,
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
 *               - cook_id
 *               - service_date
 *               - service_duration_hours
 *               - number_of_guests
 *               - address
 *               - city
 *               - postal_code
 *             properties:
 *               cook_id:
 *                 type: string
 *               service_date:
 *                 type: string
 *                 format: date-time
 *               service_duration_hours:
 *                 type: number
 *               number_of_guests:
 *                 type: integer
 *               address:
 *                 type: string
 *               city:
 *                 type: string
 *               postal_code:
 *                 type: string
 *               country:
 *                 type: string
 *               special_requests:
 *                 type: string
 *               dietary_restrictions:
 *                 type: string
 *               pantry_items:
 *                 type: string
 *               menu_description:
 *                 type: string
 *               can_do_groceries:
 *                 type: boolean
 *               can_set_table:
 *                 type: boolean
 *               can_do_dishes:
 *                 type: boolean
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

