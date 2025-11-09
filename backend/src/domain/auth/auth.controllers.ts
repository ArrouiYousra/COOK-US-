import { type Request, type Response } from 'express';
import { supabase, supabaseAdmin } from '@config/supabaseClient';
import { type AuthRequest } from '@core/middleware';
import { UserStore } from '@stores/user.store';
import type { UserRole } from '../../types/database.types';

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      email,
      password,
      first_name,
      last_name,
      role,
      phone,
      date_of_birth,
      address,
      city,
      postal_code,
      country,
      // For cook profile
      headline,
      hourly_rate,
      employment_status,
      // For client profile
      household_size,
    } = req.body;

    // Validation
    if (!email || !password) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Email and password are required',
      });
      return;
    }

    if (!first_name || !last_name) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'First name and last name are required',
      });
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid email format',
      });
      return;
    }

    // Password validation (minimum 6 characters)
    if (password.length < 6) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Password must be at least 6 characters long',
      });
      return;
    }

    // Validate role
    const userRole: UserRole = role && ['CLIENT', 'COOK', 'ADMIN'].includes(role) ? role : 'CLIENT';

    // Validate cook-specific fields if role is COOK
    if (userRole === 'COOK') {
      if (!headline || !hourly_rate || !employment_status) {
        res.status(400).json({
          error: 'Bad Request',
          message: 'Headline, hourly_rate, and employment_status are required for cook registration',
        });
        return;
      }
    }

    // Step 1: Create user in Supabase Auth using admin client
    // This bypasses email validation restrictions for development
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email for development
      user_metadata: {
        first_name,
        last_name,
        role: userRole,
      },
    });

    if (authError) {
      console.error('Supabase auth error:', authError);
      res.status(400).json({
        error: 'Registration Failed',
        message: authError.message,
        details: authError.status ? `Status: ${authError.status}` : undefined,
      });
      return;
    }

    if (!authData.user) {
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to create user account',
      });
      return;
    }

    // Step 2: Create user in database
    try {
      await UserStore.createUser(authData.user.id, {
        email,
        password: 'hashed_by_supabase_auth', // Password is managed by Supabase Auth
        first_name,
        last_name,
        role: userRole,
        phone: phone ?? undefined,
        date_of_birth: date_of_birth ?? undefined,
        address: address ?? undefined,
        city: city ?? undefined,
        postal_code: postal_code ?? undefined,
        country: country ?? 'FR',
      });
    } catch (dbError) {
      console.error('Database error:', dbError);
      // If database creation fails, try to delete the auth user
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);

      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to create user profile in database',
      });
      return;
    }

    // Step 3: Create profile based on role
    try {
      if (userRole === 'COOK') {
        await UserStore.createCookProfile({
          user_id: authData.user.id,
          headline,
          hourly_rate: parseFloat(hourly_rate),
          employment_status,
        });
      } else {
        // CLIENT or default
        await UserStore.createClientProfile({
          user_id: authData.user.id,
          household_size: household_size ? parseInt(household_size, 10) : undefined,
        });
      }
    } catch (profileError) {
      console.error('Profile creation error:', profileError);
      // User is created but profile failed - this is recoverable
      // We'll still return success but log the error
    }

    // Step 4: Generate a session for the user (optional - user can login after)
    // For now, we'll just return the user info
    // The user can use the login endpoint to get a session
    
    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: authData.user.id,
        email: authData.user.email,
        role: userRole,
        first_name,
        last_name,
      },
      // Note: User should login to get a session token
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to register user',
    });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Email and password are required',
      });
      return;
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      res.status(401).json({
        error: 'Authentication Failed',
        message: error.message,
      });
      return;
    }

    res.status(200).json({
      message: 'Login successful',
      user: data.user,
      session: data.session,
      accessToken: data.session?.access_token,
      refreshToken: data.session?.refresh_token,
    });
  } catch (error) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to login',
    });
  }
};

export const logout = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.substring(7);

    if (token) {
      await supabase.auth.signOut();
    }

    res.status(200).json({
      message: 'Logout successful',
    });
  } catch (error) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to logout',
    });
  }
};

export const getCurrentUser = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated',
      });
      return;
    }

    const { data: user, error } = await supabase.auth.getUser(req.user.id);

    if (error || !user) {
      res.status(404).json({
        error: 'Not Found',
        message: 'User not found',
      });
      return;
    }

    res.status(200).json({
      user: user.user,
    });
  } catch (error) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get user',
    });
  }
};

export const refreshToken = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Refresh token is required',
      });
      return;
    }

    const { data, error } = await supabase.auth.refreshSession({
      refresh_token: refreshToken,
    });

    if (error) {
      res.status(401).json({
        error: 'Token Refresh Failed',
        message: error.message,
      });
      return;
    }

    res.status(200).json({
      message: 'Token refreshed successfully',
      session: data.session,
      accessToken: data.session?.access_token,
      refreshToken: data.session?.refresh_token,
    });
  } catch (error) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to refresh token',
    });
  }
};

