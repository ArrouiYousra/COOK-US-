import { Router } from "express";
import {
  getMyAddresses,
  getClientAddresses,
  getAddressById,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
  getBookingAddress,
} from "./address.controllers";
import { authGuard } from "@core/middleware";

const router = Router();

/**
 * @swagger
 * /api/addresses/me:
 *   get:
 *     summary: Get my addresses (client sees all)
 *     tags: [Addresses]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all addresses
 *       403:
 *         description: Forbidden (only clients)
 */
router.get("/me", authGuard, getMyAddresses);

/**
 * @swagger
 * /api/addresses/client/{clientId}:
 *   get:
 *     summary: Get addresses for a client (others see only default)
 *     tags: [Addresses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: clientId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of addresses (default only for non-owners)
 */
router.get("/client/:clientId", authGuard, getClientAddresses);

/**
 * @swagger
 * /api/addresses/{addressId}:
 *   get:
 *     summary: Get address by ID
 *     tags: [Addresses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: addressId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Address found
 *       403:
 *         description: Forbidden (can only view own or default addresses)
 */
router.get("/:addressId", authGuard, getAddressById);

/**
 * @swagger
 * /api/addresses:
 *   post:
 *     summary: Create an address (client/admin)
 *     tags: [Addresses]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - street
 *               - street_number
 *               - city
 *               - postal_code
 *               - latitude
 *               - longitude
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [HOME, VACATION_RENTAL, WORK, OTHER]
 *                 default: HOME
 *               label:
 *                 type: string
 *               street:
 *                 type: string
 *               street_number:
 *                 type: string
 *               complement:
 *                 type: string
 *               city:
 *                 type: string
 *               postal_code:
 *                 type: string
 *               country:
 *                 type: string
 *                 default: FR
 *               latitude:
 *                 type: number
 *               longitude:
 *                 type: number
 *               access_code:
 *                 type: string
 *               access_notes:
 *                 type: string
 *               parking_info:
 *                 type: string
 *               has_oven:
 *                 type: boolean
 *                 default: true
 *               has_dishwasher:
 *                 type: boolean
 *                 default: false
 *               kitchen_notes:
 *                 type: string
 *               is_default:
 *                 type: boolean
 *                 default: false
 *     responses:
 *       201:
 *         description: Address created successfully
 */
router.post("/", authGuard, createAddress);

/**
 * @swagger
 * /api/addresses/{addressId}:
 *   put:
 *     summary: Update an address (client/admin)
 *     tags: [Addresses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: addressId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [HOME, VACATION_RENTAL, WORK, OTHER]
 *               label:
 *                 type: string
 *               street:
 *                 type: string
 *               street_number:
 *                 type: string
 *               complement:
 *                 type: string
 *               city:
 *                 type: string
 *               postal_code:
 *                 type: string
 *               country:
 *                 type: string
 *               latitude:
 *                 type: number
 *               longitude:
 *                 type: number
 *               access_code:
 *                 type: string
 *               access_notes:
 *                 type: string
 *               parking_info:
 *                 type: string
 *               has_oven:
 *                 type: boolean
 *               has_dishwasher:
 *                 type: boolean
 *               kitchen_notes:
 *                 type: string
 *               is_default:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Address updated successfully
 */
router.put("/:addressId", authGuard, updateAddress);

/**
 * @swagger
 * /api/addresses/{addressId}:
 *   delete:
 *     summary: Delete an address (client/admin)
 *     tags: [Addresses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: addressId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Address deleted successfully
 */
router.delete("/:addressId", authGuard, deleteAddress);

/**
 * @swagger
 * /api/addresses/{addressId}/set-default:
 *   put:
 *     summary: Set address as default (automatically unsets others)
 *     tags: [Addresses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: addressId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Default address set successfully
 */
router.put("/:addressId/set-default", authGuard, setDefaultAddress);

/**
 * @swagger
 * /api/bookings/{bookingId}/address:
 *   get:
 *     summary: Get address for a booking (cook can see booking address)
 *     tags: [Addresses]
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
 *         description: Booking address found
 *       403:
 *         description: Forbidden (only participants can view)
 */
router.get("/:bookingId/address", authGuard, getBookingAddress);

export default router;
