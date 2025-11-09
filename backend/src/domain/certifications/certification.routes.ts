import { Router } from 'express';
import {
  getMyCertifications,
  getCookCertifications,
  createCertification,
  updateCertification,
  deleteCertification,
  verifyCertification,
  getPendingCertifications,
} from './certification.controllers';
import { authGuard } from '@core/middleware';

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Certification:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         cook_profile_id:
 *           type: string
 *           format: uuid
 *         name:
 *           type: string
 *         issuing_organization:
 *           type: string
 *         issue_date:
 *           type: string
 *           format: date
 *           nullable: true
 *         expiry_date:
 *           type: string
 *           format: date
 *           nullable: true
 *         certificate_url:
 *           type: string
 *           nullable: true
 *         verification_status:
 *           type: string
 *           enum: [PENDING, VERIFIED, REJECTED]
 *         verified_at:
 *           type: string
 *           format: date-time
 *           nullable: true
 *         verified_by:
 *           type: string
 *           format: uuid
 *           nullable: true
 *         notes:
 *           type: string
 *           nullable: true
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 *     CreateCertification:
 *       type: object
 *       required:
 *         - name
 *         - issuing_organization
 *       properties:
 *         name:
 *           type: string
 *         issuing_organization:
 *           type: string
 *         issue_date:
 *           type: string
 *           format: date
 *         expiry_date:
 *           type: string
 *           format: date
 *         certificate_url:
 *           type: string
 *         notes:
 *           type: string
 */

/**
 * @swagger
 * /api/certifications/me:
 *   get:
 *     summary: Get current cook's certifications
 *     tags: [Certifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Certifications retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Only cooks can access
 */
router.get('/me', authGuard, getMyCertifications);

/**
 * @swagger
 * /api/certifications/cook/{cookId}:
 *   get:
 *     summary: Get a cook's verified certifications (public)
 *     tags: [Certifications]
 *     parameters:
 *       - in: path
 *         name: cookId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Certifications retrieved successfully
 *       404:
 *         description: Cook profile not found
 */
router.get('/cook/:cookId', getCookCertifications);

/**
 * @swagger
 * /api/certifications:
 *   post:
 *     summary: Create a new certification
 *     tags: [Certifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateCertification'
 *     responses:
 *       201:
 *         description: Certification created successfully
 *       400:
 *         description: Bad Request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Only cooks can create
 */
router.post('/', authGuard, createCertification);

/**
 * @swagger
 * /api/certifications/{certId}:
 *   put:
 *     summary: Update a certification
 *     tags: [Certifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: certId
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
 *               name:
 *                 type: string
 *               issuing_organization:
 *                 type: string
 *               issue_date:
 *                 type: string
 *                 format: date
 *               expiry_date:
 *                 type: string
 *                 format: date
 *               certificate_url:
 *                 type: string
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Certification updated successfully
 *       400:
 *         description: Bad Request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Certification not found
 */
router.put('/:certId', authGuard, updateCertification);

/**
 * @swagger
 * /api/certifications/{certId}:
 *   delete:
 *     summary: Delete a certification
 *     tags: [Certifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: certId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Certification deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Certification not found
 */
router.delete('/:certId', authGuard, deleteCertification);

/**
 * @swagger
 * /api/certifications/{certId}/verify:
 *   post:
 *     summary: Verify or reject a certification (admin only)
 *     tags: [Certifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: certId
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
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [VERIFIED, REJECTED]
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Certification verified/rejected successfully
 *       400:
 *         description: Bad Request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Only admins can verify
 *       404:
 *         description: Certification not found
 */
router.post('/:certId/verify', authGuard, verifyCertification);

/**
 * @swagger
 * /api/certifications/pending:
 *   get:
 *     summary: Get all pending certifications (admin only)
 *     tags: [Certifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Pending certifications retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Only admins can access
 */
router.get('/pending', authGuard, getPendingCertifications);

export default router;

