import swaggerJsdoc from 'swagger-jsdoc';
import type { SwaggerDefinition } from 'swagger-jsdoc';

const swaggerDefinition: SwaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'COOK-US API',
    version: '1.0.0',
    description: 'API backend for COOK-US - Plateforme de cuisine à domicile',
    contact: {
      name: 'API Support',
    },
  },
  servers: [
    {
      url: 'http://localhost:3000',
      description: 'Development server',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
  },
  tags: [
    {
      name: 'Auth',
      description: 'Authentication endpoints',
    },
    {
      name: 'Profiles',
      description: 'User profiles management',
    },
    {
      name: 'Bookings',
      description: 'Bookings management',
    },
    {
      name: 'Reservations',
      description: 'Reservations management (cooks applying to bookings)',
    },
    {
      name: 'Reviews',
      description: 'Reviews and ratings system',
    },
    {
      name: 'Availabilities',
      description: 'Cook availabilities and blocked dates management',
    },
    {
      name: 'Addresses',
      description: 'Client addresses management with PostGIS geolocation',
    },
    {
      name: 'Messages',
      description: 'Messaging system',
    },
  ],
};

const options = {
  definition: swaggerDefinition,
  apis: ['./src/**/*.routes.ts', './src/**/*.controllers.ts'], // Paths to files containing OpenAPI definitions
};

export const swaggerSpec = swaggerJsdoc(options);

