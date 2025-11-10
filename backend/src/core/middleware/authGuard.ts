import { type Request, type Response, type NextFunction } from 'express';
import { supabaseAdmin } from '@config/supabaseClient';

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
  next: NextFunction
): Promise<void> => {
  try {
    const cookieToken = (req as unknown as { cookies?: Record<string, string> }).cookies?.access_token;
    const authHeader = req.headers.authorization;

    const tokenFromHeader = authHeader?.startsWith('Bearer ')
      ? authHeader.substring(7)
      : undefined;

    const token = (tokenFromHeader ?? cookieToken)?.trim();

    if (!token) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Jeton d’authentification manquant',
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
      console.error('Auth verification error:', error);
      res.status(401).json({
        error: 'Unauthorized',
        message: error?.message || 'Invalid or expired token',
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
    console.error('Auth guard error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to authenticate user',
    });
  }
};

