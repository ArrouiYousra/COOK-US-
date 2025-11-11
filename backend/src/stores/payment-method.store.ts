import { supabaseAdmin } from "@config/supabaseClient";
import type {
  PaymentMethod,
  CreatePaymentMethodDTO,
} from "../types/database.types";

export class PaymentMethodStore {
  /**
   * Create a new payment method
   */
  static async createPaymentMethod(
    userId: string,
    data: CreatePaymentMethodDTO,
  ): Promise<PaymentMethod> {
    const { data: insertData, error } = await supabaseAdmin
      .from("payment_methods")
      .insert({
        user_id: userId,
        stripe_payment_method_id: data.stripe_payment_method_id,
        type: data.type || "card",
        last4: data.last4 || null,
        brand: data.brand || null,
        expiry_month: data.expiry_month || null,
        expiry_year: data.expiry_year || null,
        is_default: data.is_default || false,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create payment method: ${error.message}`);
    }

    return insertData as PaymentMethod;
  }

  /**
   * Get all payment methods for a user
   */
  static async getPaymentMethodsByUserId(
    userId: string,
  ): Promise<PaymentMethod[]> {
    const { data, error } = await supabaseAdmin
      .from("payment_methods")
      .select("*")
      .eq("user_id", userId)
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(`Failed to get payment methods: ${error.message}`);
    }

    return (data as PaymentMethod[]) || [];
  }

  /**
   * Get a payment method by ID
   */
  static async getPaymentMethodById(
    paymentMethodId: string,
  ): Promise<PaymentMethod | null> {
    const { data, error } = await supabaseAdmin
      .from("payment_methods")
      .select("*")
      .eq("id", paymentMethodId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null; // Not found
      }
      throw new Error(`Failed to get payment method: ${error.message}`);
    }

    return data as PaymentMethod;
  }

  /**
   * Delete a payment method
   */
  static async deletePaymentMethod(
    paymentMethodId: string,
    userId: string,
  ): Promise<void> {
    const { error } = await supabaseAdmin
      .from("payment_methods")
      .delete()
      .eq("id", paymentMethodId)
      .eq("user_id", userId); // Ensure user owns the payment method

    if (error) {
      throw new Error(`Failed to delete payment method: ${error.message}`);
    }
  }

  /**
   * Set a payment method as default (and unset others)
   */
  static async setDefaultPaymentMethod(
    paymentMethodId: string,
    userId: string,
  ): Promise<PaymentMethod> {
    // First, unset all other default payment methods for this user
    await supabaseAdmin
      .from("payment_methods")
      .update({ is_default: false })
      .eq("user_id", userId)
      .eq("is_default", true);

    // Then set this one as default
    const { data, error } = await supabaseAdmin
      .from("payment_methods")
      .update({ is_default: true })
      .eq("id", paymentMethodId)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to set default payment method: ${error.message}`);
    }

    return data as PaymentMethod;
  }
}
