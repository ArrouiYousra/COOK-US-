import { type Response } from "express";
import { type AuthRequest } from "@core/middleware";
import { DisputeStore } from "@stores/dispute.store";
import { BookingStore } from "@stores/booking.store";
import { UserStore } from "@stores/user.store";
import { ProfileStore } from "@stores/profile.store";
import { StripeService } from "@core/services/stripe.service";
import { TransactionStore } from "@stores/transaction.store";
import { supabaseAdmin } from "@config/supabaseClient";
import type {
  CreateDisputeDTO,
  UpdateDisputeDTO,
  ResolveDisputeDTO,
} from "../../types/database.types";

// ============ DISPUTES ============

export const createDispute = async (
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

    const disputeData: CreateDisputeDTO = req.body;

    // Validation
    if (
      !disputeData.booking_id ||
      !disputeData.reason ||
      !disputeData.description
    ) {
      res.status(400).json({
        error: "Bad Request",
        message: "booking_id, reason, and description are required",
      });
      return;
    }

    // Verify booking exists and user has access
    const booking = await BookingStore.getBookingById(disputeData.booking_id);
    if (!booking) {
      res.status(404).json({
        error: "Not Found",
        message: "Booking not found",
      });
      return;
    }

    // Check if user is part of this booking
    const clientProfile = await ProfileStore.getClientProfileByUserId(
      req.user.id,
    );
    const cookProfile = await ProfileStore.getCookProfileByUserId(req.user.id);

    const hasAccess =
      (clientProfile && clientProfile.id === booking.client_profile_id) ||
      (cookProfile && cookProfile.id === booking.cook_profile_id);

    if (!hasAccess) {
      res.status(403).json({
        error: "Forbidden",
        message: "You can only open disputes for your own bookings",
      });
      return;
    }

    // Check if booking already has an open dispute
    const existingDisputes = await DisputeStore.getDisputesByBookingId(
      disputeData.booking_id,
    );
    const hasOpenDispute = existingDisputes.some(
      (d) => d.status === "OPEN" || d.status === "IN_REVIEW",
    );

    if (hasOpenDispute) {
      res.status(400).json({
        error: "Bad Request",
        message: "This booking already has an open dispute",
      });
      return;
    }

    const dispute = await DisputeStore.createDispute(disputeData, req.user.id);

    res.status(201).json({
      message: "Dispute created successfully",
      dispute,
    });
  } catch (error) {
    console.error("Create dispute error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to create dispute",
      details: errorMessage,
    });
  }
};

export const getMyDisputes = async (
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

    const disputes = await DisputeStore.getDisputesByUserId(req.user.id);

    res.status(200).json({
      disputes,
      count: disputes.length,
    });
  } catch (error) {
    console.error("Get disputes error:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to get disputes",
    });
  }
};

export const getDisputeById = async (
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

    const { disputeId } = req.params;
    if (!disputeId) {
      res.status(400).json({
        error: "Bad Request",
        message: "Dispute ID is required",
      });
      return;
    }

    const dispute = await DisputeStore.getDisputeById(disputeId);
    if (!dispute) {
      res.status(404).json({
        error: "Not Found",
        message: "Dispute not found",
      });
      return;
    }

    // Check access
    const user = await UserStore.getUserById(req.user.id);
    const hasAccess = await DisputeStore.userHasAccessToDispute(
      disputeId,
      req.user.id,
    );
    const isAdmin = user?.role === "ADMIN";

    if (!hasAccess && !isAdmin) {
      res.status(403).json({
        error: "Forbidden",
        message: "You do not have access to this dispute",
      });
      return;
    }

    res.status(200).json({
      dispute,
    });
  } catch (error) {
    console.error("Get dispute error:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to get dispute",
    });
  }
};

export const updateDispute = async (
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

    const { disputeId } = req.params;
    if (!disputeId) {
      res.status(400).json({
        error: "Bad Request",
        message: "Dispute ID is required",
      });
      return;
    }

    const dispute = await DisputeStore.getDisputeById(disputeId);
    if (!dispute) {
      res.status(404).json({
        error: "Not Found",
        message: "Dispute not found",
      });
      return;
    }

    // Only the user who raised the dispute or admin can update
    const user = await UserStore.getUserById(req.user.id);
    const isAdmin = user?.role === "ADMIN";
    const isRaiser = dispute.raised_by === req.user.id;

    if (!isRaiser && !isAdmin) {
      res.status(403).json({
        error: "Forbidden",
        message: "You can only update disputes you raised",
      });
      return;
    }

    // Only allow status updates for admins
    const updates: UpdateDisputeDTO = req.body;
    if (updates.status && !isAdmin) {
      res.status(403).json({
        error: "Forbidden",
        message: "Only admins can update dispute status",
      });
      return;
    }

    // Only allow updates if dispute is not resolved or closed
    if (dispute.status === "RESOLVED" || dispute.status === "CLOSED") {
      res.status(400).json({
        error: "Bad Request",
        message: "Cannot update a resolved or closed dispute",
      });
      return;
    }

    const updatedDispute = await DisputeStore.updateDispute(disputeId, updates);

    res.status(200).json({
      message: "Dispute updated successfully",
      dispute: updatedDispute,
    });
  } catch (error) {
    console.error("Update dispute error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to update dispute",
      details: errorMessage,
    });
  }
};

