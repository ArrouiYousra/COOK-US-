import { Router } from "express";
import {
  getMyDietaryRestrictions,
  addDietaryRestriction,
  removeDietaryRestriction,
  getMyAllergies,
  addAllergy,
  removeAllergy,
  getMyFavoriteCuisines,
  addFavoriteCuisine,
  removeFavoriteCuisine,
} from "./clientPreferences.controllers";
import { authGuard } from "@core/middleware";

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     ClientDietaryRestriction:
 *       type: object
 *       properties:
 *         client_profile_id:
 *           type: string
 *           format: uuid
 *         restriction:
 *           type: string
 *           enum: [VEGETARIAN, VEGAN, GLUTEN_FREE, LACTOSE_FREE, HALAL, KOSHER, LOW_CARB, KETO, PALEO, DIABETIC]
 *     ClientAllergy:
 *       type: object
 *       properties:
 *         client_profile_id:
 *           type: string
 *           format: uuid
 *         allergy:
 *           type: string
 *           enum: [PEANUTS, TREE_NUTS, MILK, EGGS, FISH, SHELLFISH, SOY, WHEAT, SESAME, MUSTARD, CELERY, LUPIN, SULFITES]
 *     ClientFavoriteCuisine:
 *       type: object
 *       properties:
 *         client_profile_id:
 *           type: string
 *           format: uuid
 *         cuisine:
 *           type: string
 *           enum: [FRENCH, ITALIAN, ASIAN, MEDITERRANEAN, VEGETARIAN, VEGAN, HEALTHY, TRADITIONAL, GASTRONOMIC, COMFORT_FOOD, INTERNATIONAL, FUSION, SEAFOOD, GRILLED, PASTRY]
 */

/**
 * @swagger
 * /api/client-preferences/dietary-restrictions:
 *   get:
 *     summary: Get current user's dietary restrictions
 *     tags: [Client Preferences]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dietary restrictions retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Client profile not found
 */
router.get("/dietary-restrictions", authGuard, getMyDietaryRestrictions);

/**
 * @swagger
 * /api/client-preferences/dietary-restrictions:
 *   post:
 *     summary: Add a dietary restriction
 *     tags: [Client Preferences]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - restriction
 *             properties:
 *               restriction:
 *                 type: string
 *                 enum: [VEGETARIAN, VEGAN, GLUTEN_FREE, LACTOSE_FREE, HALAL, KOSHER, LOW_CARB, KETO, PALEO, DIABETIC]
 *     responses:
 *       201:
 *         description: Dietary restriction added successfully
 *       400:
 *         description: Bad Request
 *       401:
 *         description: Unauthorized
 */
router.post("/dietary-restrictions", authGuard, addDietaryRestriction);

/**
 * @swagger
 * /api/client-preferences/dietary-restrictions/{restriction}:
 *   delete:
 *     summary: Remove a dietary restriction
 *     tags: [Client Preferences]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: restriction
 *         required: true
 *         schema:
 *           type: string
 *           enum: [VEGETARIAN, VEGAN, GLUTEN_FREE, LACTOSE_FREE, HALAL, KOSHER, LOW_CARB, KETO, PALEO, DIABETIC]
 *     responses:
 *       200:
 *         description: Dietary restriction removed successfully
 *       400:
 *         description: Bad Request
 *       401:
 *         description: Unauthorized
 */
router.delete(
  "/dietary-restrictions/:restriction",
  authGuard,
  removeDietaryRestriction,
);

/**
 * @swagger
 * /api/client-preferences/allergies:
 *   get:
 *     summary: Get current user's allergies
 *     tags: [Client Preferences]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Allergies retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Client profile not found
 */
router.get("/allergies", authGuard, getMyAllergies);

/**
 * @swagger
 * /api/client-preferences/allergies:
 *   post:
 *     summary: Add an allergy
 *     tags: [Client Preferences]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - allergy
 *             properties:
 *               allergy:
 *                 type: string
 *                 enum: [PEANUTS, TREE_NUTS, MILK, EGGS, FISH, SHELLFISH, SOY, WHEAT, SESAME, MUSTARD, CELERY, LUPIN, SULFITES]
 *     responses:
 *       201:
 *         description: Allergy added successfully
 *       400:
 *         description: Bad Request
 *       401:
 *         description: Unauthorized
 */
router.post("/allergies", authGuard, addAllergy);

/**
 * @swagger
 * /api/client-preferences/allergies/{allergy}:
 *   delete:
 *     summary: Remove an allergy
 *     tags: [Client Preferences]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: allergy
 *         required: true
 *         schema:
 *           type: string
 *           enum: [PEANUTS, TREE_NUTS, MILK, EGGS, FISH, SHELLFISH, SOY, WHEAT, SESAME, MUSTARD, CELERY, LUPIN, SULFITES]
 *     responses:
 *       200:
 *         description: Allergy removed successfully
 *       400:
 *         description: Bad Request
 *       401:
 *         description: Unauthorized
 */
router.delete("/allergies/:allergy", authGuard, removeAllergy);

/**
 * @swagger
 * /api/client-preferences/favorite-cuisines:
 *   get:
 *     summary: Get current user's favorite cuisines
 *     tags: [Client Preferences]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Favorite cuisines retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Client profile not found
 */
router.get("/favorite-cuisines", authGuard, getMyFavoriteCuisines);

/**
 * @swagger
 * /api/client-preferences/favorite-cuisines:
 *   post:
 *     summary: Add a favorite cuisine
 *     tags: [Client Preferences]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - cuisine
 *             properties:
 *               cuisine:
 *                 type: string
 *                 enum: [FRENCH, ITALIAN, ASIAN, MEDITERRANEAN, VEGETARIAN, VEGAN, HEALTHY, TRADITIONAL, GASTRONOMIC, COMFORT_FOOD, INTERNATIONAL, FUSION, SEAFOOD, GRILLED, PASTRY]
 *     responses:
 *       201:
 *         description: Favorite cuisine added successfully
 *       400:
 *         description: Bad Request
 *       401:
 *         description: Unauthorized
 */
router.post("/favorite-cuisines", authGuard, addFavoriteCuisine);

/**
 * @swagger
 * /api/client-preferences/favorite-cuisines/{cuisine}:
 *   delete:
 *     summary: Remove a favorite cuisine
 *     tags: [Client Preferences]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: cuisine
 *         required: true
 *         schema:
 *           type: string
 *           enum: [FRENCH, ITALIAN, ASIAN, MEDITERRANEAN, VEGETARIAN, VEGAN, HEALTHY, TRADITIONAL, GASTRONOMIC, COMFORT_FOOD, INTERNATIONAL, FUSION, SEAFOOD, GRILLED, PASTRY]
 *     responses:
 *       200:
 *         description: Favorite cuisine removed successfully
 *       400:
 *         description: Bad Request
 *       401:
 *         description: Unauthorized
 */
router.delete("/favorite-cuisines/:cuisine", authGuard, removeFavoriteCuisine);

export default router;
