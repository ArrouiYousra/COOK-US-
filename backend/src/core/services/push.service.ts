import * as admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

// Lazy initialization of Firebase Admin
let firebaseApp: admin.app.App | null = null;

function getFirebaseApp(): admin.app.App {
  if (!firebaseApp) {
    if (!process.env.FIREBASE_PROJECT_ID) {
      throw new Error(
        'FIREBASE_PROJECT_ID is not defined in environment variables. Please add it to your .env file.'
      );
    }

    // Vérifier si Firebase est déjà initialisé
    try {
      firebaseApp = admin.app();
    } catch (error) {
      // Firebase n'est pas encore initialisé
      const serviceAccount = process.env.FIREBASE_PRIVATE_KEY
        ? {
            projectId: process.env.FIREBASE_PROJECT_ID,
            privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          }
        : undefined;

      if (!serviceAccount) {
        throw new Error(
          'FIREBASE_PRIVATE_KEY and FIREBASE_CLIENT_EMAIL must be defined. Please add them to your .env file.'
        );
      }

      firebaseApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
        projectId: process.env.FIREBASE_PROJECT_ID,
      });
    }
  }
  return firebaseApp;
}

/**
 * Service d'envoi de notifications push via Firebase Cloud Messaging
 */
export class PushService {
  /**
   * Envoyer une notification push à un utilisateur
   * @param fcmToken - Token FCM de l'appareil de l'utilisateur
   * @param title - Titre de la notification
   * @param body - Corps de la notification
   * @param data - Données supplémentaires (optionnel)
   */
  static async sendPushNotification(
    fcmToken: string,
    title: string,
    body: string,
    data?: Record<string, string>
  ): Promise<void> {
    try {
      const app = getFirebaseApp();
      const messaging = app.messaging();

      const message: admin.messaging.Message = {
        token: fcmToken,
        notification: {
          title,
          body,
        },
        data: data || {},
        android: {
          priority: 'high' as const,
          notification: {
            sound: 'default',
            channelId: 'default',
          },
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1,
            },
          },
        },
      };

      const response = await messaging.send(message);
      console.log(`Push notification sent successfully. Message ID: ${response}`);
    } catch (error) {
      console.error('Error sending push notification:', error);
      
      // Si le token est invalide, on ne lance pas d'erreur (l'utilisateur peut avoir désinstallé l'app)
      if (error instanceof Error && error.message.includes('registration-token-not-registered')) {
        console.warn('FCM token is invalid or unregistered. User may have uninstalled the app.');
        return;
      }
      
      throw new Error(
        `Failed to send push notification: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Envoyer une notification push à plusieurs utilisateurs
   * @param fcmTokens - Tableau de tokens FCM
   * @param title - Titre de la notification
   * @param body - Corps de la notification
   * @param data - Données supplémentaires (optionnel)
   */
  static async sendPushNotificationToMultiple(
    fcmTokens: string[],
    title: string,
    body: string,
    data?: Record<string, string>
  ): Promise<{ successCount: number; failureCount: number }> {
    try {
      const app = getFirebaseApp();
      const messaging = app.messaging();

      const message: admin.messaging.MulticastMessage = {
        tokens: fcmTokens,
        notification: {
          title,
          body,
        },
        data: data || {},
        android: {
          priority: 'high' as const,
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
            },
          },
        },
      };

      const response = await messaging.sendEachForMulticast(message);
      
      console.log(
        `Push notifications sent: ${response.successCount} successful, ${response.failureCount} failed`
      );

      return {
        successCount: response.successCount,
        failureCount: response.failureCount,
      };
    } catch (error) {
      console.error('Error sending push notifications:', error);
      throw new Error(
        `Failed to send push notifications: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Envoyer une notification de confirmation de réservation
   */
  static async sendBookingConfirmationPush(
    fcmToken: string,
    bookingData: {
      bookingId: string;
      cookName: string;
      date: string;
      time: string;
    }
  ): Promise<void> {
    await this.sendPushNotification(
      fcmToken,
      '✅ Réservation confirmée',
      `Votre réservation avec ${bookingData.cookName} est confirmée pour le ${bookingData.date} à ${bookingData.time}.`,
      {
        type: 'BOOKING_CONFIRMED',
        bookingId: bookingData.bookingId,
        actionUrl: `/dashboard/client/bookings/${bookingData.bookingId}`,
      }
    );
  }

  /**
   * Envoyer une notification de rappel de réservation
   */
  static async sendBookingReminderPush(
    fcmToken: string,
    bookingData: {
      bookingId: string;
      cookName: string;
      date: string;
      time: string;
      reminderType: '24h' | '1h';
    }
  ): Promise<void> {
    const reminderText = bookingData.reminderType === '24h' ? 'demain' : 'dans 1 heure';
    await this.sendPushNotification(
      fcmToken,
      '⏰ Rappel de réservation',
      `Votre réservation avec ${bookingData.cookName} est prévue ${reminderText} (${bookingData.date} à ${bookingData.time}).`,
      {
        type: 'BOOKING_REMINDER',
        bookingId: bookingData.bookingId,
        reminderType: bookingData.reminderType,
        actionUrl: `/dashboard/client/bookings/${bookingData.bookingId}`,
      }
    );
  }

  /**
   * Envoyer une notification de nouvelle proposition
   */
  static async sendProposalReceivedPush(
    fcmToken: string,
    proposalData: {
      proposalId: string;
      cookName: string;
      date: string;
    }
  ): Promise<void> {
    await this.sendPushNotification(
      fcmToken,
      '✨ Nouvelle proposition',
      `${proposalData.cookName} a proposé ses services pour le ${proposalData.date}.`,
      {
        type: 'PROPOSAL_RECEIVED',
        proposalId: proposalData.proposalId,
        actionUrl: `/dashboard/client/proposals`,
      }
    );
  }

  /**
   * Vérifier si Firebase est configuré
   */
  static isConfigured(): boolean {
    return !!(
      process.env.FIREBASE_PROJECT_ID &&
      process.env.FIREBASE_PRIVATE_KEY &&
      process.env.FIREBASE_CLIENT_EMAIL
    );
  }
}

