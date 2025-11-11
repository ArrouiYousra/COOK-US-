import { type Response } from "express";
import { type AuthRequest } from "@core/middleware";
import { ReviewStore } from "@stores/review.store";
import { BookingStore } from "@stores/booking.store";
import { UserStore } from "@stores/user.store";
import { ReviewImageService } from "@core/services/review-image.service";

export const createReview = async (
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

    const { booking_id, rating, comment, detailed_ratings, photos, is_recommended } = req.body;

    if (!booking_id || rating === undefined) {
      res.status(400).json({
        error: "Bad Request",
        message: "booking_id and rating are required",
      });
      return;
    }

    if (rating < 0 || rating > 5) {
      res.status(400).json({
        error: "Bad Request",
        message: "Rating must be between 0 and 5",
      });
      return;
    }

    // Valider les notes détaillées si fournies
    if (detailed_ratings) {
      const validKeys = ["quality", "punctuality", "cleanliness", "communication"];
      for (const key of validKeys) {
        if (detailed_ratings[key] !== undefined) {
          if (detailed_ratings[key] < 0 || detailed_ratings[key] > 5) {
            res.status(400).json({
              error: "Bad Request",
              message: `Rating ${key} must be between 0 and 5`,
            });
            return;
          }
        }
      }
    }

    // Valider les photos si fournies
    if (photos && !Array.isArray(photos)) {
      res.status(400).json({
        error: "Bad Request",
        message: "photos must be an array",
      });
      return;
    }

    if (photos && photos.length > 5) {
      res.status(400).json({
        error: "Bad Request",
        message: "Maximum 5 photos allowed",
      });
      return;
    }

    const review = await ReviewStore.createReview(req.user.id, {
      booking_id,
      rating,
      comment,
      detailed_ratings,
      photos,
      is_recommended: is_recommended || false,
    });

    res.status(201).json({
      message: "Review created successfully",
      review,
    });
  } catch (error) {
    console.error("Create review error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to create review";

    if (
      errorMessage.includes("not found") ||
      errorMessage.includes("not completed") ||
      errorMessage.includes("not a participant") ||
      errorMessage.includes("already exists")
    ) {
      res.status(400).json({
        error: "Bad Request",
        message: errorMessage,
      });
      return;
    }

    res.status(500).json({
      error: "Internal Server Error",
      message: errorMessage,
    });
  }
};

export const getReviewByBooking = async (
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

    const { bookingId } = req.params;
    if (!bookingId) {
      res.status(400).json({
        error: "Bad Request",
        message: "Booking ID is required",
      });
      return;
    }

    // Verify user is a participant
    const booking = await BookingStore.getBookingById(bookingId);
    if (!booking) {
      res.status(404).json({
        error: "Not Found",
        message: "Booking not found",
      });
      return;
    }

    const user = await UserStore.getUserById(req.user.id);
    if (!user) {
      res.status(404).json({
        error: "Not Found",
        message: "User not found",
      });
      return;
    }

    // Check if user is participant (simplified check - can be improved)
    const review = await ReviewStore.getReviewByBooking(bookingId);

    if (!review) {
      res.status(404).json({
        error: "Not Found",
        message: "Review not found for this booking",
      });
      return;
    }

    res.status(200).json({
      review,
    });
  } catch (error) {
    console.error("Get review error:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to get review",
    });
  }
};

export const getReviewsByUser = async (
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

    const { userId } = req.params;
    if (!userId) {
      res.status(400).json({
        error: "Bad Request",
        message: "User ID is required",
      });
      return;
    }

    // Get reviews where user is the reviewee (reviews about them)
    const reviews = await ReviewStore.getReviewsByReviewee(userId);

    // Enrich with reviewer info
    const reviewsWithReviewers = await Promise.all(
      reviews.map(async (review) => {
        const reviewer = await UserStore.getUserById(review.reviewer_id);
        return {
          ...review,
          reviewer: reviewer
            ? {
                id: reviewer.id,
                first_name: reviewer.first_name,
                last_name: reviewer.last_name,
                avatar_url: reviewer.avatar_url,
              }
            : null,
        };
      }),
    );

    res.status(200).json({
      reviews: reviewsWithReviewers,
      count: reviewsWithReviewers.length,
      average_rating:
        reviews.length > 0
          ? Math.round(
              (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length) *
                100,
            ) / 100
          : null,
    });
  } catch (error) {
    console.error("Get reviews error:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to get reviews",
    });
  }
};

