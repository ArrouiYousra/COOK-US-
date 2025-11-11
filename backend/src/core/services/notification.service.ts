import { NotificationStore } from '@stores/notification.store';
import { UserStore } from '@stores/user.store';
import { PushService } from './push.service';
import { SmsService } from './sms.service';
import { EmailService } from './email.service';
import { supabaseAdmin } from '@config/supabaseClient';
import type { CreateNotificationDTO } from '../../types/database.types';

/**
 * Service unifié pour envoyer des notifications
 * Gère automatiquement : Base de données + Push + Email + SMS selon les préférences utilisateur
 */
export class NotificationService {
  /**
   * Récupérer les préférences de notifications détaillées d'un utilisateur
   */
  private static async getUserNotificationPreferences(userId: string): Promise<any> {
    try {
      const { data } = await supabaseAdmin
        .from('users')
        .select('notification_preferences')
        .eq('id', userId)
        .single();

      return (data?.notification_preferences as any) || {};
    } catch (error) {
      console.warn('Failed to get notification preferences, using defaults');
      return {};
    }
  }

  /**
   * Vérifier si une notification doit être envoyée selon le type et les préférences
   */
  private static shouldSendNotification(
    notificationType: string,
    channel: 'email' | 'sms' | 'push',
    user: any,
    preferences: any
  ): boolean {
    // Vérifier d'abord les préférences globales
    if (!user.notifications_enabled) return false;

    if (channel === 'email' && !user.email_notifications) return false;
    if (channel === 'sms' && (!user.sms_notifications || !user.phone)) return false;
    if (channel === 'push' && !user.fcm_token) return false;

    // Mapper les types de notifications vers les clés de préférences
    const preferenceKeyMap: Record<string, string> = {
      'BOOKING_REQUEST': 'booking_request',
      'BOOKING_ACCEPTED': 'booking_accepted',
      'BOOKING_CONFIRMED': 'booking_confirmed',
      'BOOKING_CANCELLED': 'booking_cancelled',
      'BOOKING_REMINDER': 'booking_reminder',
      'REVIEW_RECEIVED': 'review_received',
      'MESSAGE_RECEIVED': 'message_received',
      'PAYMENT_RECEIVED': 'payment_received',
      'DISPUTE_OPENED': 'dispute_opened',
      'PROFILE_APPROVED': 'profile_approved',
      'PROFILE_REJECTED': 'profile_rejected',
      'RESERVATION_CREATED': 'reservation_created',
      'RESERVATION_ACCEPTED': 'reservation_accepted',
      'RESERVATION_REJECTED': 'reservation_rejected',
      'RESERVATION_CANCELLED': 'reservation_cancelled',
      'PROPOSAL_RECEIVED': 'proposal_received',
      'PROPOSAL_ACCEPTED': 'proposal_accepted',
      'PROPOSAL_REJECTED': 'proposal_rejected',
    };

    const preferenceKey = preferenceKeyMap[notificationType];
    if (!preferenceKey) {
      // Type inconnu, utiliser les préférences globales
      return true;
    }

    const typePreferences = preferences[preferenceKey];
    if (!typePreferences) {
      // Pas de préférences spécifiques, utiliser les préférences globales
      return true;
    }

    // Vérifier la préférence spécifique pour ce canal
    return typePreferences[channel] !== false; // true par défaut si non défini
  }

