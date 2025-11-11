import { supabaseAdmin } from "@config/supabaseClient";
import type {
  Transaction,
  CreateTransactionDTO,
  TransactionStatus,
  TransactionType,
} from "../types/database.types";

export class TransactionStore {
  /**
   * Create a new transaction
   */
  static async createTransaction(
    transactionData: CreateTransactionDTO,
  ): Promise<Transaction> {
    const { data, error } = await supabaseAdmin
      .from("transactions")
      .insert({
        type: transactionData.type,
        status: "PENDING",
        booking_id: transactionData.booking_id ?? null,
        from_user_id: transactionData.from_user_id ?? null,
        to_user_id: transactionData.to_user_id ?? null,
        amount: transactionData.amount,
        currency: transactionData.currency ?? "EUR",
        stripe_payment_id: transactionData.stripe_payment_id ?? null,
        stripe_transfer_id: transactionData.stripe_transfer_id ?? null,
        stripe_refund_id: transactionData.stripe_refund_id ?? null,
        description: transactionData.description ?? null,
        metadata: transactionData.metadata ?? null,
      })
      .select()
      .single();

    if (error) {
      console.error("Supabase error details:", {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      });
      throw new Error(
        `Failed to create transaction: ${error.message} (code: ${error.code})`,
      );
    }

    return data as Transaction;
  }

  /**
   * Get transaction by ID
   */
  static async getTransactionById(
    transactionId: string,
  ): Promise<Transaction | null> {
    const { data, error } = await supabaseAdmin
      .from("transactions")
      .select("*")
      .eq("id", transactionId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null; // Not found
      }
      throw new Error(`Failed to get transaction: ${error.message}`);
    }

    return data as Transaction;
  }

  /**
   * Get transactions by user ID
   */
  static async getTransactionsByUserId(userId: string): Promise<Transaction[]> {
    const { data, error } = await supabaseAdmin
      .from("transactions")
      .select("*")
      .or(`from_user_id.eq.${userId},to_user_id.eq.${userId}`)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(`Failed to get transactions: ${error.message}`);
    }

    return (data ?? []) as Transaction[];
  }

  /**
   * Get transactions by booking ID
   */
  static async getTransactionsByBookingId(
    bookingId: string,
  ): Promise<Transaction[]> {
    const { data, error } = await supabaseAdmin
      .from("transactions")
      .select("*")
      .eq("booking_id", bookingId)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(`Failed to get transactions: ${error.message}`);
    }

    return (data ?? []) as Transaction[];
  }

  /**
   * Get all transactions (admin only)
   */
  static async getAllTransactions(
    status?: TransactionStatus,
    type?: TransactionType,
  ): Promise<Transaction[]> {
    let query = supabaseAdmin.from("transactions").select("*");

    if (status) {
      query = query.eq("status", status);
    }

    if (type) {
      query = query.eq("type", type);
    }

    const { data, error } = await query.order("created_at", {
      ascending: false,
    });

    if (error) {
      throw new Error(`Failed to get transactions: ${error.message}`);
    }

    return (data ?? []) as Transaction[];
  }

  /**
   * Update transaction status
   */
  static async updateTransactionStatus(
    transactionId: string,
    status: TransactionStatus,
    failureReason?: string,
  ): Promise<Transaction> {
    const updateData: any = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (status === "COMPLETED") {
      updateData.completed_at = new Date().toISOString();
    }

    if (status === "FAILED" && failureReason) {
      updateData.failure_reason = failureReason;
    }

    const { data, error } = await supabaseAdmin
      .from("transactions")
      .update(updateData)
      .eq("id", transactionId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update transaction: ${error.message}`);
    }

    return data as Transaction;
  }
}
