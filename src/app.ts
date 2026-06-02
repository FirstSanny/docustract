import Fastify, { type FastifyInstance, type FastifyError } from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { env } from './config/index.js';
import authRoutes from './routes/auth/index.js';
import documentsRoutes from './routes/documents/index.js';
import pipelinesRoutes from './routes/pipelines/index.js';
import apiKeyRoutes from './routes/api-keys/index.js';
import { healthRoutes } from './routes/health.js';

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: {
      level: env.NODE_ENV === 'production' ? 'info' : 'debug',
    },
  });

  // Global error handler — normalize all unhandled errors to JSON
  app.setErrorHandler((error: FastifyError, request, reply) => {
    request.log.error(error);

    if (error.statusCode && error.statusCode < 500) {
      return reply.status(error.statusCode).send({
        statusCode: error.statusCode,
        error: error.code || 'Error',
        message: error.message,
      });
    }

    return reply.status(500).send({
      statusCode: 500,
      error: 'InternalServerError',
      message: env.NODE_ENV === 'production' ? 'An unexpected error occurred' : error.message,
    });
  });

  // Catch-all for missing routes
  app.setNotFoundHandler((_request, reply) => {
    return reply.status(404).send({
      statusCode: 404,
      error: 'NotFound',
      message: 'Route not found',
    });
  });

  // CORS — allow specified origins for browser clients
  const corsOrigins = env.CORS_ORIGINS.split(',').map((s) => s.trim());
  await app.register(cors, {
    origin: corsOrigins,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  // Multipart support for file uploads
  app.register(multipart, {
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  });

  // OpenAPI/Swagger docs
  app.register(swagger, {
    openapi: {
      info: {
        title: 'DocuStract API',
        description: 'Document processing pipeline API — a better docupipe.ai',
        version: '1.0.0',
      },
      servers: [{ url: `http://localhost:${env.PORT}`, description: 'Local' }],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
      },
    },
  });
  app.register(swaggerUi, { routePrefix: '/api-docs' });

  // Health check
  app.register(healthRoutes);

  // API routes
  app.register(authRoutes, { prefix: '/api/v1/auth' });
  app.register(documentsRoutes, { prefix: '/api/v1/documents' });
  app.register(pipelinesRoutes, { prefix: '/api/v1/pipelines' });
  app.register(apiKeyRoutes, { prefix: '/api/v1/api-keys' });

  return app;
}
