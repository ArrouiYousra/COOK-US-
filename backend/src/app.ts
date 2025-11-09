import express, { type Express, type Request, type Response, type NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

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

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  });
});

// API routes (will be added later)
// app.use('/api', routes);

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
