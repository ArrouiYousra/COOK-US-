import { Router } from 'express';
import {
  getMyPortfolio,
  getCookPortfolio,
  createPortfolioItem,
  updatePortfolioItem,
  deletePortfolioItem,
  reorderPortfolioItems,
} from './portfolio.controllers';
import { authGuard } from '@core/middleware';

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     PortfolioItem:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         cook_profile_id:
 *           type: string
 *           format: uuid
 *         title:
 *           type: string
 *         description:
 *           type: string
 *           nullable: true
 *         image_url:
 *           type: string
 *         category:
 *           type: string
 *           nullable: true
 *         display_order:
 *           type: number
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 *     CreatePortfolioItem:
 *       type: object
 *       required:
 *         - title
 *         - image_url
 *       properties:
 *         title:
 *           type: string
 *         description:
 *           type: string
 *         image_url:
 *           type: string
 *         category:
 *           type: string
 *         display_order:
 *           type: number
 */

/**
 * @swagger
 * /api/portfolio/me:
 *   get:
 *     summary: Get current cook's portfolio
 *     tags: [Portfolio]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Portfolio items retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Only cooks can access
 */
router.get('/me', authGuard, getMyPortfolio);

/**
 * @swagger
 * /api/portfolio/cook/{cookId}:
 *   get:
 *     summary: Get a cook's public portfolio
 *     tags: [Portfolio]
 *     parameters:
 *       - in: path
 *         name: cookId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Portfolio items retrieved successfully
 *       404:
 *         description: Cook profile not found
 */
router.get('/cook/:cookId', getCookPortfolio);

/**
 * @swagger
 * /api/portfolio:
 *   post:
 *     summary: Create a new portfolio item
 *     tags: [Portfolio]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreatePortfolioItem'
 *     responses:
 *       201:
 *         description: Portfolio item created successfully
 *       400:
 *         description: Bad Request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Only cooks can create
 */
router.post('/', authGuard, createPortfolioItem);

/**
 * @swagger
 * /api/portfolio/{itemId}:
 *   put:
 *     summary: Update a portfolio item
 *     tags: [Portfolio]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               image_url:
 *                 type: string
 *               category:
 *                 type: string
 *               display_order:
 *                 type: number
 *     responses:
 *       200:
 *         description: Portfolio item updated successfully
 *       400:
 *         description: Bad Request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Portfolio item not found
 */
router.put('/:itemId', authGuard, updatePortfolioItem);

/**
 * @swagger
 * /api/portfolio/{itemId}:
 *   delete:
 *     summary: Delete a portfolio item
 *     tags: [Portfolio]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Portfolio item deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Portfolio item not found
 */
router.delete('/:itemId', authGuard, deletePortfolioItem);

/**
 * @swagger
 * /api/portfolio/reorder:
 *   post:
 *     summary: Reorder portfolio items
 *     tags: [Portfolio]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - itemIds
 *             properties:
 *               itemIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *     responses:
 *       200:
 *         description: Portfolio items reordered successfully
 *       400:
 *         description: Bad Request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.post('/reorder', authGuard, reorderPortfolioItems);

export default router;

