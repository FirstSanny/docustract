import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import type { FastifyInstance, FastifyPluginAsync } from 'fastify';
import {
  createUser,
  getUserByEmail,
  signAccessToken,
  signRefreshToken,
  verifyPassword,
} from '../../services/auth.js';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

const registerRoutes: FastifyPluginAsync = async (app: FastifyInstance) => {
  app.post(
    '/register',
    {
      config: {
        rateLimit: { max: 10, timeWindow: '1 minute' },
      },
      schema: {
        body: {
          type: 'object',
          properties: {
            email: { type: 'string', format: 'email' },
            password: { type: 'string', minLength: 8, maxLength: 128 },
          },
          required: ['email', 'password'],
        },
        response: {
          201: {
            type: 'object',
            properties: {
              accessToken: { type: 'string' },
              refreshToken: { type: 'string' },
              user: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  email: { type: 'string' },
                  role: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const parsed = registerSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.code(422).send({
          statusCode: 422,
          error: 'ValidationError',
          message: parsed.error.message,
        });
      }

      const { email, password } = parsed.data;

      const existing = await getUserByEmail(email);
      if (existing) {
        return reply.code(409).send({
          statusCode: 409,
          error: 'Conflict',
          message: 'An account with this email already exists',
        });
      }

      const user = await createUser(email, password);
      const [accessToken, refreshToken] = await Promise.all([
        signAccessToken(user),
        signRefreshToken(user.id, randomUUID()),
      ]);

      return reply.code(201).send({
        accessToken,
        refreshToken,
        user: { id: user.id, email: user.email, role: user.role },
      });
    },
  );

  app.post(
    '/login',
    {
      config: {
        rateLimit: { max: 5, timeWindow: '1 minute' },
      },
      schema: {
        body: {
          type: 'object',
          properties: {
            email: { type: 'string', format: 'email' },
            password: { type: 'string' },
          },
          required: ['email', 'password'],
        },
        response: {
          200: {
            type: 'object',
            properties: {
              accessToken: { type: 'string' },
              refreshToken: { type: 'string' },
              user: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  email: { type: 'string' },
                  role: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const parsed = loginSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.code(422).send({
          statusCode: 422,
          error: 'ValidationError',
          message: parsed.error.message,
        });
      }

      const { email, password } = parsed.data;

      const user = await getUserByEmail(email);
      if (!user) {
        return reply.code(401).send({
          statusCode: 401,
          error: 'Unauthorized',
          message: 'Invalid email or password',
        });
      }

      const valid = await verifyPassword(password, user.passwordHash);
      if (!valid) {
        return reply.code(401).send({
          statusCode: 401,
          error: 'Unauthorized',
          message: 'Invalid email or password',
        });
      }

      const [accessToken, refreshToken] = await Promise.all([
        signAccessToken(user),
        signRefreshToken(user.id, randomUUID()),
      ]);

      return {
        accessToken,
        refreshToken,
        user: { id: user.id, email: user.email, role: user.role },
      };
    },
  );
};

export default registerRoutes;
