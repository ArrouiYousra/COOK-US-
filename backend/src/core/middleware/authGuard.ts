import { type Request, type Response, type NextFunction } from "express";
import { supabaseAdmin } from "@config/supabaseClient";

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email?: string;
    role?: string;
  };
}

export const authGuard = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    // Debug: Log cookies and headers
    const cookies = (req as unknown as { cookies?: Record<string, string> }).cookies;
    const cookieHeader = req.headers.cookie;
    const cookieToken = cookies?.access_token;
    const authHeader = req.headers.authorization;

    // Log pour déboguer les problèmes de cookies cross-origin
    if (process.env.NODE_ENV === "production") {
      console.log("[AuthGuard] Debug:", {
        hasCookies: !!cookies,
        cookieKeys: cookies ? Object.keys(cookies) : [],
        hasAccessToken: !!cookieToken,
        hasCookieHeader: !!cookieHeader,
        hasAuthHeader: !!authHeader,
        origin: req.headers.origin,
        url: req.url,
      });
    }

    const tokenFromHeader = authHeader?.startsWith("Bearer ")
      ? authHeader.substring(7)
      : undefined;

    const token = (tokenFromHeader ?? cookieToken)?.trim();

    if (!token) {
      // Log plus détaillé en cas d'erreur
      console.warn("[AuthGuard] No token found:", {
        hasCookieToken: !!cookieToken,
        hasHeaderToken: !!tokenFromHeader,
        cookieHeader: cookieHeader ? "present" : "missing",
        cookies: cookies ? Object.keys(cookies) : "none",
        origin: req.headers.origin,
      });
      
      res.status(401).json({
        error: "Unauthorized",
        message: "Jeton d’authentification manquant",
      });
      return;
    }

    // Verify token with Supabase Admin
    // Use admin client to verify the JWT token
    const {
      data: { user },
      error,
    } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      console.error("Auth verification error:", error);
      res.status(401).json({
        error: "Unauthorized",
        message: error?.message || "Invalid or expired token",
      });
      return;
    }

    // Attach user to request
    req.user = {
      id: user.id,
      email: user.email ?? undefined,
      role: user.user_metadata?.role ?? undefined,
    };

    next();
  } catch (error) {
    console.error("Auth guard error:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to authenticate user",
    });
  }
};
