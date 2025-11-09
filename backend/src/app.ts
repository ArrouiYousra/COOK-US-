import express, { type Express, type Request, type Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from '@config/swagger';
import authRoutes from '@domain/auth/auth.routes';
import profileRoutes from '@domain/profiles/profile.routes';
import bookingRoutes from '@domain/bookings/booking.routes';
import reservationRoutes from '@domain/reservations/reservation.routes';
import reviewRoutes from '@domain/reviews/review.routes';
import availabilityRoutes from '@domain/availabilities/availability.routes';
import messageRoutes from '@domain/messages/message.routes';

// Load environment variables
dotenv.config();

// Import core modules (will be created later)
// import { errorHandler } from '@core/errors';
// import { logger } from '@config/logger';

const app: Express = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Swagger documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/profiles', profileRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/bookings', reservationRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/availabilities', availabilityRoutes);
app.use('/api/messages', messageRoutes);

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'The requested resource was not found',
  });
});

// Global error handler (will be implemented later)
// app.use(errorHandler);

export default app;
