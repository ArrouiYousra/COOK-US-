import { type Response } from "express";
import { type AuthRequest } from "@core/middleware";
import { UserStore } from "@stores/user.store";
import { PaymentMethodStore } from "@stores/payment-method.store";
import { StripeService } from "@core/services/stripe.service";
import { z } from "zod";

const confirmPaymentMethodSchema = z.object({
  setupIntentId: z.string().min(1, "Setup Intent ID is required"),
  paymentMethodId: z.string().min(1, "Payment Method ID is required"),
  isDefault: z.boolean().optional(),
});

/**
 * Get all payment methods for the authenticated user
 */
export const getMyPaymentMethods = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    if (!req.user) {
      res
        .status(401)
        .json({ error: "Unauthorized", message: "User not authenticated" });
      return;
    }

    const paymentMethods = await PaymentMethodStore.getPaymentMethodsByUserId(
      req.user.id,
    );

    res.status(200).json({
      paymentMethods: paymentMethods.map((pm) => ({
        id: pm.id,
        type: pm.type,
        last4: pm.last4,
        brand: pm.brand,
        expiry_month: pm.expiry_month,
        expiry_year: pm.expiry_year,
        is_default: pm.is_default,
        stripe_payment_method_id: pm.stripe_payment_method_id,
      })),
      count: paymentMethods.length,
    });
  } catch (error) {
    console.error("Get payment methods error:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to get payment methods",
      details: error instanceof Error ? error.message : String(error),
    });
  }
};

/**
 * Create a Setup Intent for adding a new payment method
 */
export const createSetupIntent = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    if (!req.user) {
      res
        .status(401)
        .json({ error: "Unauthorized", message: "User not authenticated" });
      return;
    }

    // Get or create Stripe customer
    const user = await UserStore.getUserById(req.user.id);
    if (!user) {
      res.status(404).json({ error: "Not Found", message: "User not found" });
      return;
    }

    let customerId = user.stripe_customer_id;

    if (!customerId) {
      // Create Stripe customer
      customerId = await StripeService.getOrCreateCustomer(
        user.id,
        user.email,
        `${user.first_name} ${user.last_name}`,
      );

      // Save customer ID to user
      await UserStore.updateUser(user.id, { stripe_customer_id: customerId });
    }

    // Create Setup Intent
    const { clientSecret, setupIntentId } =
      await StripeService.createSetupIntent(customerId);

    res.status(200).json({
      clientSecret,
      setupIntentId,
      customerId,
    });
  } catch (error) {
    console.error("Create setup intent error:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to create setup intent",
      details: error instanceof Error ? error.message : String(error),
    });
  }
};

/**
 * Confirm and save a payment method after Setup Intent
 */
export const confirmPaymentMethod = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    if (!req.user) {
      res
        .status(401)
        .json({ error: "Unauthorized", message: "User not authenticated" });
      return;
    }

    const parsed = confirmPaymentMethodSchema.parse(req.body);
    const { paymentMethodId, isDefault } = parsed;

    // Get user and customer ID
    const user = await UserStore.getUserById(req.user.id);
    if (!user) {
      res.status(404).json({ error: "Not Found", message: "User not found" });
      return;
    }

    if (!user.stripe_customer_id) {
      res.status(400).json({
        error: "Bad Request",
        message: "User does not have a Stripe customer ID",
      });
      return;
    }

    // Get payment method details from Stripe
    const stripePaymentMethod =
      await StripeService.getPaymentMethod(paymentMethodId);

    // Attach payment method to customer if not already attached
    try {
      await StripeService.attachPaymentMethod(
        paymentMethodId,
        user.stripe_customer_id,
      );
    } catch (error: any) {
      // If already attached, that's fine
      if (!error.message?.includes("already been attached")) {
        throw error;
      }
    }

    // Extract card details
    const card = stripePaymentMethod.card;
    const paymentMethodData = {
      stripe_payment_method_id: paymentMethodId,
      type: stripePaymentMethod.type || "card",
      last4: card?.last4 || undefined,
      brand: card?.brand || undefined,
      expiry_month: card?.exp_month || undefined,
      expiry_year: card?.exp_year || undefined,
      is_default: isDefault || false,
    };

    // Save to database
    const paymentMethod = await PaymentMethodStore.createPaymentMethod(
      req.user.id,
      paymentMethodData,
    );

    // If this is the default, set it as default in Stripe and unset others
    if (isDefault) {
      await StripeService.setDefaultPaymentMethod(
        user.stripe_customer_id,
        paymentMethodId,
      );
      await PaymentMethodStore.setDefaultPaymentMethod(
        paymentMethod.id,
        req.user.id,
      );
    }

    res.status(200).json({
      message: "Payment method saved successfully",
      paymentMethod: {
        id: paymentMethod.id,
        type: paymentMethod.type,
        last4: paymentMethod.last4,
        brand: paymentMethod.brand,
        expiry_month: paymentMethod.expiry_month,
        expiry_year: paymentMethod.expiry_year,
        is_default: paymentMethod.is_default,
        stripe_payment_method_id: paymentMethod.stripe_payment_method_id,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res
        .status(400)
        .json({ error: "ValidationError", details: error.flatten() });
      return;
    }
    console.error("Confirm payment method error:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to confirm payment method",
      details: error instanceof Error ? error.message : String(error),
    });
  }
};

