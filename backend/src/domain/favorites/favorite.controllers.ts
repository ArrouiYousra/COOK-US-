import { type Response } from "express";
import { type AuthRequest } from "@core/middleware";
import { FavoriteStore } from "@stores/favorite.store";
import { ProfileStore } from "@stores/profile.store";
import { UserStore } from "@stores/user.store";

export const getMyFavorites = async (
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

    // Only clients can view their favorites
    const user = await UserStore.getUserById(req.user.id);
    if (!user || user.role !== "CLIENT") {
      res.status(403).json({
        error: "Forbidden",
        message: "Only clients can view their favorites",
      });
      return;
    }

    const clientProfile = await ProfileStore.getClientProfileByUserId(
      req.user.id,
    );
    if (!clientProfile) {
      res.status(404).json({
        error: "Not Found",
        message: "Client profile not found",
      });
      return;
    }

    const favorites = await FavoriteStore.getFavoritesByClient(
      clientProfile.id,
    );

    // Enrich with cook profile info
    const favoritesWithCooks = await Promise.all(
      favorites.map(async (favorite) => {
        const cookProfile = await ProfileStore.getCookProfileById(
          favorite.cook_profile_id,
        );
        const cookUser = cookProfile
          ? await UserStore.getUserById(cookProfile.user_id)
          : null;

        return {
          ...favorite,
          cook:
            cookUser && cookProfile
              ? {
                  profile_id: cookProfile.id,
                  user_id: cookUser.id,
                  first_name: cookUser.first_name,
                  last_name: cookUser.last_name,
                  avatar_url: cookUser.avatar_url,
                  headline: cookProfile.headline,
                  hourly_rate: cookProfile.hourly_rate,
                  average_rating: cookProfile.average_rating,
                  city: cookUser.city,
                }
              : null,
        };
      }),
    );

    res.status(200).json({
      favorites: favoritesWithCooks,
      count: favoritesWithCooks.length,
    });
  } catch (error) {
    console.error("Get favorites error:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to get favorites",
    });
  }
};

export const addFavorite = async (
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

    // Only clients can add favorites
    const user = await UserStore.getUserById(req.user.id);
    if (!user || user.role !== "CLIENT") {
      res.status(403).json({
        error: "Forbidden",
        message: "Only clients can add favorites",
      });
      return;
    }

    const clientProfile = await ProfileStore.getClientProfileByUserId(
      req.user.id,
    );
    if (!clientProfile) {
      res.status(404).json({
        error: "Not Found",
        message: "Client profile not found",
      });
      return;
    }

    const { cookId } = req.params;
    if (!cookId) {
      res.status(400).json({
        error: "Bad Request",
        message: "Cook ID is required",
      });
      return;
    }

    // Verify cook exists
    const cookProfile = await ProfileStore.getCookProfileById(cookId);
    if (!cookProfile) {
      res.status(404).json({
        error: "Not Found",
        message: "Cook profile not found",
      });
      return;
    }

    const favorite = await FavoriteStore.addFavorite(clientProfile.id, cookId);

    res.status(201).json({
      message: "Cook added to favorites successfully",
      favorite,
    });
  } catch (error) {
    console.error("Add favorite error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to add favorite";

    if (errorMessage.includes("already in your favorites")) {
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

export const removeFavorite = async (
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

    // Only clients can remove favorites
    const user = await UserStore.getUserById(req.user.id);
    if (!user || user.role !== "CLIENT") {
      res.status(403).json({
        error: "Forbidden",
        message: "Only clients can remove favorites",
      });
      return;
    }

    const clientProfile = await ProfileStore.getClientProfileByUserId(
      req.user.id,
    );
    if (!clientProfile) {
      res.status(404).json({
        error: "Not Found",
        message: "Client profile not found",
      });
      return;
    }

    const { cookId } = req.params;
    if (!cookId) {
      res.status(400).json({
        error: "Bad Request",
        message: "Cook ID is required",
      });
      return;
    }

    await FavoriteStore.removeFavorite(clientProfile.id, cookId);

    res.status(200).json({
      message: "Cook removed from favorites successfully",
    });
  } catch (error) {
    console.error("Remove favorite error:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to remove favorite",
    });
  }
};

export const checkFavorite = async (
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

    // Only clients can check favorites
    const user = await UserStore.getUserById(req.user.id);
    if (!user || user.role !== "CLIENT") {
      res.status(403).json({
        error: "Forbidden",
        message: "Only clients can check favorites",
      });
      return;
    }

    const clientProfile = await ProfileStore.getClientProfileByUserId(
      req.user.id,
    );
    if (!clientProfile) {
      res.status(404).json({
        error: "Not Found",
        message: "Client profile not found",
      });
      return;
    }

    const { cookId } = req.params;
    if (!cookId) {
      res.status(400).json({
        error: "Bad Request",
        message: "Cook ID is required",
      });
      return;
    }

    const isFavorite = await FavoriteStore.isFavorite(clientProfile.id, cookId);

    res.status(200).json({
      is_favorite: isFavorite,
    });
  } catch (error) {
    console.error("Check favorite error:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to check favorite",
    });
  }
};
