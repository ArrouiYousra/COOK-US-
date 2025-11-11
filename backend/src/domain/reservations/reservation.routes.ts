import { Router } from 'express';
import {
  createReservation,
  getReservationsByBookingId,
  getMyReservations,
  acceptReservation,
  rejectReservation,
  cancelReservation,
  getReservationById,
} from './reservation.controllers';
import { authGuard } from '@core/middleware';

const router = Router();

/**
 * @swagger
 * /api/reservations:
 *   post:
 *     summary: Create a reservation (proposition) on a public request
 *     tags: [Reservations]
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
 *               - proposed_price
 *             properties:
 *               booking_id:
 *                 type: string
 *               proposed_price:
 *                 type: number
 *               proposed_hours:
 *                 type: number
 *               proposed_hourly_rate:
 *                 type: number
 *               message:
 *                 type: string
 *               can_do_groceries:
 *                 type: boolean
 *               can_set_table:
 *                 type: boolean
 *               can_do_dishes:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Reservation created successfully
 *       400:
 *         description: Bad request
 *       403:
 *         description: Forbidden (only cooks can create reservations)
 */
router.post('/', authGuard, createReservation);

/**
 * @swagger
 * /api/reservations/booking/{bookingId}:
 *   get:
 *     summary: Get all reservations for a public request
 *     tags: [Reservations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: bookingId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: includeExpired
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: List of reservations with stats
 */
router.get('/booking/:bookingId', authGuard, getReservationsByBookingId);

/**
 * @swagger
 * /api/reservations/my-proposals:
 *   get:
 *     summary: Get my reservations (as a cook)
 *     tags: [Reservations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, ACCEPTED, REJECTED, CANCELLED, EXPIRED]
 *     responses:
 *       200:
 *         description: List of my reservations
 */
router.get('/my-proposals', authGuard, getMyReservations);

/**
 * @swagger
 * /api/reservations/{reservationId}:
 *   get:
 *     summary: Get a reservation by ID
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
 *         description: Reservation found
 *       404:
 *         description: Reservation not found
 */
router.get('/:reservationId', authGuard, getReservationById);

/**
 * @swagger
 * /api/reservations/{reservationId}/accept:
 *   put:
 *     summary: Accept a reservation (by client)
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
 *         description: Reservation accepted successfully
 *       400:
 *         description: Bad request
 *       403:
 *         description: Forbidden (only clients can accept reservations)
 */
router.put('/:reservationId/accept', authGuard, acceptReservation);

/**
 * @swagger
 * /api/reservations/{reservationId}/reject:
 *   put:
 *     summary: Reject a reservation (by client)
 *     tags: [Reservations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reservationId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               rejection_reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Reservation rejected successfully
 *       400:
 *         description: Bad request
 *       403:
 *         description: Forbidden (only clients can reject reservations)
 */
router.put('/:reservationId/reject', authGuard, rejectReservation);

/**
 * @swagger
 * /api/reservations/{reservationId}/cancel:
 *   put:
 *     summary: Cancel a reservation (by cook)
 *     tags: [Reservations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reservationId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               cancellation_reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Reservation cancelled successfully
 *       400:
 *         description: Bad request
 *       403:
 *         description: Forbidden (only cooks can cancel their reservations)
 */
router.put('/:reservationId/cancel', authGuard, cancelReservation);

export default router;