  /**
   * Envoyer une notification complète (DB + Push + Email + SMS selon préférences détaillées)
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

      // 2. Récupérer l'utilisateur et ses préférences
      const user = await UserStore.getUserById(userId);
      if (!user) {
        console.warn(`User ${userId} not found, notification created in DB only`);
        return;
      }

      const preferences = await this.getUserNotificationPreferences(userId);

      // 3. Envoyer push notification si activé
      if (
        this.shouldSendNotification(notificationData.type, 'push', user, preferences) &&
        PushService.isConfigured()
      ) {
        try {
          await PushService.sendPushNotification(
            user.fcm_token!,
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
        }
      }

      // 4. Envoyer email si activé
      if (
        this.shouldSendNotification(notificationData.type, 'email', user, preferences) &&
        EmailService
      ) {
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
        }
      }

      // 5. Envoyer SMS si activé
      if (
        this.shouldSendNotification(notificationData.type, 'sms', user, preferences) &&
        SmsService.isConfigured()
      ) {
        try {
          await SmsService.sendSms(
            user.phone!,
            `${notificationData.title || 'Notification'}: ${notificationData.message || ''}`
          );
        } catch (smsError) {
          console.error('Failed to send SMS notification:', smsError);
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
      type: 'PROPOSAL_RECEIVED',
      title: 'Nouvelle proposition reçue',
      message: `${proposalData.cookName} a proposé ses services pour le ${proposalData.date} à ${proposalData.time}.`,
      action_url: `/dashboard/client/requests/${proposalData.proposalId}/proposals`,
      metadata: {
        proposal_id: proposalData.proposalId,
        cook_name: proposalData.cookName,
      },
    });

    // Email spécialisé
    const preferences = await this.getUserNotificationPreferences(userId);
    if (this.shouldSendNotification('PROPOSAL_RECEIVED', 'email', user, preferences)) {
      try {
        await EmailService.sendProposalReceivedEmail(user.email, {
          proposalId: proposalData.proposalId,
          cookName: proposalData.cookName,
          date: proposalData.date,
          time: proposalData.time,
          price: proposalData.price,
        });
      } catch (error) {
        console.error('Failed to send proposal received email:', error);
      }
    }

    // SMS spécialisé
    if (this.shouldSendNotification('PROPOSAL_RECEIVED', 'sms', user, preferences)) {
      try {
        await SmsService.sendProposalReceivedSms(user.phone!, {
          proposalId: proposalData.proposalId,
          cookName: proposalData.cookName,
          date: proposalData.date,
        });
      } catch (error) {
        console.error('Failed to send proposal received SMS:', error);
      }
    }
  }

  // ========== NOTIFICATIONS POUR LES RÉSERVATIONS ==========

  /**
   * Envoyer une notification quand une proposition est créée (au cuisinier)
   */
  static async sendReservationCreatedNotification(
    cookUserId: string,
    reservationData: {
      reservationId: string;
      bookingId: string;
      clientName: string;
      date: string;
      proposedPrice: number;
    }
  ): Promise<void> {
    await this.sendNotification(cookUserId, {
      user_id: cookUserId,
      type: 'RESERVATION_CREATED',
      title: 'Proposition envoyée',
      message: `Votre proposition pour la demande du ${reservationData.date} a été envoyée avec succès.`,
      action_url: `/dashboard/cook/reservations`,
      metadata: {
        reservation_id: reservationData.reservationId,
        booking_id: reservationData.bookingId,
        client_name: reservationData.clientName,
      },
    });
  }

  /**
   * Envoyer une notification quand une proposition est acceptée (au cuisinier)
   */
  static async sendReservationAcceptedNotification(
    cookUserId: string,
    reservationData: {
      reservationId: string;
      bookingId: string;
      clientName: string;
      date: string;
      proposedPrice: number;
      depositAmount: number;
    }
  ): Promise<void> {
    const user = await UserStore.getUserById(cookUserId);
    if (!user) return;

    await this.sendNotification(cookUserId, {
      user_id: cookUserId,
      type: 'RESERVATION_ACCEPTED',
      title: '🎉 Proposition acceptée !',
      message: `${reservationData.clientName} a accepté votre proposition pour le ${reservationData.date}.`,
      action_url: `/dashboard/cook/bookings/${reservationData.bookingId}`,
      metadata: {
        reservation_id: reservationData.reservationId,
        booking_id: reservationData.bookingId,
        client_name: reservationData.clientName,
        price: reservationData.proposedPrice,
      },
    });

    // Email spécialisé
    const preferences = await this.getUserNotificationPreferences(cookUserId);
    if (this.shouldSendNotification('RESERVATION_ACCEPTED', 'email', user, preferences)) {
      try {
        await EmailService.sendEmail(
          user.email,
          '🎉 Votre proposition a été acceptée !',
          `
            <h1>Félicitations !</h1>
            <p>Votre proposition pour le ${reservationData.date} a été acceptée par ${reservationData.clientName}.</p>
            <p><strong>Prix total :</strong> ${reservationData.proposedPrice.toFixed(2)}€</p>
            <p><strong>Acompte à recevoir :</strong> ${reservationData.depositAmount.toFixed(2)}€ (30%)</p>
            <p><a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard/cook/bookings/${reservationData.bookingId}">Voir les détails</a></p>
          `
        );
      } catch (error) {
        console.error('Failed to send reservation accepted email:', error);
      }
    }

    // SMS spécialisé
    if (this.shouldSendNotification('RESERVATION_ACCEPTED', 'sms', user, preferences)) {
      try {
        await SmsService.sendSms(
          user.phone!,
          `🎉 Votre proposition pour le ${reservationData.date} a été acceptée par ${reservationData.clientName} ! Prix: ${reservationData.proposedPrice.toFixed(2)}€`
        );
      } catch (error) {
        console.error('Failed to send reservation accepted SMS:', error);
      }
    }
  }

