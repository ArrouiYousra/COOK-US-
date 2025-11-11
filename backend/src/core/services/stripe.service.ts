import Stripe from "stripe";
import dotenv from "dotenv";

dotenv.config();

// Lazy initialization of Stripe client
let stripeInstance: Stripe | null = null;

function getStripe(): Stripe {
  if (!stripeInstance) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error(
        "STRIPE_SECRET_KEY is not defined in environment variables. Please add it to your .env file.",
      );
    }
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2025-02-24.acacia",
    });
  }
  return stripeInstance;
}

// Export getter function for direct access if needed
export function getStripeClient(): Stripe {
  return getStripe();
}

export class StripeService {
  /**
   * Create a Payment Intent for a booking
   */
  static async createPaymentIntent(
    amount: number, // Amount in cents
    currency: string = "eur",
    metadata: Record<string, string> = {},
  ): Promise<Stripe.PaymentIntent> {
    try {
      const stripe = getStripe();
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: currency.toLowerCase(),
        metadata,
        automatic_payment_methods: {
          enabled: true,
        },
      });

      return paymentIntent;
    } catch (error) {
      console.error("Stripe create payment intent error:", error);
      throw new Error(
        `Failed to create payment intent: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Retrieve a Payment Intent
   */
  static async getPaymentIntent(
    paymentIntentId: string,
  ): Promise<Stripe.PaymentIntent> {
    try {
      const stripe = getStripe();
      const paymentIntent =
        await stripe.paymentIntents.retrieve(paymentIntentId);
      return paymentIntent;
    } catch (error) {
      console.error("Stripe get payment intent error:", error);
      throw new Error(
        `Failed to retrieve payment intent: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Confirm a Payment Intent (usually done client-side, but can be done server-side)
   */
  static async confirmPaymentIntent(
    paymentIntentId: string,
    paymentMethodId?: string,
  ): Promise<Stripe.PaymentIntent> {
    try {
      const stripe = getStripe();
      const params: Stripe.PaymentIntentConfirmParams = {};
      if (paymentMethodId) {
        params.payment_method = paymentMethodId;
      }

      const paymentIntent = await stripe.paymentIntents.confirm(
        paymentIntentId,
        params,
      );
      return paymentIntent;
    } catch (error) {
      console.error("Stripe confirm payment intent error:", error);
      throw new Error(
        `Failed to confirm payment intent: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Cancel a Payment Intent
   */
  static async cancelPaymentIntent(
    paymentIntentId: string,
  ): Promise<Stripe.PaymentIntent> {
    try {
      const stripe = getStripe();
      const paymentIntent = await stripe.paymentIntents.cancel(paymentIntentId);
      return paymentIntent;
    } catch (error) {
      console.error("Stripe cancel payment intent error:", error);
      throw new Error(
        `Failed to cancel payment intent: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Create a refund
   */
  static async createRefund(
    paymentIntentId: string,
    amount?: number, // Amount in cents, if not provided, full refund
    reason?: Stripe.RefundCreateParams.Reason,
  ): Promise<Stripe.Refund> {
    try {
      const stripe = getStripe();
      const params: Stripe.RefundCreateParams = {
        payment_intent: paymentIntentId,
      };

      if (amount) {
        params.amount = Math.round(amount * 100); // Convert to cents
      }

      if (reason) {
        params.reason = reason;
      }

      const refund = await stripe.refunds.create(params);
      return refund;
    } catch (error) {
      console.error("Stripe create refund error:", error);
      throw new Error(
        `Failed to create refund: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Get a refund by ID
   */
  static async getRefund(refundId: string): Promise<Stripe.Refund> {
    try {
      const stripe = getStripe();
      const refund = await stripe.refunds.retrieve(refundId);
      return refund;
    } catch (error) {
      console.error("Stripe get refund error:", error);
      throw new Error(
        `Failed to retrieve refund: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Verify webhook signature
   */
  static verifyWebhookSignature(
    payload: string | Buffer,
    signature: string,
  ): Stripe.Event {
    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      throw new Error("STRIPE_WEBHOOK_SECRET is not defined");
    }

    try {
      const stripe = getStripe();
      const event = stripe.webhooks.constructEvent(
        payload,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET,
      );
      return event;
    } catch (error) {
      console.error("Stripe webhook signature verification error:", error);
      throw new Error(
        `Webhook signature verification failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Calculate platform fee (percentage of total)
   */
  static calculatePlatformFee(
    totalAmount: number,
    feePercentage: number = 10,
  ): number {
    return Math.round(((totalAmount * feePercentage) / 100) * 100) / 100; // Round to 2 decimals
  }

  /**
   * Calculate cook earnings (total - platform fee)
   */
  static calculateCookEarnings(
    totalAmount: number,
    platformFee: number,
  ): number {
    return Math.round((totalAmount - platformFee) * 100) / 100; // Round to 2 decimals
  }

  /**
   * Create or retrieve a Stripe Customer for a user
   */
  static async getOrCreateCustomer(
    userId: string,
    email: string,
    name?: string,
  ): Promise<string> {
    const stripe = getStripe();

    // Create a new customer (in production, check database first for existing customer ID)
    const customer = await stripe.customers.create({
      email,
      name,
      metadata: {
        userId,
      },
    });

    return customer.id;
  }

  /**
   * Create a Setup Intent for adding a payment method
   */
  static async createSetupIntent(customerId: string): Promise<{
    clientSecret: string;
    setupIntentId: string;
  }> {
    const stripe = getStripe();

    const setupIntent = await stripe.setupIntents.create({
      customer: customerId,
      payment_method_types: ["card"],
    });

    return {
      clientSecret: setupIntent.client_secret!,
      setupIntentId: setupIntent.id,
    };
  }

  /**
   * Attach a payment method to a customer
   */
  static async attachPaymentMethod(
    paymentMethodId: string,
    customerId: string,
  ): Promise<void> {
    const stripe = getStripe();

    await stripe.paymentMethods.attach(paymentMethodId, {
      customer: customerId,
    });
  }

  /**
   * Detach a payment method from a customer
   */
  static async detachPaymentMethod(paymentMethodId: string): Promise<void> {
    const stripe = getStripe();

    await stripe.paymentMethods.detach(paymentMethodId);
  }

  /**
   * Set default payment method for a customer
   */
  static async setDefaultPaymentMethod(
    customerId: string,
    paymentMethodId: string,
  ): Promise<void> {
    const stripe = getStripe();

    await stripe.customers.update(customerId, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    });
  }

  /**
   * Get payment method details
   */
  static async getPaymentMethod(
    paymentMethodId: string,
  ): Promise<Stripe.PaymentMethod> {
    const stripe = getStripe();

    return await stripe.paymentMethods.retrieve(paymentMethodId);
  }

  /**
   * List all payment methods for a customer
   */
  static async listPaymentMethods(
    customerId: string,
  ): Promise<Stripe.PaymentMethod[]> {
    const stripe = getStripe();

    const paymentMethods = await stripe.paymentMethods.list({
      customer: customerId,
      type: "card",
    });

    return paymentMethods.data;
  }
}
