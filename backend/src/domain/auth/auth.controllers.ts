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

    // Get user from database
    const user = await UserStore.getUserById(req.user.id);

    if (!user) {
      res.status(404).json({
        error: 'Not Found',
        message: 'User not found in database',
      });
      return;
    }

    // Remove sensitive data
    const { password, two_factor_secret, ...userWithoutSensitiveData } = user;

    res.status(200).json({
      user: userWithoutSensitiveData,
    });
  } catch (error) {
    console.error('Get current user error:', error);
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

export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Email is required',
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

    // Send password reset email
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.FRONTEND_URL ?? 'http://localhost:3000'}/reset-password`,
    });

    if (error) {
      console.error('Password reset error:', error);
      // Don't reveal if email exists or not for security
      res.status(200).json({
        message: 'If an account with that email exists, a password reset link has been sent.',
      });
      return;
    }

    res.status(200).json({
      message: 'If an account with that email exists, a password reset link has been sent.',
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to process password reset request',
    });
  }
};

export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { password } = req.body;

    if (!password) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Password is required',
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

    // Note: Supabase handles the token via the URL hash when user clicks the email link
    // This endpoint should be called from the frontend after the user is redirected
    // The token is automatically handled by Supabase client in the frontend
    // For backend, we need the session to be set first (handled by frontend)
    
    // If called from backend with a session, update the password
    const { data, error } = await supabase.auth.updateUser({
      password: password,
    });

    if (error) {
      console.error('Password reset error:', error);
      res.status(400).json({
        error: 'Password Reset Failed',
        message: error.message || 'Invalid or expired reset token. Please request a new password reset.',
      });
      return;
    }

    res.status(200).json({
      message: 'Password has been reset successfully',
      user: data.user,
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to reset password',
    });
  }
};

export const changePassword = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated',
      });
      return;
    }

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Current password and new password are required',
      });
      return;
    }

    // Password validation (minimum 6 characters)
    if (newPassword.length < 6) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'New password must be at least 6 characters long',
      });
      return;
    }

    // Verify current password by attempting to sign in
    const user = await UserStore.getUserById(req.user.id);
    if (!user) {
      res.status(404).json({
        error: 'Not Found',
        message: 'User not found',
      });
      return;
    }

    // Try to sign in with current password to verify it
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    });

    if (signInError) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Current password is incorrect',
      });
      return;
    }

    // Update password
    const { data, error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      console.error('Password update error:', updateError);
      res.status(400).json({
        error: 'Password Update Failed',
        message: updateError.message,
      });
      return;
    }

    res.status(200).json({
      message: 'Password has been changed successfully',
      user: data.user,
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to change password',
    });
  }
};

export const updateEmail = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated',
      });
      return;
    }

    const { newEmail, password } = req.body;

    if (!newEmail || !password) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'New email and password are required',
      });
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid email format',
      });
      return;
    }

    // Get current user
    const user = await UserStore.getUserById(req.user.id);
    if (!user) {
      res.status(404).json({
        error: 'Not Found',
        message: 'User not found',
      });
      return;
    }

    // Verify password by attempting to sign in
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: password,
    });

    if (signInError) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Password is incorrect',
      });
      return;
    }

    // Check if new email is already taken
    const existingUser = await UserStore.getUserByEmail(newEmail);
    if (existingUser && existingUser.id !== req.user.id) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Email is already in use',
      });
      return;
    }

    // Update email in Supabase Auth
    const { data, error: updateError } = await supabase.auth.updateUser({
      email: newEmail,
    });

    if (updateError) {
      console.error('Email update error:', updateError);
      res.status(400).json({
        error: 'Email Update Failed',
        message: updateError.message,
      });
      return;
    }

    // Update email in database
    await UserStore.updateUser(req.user.id, {
      email: newEmail,
    });

    res.status(200).json({
      message: 'Email has been updated successfully. Please check your new email to confirm.',
      user: data.user,
    });
  } catch (error) {
    console.error('Update email error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to update email',
    });
  }
};

export const deleteAccount = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated',
      });
      return;
    }

    const { password } = req.body;

    if (!password) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Password is required to confirm account deletion',
      });
      return;
    }

    // Get current user
    const user = await UserStore.getUserById(req.user.id);
    if (!user) {
      res.status(404).json({
        error: 'Not Found',
        message: 'User not found',
      });
      return;
    }

    // Verify password by attempting to sign in
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: password,
    });

    if (signInError) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Password is incorrect',
      });
      return;
    }

    // Delete user from Supabase Auth (admin client)
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(req.user.id);

    if (deleteError) {
      console.error('Account deletion error:', deleteError);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to delete account',
      });
      return;
    }

    // Note: User deletion in database will be handled by CASCADE in Supabase
    // (user_profiles and client_profiles will be deleted automatically)

    res.status(200).json({
      message: 'Account has been deleted successfully',
    });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to delete account',
    });
  }
};

export const resendVerification = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Email is required',
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

    // Check if user exists
    const user = await UserStore.getUserByEmail(email);
    if (!user) {
      // Return same message for security (don't reveal if email exists)
      res.status(200).json({
        message: 'If an account with that email exists and is not verified, a verification email has been sent.',
      });
      return;
    }

    // Resend verification email using Supabase
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email,
    });

    if (error) {
      console.error('Resend verification error:', error);
      // Still return success message for security
      res.status(200).json({
        message: 'If an account with that email exists and is not verified, a verification email has been sent.',
      });
      return;
    }

    res.status(200).json({
      message: 'If an account with that email exists and is not verified, a verification email has been sent.',
    });
  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to resend verification email',
    });
  }
};

