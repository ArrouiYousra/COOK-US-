import { type Request, type Response } from 'express';
import { StripeService } from '@core/services/stripe.service';
import { BookingStore } from '@stores/booking.store';
import { TransactionStore } from '@stores/transaction.store';
import { supabaseAdmin } from '@config/supabaseClient';

/**
 * Handle Stripe webhook events
 * This endpoint should be configured in Stripe Dashboard:
 * https://dashboard.stripe.com/webhooks
 */
export const handleStripeWebhook = async (req: Request, res: Response): Promise<void> => {
  const sig = req.headers['stripe-signature'];

  if (!sig) {
    res.status(400).json({
      error: 'Bad Request',
      message: 'Missing stripe-signature header',
    });
    return;
  }

  let event;

  try {
    // Verify webhook signature
    event = StripeService.verifyWebhookSignature(req.body, sig as string);
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    res.status(400).json({
      error: 'Bad Request',
      message: 'Webhook signature verification failed',
    });
    return;
  }

  // Handle the event
  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object as any);
        break;

      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object as any);
        break;

      case 'payment_intent.canceled':
        await handlePaymentIntentCanceled(event.data.object as any);
        break;

      case 'charge.refunded':
        await handleChargeRefunded(event.data.object as any);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    // Return a 200 response to acknowledge receipt of the event
    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Error handling webhook:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to handle webhook',
    });
  }
};

/**
 * Handle successful payment
 */
async function handlePaymentIntentSucceeded(paymentIntent: any): Promise<void> {
  const bookingId = paymentIntent.metadata?.booking_id;

  if (!bookingId) {
    console.error('Payment intent missing booking_id in metadata');
    return;
  }

  const booking = await BookingStore.getBookingById(bookingId);
  if (!booking) {
    console.error(`Booking not found: ${bookingId}`);
    return;
  }

  // Update booking status
  await supabaseAdmin
    .from('bookings')
    .update({
      payment_status: 'succeeded',
      paid_at: new Date().toISOString(),
      status: booking.status === 'PENDING' ? 'CONFIRMED' : booking.status,
    })
    .eq('id', bookingId);

  // Create transaction record: Client pays to platform (not directly to cook)
  try {
    const clientUserId = paymentIntent.metadata?.client_id;
    
    // Transaction: Client → Platform
    await TransactionStore.createTransaction({
      type: 'BOOKING_PAYMENT',
      booking_id: bookingId,
      from_user_id: clientUserId || undefined,
      to_user_id: undefined, // Platform receives payment, no to_user_id
      amount: paymentIntent.amount / 100, // Convert from cents
      currency: paymentIntent.currency.toUpperCase(),
      stripe_payment_id: paymentIntent.id,
      description: `Payment for booking ${bookingId}`,
      metadata: {
        booking_id: bookingId,
        payment_intent_id: paymentIntent.id,
      },
    });
    
    // Create platform fee transaction if applicable
    if (booking.platform_fee && booking.platform_fee > 0) {
      await TransactionStore.createTransaction({
        type: 'PLATFORM_FEE',
        booking_id: bookingId,
        from_user_id: clientUserId || undefined,
        to_user_id: undefined, // Platform fee
        amount: booking.platform_fee,
        currency: paymentIntent.currency.toUpperCase(),
        stripe_payment_id: paymentIntent.id,
        description: `Platform fee for booking ${bookingId}`,
        metadata: {
          booking_id: bookingId,
        },
      });
    }
  } catch (transactionError) {
    console.error('Failed to create transaction record:', transactionError);
    // Continue even if transaction creation fails
  }

  // Create notification for client
  await supabaseAdmin.from('notifications').insert({
    user_id: paymentIntent.metadata?.client_id || '',
    type: 'PAYMENT_RECEIVED',
    title: 'Paiement confirmé',
    message: `Votre paiement pour la réservation du ${booking.booking_date} a été confirmé.`,
    action_url: `/bookings/${bookingId}`,
    metadata: {
      booking_id: bookingId,
      payment_intent_id: paymentIntent.id,
    },
  });

  // Create notification for cook
  if (booking.cook_profile_id) {
    const { data: cookProfile } = await supabaseAdmin
      .from('cook_profiles')
      .select('user_id')
      .eq('id', booking.cook_profile_id)
      .single();

    if (cookProfile) {
      await supabaseAdmin.from('notifications').insert({
        user_id: cookProfile.user_id,
        type: 'PAYMENT_RECEIVED',
        title: 'Paiement reçu',
        message: `Un paiement a été reçu pour votre réservation du ${booking.booking_date}.`,
        action_url: `/bookings/${bookingId}`,
        metadata: {
          booking_id: bookingId,
          payment_intent_id: paymentIntent.id,
        },
      });
    }
  }

  console.log(`Payment succeeded for booking: ${bookingId}`);
}

