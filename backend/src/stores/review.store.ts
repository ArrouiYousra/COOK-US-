import { supabaseAdmin } from "@config/supabaseClient";
import type { Review, CreateReviewDTO } from "../types/database.types";

export class ReviewStore {
  /**
   * Create a review for a completed booking
   */
  static async createReview(
    reviewerId: string,
    reviewData: CreateReviewDTO,
  ): Promise<Review> {
    // Validate rating
    if (reviewData.rating < 0 || reviewData.rating > 5) {
      throw new Error("Rating must be between 0 and 5");
    }

    // Check if booking exists and is completed
    const { data: booking, error: bookingError } = await supabaseAdmin
      .from("bookings")
      .select("*")
      .eq("id", reviewData.booking_id)
      .single();

    if (bookingError || !booking) {
      throw new Error("Booking not found");
    }

    // Accept multiple status variants for completed bookings
    const completedStatuses = ["COMPLETED", "completed", "done"];
    if (!completedStatuses.includes(booking.status)) {
      throw new Error("Can only review completed bookings");
    }

    // Verify reviewer is a participant (client or cook)
    const user = await supabaseAdmin
      .from("users")
      .select("id, role")
      .eq("id", reviewerId)
      .single();

    if (user.error || !user.data) {
      throw new Error("User not found");
    }

    // Get profiles to verify participation
    let isParticipant = false;
    let revieweeId: string | null = null;

    if (user.data.role === "CLIENT") {
      // Client reviewing cook
      const { data: clientProfile } = await supabaseAdmin
        .from("client_profiles")
        .select("id")
        .eq("user_id", reviewerId)
        .single();

      if (clientProfile && clientProfile.id === booking.client_profile_id) {
        isParticipant = true;
        // Get cook's user_id
        if (booking.cook_profile_id) {
          const { data: cookProfile } = await supabaseAdmin
            .from("cook_profiles")
            .select("user_id")
            .eq("id", booking.cook_profile_id)
            .single();

          if (cookProfile) {
            revieweeId = cookProfile.user_id;
          }
        }
      }
    } else if (user.data.role === "COOK") {
      // Cook reviewing client
      const { data: cookProfile } = await supabaseAdmin
        .from("cook_profiles")
        .select("id")
        .eq("user_id", reviewerId)
        .single();

      if (cookProfile && cookProfile.id === booking.cook_profile_id) {
        isParticipant = true;
        // Get client's user_id
        const { data: clientProfile } = await supabaseAdmin
          .from("client_profiles")
          .select("user_id")
          .eq("id", booking.client_profile_id)
          .single();

        if (clientProfile) {
          revieweeId = clientProfile.user_id;
        }
      }
    }

    if (!isParticipant || !revieweeId) {
      throw new Error("You are not a participant of this booking");
    }

    // Check if review already exists for this booking
    const existingReview = await this.getReviewByBooking(reviewData.booking_id);
    if (existingReview) {
      throw new Error("A review already exists for this booking");
    }

    // Create review
    const { data, error } = await supabaseAdmin
      .from("reviews")
      .insert({
        booking_id: reviewData.booking_id,
        reviewer_id: reviewerId,
        reviewee_id: revieweeId,
        rating: reviewData.rating,
        comment: reviewData.comment || null,
        detailed_ratings: reviewData.detailed_ratings || null,
        photos: reviewData.photos || null,
        is_recommended: reviewData.is_recommended || false,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create review: ${error.message}`);
    }

    // Update average rating for reviewee
    await this.updateAverageRating(revieweeId);

    return data as Review;
  }

  /**
   * Get review by booking ID
   */
  static async getReviewByBooking(bookingId: string): Promise<Review | null> {
    const { data, error } = await supabaseAdmin
      .from("reviews")
      .select("*")
      .eq("booking_id", bookingId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null;
      }
      throw new Error(`Failed to get review: ${error.message}`);
    }

    return data as Review;
  }

  /**
   * Get review by ID
   */
  static async getReviewById(reviewId: string): Promise<Review | null> {
    const { data, error } = await supabaseAdmin
      .from("reviews")
      .select("*")
      .eq("id", reviewId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null;
      }
      throw new Error(`Failed to get review: ${error.message}`);
    }

    return data as Review;
  }

  /**
   * Get all reviews for a user (as reviewee)
   */
  static async getReviewsByReviewee(revieweeId: string): Promise<Review[]> {
    const { data, error } = await supabaseAdmin
      .from("reviews")
      .select("*")
      .eq("reviewee_id", revieweeId)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(`Failed to get reviews: ${error.message}`);
    }

    return (data as Review[]) || [];
  }

  /**
   * Get all reviews written by a user (as reviewer)
   */
  static async getReviewsByReviewer(reviewerId: string): Promise<Review[]> {
    const { data, error } = await supabaseAdmin
      .from("reviews")
      .select("*")
      .eq("reviewer_id", reviewerId)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(`Failed to get reviews: ${error.message}`);
    }

    return (data as Review[]) || [];
  }

  /**
   * Update a review
   */
  static async updateReview(
    reviewId: string,
    reviewerId: string,
    updates: { rating?: number; comment?: string },
  ): Promise<Review> {
    // Verify ownership
    const review = await this.getReviewById(reviewId);
    if (!review) {
      throw new Error("Review not found");
    }

    if (review.reviewer_id !== reviewerId) {
      throw new Error("You can only update your own reviews");
    }

    // Validate rating if provided
    if (
      updates.rating !== undefined &&
      (updates.rating < 0 || updates.rating > 5)
    ) {
      throw new Error("Rating must be between 0 and 5");
    }

    const { data, error } = await supabaseAdmin
      .from("reviews")
      .update({
        rating: updates.rating,
        comment: updates.comment,
      })
      .eq("id", reviewId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update review: ${error.message}`);
    }

    // Update average rating for reviewee
    await this.updateAverageRating(review.reviewee_id);

    return data as Review;
  }