/**
 * Set a payment method as default
 */
export const setDefaultPaymentMethod = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    if (!req.user) {
      res
        .status(401)
        .json({ error: "Unauthorized", message: "User not authenticated" });
      return;
    }

    const { paymentMethodId } = req.params;
    if (!paymentMethodId) {
      res.status(400).json({
        error: "Bad Request",
        message: "Payment method ID is required",
      });
      return;
    }

    // Verify payment method belongs to user
    const paymentMethod =
      await PaymentMethodStore.getPaymentMethodById(paymentMethodId);
    if (!paymentMethod) {
      res
        .status(404)
        .json({ error: "Not Found", message: "Payment method not found" });
      return;
    }

    if (paymentMethod.user_id !== req.user.id) {
      res.status(403).json({
        error: "Forbidden",
        message: "Payment method does not belong to user",
      });
      return;
    }

    // Get user and customer ID
    const user = await UserStore.getUserById(req.user.id);
    if (!user || !user.stripe_customer_id) {
      res.status(400).json({
        error: "Bad Request",
        message: "User does not have a Stripe customer ID",
      });
      return;
    }

    // Set as default in Stripe
    await StripeService.setDefaultPaymentMethod(
      user.stripe_customer_id,
      paymentMethod.stripe_payment_method_id,
    );

    // Set as default in database (this will unset others)
    const updatedPaymentMethod =
      await PaymentMethodStore.setDefaultPaymentMethod(
        paymentMethodId,
        req.user.id,
      );

    res.status(200).json({
      message: "Default payment method updated successfully",
      paymentMethod: {
        id: updatedPaymentMethod.id,
        type: updatedPaymentMethod.type,
        last4: updatedPaymentMethod.last4,
        brand: updatedPaymentMethod.brand,
        expiry_month: updatedPaymentMethod.expiry_month,
        expiry_year: updatedPaymentMethod.expiry_year,
        is_default: updatedPaymentMethod.is_default,
        stripe_payment_method_id: updatedPaymentMethod.stripe_payment_method_id,
      },
    });
  } catch (error) {
    console.error("Set default payment method error:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to set default payment method",
      details: error instanceof Error ? error.message : String(error),
    });
  }
};

/**
 * Delete a payment method
 */
export const deletePaymentMethod = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    if (!req.user) {
      res
        .status(401)
        .json({ error: "Unauthorized", message: "User not authenticated" });
      return;
    }

    const { paymentMethodId } = req.params;
    if (!paymentMethodId) {
      res.status(400).json({
        error: "Bad Request",
        message: "Payment method ID is required",
      });
      return;
    }

    // Verify payment method belongs to user
    const paymentMethod =
      await PaymentMethodStore.getPaymentMethodById(paymentMethodId);
    if (!paymentMethod) {
      res
        .status(404)
        .json({ error: "Not Found", message: "Payment method not found" });
      return;
    }

    if (paymentMethod.user_id !== req.user.id) {
      res.status(403).json({
        error: "Forbidden",
        message: "Payment method does not belong to user",
      });
      return;
    }

    // Detach from Stripe customer
    try {
      await StripeService.detachPaymentMethod(
        paymentMethod.stripe_payment_method_id,
      );
    } catch (error: any) {
      // If already detached or doesn't exist, continue with deletion
      console.warn(
        "Error detaching payment method from Stripe:",
        error.message,
      );
    }

    // Delete from database
    await PaymentMethodStore.deletePaymentMethod(paymentMethodId, req.user.id);

    res.status(200).json({
      message: "Payment method deleted successfully",
    });
  } catch (error) {
    console.error("Delete payment method error:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to delete payment method",
      details: error instanceof Error ? error.message : String(error),
    });
  }
};
