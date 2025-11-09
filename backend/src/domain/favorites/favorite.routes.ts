import { Router } from 'express';
import {
  getMyFavorites,
  addFavorite,
  removeFavorite,
  checkFavorite,
} from './favorite.controllers';
import { authGuard } from '@core/middleware';

const router = Router();

/**
 * @swagger
 * /api/favorites:
 *   get:
 *     summary: Get my favorite cooks (client)
 *     tags: [Favorites]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of favorite cooks with profile info
 *       403:
 *         description: Forbidden (only clients)
 */
router.get('/', authGuard, getMyFavorites);

/**
 * @swagger
 * /api/favorites/{cookId}:
 *   post:
 *     summary: Add a cook to favorites (client)
 *     tags: [Favorites]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: cookId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       201:
 *         description: Cook added to favorites successfully
 *       400:
 *         description: Bad request (already favorited)
 *       403:
 *         description: Forbidden (only clients)
 */
router.post('/:cookId', authGuard, addFavorite);

/**
 * @swagger
 * /api/favorites/{cookId}:
 *   delete:
 *     summary: Remove a cook from favorites (client)
 *     tags: [Favorites]
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
 *         description: Cook removed from favorites successfully
 *       403:
 *         description: Forbidden (only clients)
 */
router.delete('/:cookId', authGuard, removeFavorite);

/**
 * @swagger
 * /api/favorites/{cookId}/check:
 *   get:
 *     summary: Check if a cook is in favorites (client)
 *     tags: [Favorites]
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
 *         description: Favorite status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 is_favorite:
 *                   type: boolean
 *       403:
 *         description: Forbidden (only clients)
 */
router.get('/:cookId/check', authGuard, checkFavorite);

export default router;

