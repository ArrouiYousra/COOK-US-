import { type Response } from 'express';
import { type AuthRequest } from '@core/middleware';
import { UserStore } from '@stores/user.store';
import { z } from 'zod';
import { supabaseAdmin } from '@config/supabaseClient';

const notificationPreferencesSchema = z.object({
  booking_request: z.object({
    email: z.boolean().default(true),
    sms: z.boolean().default(false),
    push: z.boolean().default(true),
  }).optional(),
  booking_accepted: z.object({
    email: z.boolean().default(true),
    sms: z.boolean().default(false),
    push: z.boolean().default(true),
  }).optional(),
  booking_confirmed: z.object({
    email: z.boolean().default(true),
    sms: z.boolean().default(true),
    push: z.boolean().default(true),
  }).optional(),
  booking_cancelled: z.object({
    email: z.boolean().default(true),
    sms: z.boolean().default(false),
    push: z.boolean().default(true),
  }).optional(),
  booking_reminder: z.object({
    email: z.boolean().default(true),
    sms: z.boolean().default(true),
    push: z.boolean().default(true),
  }).optional(),
  review_received: z.object({
    email: z.boolean().default(true),
    sms: z.boolean().default(false),
    push: z.boolean().default(true),
  }).optional(),
  message_received: z.object({
    email: z.boolean().default(false),
    sms: z.boolean().default(false),
    push: z.boolean().default(true),
  }).optional(),
  payment_received: z.object({
    email: z.boolean().default(true),
    sms: z.boolean().default(false),
    push: z.boolean().default(true),
  }).optional(),
  dispute_opened: z.object({
    email: z.boolean().default(true),
    sms: z.boolean().default(false),
    push: z.boolean().default(true),
  }).optional(),
  profile_approved: z.object({
    email: z.boolean().default(true),
    sms: z.boolean().default(false),
    push: z.boolean().default(true),
  }).optional(),
  profile_rejected: z.object({
    email: z.boolean().default(true),
    sms: z.boolean().default(false),
    push: z.boolean().default(true),
  }).optional(),
  // Préférences pour les réservations (propositions)
  reservation_created: z.object({
    email: z.boolean().default(true),
    sms: z.boolean().default(false),
    push: z.boolean().default(true),
  }).optional(),
  reservation_accepted: z.object({
    email: z.boolean().default(true),
    sms: z.boolean().default(true),
    push: z.boolean().default(true),
  }).optional(),
  reservation_rejected: z.object({
    email: z.boolean().default(true),
    sms: z.boolean().default(false),
    push: z.boolean().default(true),
  }).optional(),
  reservation_cancelled: z.object({
    email: z.boolean().default(true),
    sms: z.boolean().default(false),
    push: z.boolean().default(true),
  }).optional(),
  proposal_received: z.object({
    email: z.boolean().default(true),
    sms: z.boolean().default(false),
    push: z.boolean().default(true),
  }).optional(),
  proposal_accepted: z.object({
    email: z.boolean().default(true),
    sms: z.boolean().default(true),
    push: z.boolean().default(true),
  }).optional(),
  proposal_rejected: z.object({
    email: z.boolean().default(true),
    sms: z.boolean().default(false),
    push: z.boolean().default(true),
  }).optional(),
});

type NotificationPreferences = z.infer<typeof notificationPreferencesSchema>;

const DEFAULT_PREFERENCES: NotificationPreferences = {
  booking_request: { email: true, sms: false, push: true },
  booking_accepted: { email: true, sms: false, push: true },
  booking_confirmed: { email: true, sms: true, push: true },
  booking_cancelled: { email: true, sms: false, push: true },
  booking_reminder: { email: true, sms: true, push: true },
  review_received: { email: true, sms: false, push: true },
  message_received: { email: false, sms: false, push: true },
  payment_received: { email: true, sms: false, push: true },
  dispute_opened: { email: true, sms: false, push: true },
  profile_approved: { email: true, sms: false, push: true },
  profile_rejected: { email: true, sms: false, push: true },
  // Préférences pour les réservations (propositions)
  reservation_created: { email: true, sms: false, push: true },
  reservation_accepted: { email: true, sms: true, push: true },
  reservation_rejected: { email: true, sms: false, push: true },
  reservation_cancelled: { email: true, sms: false, push: true },
  proposal_received: { email: true, sms: false, push: true },
  proposal_accepted: { email: true, sms: true, push: true },
  proposal_rejected: { email: true, sms: false, push: true },
};