export const resolveDispute = async (
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

    // Only admins can resolve disputes
    const user = await UserStore.getUserById(req.user.id);
    if (!user || user.role !== "ADMIN") {
      res.status(403).json({
        error: "Forbidden",
        message: "Only admins can resolve disputes",
      });
      return;
    }

    const { disputeId } = req.params;
    if (!disputeId) {
      res.status(400).json({
        error: "Bad Request",
        message: "Dispute ID is required",
      });
      return;
    }

    const resolutionData: ResolveDisputeDTO = req.body;
    if (!resolutionData.resolution) {
      res.status(400).json({
        error: "Bad Request",
        message: "resolution is required",
      });
      return;
    }

    // Get dispute and booking
    const dispute = await DisputeStore.getDisputeById(disputeId);
    if (!dispute) {
      res.status(404).json({
        error: "Not Found",
        message: "Dispute not found",
      });
      return;
    }

    const booking = await BookingStore.getBookingById(dispute.booking_id);
    if (!booking) {
      res.status(404).json({
        error: "Not Found",
        message: "Booking not found",
      });
      return;
    }

    // Handle refunds if resolution mentions refund
    // Note: resolution is TEXT, so we check if it contains refund keywords
    const resolutionLower = resolutionData.resolution.toLowerCase();
    if (
      (resolutionLower.includes("refund") ||
        resolutionLower.includes("remboursement")) &&
      booking.payment_intent_id &&
      booking.payment_status === "succeeded"
    ) {
      try {
        const refundAmount = resolutionData.refund_amount; // Optional partial refund amount
        const refund = await StripeService.createRefund(
          booking.payment_intent_id,
          refundAmount,
          "requested_by_customer",
        );

        // Create transaction record for refund
        try {
          const { data: clientProfile } = await supabaseAdmin
            .from("client_profiles")
            .select("user_id")
            .eq("id", booking.client_profile_id)
            .single();

          const { data: cookProfile } = await supabaseAdmin
            .from("cook_profiles")
            .select("user_id")
            .eq("id", booking.cook_profile_id)
            .single();

          await TransactionStore.createTransaction({
            type: "REFUND",
            booking_id: dispute.booking_id,
            from_user_id: cookProfile?.user_id || undefined,
            to_user_id: clientProfile?.user_id || undefined,
            amount: refundAmount || booking.total_price || 0,
            currency: "EUR",
            stripe_payment_id: booking.payment_intent_id,
            stripe_refund_id: refund.id,
            description: `Refund from dispute resolution: ${resolutionData.resolution}`,
            metadata: {
              dispute_id: disputeId,
              booking_id: dispute.booking_id,
              refund_amount: refundAmount,
            },
          });
        } catch (transactionError) {
          console.error(
            "Failed to create refund transaction record:",
            transactionError,
          );
          // Continue even if transaction creation fails
        }
      } catch (refundError) {
        console.error("Failed to create refund:", refundError);
        // Continue with dispute resolution even if refund fails
        // The refund can be created manually later
      }
    }

    const resolvedDispute = await DisputeStore.resolveDispute(
      disputeId,
      req.user.id,
      resolutionData,
    );

    res.status(200).json({
      message: "Dispute resolved successfully",
      dispute: resolvedDispute,
    });
  } catch (error) {
    console.error("Resolve dispute error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to resolve dispute",
      details: errorMessage,
    });
  }
};

export const closeDispute = async (
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

    const { disputeId } = req.params;
    if (!disputeId) {
      res.status(400).json({
        error: "Bad Request",
        message: "Dispute ID is required",
      });
      return;
    }

    const dispute = await DisputeStore.getDisputeById(disputeId);
    if (!dispute) {
      res.status(404).json({
        error: "Not Found",
        message: "Dispute not found",
      });
      return;
    }

    // Only admins or the user who raised it can close (if resolved)
    const user = await UserStore.getUserById(req.user.id);
    const isAdmin = user?.role === "ADMIN";
    const isRaiser = dispute.raised_by === req.user.id; // Changed from opened_by

    if (!isAdmin && !isRaiser) {
      res.status(403).json({
        error: "Forbidden",
        message: "You do not have permission to close this dispute",
      });
      return;
    }

    // Only resolved disputes can be closed by opener, admins can close any
    if (!isAdmin && dispute.status !== "RESOLVED") {
      res.status(400).json({
        error: "Bad Request",
        message: "Only resolved disputes can be closed",
      });
      return;
    }

    const closedDispute = await DisputeStore.closeDispute(disputeId);

    res.status(200).json({
      message: "Dispute closed successfully",
      dispute: closedDispute,
    });
  } catch (error) {
    console.error("Close dispute error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to close dispute",
      details: errorMessage,
    });
  }
};

export const getAllDisputes = async (
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

    // Only admins can view all disputes
    const user = await UserStore.getUserById(req.user.id);
    if (!user || user.role !== "ADMIN") {
      res.status(403).json({
        error: "Forbidden",
        message: "Only admins can view all disputes",
      });
      return;
    }

    const { status } = req.query;
    const disputes = await DisputeStore.getAllDisputes(
      status ? (status as any) : undefined,
    );

    res.status(200).json({
      disputes,
      count: disputes.length,
    });
  } catch (error) {
    console.error("Get all disputes error:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to get disputes",
    });
  }
};

// Dispute messages removed - not in SQL schema
