import { Router } from 'express';
import {
  applyToBooking,
  getBookingReservations,
  confirmReservation,
  cancelReservation,
  getAvailableBookings,
} from './reservation.controllers';
import { authGuard } from '@core/middleware';

const router = Router();

/**
 * @swagger
 * /api/bookings/available:
 *   get:
 *     summary: Get available public bookings (for cooks to browse)
 *     tags: [Reservations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: meal_type
 *         schema:
 *           type: string
 *           enum: [BREAKFAST, LUNCH, DINNER, BRUNCH]
 *       - in: query
 *         name: booking_date
 *         schema:
 *           type: string
 *           format: date
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
 *         description: List of available public bookings
 *       403:
 *         description: Forbidden (only cooks can view)
 */
router.get('/available', authGuard, getAvailableBookings);

/**
 * @swagger
 * /api/bookings/{bookingId}/apply:
 *   post:
 *     summary: Apply to a booking (cook postulates)
 *     tags: [Reservations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: bookingId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       201:
 *         description: Reservation submitted successfully
 *       400:
 *         description: Bad request (already applied or booking has cook)
 *       403:
 *         description: Forbidden (only cooks can apply)
 */
router.post('/:bookingId/apply', authGuard, applyToBooking);

/**
 * @swagger
 * /api/bookings/{bookingId}/reservations:
 *   get:
 *     summary: Get all reservations for a booking (client views candidates)
 *     tags: [Reservations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: bookingId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of reservations with cook info
 *       403:
 *         description: Forbidden (only client can view)
 */
router.get('/:bookingId/reservations', authGuard, getBookingReservations);

/**
 * @swagger
 * /api/bookings/{bookingId}/reservations/{reservationId}/confirm:
 *   put:
 *     summary: Confirm a reservation (client chooses a cook)
 *     tags: [Reservations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: bookingId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: reservationId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Reservation confirmed, booking updated with cook
 *       400:
 *         description: Bad request
 *       403:
 *         description: Forbidden (only client can confirm)
 */
router.put('/:bookingId/reservations/:reservationId/confirm', authGuard, confirmReservation);

/**
 * @swagger
 * /api/reservations/{reservationId}/cancel:
 *   put:
 *     summary: Cancel a reservation (client rejects or cook withdraws)
 *     tags: [Reservations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reservationId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Reservation cancelled
 *       403:
 *         description: Forbidden
 */
router.put('/reservations/:reservationId/cancel', authGuard, cancelReservation);

export default router;

