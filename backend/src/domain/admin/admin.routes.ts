import { Router } from "express";
import { authGuard, requireRole } from "@core/middleware";
import { AdminController } from "./admin.controllers";

const router = Router();

// Sécurité : routes accessibles uniquement aux administrateurs authentifiés
router.use(authGuard);
router.use(requireRole("ADMIN"));

router.get("/stats/summary", AdminController.getSummary);
router.get("/stats/timeseries", AdminController.getTimeseries);
router.get("/stats/distribution", AdminController.getDistributions);
router.get("/users", AdminController.getUsers);

export default router;

