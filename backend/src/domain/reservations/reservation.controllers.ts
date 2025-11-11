import { type Response } from 'express';
import { type AuthRequest } from '@core/middleware';
import { ReservationStore } from '@stores/reservation.store';
import { UserStore } from '@stores/user.store';
import { ProfileStore } from '@stores/profile.store';
import { BookingStore } from '@stores/booking.store';
import { NotificationService } from '@core/services/notification.service';
import { supabaseAdmin } from '@config/supabaseClient';
import type { CreateReservationDTO } from '../../types/database.types';

/**
 * Créer une proposition (réservation) sur une demande publique
 * POST /api/reservations
 */
export const createReservation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated',
      });
      return;
    }

    // Seuls les cuisiniers peuvent créer des propositions
    const user = await UserStore.getUserById(req.user.id);
    if (!user || user.role !== 'COOK') {
      res.status(403).json({
        error: 'Forbidden',
        message: 'Only cooks can create reservations',
      });
      return;
    }

    // Récupérer le profil cuisinier
    const cookProfile = await ProfileStore.getCookProfileByUserId(req.user.id);
    if (!cookProfile) {
      res.status(404).json({
        error: 'Not Found',
        message: 'Cook profile not found',
      });
      return;
    }

    // Valider les données
    const reservationData: CreateReservationDTO = req.body;
    if (!reservationData.booking_id || !reservationData.proposed_price) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'booking_id and proposed_price are required',
      });
      return;
    }

    // Créer la proposition
    const reservation = await ReservationStore.createReservation(
      cookProfile.id,
      reservationData
    );

    // Récupérer les informations du booking pour les notifications
    const booking = await BookingStore.getBookingById(reservationData.booking_id);
    if (booking) {
      // Récupérer le client pour la notification
      const { data: clientProfile } = await supabaseAdmin
        .from('client_profiles')
        .select('user_id')
        .eq('id', booking.client_profile_id)
        .single();

      if (clientProfile) {
        const clientUser = await UserStore.getUserById(clientProfile.user_id);
        const bookingDate = booking.booking_date ? new Date(booking.booking_date).toLocaleDateString('fr-FR') : 'date non spécifiée';

        // Notifier le client qu'une nouvelle proposition a été reçue
        if (reservation.cook && reservation.cook.user) {
          const cookName = `${reservation.cook.user.first_name} ${reservation.cook.user.last_name}`.trim();
          await NotificationService.sendProposalReceivedNotification(clientProfile.user_id, {
            proposalId: reservation.id,
            cookName,
            date: bookingDate,
            time: booking.start_time || '',
            price: reservation.proposed_price,
          }).catch(err => console.error('Failed to send proposal received notification:', err));
        }

        // Notifier le cuisinier que sa proposition a été créée
        await NotificationService.sendReservationCreatedNotification(req.user.id, {
          reservationId: reservation.id,
          bookingId: reservationData.booking_id,
          clientName: clientUser ? `${clientUser.first_name} ${clientUser.last_name}`.trim() : 'Client',
          date: bookingDate,
          proposedPrice: reservation.proposed_price,
        }).catch(err => console.error('Failed to send reservation created notification:', err));
      }
    }

    res.status(201).json({
      message: 'Reservation created successfully',
      reservation,
    });
  } catch (error) {
    console.error('Create reservation error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to create reservation';
    res.status(500).json({
      error: 'Internal Server Error',
      message: errorMessage,
    });
  }
};

/**
 * Récupérer les propositions pour une demande publique
 * GET /api/reservations/booking/:bookingId
 */
export const getReservationsByBookingId = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated',
      });
      return;
    }

    const { bookingId } = req.params;
    const { includeExpired } = req.query;

    if (!bookingId) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'bookingId is required',
      });
      return;
    }

    // Vérifier que l'utilisateur a le droit de voir ces propositions
    // (soit le client propriétaire, soit un cuisinier qui a proposé)
    const user = await UserStore.getUserById(req.user.id);
    if (!user) {
      res.status(404).json({
        error: 'Not Found',
        message: 'User not found',
      });
      return;
    }

    // Récupérer les propositions
    const reservations = await ReservationStore.getReservationsByBookingId(
      bookingId,
      includeExpired === 'true'
    );

    // Récupérer les statistiques
    const stats = await ReservationStore.getReservationStats(bookingId);

    res.status(200).json({
      reservations,
      stats,
      count: reservations.length,
    });
  } catch (error) {
    console.error('Get reservations by booking error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to get reservations';
    res.status(500).json({
      error: 'Internal Server Error',
      message: errorMessage,
    });
  }
};

/**
 * Récupérer les propositions d'un cuisinier
 * GET /api/reservations/my-proposals
 */
