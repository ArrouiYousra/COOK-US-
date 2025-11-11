import type { NextFunction, Response } from "express";
import type { AuthRequest } from "./authGuard";
import type { UserRole } from "../../types/database.types";

/**
 * Middleware de contrôle de rôle.
 * À utiliser après `authGuard`.
 */
export function requireRole(requiredRoles: UserRole | UserRole[]) {
  const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];

  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    const userRole = req.user?.role;

    if (!userRole || !roles.includes(userRole as UserRole)) {
      res.status(403).json({
        error: "Forbidden",
        message: "Accès refusé. Rôle insuffisant.",
      });
      return;
    }

    next();
  };
}

