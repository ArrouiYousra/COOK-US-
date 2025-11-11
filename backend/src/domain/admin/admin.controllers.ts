import type { Request, Response } from "express";
import {
  AdminStore,
  type AdminUserListOptions,
} from "@stores/admin.store";

export class AdminController {
  static async getSummary(_req: Request, res: Response): Promise<void> {
    try {
      const stats = await AdminStore.getSummaryStats();
      res.status(200).json({ stats });
    } catch (error) {
      console.error("[AdminController] getSummary error:", error);
      res.status(500).json({
        error: "InternalServerError",
        message:
          error instanceof Error
            ? error.message
            : "Impossible de récupérer les statistiques admin.",
      });
    }
  }

  static async getTimeseries(req: Request, res: Response): Promise<void> {
    try {
      const rangeParam = req.query.range;
      const range = Number(rangeParam) || 30;
      const timeseries = await AdminStore.getTimeseries(range);
      res.status(200).json({ range, timeseries });
    } catch (error) {
      console.error("[AdminController] getTimeseries error:", error);
      res.status(500).json({
        error: "InternalServerError",
        message:
          error instanceof Error
            ? error.message
            : "Impossible de récupérer la série temporelle.",
      });
    }
  }

  static async getDistributions(req: Request, res: Response): Promise<void> {
    try {
      const rangeParam = req.query.range;
      const range = Number(rangeParam) || 90;
      const distributions = await AdminStore.getDistributions(range);
      res.status(200).json({ range, distributions });
    } catch (error) {
      console.error("[AdminController] getDistributions error:", error);
      res.status(500).json({
        error: "InternalServerError",
        message:
          error instanceof Error
            ? error.message
            : "Impossible de récupérer les répartitions.",
      });
    }
  }

  static async getUsers(req: Request, res: Response): Promise<void> {
    try {
      const options: AdminUserListOptions = {
        role:
          typeof req.query.role === "string"
            ? (req.query.role as AdminUserListOptions["role"])
            : undefined,
        status:
          typeof req.query.status === "string"
            ? (req.query.status as AdminUserListOptions["status"])
            : undefined,
        search:
          typeof req.query.search === "string" ? req.query.search : undefined,
        limit:
          typeof req.query.limit === "string"
            ? Number(req.query.limit)
            : undefined,
        offset:
          typeof req.query.offset === "string"
            ? Number(req.query.offset)
            : undefined,
        sortBy:
          req.query.sortBy === "last_login_at" ? "last_login_at" : "created_at",
        sortDirection:
          req.query.sortDirection === "asc" ? "asc" : "desc",
      };

      const result = await AdminStore.getUsers(options);
      res.status(200).json(result);
    } catch (error) {
      console.error("[AdminController] getUsers error:", error);
      res.status(500).json({
        error: "InternalServerError",
        message:
          error instanceof Error
            ? error.message
            : "Impossible de récupérer la liste des utilisateurs.",
      });
    }
  }
}

