import twilio from 'twilio';
import dotenv from 'dotenv';

dotenv.config();

// Lazy initialization of Twilio client
let twilioClient: twilio.Twilio | null = null;

function getTwilioClient(): twilio.Twilio {
  if (!twilioClient) {
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
      throw new Error(
        'TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN must be defined in environment variables. Please add them to your .env file.'
      );
    }
    twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  }
  return twilioClient;
}

// Phone number configuration
const FROM_PHONE = process.env.TWILIO_PHONE_NUMBER;

if (!FROM_PHONE) {
  console.warn(
    'TWILIO_PHONE_NUMBER is not defined. SMS sending will fail. Please add it to your .env file.'
  );
}

/**
 * Service d'envoi de SMS via Twilio
 */
export class SmsService {
  /**
   * Envoyer un SMS
   * @param to - Numéro de téléphone du destinataire (format international, ex: +33612345678)
   * @param message - Message à envoyer
   */
  static async sendSms(to: string, message: string): Promise<void> {
    try {
      if (!FROM_PHONE) {
        throw new Error('TWILIO_PHONE_NUMBER is not configured');
      }

      const client = getTwilioClient();

      // Normaliser le numéro de téléphone (ajouter + si absent)
      const normalizedTo = to.startsWith('+') ? to : `+${to}`;

      const result = await client.messages.create({
        body: message,
        from: FROM_PHONE,
        to: normalizedTo,
      });

      console.log(`SMS sent successfully. SID: ${result.sid}`);
    } catch (error) {
      console.error('Error sending SMS:', error);
      throw new Error(
        `Failed to send SMS: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Envoyer un SMS de confirmation de réservation
   */
  static async sendBookingConfirmationSms(
    phoneNumber: string,
    bookingData: {
      bookingId: string;
      cookName: string;
      date: string;
      time: string;
    }
  ): Promise<void> {
    const message = `✅ Réservation confirmée avec ${bookingData.cookName} le ${bookingData.date} à ${bookingData.time}. Détails: ${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard/client/bookings/${bookingData.bookingId}`;
    await this.sendSms(phoneNumber, message);
  }

  /**
   * Envoyer un SMS de rappel de réservation
   */
  static async sendBookingReminderSms(
    phoneNumber: string,
    bookingData: {
      bookingId: string;
      cookName: string;
      date: string;
      time: string;
      reminderType: '24h' | '1h';
    }
  ): Promise<void> {
    const reminderText = bookingData.reminderType === '24h' ? 'demain' : 'dans 1 heure';
    const message = `⏰ Rappel: Votre réservation avec ${bookingData.cookName} est prévue ${reminderText} (${bookingData.date} à ${bookingData.time}).`;
    await this.sendSms(phoneNumber, message);
  }

  /**
   * Envoyer un SMS de notification de nouvelle proposition
   */
  static async sendProposalReceivedSms(
    phoneNumber: string,
    proposalData: {
      proposalId: string;
      cookName: string;
      date: string;
    }
  ): Promise<void> {
    const message = `✨ Nouvelle proposition reçue de ${proposalData.cookName} pour le ${proposalData.date}. Connectez-vous pour voir les détails.`;
    await this.sendSms(phoneNumber, message);
  }

  /**
   * Envoyer un SMS de notification de changement de statut
   */
  static async sendStatusChangeSms(
    phoneNumber: string,
    statusData: {
      bookingId: string;
      status: string;
      message?: string;
    }
  ): Promise<void> {
    const statusMessages: Record<string, string> = {
      CONFIRMED: '✅ Votre réservation a été confirmée.',
      CANCELLED: '❌ Votre réservation a été annulée.',
      DONE: '🎉 Votre réservation est terminée. N\'hésitez pas à laisser un avis !',
    };

    const message = statusMessages[statusData.status] || statusData.message || 'Le statut de votre réservation a changé.';
    await this.sendSms(phoneNumber, message);
  }

  /**
   * Vérifier si Twilio est configuré
   */
  static isConfigured(): boolean {
    return !!(
      process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_AUTH_TOKEN &&
      process.env.TWILIO_PHONE_NUMBER
    );
  }
}