  /**
   * Delete a review
   */
  static async deleteReview(
    reviewId: string,
    reviewerId: string,
  ): Promise<void> {
    // Verify ownership
    const review = await this.getReviewById(reviewId);
    if (!review) {
      throw new Error("Review not found");
    }

    if (review.reviewer_id !== reviewerId) {
      throw new Error("You can only delete your own reviews");
    }

    const { error } = await supabaseAdmin
      .from("reviews")
      .delete()
      .eq("id", reviewId);

    if (error) {
      throw new Error(`Failed to delete review: ${error.message}`);
    }

    // Update average rating for reviewee
    await this.updateAverageRating(review.reviewee_id);
  }

  /**
   * Update average rating for a user (cook or client)
   */
  private static async updateAverageRating(userId: string): Promise<void> {
    // Get all reviews for this user
    const reviews = await this.getReviewsByReviewee(userId);

    if (reviews.length === 0) {
      // No reviews, set average to null
      // Check if user is cook or client
      const { data: user } = await supabaseAdmin
        .from("users")
        .select("role")
        .eq("id", userId)
        .single();

      if (user?.role === "COOK") {
        const { data: cookProfile } = await supabaseAdmin
          .from("cook_profiles")
          .select("id")
          .eq("user_id", userId)
          .single();

        if (cookProfile) {
          await supabaseAdmin
            .from("cook_profiles")
            .update({ average_rating: null })
            .eq("id", cookProfile.id);
        }
      } else if (user?.role === "CLIENT") {
        const { data: clientProfile } = await supabaseAdmin
          .from("client_profiles")
          .select("id")
          .eq("user_id", userId)
          .single();

        if (clientProfile) {
          await supabaseAdmin
            .from("client_profiles")
            .update({ average_rating_given: null })
            .eq("id", clientProfile.id);
        }
      }
      return;
    }

    // Calculate average
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    const average = Math.round((sum / reviews.length) * 100) / 100; // Round to 2 decimals

    // Check if user is cook or client
    const { data: user } = await supabaseAdmin
      .from("users")
      .select("role")
      .eq("id", userId)
      .single();

    if (user?.role === "COOK") {
      const { data: cookProfile } = await supabaseAdmin
        .from("cook_profiles")
        .select("id")
        .eq("user_id", userId)
        .single();

      if (cookProfile) {
        await supabaseAdmin
          .from("cook_profiles")
          .update({ average_rating: average })
          .eq("id", cookProfile.id);
      }
    } else if (user?.role === "CLIENT") {
      // For clients, we might want to track average_rating_given (reviews they wrote)
      // But the schema shows average_rating_given, so let's calculate based on reviews they wrote
      const reviewsWritten = await this.getReviewsByReviewer(userId);
      if (reviewsWritten.length > 0) {
        const sumWritten = reviewsWritten.reduce((acc, r) => acc + r.rating, 0);
        const averageWritten =
          Math.round((sumWritten / reviewsWritten.length) * 100) / 100;

        const { data: clientProfile } = await supabaseAdmin
          .from("client_profiles")
          .select("id")
          .eq("user_id", userId)
          .single();

        if (clientProfile) {
          await supabaseAdmin
            .from("client_profiles")
            .update({ average_rating_given: averageWritten })
            .eq("id", clientProfile.id);
        }
      }
    }
  }
}