/**
 * Handle failed payment
 */
async function handlePaymentIntentFailed(paymentIntent: any): Promise<void> {
  const bookingId = paymentIntent.metadata?.booking_id;

  if (!bookingId) {
    console.error('Payment intent missing booking_id in metadata');
    return;
  }

  // Update booking payment status
  await supabaseAdmin
    .from('bookings')
    .update({
      payment_status: 'failed',
    })
    .eq('id', bookingId);

  // Create notification for client
  await supabaseAdmin.from('notifications').insert({
    user_id: paymentIntent.metadata?.client_id || '',
    type: 'SYSTEM',
    title: 'Échec du paiement',
    message: `Le paiement pour votre réservation a échoué. Veuillez réessayer.`,
    action_url: `/bookings/${bookingId}`,
    metadata: {
      booking_id: bookingId,
      payment_intent_id: paymentIntent.id,
    },
  });

  console.log(`Payment failed for booking: ${bookingId}`);
}

/**
 * Handle canceled payment
 */
async function handlePaymentIntentCanceled(paymentIntent: any): Promise<void> {
  const bookingId = paymentIntent.metadata?.booking_id;

  if (!bookingId) {
    console.error('Payment intent missing booking_id in metadata');
    return;
  }

  // Update booking payment status
  await supabaseAdmin
    .from('bookings')
    .update({
      payment_status: 'canceled',
    })
    .eq('id', bookingId);

  console.log(`Payment canceled for booking: ${bookingId}`);
}

/**
 * Handle refund
 */
async function handleChargeRefunded(charge: any): Promise<void> {
  const paymentIntentId = charge.payment_intent;

  if (!paymentIntentId) {
    console.error('Charge missing payment_intent');
    return;
  }

  // Get payment intent to find booking
  const paymentIntent = await StripeService.getPaymentIntent(paymentIntentId);
  const bookingId = paymentIntent.metadata?.booking_id;

  if (!bookingId) {
    console.error('Payment intent missing booking_id in metadata');
    return;
  }

  // Update booking with refund info
  const refundAmount = charge.amount_refunded / 100; // Convert from cents
  await supabaseAdmin
    .from('bookings')
    .update({
      refund_amount: refundAmount,
      refunded_at: new Date().toISOString(),
    })
    .eq('id', bookingId);

  // Create transaction record for refund
  try {
    const clientUserId = paymentIntent.metadata?.client_id;
    const cookUserId = paymentIntent.metadata?.cook_id;
    
    await TransactionStore.createTransaction({
      type: 'REFUND',
      booking_id: bookingId,
      from_user_id: cookUserId || undefined,
      to_user_id: clientUserId || undefined,
      amount: refundAmount,
      currency: paymentIntent.currency.toUpperCase(),
      stripe_payment_id: paymentIntent.id,
      stripe_refund_id: charge.id,
      description: `Refund for booking ${bookingId}`,
      metadata: {
        booking_id: bookingId,
        refund_amount: refundAmount,
        charge_id: charge.id,
      },
    });
  } catch (transactionError) {
    console.error('Failed to create refund transaction record:', transactionError);
    // Continue even if transaction creation fails
  }

  // Create notification for client
  await supabaseAdmin.from('notifications').insert({
    user_id: paymentIntent.metadata?.client_id || '',
    type: 'SYSTEM',
    title: 'Remboursement effectué',
    message: `Un remboursement de ${refundAmount}€ a été effectué pour votre réservation.`,
    action_url: `/bookings/${bookingId}`,
    metadata: {
      booking_id: bookingId,
      refund_amount: refundAmount,
    },
  });

  console.log(`Refund processed for booking: ${bookingId}`);
}

