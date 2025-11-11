import express, { type Express, type Request, type Response } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "@config/swagger";
import authRoutes from "@domain/auth/auth.routes";
import profileRoutes from "@domain/profiles/profile.routes";
import bookingRoutes from "@domain/bookings/booking.routes";
import reservationRoutes from "@domain/reservations/reservation.routes";
import reviewRoutes from "@domain/reviews/review.routes";
import availabilityRoutes from "@domain/availabilities/availability.routes";
import addressRoutes from "@domain/addresses/address.routes";
import favoriteRoutes from "@domain/favorites/favorite.routes";
import notificationRoutes from "@domain/notifications/notification.routes";
import messageRoutes from "@domain/messages/message.routes";
import portfolioRoutes from "@domain/portfolio/portfolio.routes";
import certificationRoutes from "@domain/certifications/certification.routes";
import disputeRoutes from "@domain/disputes/dispute.routes";
import paymentRoutes from "@domain/payments/payment.routes";
import transactionRoutes from "@domain/transactions/transaction.routes";
import clientPreferencesRoutes from "@domain/clientPreferences/clientPreferences.routes";
import mapboxRoutes from "@domain/mapbox/mapbox.routes";
import clientFiltersRoutes from "@domain/clientFilters/filter.routes";

// Load environment variables
dotenv.config();

// Import core modules (will be created later)
// import { errorHandler } from '@core/errors';
// import { logger } from '@config/logger';

const app: Express = express();

// Middleware
const frontendOrigin = process.env.FRONTEND_URL || "http://localhost:3000";

app.use(
  cors({
    origin: [frontendOrigin, "http://localhost:3000", "http://127.0.0.1:3000"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Cookie"],
  }),
);
app.use(cookieParser());

// IMPORTANT: Stripe webhook needs raw body for signature verification
// Configure raw body parser for webhook endpoint only
app.use("/api/payments/webhook", express.raw({ type: "application/json" }));

// JSON parsing for all other routes
// Augmenter la limite pour permettre les avatars base64 (jusqu'à 500KB)
app.use(express.json({ limit: "500kb" }));
app.use(express.urlencoded({ extended: true, limit: "500kb" }));

// Swagger documentation
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Health check endpoint
app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({
    status: "ok",
    message: "Server is running",
    timestamp: new Date().toISOString(),
  });
});

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/profiles", profileRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/reservations", reservationRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/availabilities", availabilityRoutes);
app.use("/api/addresses", addressRoutes);
app.use("/api/bookings", addressRoutes); // For booking address route
app.use("/api/favorites", favoriteRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/portfolio", portfolioRoutes);
app.use("/api/certifications", certificationRoutes);
app.use("/api/disputes", disputeRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/client-preferences", clientPreferencesRoutes);
app.use("/api/mapbox", mapboxRoutes);
app.use("/api/client", clientFiltersRoutes);

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    error: "Not Found",
    message: "The requested resource was not found",
  });
});

// Global error handler (will be implemented later)
// app.use(errorHandler);

export default app;
