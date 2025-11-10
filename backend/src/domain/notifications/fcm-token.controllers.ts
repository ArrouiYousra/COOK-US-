import { type Response } from 'express';
import { type AuthRequest } from '@core/middleware';
import { UserStore } from '@stores/user.store';
import { supabaseAdmin } from '@config/supabaseClient';

/**
 * Enregistrer ou mettre à jour le token FCM d'un utilisateur
 */
export const registerFcmToken = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated',
      });
      return;
    }

    const { fcm_token } = req.body;

    if (!fcm_token || typeof fcm_token !== 'string') {
      res.status(400).json({
        error: 'Bad Request',
        message: 'fcm_token is required and must be a string',
      });
      return;
    }

    // Mettre à jour le token FCM dans la base de données
    const { data, error } = await supabaseAdmin
      .from('users')
      .update({
        fcm_token: fcm_token,
        fcm_token_updated_at: new Date().toISOString(),
      })
      .eq('id', req.user.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating FCM token:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to register FCM token',
      });
      return;
    }

    res.status(200).json({
      message: 'FCM token registered successfully',
      fcm_token_updated_at: data.fcm_token_updated_at,
    });
  } catch (error) {
    console.error('Register FCM token error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to register FCM token',
    });
  }
};

/**
 * Supprimer le token FCM d'un utilisateur (déconnexion, désinstallation app)
 */
export const removeFcmToken = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated',
      });
      return;
    }

    // Supprimer le token FCM
    const { error } = await supabaseAdmin
      .from('users')
      .update({
        fcm_token: null,
        fcm_token_updated_at: null,
      })
      .eq('id', req.user.id);

    if (error) {
      console.error('Error removing FCM token:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to remove FCM token',
      });
      return;
    }

    res.status(200).json({
      message: 'FCM token removed successfully',
    });
  } catch (error) {
    console.error('Remove FCM token error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to remove FCM token',
    });
  }
};

