import { NotificationStore } from '@stores/notification.store';
import { UserStore } from '@stores/user.store';
import { PushService } from './push.service';
import { SmsService } from './sms.service';
import { EmailService } from './email.service';
import type { CreateNotificationDTO } from '../types/database.types';

/**
 * Service unifié pour envoyer des notifications
 * Gère automatiquement : Base de données + Push + Email + SMS selon les préférences utilisateur
 */
export class NotificationService {
  /**
   * Envoyer une notification complète (DB + Push + Email + SMS selon préférences)
   */
  static async sendNotification(
    userId: string,
    notificationData: CreateNotificationDTO
  ): Promise<void> {
    try {
      // 1. Toujours créer la notification en base de données
      const notification = await NotificationStore.createNotification({
        ...notificationData,
        user_id: userId,
      });

      // 2. Récupérer l'utilisateur pour vérifier ses préférences et récupérer les tokens
      const user = await UserStore.getUserById(userId);
      if (!user) {
        console.warn(`User ${userId} not found, notification created in DB only`);
        return;
      }

      // 3. Envoyer push notification si l'utilisateur a un token FCM et les notifications sont activées
      if (
        user.notifications_enabled &&
        user.fcm_token &&
        PushService.isConfigured()
      ) {
        try {
          await PushService.sendPushNotification(
            user.fcm_token,
            notificationData.title || 'Notification',
            notificationData.message || '',
            {
              type: notificationData.type,
              notificationId: notification.id,
              actionUrl: notificationData.action_url || '',
            }
          );
        } catch (pushError) {
          console.error('Failed to send push notification:', pushError);
          // Ne pas bloquer si le push échoue
        }
      }

      // 4. Envoyer email si activé
      if (user.notifications_enabled && user.email_notifications && EmailService) {
        try {
          await EmailService.sendEmail(
            user.email,
            notificationData.title || 'Notification',
            `
              <h1>${notificationData.title || 'Notification'}</h1>
              <p>${notificationData.message || ''}</p>
              ${notificationData.action_url ? `<p><a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}${notificationData.action_url}">Voir les détails</a></p>` : ''}
            `
          );
        } catch (emailError) {
          console.error('Failed to send email notification:', emailError);
          // Ne pas bloquer si l'email échoue
        }
      }

      // 5. Envoyer SMS si activé et numéro disponible
      if (
        user.notifications_enabled &&
        user.sms_notifications &&
        user.phone &&
        SmsService.isConfigured()
      ) {
        try {
          await SmsService.sendSms(
            user.phone,
            `${notificationData.title || 'Notification'}: ${notificationData.message || ''}`
          );
        } catch (smsError) {
          console.error('Failed to send SMS notification:', smsError);
          // Ne pas bloquer si le SMS échoue
        }
      }
    } catch (error) {
      console.error('Error sending notification:', error);
      // Lancer l'erreur seulement si la création en DB échoue
      throw error;
    }
  }

  /**
   * Envoyer une notification de confirmation de réservation
   */
  static async sendBookingConfirmationNotification(
    userId: string,
    bookingData: {
      bookingId: string;
      cookName: string;
      date: string;
      time: string;
      numberOfGuests: number;
      totalPrice: number;
      address: string;
    }
  ): Promise<void> {
    const user = await UserStore.getUserById(userId);
    if (!user) return;

    // Notification en base
    await this.sendNotification(userId, {
      user_id: userId,
      type: 'BOOKING_CONFIRMED',
      title: 'Réservation confirmée',
      message: `Votre réservation avec ${bookingData.cookName} est confirmée pour le ${bookingData.date} à ${bookingData.time}.`,
      action_url: `/dashboard/client/bookings/${bookingData.bookingId}`,
      metadata: {
        booking_id: bookingData.bookingId,
        cook_name: bookingData.cookName,
      },
    });

    // Push notification spécialisée
    if (user.fcm_token && PushService.isConfigured()) {
      try {
        await PushService.sendBookingConfirmationPush(user.fcm_token, {
          bookingId: bookingData.bookingId,
          cookName: bookingData.cookName,
          date: bookingData.date,
          time: bookingData.time,
        });
      } catch (error) {
        console.error('Failed to send booking confirmation push:', error);
      }
    }

    // Email spécialisé
    if (user.email_notifications) {
      try {
        await EmailService.sendBookingConfirmationEmail(user.email, bookingData);
      } catch (error) {
        console.error('Failed to send booking confirmation email:', error);
      }
    }

    // SMS spécialisé
    if (user.sms_notifications && user.phone && SmsService.isConfigured()) {
      try {
        await SmsService.sendBookingConfirmationSms(user.phone, {
          bookingId: bookingData.bookingId,
          cookName: bookingData.cookName,
          date: bookingData.date,
          time: bookingData.time,
        });
      } catch (error) {
        console.error('Failed to send booking confirmation SMS:', error);
      }
    }
  }

  /**
   * Envoyer une notification de paiement reçu
   */
  static async sendPaymentReceivedNotification(
    userId: string,
    paymentData: {
      bookingId: string;
      amount: number;
      date: string;
    }
  ): Promise<void> {
    await this.sendNotification(userId, {
      user_id: userId,
      type: 'PAYMENT_RECEIVED',
      title: 'Paiement confirmé',
      message: `Votre paiement de ${paymentData.amount.toFixed(2)}€ pour la réservation du ${paymentData.date} a été confirmé.`,
      action_url: `/dashboard/client/bookings/${paymentData.bookingId}`,
      metadata: {
        booking_id: paymentData.bookingId,
        amount: paymentData.amount,
      },
    });
  }

  /**
   * Envoyer une notification de nouvelle proposition
   */
  static async sendProposalReceivedNotification(
    userId: string,
    proposalData: {
      proposalId: string;
      cookName: string;
      date: string;
      time: string;
      price: number;
    }
  ): Promise<void> {
    const user = await UserStore.getUserById(userId);
    if (!user) return;

    await this.sendNotification(userId, {
      user_id: userId,
      type: 'BOOKING_REQUEST',
      title: 'Nouvelle proposition reçue',
      message: `${proposalData.cookName} a proposé ses services pour le ${proposalData.date} à ${proposalData.time}.`,
      action_url: `/dashboard/client/proposals`,
      metadata: {
        proposal_id: proposalData.proposalId,
        cook_name: proposalData.cookName,
      },
    });

    // Push spécialisé
    if (user.fcm_token && PushService.isConfigured()) {
      try {
        await PushService.sendProposalReceivedPush(user.fcm_token, {
          proposalId: proposalData.proposalId,
          cookName: proposalData.cookName,
          date: proposalData.date,
        });
      } catch (error) {
        console.error('Failed to send proposal push:', error);
      }
    }
  }
}