export const getMyReservations = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated',
      });
      return;
    }

    // Seuls les cuisiniers peuvent voir leurs propositions
    const user = await UserStore.getUserById(req.user.id);
    if (!user || user.role !== 'COOK') {
      res.status(403).json({
        error: 'Forbidden',
        message: 'Only cooks can view their reservations',
      });
      return;
    }

    // Récupérer le profil cuisinier
    const cookProfile = await ProfileStore.getCookProfileByUserId(req.user.id);
    if (!cookProfile) {
      res.status(404).json({
        error: 'Not Found',
        message: 'Cook profile not found',
      });
      return;
    }

    const { status } = req.query;

    // Récupérer les propositions
    const reservations = await ReservationStore.getCookReservations(
      cookProfile.id,
      status as any
    );

    res.status(200).json({
      reservations,
      count: reservations.length,
    });
  } catch (error) {
    console.error('Get my reservations error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to get reservations';
    res.status(500).json({
      error: 'Internal Server Error',
      message: errorMessage,
    });
  }
};

/**
 * Accepter une proposition (par le client)
 * PUT /api/reservations/:reservationId/accept
 */
export const acceptReservation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated',
      });
      return;
    }

    // Seuls les clients peuvent accepter des propositions
    const user = await UserStore.getUserById(req.user.id);
    if (!user || user.role !== 'CLIENT') {
      res.status(403).json({
        error: 'Forbidden',
        message: 'Only clients can accept reservations',
      });
      return;
    }

    const { reservationId } = req.params;
    if (!reservationId) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'reservationId is required',
      });
      return;
    }

    // Accepter la proposition
    const reservation = await ReservationStore.acceptReservation(
      reservationId,
      req.user.id
    );

    // Calculer les montants pour le paiement en 2 temps
    const depositAmount = reservation.proposed_price * 0.3; // 30%
    const remainingAmount = reservation.proposed_price * 0.7; // 70%

    // Mettre à jour le booking avec les montants
    await supabaseAdmin
      .from('bookings')
      .update({
        deposit_amount: depositAmount,
        remaining_amount: remainingAmount,
        total_price: reservation.proposed_price,
      })
      .eq('id', reservation.booking_id);

    // Récupérer les informations pour les notifications
    const booking = await BookingStore.getBookingById(reservation.booking_id);
    if (booking && reservation.cook) {
      const bookingDate = booking.booking_date ? new Date(booking.booking_date).toLocaleDateString('fr-FR') : 'date non spécifiée';
      const cookName = reservation.cook.user ? `${reservation.cook.user.first_name} ${reservation.cook.user.last_name}`.trim() : 'Cuisinier';

      // Récupérer le user_id du cuisinier
      const { data: cookProfileData } = await supabaseAdmin
        .from('cook_profiles')
        .select('user_id')
        .eq('id', reservation.cook_profile_id)
        .single();

      // Notifier le client que sa proposition a été acceptée
      await NotificationService.sendProposalAcceptedNotification(req.user.id, {
        reservationId: reservation.id,
        bookingId: reservation.booking_id,
        cookName,
        date: bookingDate,
        proposedPrice: reservation.proposed_price,
        depositAmount,
      }).catch(err => console.error('Failed to send proposal accepted notification:', err));

      // Notifier le cuisinier que sa proposition a été acceptée
      if (cookProfileData) {
        const clientName = `${user.first_name} ${user.last_name}`.trim();
        await NotificationService.sendReservationAcceptedNotification(cookProfileData.user_id, {
          reservationId: reservation.id,
          bookingId: reservation.booking_id,
          clientName,
          date: bookingDate,
          proposedPrice: reservation.proposed_price,
          depositAmount,
        }).catch(err => console.error('Failed to send reservation accepted notification:', err));
      }
    }

    res.status(200).json({
      message: 'Reservation accepted successfully',
      reservation,
      depositAmount,
      remainingAmount,
    });
  } catch (error) {
    console.error('Accept reservation error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to accept reservation';
    
    // Gérer les erreurs spécifiques
    if (errorMessage.includes('introuvable') || errorMessage.includes('ne peut plus')) {
      res.status(400).json({
        error: 'Bad Request',
        message: errorMessage,
      });
      return;
    }

    if (errorMessage.includes('autorisé')) {
      res.status(403).json({
        error: 'Forbidden',
        message: errorMessage,
      });
      return;
    }

    res.status(500).json({
      error: 'Internal Server Error',
      message: errorMessage,
    });
  }
};

/**
 * Refuser une proposition (par le client)
 * PUT /api/reservations/:reservationId/reject
 */
