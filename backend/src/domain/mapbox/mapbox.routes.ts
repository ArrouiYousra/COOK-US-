import { Router } from "express";
import {
  geocodeAddress,
  reverseGeocode,
  searchAddresses,
  calculateDistance,
} from "./mapbox.controllers";
import { authGuard, type AuthRequest } from "@core/middleware";
import { type Response } from "express";

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     GeocodeResult:
 *       type: object
 *       properties:
 *         latitude:
 *           type: number
 *         longitude:
 *           type: number
 *         placeName:
 *           type: string
 *         address:
 *           type: string
 *         city:
 *           type: string
 *         postalCode:
 *           type: string
 *         country:
 *           type: string
 *     ReverseGeocodeResult:
 *       type: object
 *       properties:
 *         placeName:
 *           type: string
 *         address:
 *           type: string
 *         city:
 *           type: string
 *         postalCode:
 *           type: string
 *         country:
 *           type: string
 *     AddressSearchResult:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         placeName:
 *           type: string
 *         address:
 *           type: string
 *         latitude:
 *           type: number
 *         longitude:
 *           type: number
 *         city:
 *           type: string
 *         postalCode:
 *           type: string
 *         country:
 *           type: string
 *     DistanceResult:
 *       type: object
 *       properties:
 *         distance:
 *           type: number
 *           description: Distance in meters
 *         distance_km:
 *           type: string
 *           description: Distance in kilometers
 *         duration:
 *           type: number
 *           description: Duration in seconds
 *         duration_minutes:
 *           type: number
 *           description: Duration in minutes
 */

/**
 * @swagger
 * /api/mapbox/geocode:
 *   get:
 *     summary: Geocode an address (address -> coordinates)
 *     tags: [Mapbox]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: address
 *         required: true
 *         schema:
 *           type: string
 *         description: Address to geocode
 *       - in: query
 *         name: country
 *         schema:
 *           type: string
 *         description: Country code to limit search (e.g., FR, US)
 *     responses:
 *       200:
 *         description: Address geocoded successfully
 *       400:
 *         description: Bad Request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Address not found
 */
router.get("/geocode", authGuard, geocodeAddress);

/**
 * @swagger
 * /api/mapbox/reverse-geocode:
 *   get:
 *     summary: Reverse geocode coordinates (coordinates -> address)
 *     tags: [Mapbox]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: latitude
 *         required: true
 *         schema:
 *           type: number
 *         description: Latitude
 *       - in: query
 *         name: longitude
 *         required: true
 *         schema:
 *           type: number
 *         description: Longitude
 *     responses:
 *       200:
 *         description: Coordinates reverse geocoded successfully
 *       400:
 *         description: Bad Request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Address not found
 */
router.get("/reverse-geocode", authGuard, reverseGeocode);

/**
 * @swagger
 * /api/mapbox/search:
 *   get:
 *     summary: Search addresses (autocomplete)
 *     tags: [Mapbox]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: query
 *         required: true
 *         schema:
 *           type: string
 *         description: Search query
 *       - in: query
 *         name: country
 *         schema:
 *           type: string
 *         description: Country code to limit search
 *       - in: query
 *         name: proximity_lng
 *         schema:
 *           type: number
 *         description: Longitude for proximity bias
 *       - in: query
 *         name: proximity_lat
 *         schema:
 *           type: number
 *         description: Latitude for proximity bias
 *     responses:
 *       200:
 *         description: Addresses found successfully
 *       400:
 *         description: Bad Request
 *       401:
 *         description: Unauthorized
 */
router.get("/search", authGuard, searchAddresses);

/**
 * @swagger
 * /api/mapbox/distance:
 *   get:
 *     summary: Calculate distance and duration between two points
 *     tags: [Mapbox]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: origin_lat
 *         required: true
 *         schema:
 *           type: number
 *         description: Origin latitude
 *       - in: query
 *         name: origin_lng
 *         required: true
 *         schema:
 *           type: number
 *         description: Origin longitude
 *       - in: query
 *         name: dest_lat
 *         required: true
 *         schema:
 *           type: number
 *         description: Destination latitude
 *       - in: query
 *         name: dest_lng
 *         required: true
 *         schema:
 *           type: number
 *         description: Destination longitude
 *       - in: query
 *         name: profile
 *         schema:
 *           type: string
 *           enum: [driving, walking, cycling]
 *           default: driving
 *         description: Routing profile
 *     responses:
 *       200:
 *         description: Distance calculated successfully
 *       400:
 *         description: Bad Request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Route not found
 */
router.get("/distance", authGuard, calculateDistance);

/**
 * @swagger
 * /api/mapbox/token:
 *   get:
 *     summary: Get Mapbox access token for frontend (secured)
 *     tags: [Mapbox]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Mapbox token retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Mapbox token not configured
 */
router.get(
  "/token",
  authGuard,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          error: "Unauthorized",
          message: "User not authenticated",
        });
        return;
      }

      // Retourner le token Mapbox (public token, sécurisé côté backend)
      const token = process.env.MAPBOX_ACCESS_TOKEN;
      if (!token || token === "votre_token_mapbox" || token.trim() === "") {
        res.status(500).json({
          error: "Internal Server Error",
          message:
            "Mapbox token not configured. Please set MAPBOX_ACCESS_TOKEN in your .env file with a valid Mapbox token (starts with pk.)",
        });
        return;
      }

      // Vérifier que le token a le bon format
      if (!token.startsWith("pk.")) {
        res.status(500).json({
          error: "Internal Server Error",
          message: 'Invalid Mapbox token format. Token must start with "pk."',
        });
        return;
      }

      res.status(200).json({
        token,
      });
    } catch (error) {
      console.error("Get Mapbox token error:", error);
      res.status(500).json({
        error: "Internal Server Error",
        message: "Failed to get Mapbox token",
      });
    }
  },
);

export default router;
