import { Resend } from 'resend';
import dotenv from 'dotenv';

dotenv.config();

// Lazy initialization of Resend client
let resendInstance: Resend | null = null;

function getResend(): Resend {
  if (!resendInstance) {
    if (!process.env.RESEND_API_KEY) {
      throw new Error(
        'RESEND_API_KEY is not defined in environment variables. Please add it to your .env file.'
      );
    }
    resendInstance = new Resend(process.env.RESEND_API_KEY);
  }
  return resendInstance;
}

// Email sender configuration
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'noreply@cook-us.com';
const FROM_NAME = process.env.RESEND_FROM_NAME || 'Cook US';

/**
 * Service d'envoi d'emails transactionnels via Resend
 */
export class EmailService {
  /**
   * Envoyer un email de confirmation de réservation au client
   */
  static async sendBookingConfirmationEmail(
    to: string,
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
    try {
      const resend = getResend();
      
      await resend.emails.send({
        from: `${FROM_NAME} <${FROM_EMAIL}>`,
        to: [to],
        subject: `Confirmation de réservation - ${bookingData.date}`,
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                .booking-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
                .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
                .detail-row:last-child { border-bottom: none; }
                .label { font-weight: bold; color: #666; }
                .value { color: #333; }
                .button { display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
                .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>🎉 Réservation confirmée !</h1>
                </div>
                <div class="content">
                  <p>Bonjour,</p>
                  <p>Votre réservation avec <strong>${bookingData.cookName}</strong> a été confirmée avec succès.</p>
                  
                  <div class="booking-details">
                    <div class="detail-row">
                      <span class="label">Date :</span>
                      <span class="value">${bookingData.date}</span>
                    </div>
                    <div class="detail-row">
                      <span class="label">Heure :</span>
                      <span class="value">${bookingData.time}</span>
                    </div>
                    <div class="detail-row">
                      <span class="label">Nombre de convives :</span>
                      <span class="value">${bookingData.numberOfGuests}</span>
                    </div>
                    <div class="detail-row">
                      <span class="label">Adresse :</span>
                      <span class="value">${bookingData.address}</span>
                    </div>
                    <div class="detail-row">
                      <span class="label">Montant total :</span>
                      <span class="value"><strong>${bookingData.totalPrice.toFixed(2)} €</strong></span>
                    </div>
                  </div>

                  <p>Nous vous enverrons un rappel 24h avant votre réservation.</p>
                  
                  <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard/client/bookings/${bookingData.bookingId}" class="button">
                    Voir les détails de la réservation
                  </a>
                </div>
                <div class="footer">
                  <p>Cook US - Votre chef à domicile</p>
                  <p>Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
                </div>
              </div>
            </body>
          </html>
        `,
      });
    } catch (error) {
      console.error('Error sending booking confirmation email:', error);
      throw error;
    }
  }

  /**
   * Envoyer un email de rappel de réservation
   */
  static async sendBookingReminderEmail(
    to: string,
    bookingData: {
      bookingId: string;
      cookName: string;
      date: string;
      time: string;
      reminderType: '24h' | '1h';
    }
  ): Promise<void> {
    try {
      const resend = getResend();
      
      const reminderText = bookingData.reminderType === '24h'
        ? 'demain'
        : 'dans 1 heure';
      
      await resend.emails.send({
        from: `${FROM_NAME} <${FROM_EMAIL}>`,
        to: [to],
        subject: `Rappel : Réservation ${reminderText}`,
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: #ff9800; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                .reminder-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ff9800; }
                .button { display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
                .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>⏰ Rappel de réservation</h1>
                </div>
                <div class="content">
                  <p>Bonjour,</p>
                  <p>Ceci est un rappel : votre réservation avec <strong>${bookingData.cookName}</strong> est prévue ${reminderText}.</p>
                  
                  <div class="reminder-box">
                    <p><strong>Date :</strong> ${bookingData.date}</p>
                    <p><strong>Heure :</strong> ${bookingData.time}</p>
                  </div>

                  <p>Nous avons hâte de vous accueillir !</p>
                  
                  <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard/client/bookings/${bookingData.bookingId}" class="button">
                    Voir les détails
                  </a>
                </div>
                <div class="footer">
                  <p>Cook US - Votre chef à domicile</p>
                </div>
              </div>
            </body>
          </html>
        `,
      });
    } catch (error) {
      console.error('Error sending booking reminder email:', error);
      throw error;
    }
  }

  /**
   * Envoyer un email de notification de nouvelle proposition au client
   */
  static async sendProposalReceivedEmail(
    to: string,
    proposalData: {
      proposalId: string;
      cookName: string;
      date: string;
      time: string;
      price: number;
    }
  ): Promise<void> {
    try {
      const resend = getResend();
      
      await resend.emails.send({
        from: `${FROM_NAME} <${FROM_EMAIL}>`,
        to: [to],
        subject: `Nouvelle proposition de ${proposalData.cookName}`,
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: #4caf50; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                .proposal-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
                .button { display: inline-block; padding: 12px 24px; background: #4caf50; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
                .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>✨ Nouvelle proposition reçue</h1>
                </div>
                <div class="content">
                  <p>Bonjour,</p>
                  <p><strong>${proposalData.cookName}</strong> a proposé ses services pour votre demande.</p>
                  
                  <div class="proposal-box">
                    <p><strong>Date :</strong> ${proposalData.date}</p>
                    <p><strong>Heure :</strong> ${proposalData.time}</p>
                    <p><strong>Prix :</strong> ${proposalData.price.toFixed(2)} €</p>
                  </div>

                  <p>Connectez-vous pour accepter ou refuser cette proposition.</p>
                  
                  <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard/client/proposals" class="button">
                    Voir la proposition
                  </a>
                </div>
                <div class="footer">
                  <p>Cook US - Votre chef à domicile</p>
                </div>
              </div>
            </body>
          </html>
        `,
      });
    } catch (error) {
      console.error('Error sending proposal received email:', error);
      throw error;
    }
  }

  /**
   * Envoyer un email de notification de changement de statut
   */
  static async sendStatusChangeEmail(
    to: string,
    statusData: {
      bookingId: string;
      cookName: string;
      status: string;
      date: string;
      message?: string;
    }
  ): Promise<void> {
    try {
      const resend = getResend();
      
      const statusMessages: Record<string, { subject: string; message: string }> = {
        CONFIRMED: {
          subject: 'Réservation confirmée',
          message: 'Votre réservation a été confirmée.',
        },
        CANCELLED: {
          subject: 'Réservation annulée',
          message: 'Votre réservation a été annulée.',
        },
        DONE: {
          subject: 'Réservation terminée',
          message: 'Votre réservation est terminée. N\'hésitez pas à laisser un avis !',
        },
      };

      const statusInfo = statusMessages[statusData.status] || {
        subject: 'Mise à jour de réservation',
        message: statusData.message || 'Le statut de votre réservation a changé.',
      };

      await resend.emails.send({
        from: `${FROM_NAME} <${FROM_EMAIL}>`,
        to: [to],
        subject: statusInfo.subject,
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: #2196f3; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                .status-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
                .button { display: inline-block; padding: 12px 24px; background: #2196f3; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
                .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>📧 Mise à jour de réservation</h1>
                </div>
                <div class="content">
                  <p>Bonjour,</p>
                  <p>${statusInfo.message}</p>
                  
                  <div class="status-box">
                    <p><strong>Cuisinier :</strong> ${statusData.cookName}</p>
                    <p><strong>Date :</strong> ${statusData.date}</p>
                    <p><strong>Statut :</strong> ${statusData.status}</p>
                  </div>

                  <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard/client/bookings/${statusData.bookingId}" class="button">
                    Voir les détails
                  </a>
                </div>
                <div class="footer">
                  <p>Cook US - Votre chef à domicile</p>
                </div>
              </div>
            </body>
          </html>
        `,
      });
    } catch (error) {
      console.error('Error sending status change email:', error);
      throw error;
    }
  }

  /**
   * Envoyer un email générique (pour usage personnalisé)
   */
  static async sendEmail(
    to: string | string[],
    subject: string,
    htmlContent: string,
    textContent?: string
  ): Promise<void> {
    try {
      const resend = getResend();
      
      await resend.emails.send({
        from: `${FROM_NAME} <${FROM_EMAIL}>`,
        to: Array.isArray(to) ? to : [to],
        subject,
        html: htmlContent,
        text: textContent,
      });
    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
    }
  }
}

