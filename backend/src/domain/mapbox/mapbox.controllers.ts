import { type Response } from "express";
import { type AuthRequest } from "@core/middleware";
import { MapboxService } from "@core/services/mapbox.service";
import dotenv from "dotenv";

dotenv.config();

// ============ MAPBOX ============

export const geocodeAddress = async (
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

    const { address, country } = req.query;

    if (!address || typeof address !== "string") {
      res.status(400).json({
        error: "Bad Request",
        message: "address query parameter is required",
      });
      return;
    }

    const result = await MapboxService.geocodeAddress(
      address,
      country ? (country as string) : undefined,
    );

    if (!result) {
      res.status(404).json({
        error: "Not Found",
        message: "Address not found",
      });
      return;
    }

    res.status(200).json({
      result,
    });
  } catch (error) {
    console.error("Geocode address error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to geocode address",
      details: errorMessage,
    });
  }
};

export const reverseGeocode = async (
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

    const { latitude, longitude } = req.query;

    if (!latitude || !longitude) {
      res.status(400).json({
        error: "Bad Request",
        message: "latitude and longitude query parameters are required",
      });
      return;
    }

    const lat = parseFloat(latitude as string);
    const lng = parseFloat(longitude as string);

    if (isNaN(lat) || isNaN(lng)) {
      res.status(400).json({
        error: "Bad Request",
        message: "latitude and longitude must be valid numbers",
      });
      return;
    }

    const result = await MapboxService.reverseGeocode(lat, lng);

    if (!result) {
      res.status(404).json({
        error: "Not Found",
        message: "Address not found for these coordinates",
      });
      return;
    }

    res.status(200).json({
      result,
    });
  } catch (error) {
    console.error("Reverse geocode error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to reverse geocode",
      details: errorMessage,
    });
  }
};

export const searchAddresses = async (
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

    const { query, country, proximity_lng, proximity_lat } = req.query;

    if (!query || typeof query !== "string") {
      res.status(400).json({
        error: "Bad Request",
        message: "query parameter is required",
      });
      return;
    }

    let proximity: [number, number] | undefined;
    if (proximity_lng && proximity_lat) {
      const lng = parseFloat(proximity_lng as string);
      const lat = parseFloat(proximity_lat as string);
      if (!isNaN(lng) && !isNaN(lat)) {
        proximity = [lng, lat];
      }
    }

    const results = await MapboxService.searchAddresses(
      query,
      country ? (country as string) : undefined,
      proximity,
    );

    res.status(200).json({
      suggestions: results,
      count: results.length,
    });
  } catch (error) {
    console.error("Search addresses error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to search addresses",
      details: errorMessage,
    });
  }
};

export const calculateDistance = async (
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

    const { origin_lat, origin_lng, dest_lat, dest_lng, profile } = req.query;

    if (!origin_lat || !origin_lng || !dest_lat || !dest_lng) {
      res.status(400).json({
        error: "Bad Request",
        message: "origin_lat, origin_lng, dest_lat, and dest_lng are required",
      });
      return;
    }

    const originLat = parseFloat(origin_lat as string);
    const originLng = parseFloat(origin_lng as string);
    const destLat = parseFloat(dest_lat as string);
    const destLng = parseFloat(dest_lng as string);

    if (
      isNaN(originLat) ||
      isNaN(originLng) ||
      isNaN(destLat) ||
      isNaN(destLng)
    ) {
      res.status(400).json({
        error: "Bad Request",
        message: "All coordinates must be valid numbers",
      });
      return;
    }

    const validProfile =
      profile === "walking" || profile === "cycling" ? profile : "driving";

    const result = await MapboxService.calculateDistance(
      [originLng, originLat],
      [destLng, destLat],
      validProfile,
    );

    if (!result) {
      res.status(404).json({
        error: "Not Found",
        message: "Could not calculate route",
      });
      return;
    }

    res.status(200).json({
      result: {
        distance: result.distance, // meters
        distance_km: (result.distance / 1000).toFixed(2), // kilometers
        duration: result.duration, // seconds
        duration_minutes: Math.round(result.duration / 60), // minutes
      },
    });
  } catch (error) {
    console.error("Calculate distance error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to calculate distance",
      details: errorMessage,
    });
  }
};
