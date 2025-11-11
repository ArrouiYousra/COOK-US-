import { type Response } from "express";
import { type AuthRequest } from "@core/middleware";
import { StripeService } from "@core/services/stripe.service";
import { BookingStore } from "@stores/booking.store";
import { UserStore } from "@stores/user.store";
import { ProfileStore } from "@stores/profile.store";
import { supabaseAdmin } from "@config/supabaseClient";

// ============ PAYMENTS ============

export const createPaymentIntent = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: "Unauthorized",
        message: "User not authenticated",
      });
      return;
    }

    // Only clients can create payment intents
    const user = await UserStore.getUserById(req.user.id);
    if (!user || user.role !== "CLIENT") {
      res.status(403).json({
        error: "Forbidden",
        message: "Only clients can create payment intents",
      });
      return;
    }

    const { booking_id } = req.body;
    if (!booking_id) {
      res.status(400).json({
        error: "Bad Request",
        message: "booking_id is required",
      });
      return;
    }

    // Get booking
    const booking = await BookingStore.getBookingById(booking_id);
    if (!booking) {
      res.status(404).json({
        error: "Not Found",
        message: "Booking not found",
      });
      return;
    }

    // Verify booking belongs to user
    const clientProfile = await ProfileStore.getClientProfileByUserId(
      req.user.id,
    );
    if (!clientProfile || clientProfile.id !== booking.client_profile_id) {
      res.status(403).json({
        error: "Forbidden",
        message: "You can only create payment intents for your own bookings",
      });
      return;
    }

    // Check if booking already has a payment intent
    if (booking.payment_intent_id) {
      const existingIntent = await StripeService.getPaymentIntent(
        booking.payment_intent_id,
      );
      if (existingIntent.status === "succeeded") {
        res.status(400).json({
          error: "Bad Request",
          message: "This booking is already paid",
        });
        return;
      }
    }

    // Calculate amounts
    if (!booking.total_price) {
      res.status(400).json({
        error: "Bad Request",
        message: "Booking total price is not calculated",
      });
      return;
    }

    const platformFee = StripeService.calculatePlatformFee(booking.total_price);
    const cookEarnings = StripeService.calculateCookEarnings(
      booking.total_price,
      platformFee,
    );

    // Create payment intent
    const paymentIntent = await StripeService.createPaymentIntent(
      booking.total_price,
      "eur",
      {
        booking_id: booking.id,
        client_id: req.user.id,
        cook_profile_id: booking.cook_profile_id || "",
      },
    );

    // Update booking with payment intent
    await supabaseAdmin
      .from("bookings")
      .update({
        payment_intent_id: paymentIntent.id,
        payment_status: paymentIntent.status,
        platform_fee: platformFee,
        cook_earnings: cookEarnings,
      })
      .eq("id", booking_id);

    res.status(200).json({
      message: "Payment intent created successfully",
      paymentIntent: {
        id: paymentIntent.id,
        client_secret: paymentIntent.client_secret,
        amount: paymentIntent.amount / 100, // Convert from cents
        currency: paymentIntent.currency,
        status: paymentIntent.status,
      },
    });
  } catch (error) {
    console.error("Create payment intent error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to create payment intent",
      details: errorMessage,
    });
  }
};

export const getPaymentIntent = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: "Unauthorized",
        message: "User not authenticated",
      });
      return;
    }

    const { paymentIntentId } = req.params;
    if (!paymentIntentId) {
      res.status(400).json({
        error: "Bad Request",
        message: "Payment intent ID is required",
      });
      return;
    }

    const paymentIntent = await StripeService.getPaymentIntent(paymentIntentId);

    // Verify user has access (client or cook of the booking)
    const booking = await BookingStore.getBookingById(
      paymentIntent.metadata.booking_id || "",
    );
    if (!booking) {
      res.status(404).json({
        error: "Not Found",
        message: "Booking not found",
      });
      return;
    }

    const clientProfile = await ProfileStore.getClientProfileByUserId(
      req.user.id,
    );
    const cookProfile = await ProfileStore.getCookProfileByUserId(req.user.id);
    const user = await UserStore.getUserById(req.user.id);

    const hasAccess =
      (clientProfile && clientProfile.id === booking.client_profile_id) ||
      (cookProfile && cookProfile.id === booking.cook_profile_id) ||
      user?.role === "ADMIN";

    if (!hasAccess) {
      res.status(403).json({
        error: "Forbidden",
        message: "You do not have access to this payment intent",
      });
      return;
    }

    res.status(200).json({
      paymentIntent: {
        id: paymentIntent.id,
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency,
        status: paymentIntent.status,
        created: paymentIntent.created,
      },
    });
  } catch (error) {
    console.error("Get payment intent error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to get payment intent",
      details: errorMessage,
    });
  }
};

export const createRefund = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: "Unauthorized",
        message: "User not authenticated",
      });
      return;
    }

    // Only admins can create refunds (or through dispute resolution)
    const user = await UserStore.getUserById(req.user.id);
    if (!user || user.role !== "ADMIN") {
      res.status(403).json({
        error: "Forbidden",
        message: "Only admins can create refunds",
      });
      return;
    }

    const { payment_intent_id, amount, reason } = req.body;
    if (!payment_intent_id) {
      res.status(400).json({
        error: "Bad Request",
        message: "payment_intent_id is required",
      });
      return;
    }

    // Get booking
    const paymentIntent =
      await StripeService.getPaymentIntent(payment_intent_id);
    const booking = await BookingStore.getBookingById(
      paymentIntent.metadata.booking_id || "",
    );

    if (!booking) {
      res.status(404).json({
        error: "Not Found",
        message: "Booking not found",
      });
      return;
    }

    // Create refund
    const refund = await StripeService.createRefund(
      payment_intent_id,
      amount, // Amount in euros (will be converted to cents)
      reason,
    );

    // Update booking
    const refundAmount = refund.amount / 100; // Convert from cents
    await supabaseAdmin
      .from("bookings")
      .update({
        refund_amount: refundAmount,
        refunded_at: new Date().toISOString(),
      })
      .eq("id", booking.id);

    res.status(200).json({
      message: "Refund created successfully",
      refund: {
        id: refund.id,
        amount: refundAmount,
        currency: refund.currency,
        status: refund.status,
        reason: refund.reason,
      },
    });
  } catch (error) {
    console.error("Create refund error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to create refund",
      details: errorMessage,
    });
  }
};

export const getRefund = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: "Unauthorized",
        message: "User not authenticated",
      });
      return;
    }

    const { refundId } = req.params;
    if (!refundId) {
      res.status(400).json({
        error: "Bad Request",
        message: "Refund ID is required",
      });
      return;
    }

    // Only admins can view refunds
    const user = await UserStore.getUserById(req.user.id);
    if (!user || user.role !== "ADMIN") {
      res.status(403).json({
        error: "Forbidden",
        message: "Only admins can view refunds",
      });
      return;
    }

    const refund = await StripeService.getRefund(refundId);

    res.status(200).json({
      refund: {
        id: refund.id,
        amount: refund.amount / 100,
        currency: refund.currency,
        status: refund.status,
        reason: refund.reason,
        created: refund.created,
      },
    });
  } catch (error) {
    console.error("Get refund error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to get refund",
      details: errorMessage,
    });
  }
};
