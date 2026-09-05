import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import type { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { jwtVerify } from 'jose';
import {
  getJwtSecret,
  getUserById,
  signAccessToken,
  signRefreshToken,
  verifyToken,
  revokeRefreshToken,
  isRefreshTokenRevoked,
} from '../../services/auth.js';
import { requireAuth } from '../../middleware/auth.js';

const refreshSchema = z.object({
  refreshToken: z.string(),
});

const tokenRoutes: FastifyPluginAsync = async (app: FastifyInstance) => {
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
    const parsedJwt = await jwtVerify(oldToken, getJwtSecret());
    const jti = (parsedJwt.payload as { jti?: string }).jti;

    if (jti && (await isRefreshTokenRevoked(jti))) {
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
    const newJti = randomUUID();
    const [accessToken, refreshToken] = await Promise.all([
      signAccessToken(user),
      signRefreshToken(user.id, newJti),
    ]);
    return { accessToken, refreshToken };
  });

  app.post('/logout', { preHandler: [requireAuth] }, async (request, reply) => {
    const parsed = refreshSchema.safeParse(request.body);
    if (parsed.success && parsed.data.refreshToken) {
      await revokeRefreshToken(parsed.data.refreshToken);
    }
    return reply.code(204).send();
  });
};

export default tokenRoutes;