  /**
   * Envoyer une notification quand une proposition est refusée (au cuisinier)
   */
  static async sendReservationRejectedNotification(
    cookUserId: string,
    reservationData: {
      reservationId: string;
      bookingId: string;
      clientName: string;
      date: string;
      rejectionReason?: string;
    }
  ): Promise<void> {
    await this.sendNotification(cookUserId, {
      user_id: cookUserId,
      type: 'RESERVATION_REJECTED',
      title: 'Proposition refusée',
      message: `${reservationData.clientName} a refusé votre proposition pour le ${reservationData.date}.${reservationData.rejectionReason ? ` Raison : ${reservationData.rejectionReason}` : ''}`,
      action_url: `/dashboard/cook/reservations`,
      metadata: {
        reservation_id: reservationData.reservationId,
        booking_id: reservationData.bookingId,
        client_name: reservationData.clientName,
        rejection_reason: reservationData.rejectionReason,
      },
    });
  }

  /**
   * Envoyer une notification quand une proposition est annulée (au client)
   */
  static async sendReservationCancelledNotification(
    clientUserId: string,
    reservationData: {
      reservationId: string;
      bookingId: string;
      cookName: string;
      date: string;
      cancellationReason?: string;
    }
  ): Promise<void> {
    await this.sendNotification(clientUserId, {
      user_id: clientUserId,
      type: 'RESERVATION_CANCELLED',
      title: 'Proposition annulée',
      message: `${reservationData.cookName} a annulé sa proposition pour le ${reservationData.date}.${reservationData.cancellationReason ? ` Raison : ${reservationData.cancellationReason}` : ''}`,
      action_url: `/dashboard/client/requests/${reservationData.bookingId}/proposals`,
      metadata: {
        reservation_id: reservationData.reservationId,
        booking_id: reservationData.bookingId,
        cook_name: reservationData.cookName,
        cancellation_reason: reservationData.cancellationReason,
      },
    });
  }

  /**
   * Envoyer une notification quand une proposition est acceptée (au client)
   */
  static async sendProposalAcceptedNotification(
    clientUserId: string,
    proposalData: {
      reservationId: string;
      bookingId: string;
      cookName: string;
      date: string;
      proposedPrice: number;
      depositAmount: number;
    }
  ): Promise<void> {
    const user = await UserStore.getUserById(clientUserId);
    if (!user) return;

    await this.sendNotification(clientUserId, {
      user_id: clientUserId,
      type: 'PROPOSAL_ACCEPTED',
      title: '🎉 Proposition acceptée !',
      message: `Vous avez accepté la proposition de ${proposalData.cookName} pour le ${proposalData.date}.`,
      action_url: `/dashboard/client/bookings/${proposalData.bookingId}`,
      metadata: {
        reservation_id: proposalData.reservationId,
        booking_id: proposalData.bookingId,
        cook_name: proposalData.cookName,
        price: proposalData.proposedPrice,
      },
    });

    // Email spécialisé
    const preferences = await this.getUserNotificationPreferences(clientUserId);
    if (this.shouldSendNotification('PROPOSAL_ACCEPTED', 'email', user, preferences)) {
      try {
        await EmailService.sendEmail(
          user.email,
          '🎉 Proposition acceptée !',
          `
            <h1>Félicitations !</h1>
            <p>Vous avez accepté la proposition de ${proposalData.cookName} pour le ${proposalData.date}.</p>
            <p><strong>Prix total :</strong> ${proposalData.proposedPrice.toFixed(2)}€</p>
            <p><strong>Acompte à payer :</strong> ${proposalData.depositAmount.toFixed(2)}€ (30% non remboursable)</p>
            <p><a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard/client/bookings/${proposalData.bookingId}">Procéder au paiement</a></p>
          `
        );
      } catch (error) {
        console.error('Failed to send proposal accepted email:', error);
      }
    }

    // SMS spécialisé
    if (this.shouldSendNotification('PROPOSAL_ACCEPTED', 'sms', user, preferences)) {
      try {
        await SmsService.sendSms(
          user.phone!,
          `🎉 Vous avez accepté la proposition de ${proposalData.cookName} pour le ${proposalData.date}. Acompte: ${proposalData.depositAmount.toFixed(2)}€`
        );
      } catch (error) {
        console.error('Failed to send proposal accepted SMS:', error);
      }
    }
  }

  /**
   * Envoyer une notification quand une proposition est refusée (au cuisinier)
   */
  static async sendProposalRejectedNotification(
    cookUserId: string,
    proposalData: {
      reservationId: string;
      bookingId: string;
      clientName: string;
      date: string;
      rejectionReason?: string;
    }
  ): Promise<void> {
    await this.sendNotification(cookUserId, {
      user_id: cookUserId,
      type: 'PROPOSAL_REJECTED',
      title: 'Proposition refusée',
      message: `${proposalData.clientName} a refusé votre proposition pour le ${proposalData.date}.${proposalData.rejectionReason ? ` Raison : ${proposalData.rejectionReason}` : ''}`,
      action_url: `/dashboard/cook/reservations`,
      metadata: {
        reservation_id: proposalData.reservationId,
        booking_id: proposalData.bookingId,
        client_name: proposalData.clientName,
        rejection_reason: proposalData.rejectionReason,
      },
    });
  }
}