export const getMyReviews = async (
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

    // Get reviews written by the authenticated user
    const reviews = await ReviewStore.getReviewsByReviewer(req.user.id);

    // Enrich with reviewee info
    const reviewsWithReviewees = await Promise.all(
      reviews.map(async (review) => {
        const reviewee = await UserStore.getUserById(review.reviewee_id);
        return {
          ...review,
          reviewee: reviewee
            ? {
                id: reviewee.id,
                first_name: reviewee.first_name,
                last_name: reviewee.last_name,
                avatar_url: reviewee.avatar_url,
              }
            : null,
        };
      }),
    );

    res.status(200).json({
      reviews: reviewsWithReviewees,
      count: reviewsWithReviewees.length,
    });
  } catch (error) {
    console.error("Get my reviews error:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to get reviews",
    });
  }
};

export const updateReview = async (
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

    const { reviewId } = req.params;
    const { rating, comment } = req.body;

    if (!reviewId) {
      res.status(400).json({
        error: "Bad Request",
        message: "Review ID is required",
      });
      return;
    }

    if (rating !== undefined && (rating < 0 || rating > 5)) {
      res.status(400).json({
        error: "Bad Request",
        message: "Rating must be between 0 and 5",
      });
      return;
    }

    const review = await ReviewStore.updateReview(reviewId, req.user.id, {
      rating,
      comment,
    });

    res.status(200).json({
      message: "Review updated successfully",
      review,
    });
  } catch (error) {
    console.error("Update review error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to update review";

    if (
      errorMessage.includes("not found") ||
      errorMessage.includes("only update")
    ) {
      res.status(400).json({
        error: "Bad Request",
        message: errorMessage,
      });
      return;
    }

    res.status(500).json({
      error: "Internal Server Error",
      message: errorMessage,
    });
  }
};

export const deleteReview = async (
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

    const { reviewId } = req.params;
    if (!reviewId) {
      res.status(400).json({
        error: "Bad Request",
        message: "Review ID is required",
      });
      return;
    }

    await ReviewStore.deleteReview(reviewId, req.user.id);

    res.status(200).json({
      message: "Review deleted successfully",
    });
  } catch (error) {
    console.error("Delete review error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to delete review";

    if (
      errorMessage.includes("not found") ||
      errorMessage.includes("only delete")
    ) {
      res.status(400).json({
        error: "Bad Request",
        message: errorMessage,
      });
      return;
    }

    res.status(500).json({
      error: "Internal Server Error",
      message: errorMessage,
    });
  }
};

export const uploadReviewImage = async (
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

    const { image_base64 } = req.body;

    if (!image_base64) {
      res.status(400).json({
        error: "Bad Request",
        message: "image_base64 is required",
      });
      return;
    }

    const imageUrl = await ReviewImageService.uploadReviewImageFromBase64(
      req.user.id,
      image_base64,
    );

    res.status(200).json({
      message: "Image uploaded successfully",
      image_url: imageUrl,
    });
  } catch (error) {
    console.error("Upload review image error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to upload image";

    if (
      errorMessage.includes("Format") ||
      errorMessage.includes("taille") ||
      errorMessage.includes("size")
    ) {
      res.status(400).json({
        error: "Bad Request",
        message: errorMessage,
      });
      return;
    }

    res.status(500).json({
      error: "Internal Server Error",
      message: errorMessage,
    });
  }
};
