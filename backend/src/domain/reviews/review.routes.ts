import { Router } from 'express';
import {
  createReview,
  getReviewByBooking,
  getReviewsByUser,
  getMyReviews,
  updateReview,
  deleteReview,
} from './review.controllers';
import { authGuard } from '@core/middleware';

const router = Router();

/**
 * @swagger
 * /api/reviews:
 *   post:
 *     summary: Create a review for a completed booking
 *     tags: [Reviews]
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
 *               - rating
 *             properties:
 *               booking_id:
 *                 type: string
 *                 format: uuid
 *               rating:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 5
 *                 description: Rating from 0 to 5
 *               comment:
 *                 type: string
 *                 description: Optional comment
 *     responses:
 *       201:
 *         description: Review created successfully
 *       400:
 *         description: Bad request (booking not completed, already reviewed, etc.)
 */
router.post('/', authGuard, createReview);

/**
 * @swagger
 * /api/reviews/me:
 *   get:
 *     summary: Get all reviews written by the authenticated user
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of reviews written by user
 */
router.get('/me', authGuard, getMyReviews);

/**
 * @swagger
 * /api/reviews/booking/{bookingId}:
 *   get:
 *     summary: Get review for a specific booking
 *     tags: [Reviews]
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
 *         description: Review found
 *       404:
 *         description: Review not found
 */
router.get('/booking/:bookingId', authGuard, getReviewByBooking);

/**
 * @swagger
 * /api/reviews/user/{userId}:
 *   get:
 *     summary: Get all reviews for a user (reviews about them)
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of reviews with average rating
 */
router.get('/user/:userId', authGuard, getReviewsByUser);

/**
 * @swagger
 * /api/reviews/{reviewId}:
 *   put:
 *     summary: Update a review (only by the reviewer)
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reviewId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               rating:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 5
 *               comment:
 *                 type: string
 *     responses:
 *       200:
 *         description: Review updated successfully
 *       400:
 *         description: Bad request
 */
router.put('/:reviewId', authGuard, updateReview);

/**
 * @swagger
 * /api/reviews/{reviewId}:
 *   delete:
 *     summary: Delete a review (only by the reviewer)
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reviewId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Review deleted successfully
 *       400:
 *         description: Bad request
 */
router.delete('/:reviewId', authGuard, deleteReview);

export default router;