export const rejectReservation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated',
      });
      return;
    }

    // Seuls les clients peuvent refuser des propositions
    const user = await UserStore.getUserById(req.user.id);
    if (!user || user.role !== 'CLIENT') {
      res.status(403).json({
        error: 'Forbidden',
        message: 'Only clients can reject reservations',
      });
      return;
    }

    const { reservationId } = req.params;
    const { rejection_reason } = req.body;

    if (!reservationId) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'reservationId is required',
      });
      return;
    }

    // Refuser la proposition
    const reservation = await ReservationStore.rejectReservation(
      reservationId,
      req.user.id,
      rejection_reason
    );

    // Récupérer les informations pour les notifications
    const booking = await BookingStore.getBookingById(reservation.booking_id);
    if (booking && reservation.cook) {
      const bookingDate = booking.booking_date ? new Date(booking.booking_date).toLocaleDateString('fr-FR') : 'date non spécifiée';
      const clientName = `${user.first_name} ${user.last_name}`.trim();

      // Récupérer le user_id du cuisinier
      const { data: cookProfileData } = await supabaseAdmin
        .from('cook_profiles')
        .select('user_id')
        .eq('id', reservation.cook_profile_id)
        .single();

      // Notifier le cuisinier que sa proposition a été refusée
      if (cookProfileData) {
        await NotificationService.sendProposalRejectedNotification(cookProfileData.user_id, {
          reservationId: reservation.id,
          bookingId: reservation.booking_id,
          clientName,
          date: bookingDate,
          rejectionReason: rejection_reason,
        }).catch(err => console.error('Failed to send proposal rejected notification:', err));
      }
    }

    res.status(200).json({
      message: 'Reservation rejected successfully',
      reservation,
    });
  } catch (error) {
    console.error('Reject reservation error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to reject reservation';
    
    // Gérer les erreurs spécifiques
    if (errorMessage.includes('introuvable') || errorMessage.includes('ne peut plus')) {
      res.status(400).json({
        error: 'Bad Request',
        message: errorMessage,
      });
      return;
    }

    if (errorMessage.includes('autorisé')) {
      res.status(403).json({
        error: 'Forbidden',
        message: errorMessage,
      });
      return;
    }

    res.status(500).json({
      error: 'Internal Server Error',
      message: errorMessage,
    });
  }
};

/**
 * Annuler une proposition (par le cuisinier)
 * PUT /api/reservations/:reservationId/cancel
 */
export const cancelReservation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated',
      });
      return;
    }

    // Seuls les cuisiniers peuvent annuler leurs propositions
    const user = await UserStore.getUserById(req.user.id);
    if (!user || user.role !== 'COOK') {
      res.status(403).json({
        error: 'Forbidden',
        message: 'Only cooks can cancel their reservations',
      });
      return;
    }

    // Récupérer le profil cuisinier
    const cookProfile = await ProfileStore.getCookProfileByUserId(req.user.id);
    if (!cookProfile) {
      res.status(404).json({
        error: 'Not Found',
        message: 'Cook profile not found',
      });
      return;
    }

    const { reservationId } = req.params;
    const { cancellation_reason } = req.body;

    if (!reservationId) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'reservationId is required',
      });
      return;
    }

    // Annuler la proposition
    const reservation = await ReservationStore.cancelReservation(
      reservationId,
      cookProfile.id,
      cancellation_reason
    );

    // Récupérer les informations pour les notifications
    const booking = await BookingStore.getBookingById(reservation.booking_id);
    if (booking && reservation.cook) {
      const bookingDate = booking.booking_date ? new Date(booking.booking_date).toLocaleDateString('fr-FR') : 'date non spécifiée';
      const cookName = reservation.cook.user ? `${reservation.cook.user.first_name} ${reservation.cook.user.last_name}`.trim() : 'Cuisinier';

      // Récupérer le user_id du client
      const { data: clientProfile } = await supabaseAdmin
        .from('client_profiles')
        .select('user_id')
        .eq('id', booking.client_profile_id)
        .single();

      // Notifier le client que la proposition a été annulée
      if (clientProfile) {
        await NotificationService.sendReservationCancelledNotification(clientProfile.user_id, {
          reservationId: reservation.id,
          bookingId: reservation.booking_id,
          cookName,
          date: bookingDate,
          cancellationReason: cancellation_reason,
        }).catch(err => console.error('Failed to send reservation cancelled notification:', err));
      }
    }

    res.status(200).json({
      message: 'Reservation cancelled successfully',
      reservation,
    });
  } catch (error) {
    console.error('Cancel reservation error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to cancel reservation';
    
    // Gérer les erreurs spécifiques
    if (errorMessage.includes('introuvable') || errorMessage.includes('ne peut plus') || errorMessage.includes('déjà')) {
      res.status(400).json({
        error: 'Bad Request',
        message: errorMessage,
      });
      return;
    }

    if (errorMessage.includes('autorisé')) {
      res.status(403).json({
        error: 'Forbidden',
        message: errorMessage,
      });
      return;
    }

    res.status(500).json({
      error: 'Internal Server Error',
      message: errorMessage,
    });
  }
};

/**
 * Récupérer une proposition par son ID
 * GET /api/reservations/:reservationId
 */
export const getReservationById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated',
      });
      return;
    }

    const { reservationId } = req.params;
    if (!reservationId) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'reservationId is required',
      });
      return;
    }

    // Récupérer la proposition
    const reservation = await ReservationStore.getReservationById(reservationId);
    if (!reservation) {
      res.status(404).json({
        error: 'Not Found',
        message: 'Reservation not found',
      });
      return;
    }

    res.status(200).json({
      reservation,
    });
  } catch (error) {
    console.error('Get reservation by id error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to get reservation';
    res.status(500).json({
      error: 'Internal Server Error',
      message: errorMessage,
    });
  }
};