/**
 * Récupérer les préférences de notifications détaillées
 */
export const getNotificationPreferences = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated',
      });
      return;
    }

    const user = await UserStore.getUserById(req.user.id);
    if (!user) {
      res.status(404).json({
        error: 'Not Found',
        message: 'User not found',
      });
      return;
    }

    // Récupérer les préférences depuis la colonne notification_preferences (JSONB)
    // Si elle n'existe pas, retourner les valeurs par défaut
    try {
      const { data, error } = await supabaseAdmin
        .from('users')
        .select('notification_preferences')
        .eq('id', req.user.id)
        .single();

      // PGRST116 = "No rows returned" - ce n'est pas une erreur, on utilise les valeurs par défaut
      if (error && error.code !== 'PGRST116') {
        console.error('Erreur Supabase lors de la récupération des préférences:', error);
        // Si la colonne n'existe pas, retourner les valeurs par défaut
        if (error.code === '42703' || error.message?.includes('column') || error.message?.includes('does not exist')) {
          console.warn('La colonne notification_preferences n\'existe pas, utilisation des valeurs par défaut');
          res.status(200).json({
            preferences: DEFAULT_PREFERENCES,
          });
          return;
        }
        // Pour toute autre erreur, utiliser les valeurs par défaut plutôt que de throw
        console.warn('Erreur Supabase, utilisation des valeurs par défaut:', error.message);
        res.status(200).json({
          preferences: DEFAULT_PREFERENCES,
        });
        return;
      }

      const preferences = (data?.notification_preferences as NotificationPreferences) || DEFAULT_PREFERENCES;

      res.status(200).json({
        preferences,
      });
      return;
    } catch (dbError: any) {
      // Si erreur de base de données, retourner les valeurs par défaut
      console.error('Erreur lors de la récupération des préférences depuis la DB:', dbError);
      res.status(200).json({
        preferences: DEFAULT_PREFERENCES,
      });
      return;
    }
  } catch (error: any) {
    // Dernière ligne de défense - toujours retourner les valeurs par défaut plutôt qu'une erreur 500
    console.error('Get notification preferences error (catch final):', error);
    // Même en cas d'erreur inattendue, retourner les valeurs par défaut pour éviter de casser l'UI
    res.status(200).json({
      preferences: DEFAULT_PREFERENCES,
    });
  }
};

/**
 * Mettre à jour les préférences de notifications détaillées
 */
export const updateNotificationPreferences = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated',
      });
      return;
    }

    const parsed = notificationPreferencesSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: 'ValidationError',
        details: parsed.error.flatten(),
      });
      return;
    }

    // Récupérer les préférences actuelles
    const { data: currentData } = await supabaseAdmin
      .from('users')
      .select('notification_preferences')
      .eq('id', req.user.id)
      .single();

    const currentPreferences = (currentData?.notification_preferences as NotificationPreferences) || DEFAULT_PREFERENCES;

    // Fusionner les nouvelles préférences avec les existantes
    const updatedPreferences: NotificationPreferences = {
      ...currentPreferences,
      ...parsed.data,
    };

    // Mettre à jour dans la base de données
    const { error } = await supabaseAdmin
      .from('users')
      .update({ notification_preferences: updatedPreferences })
      .eq('id', req.user.id);

    if (error) {
      throw error;
    }

    res.status(200).json({
      message: 'Notification preferences updated successfully',
      preferences: updatedPreferences,
    });
  } catch (error) {
    console.error('Update notification preferences error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to update notification preferences',
      details: error instanceof Error ? error.message : String(error),
    });
  }
};

