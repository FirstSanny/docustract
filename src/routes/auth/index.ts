import { z } from 'zod';
import type { FastifyInstance, FastifyPluginAsync } from 'fastify';
import rateLimit from '@fastify/rate-limit';
import { jwtVerify } from 'jose';
import {
  createUser,
  getUserByEmail,
  getUserById,
  signAccessToken,
  signRefreshToken,
  verifyPassword,
  verifyToken,
  revokeRefreshToken,
  isRefreshTokenRevoked,
} from '../../services/auth.js';
import { requireAuth } from '../../middleware/auth.js';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

const refreshSchema = z.object({
  refreshToken: z.string(),
});

const authRoutes: FastifyPluginAsync = async (app: FastifyInstance) => {
  // Global rate limit for auth routes (stricter on login/register)
  await app.register(rateLimit, {
    global: false,
    max: 10,
    timeWindow: '1 minute',
    keyGenerator: (request) => request.ip,
  });

  // POST /auth/register
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
        signRefreshToken(user.id, crypto.randomUUID()),
      ]);

      return reply.code(201).send({
        accessToken,
        refreshToken,
        user: { id: user.id, email: user.email, role: user.role },
      });
    },
  );

  // POST /auth/login
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
        signRefreshToken(user.id, crypto.randomUUID()),
      ]);

      return {
        accessToken,
        refreshToken,
        user: { id: user.id, email: user.email, role: user.role },
      };
    },
  );

  // POST /auth/refresh
  app.post('/refresh', async (request, reply) => {
    const parsed = refreshSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(422).send({
        statusCode: 422,
        error: 'ValidationError',
        message: parsed.error.message,
      });
    }

    const oldToken = parsed.data.refreshToken;
    const parsedJwt = await jwtVerify(oldToken, new TextEncoder().encode(process.env.JWT_SECRET ?? ''));
    const jti = (parsedJwt.payload as { jti?: string }).jti;

    // Check revocation list
    if (jti && await isRefreshTokenRevoked(jti)) {
      return reply.code(401).send({
        statusCode: 401,
        error: 'Unauthorized',
        message: 'This refresh token has been revoked',
      });
    }

    const payload = await verifyToken(oldToken);

    if (!payload) {
      return reply.code(401).send({
        statusCode: 401,
        error: 'Unauthorized',
        message: 'Invalid or expired refresh token',
      });
    }

    const user = await getUserById(payload.sub);
    if (!user) {
      return reply.code(401).send({
        statusCode: 401,
        error: 'Unauthorized',
        message: 'User not found',
      });
    }

    // Rotate: revoke old token, issue new pair
    if (jti) await revokeRefreshToken(oldToken);
    const newJti = crypto.randomUUID();
    const [accessToken, refreshToken] = await Promise.all([
      signAccessToken(user),
      signRefreshToken(user.id, newJti),
    ]);
    return { accessToken, refreshToken };
  });

  // POST /auth/logout
  app.post('/logout', { preHandler: [requireAuth] }, async (request, reply) => {
    const parsed = refreshSchema.safeParse(request.body);
    if (parsed.success && parsed.data.refreshToken) {
      await revokeRefreshToken(parsed.data.refreshToken);
    }
    return reply.code(204).send();
  });

  // GET /auth/me
  app.get('/me', { preHandler: [requireAuth] }, async (request, reply) => {
    const user = await getUserById(request.userId!);
    if (!user) {
      return reply.code(404).send({
        statusCode: 404,
        error: 'NotFound',
        message: 'User not found',
      });
    }
    return { id: user.id, email: user.email, role: user.role };
  });

  // GET /auth/me/role — returns the authenticated user's role (for client-side RBAC decisions)
  app.get('/me/role', { preHandler: [requireAuth] }, async (request, reply) => {
    return { role: request.userRole };
  });
};

export default authRoutes;
