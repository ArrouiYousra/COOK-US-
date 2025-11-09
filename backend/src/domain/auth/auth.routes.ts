import { Router } from 'express';
import {
  register,
  login,
  logout,
  getCurrentUser,
  refreshToken,
} from './auth.controllers';
import { authGuard } from '@core/middleware';

const router = Router();

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refreshToken);

// Protected routes (require authentication)
router.post('/logout', authGuard, logout);
router.get('/me', authGuard, getCurrentUser);

export default router;

