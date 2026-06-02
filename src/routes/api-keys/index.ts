import { z } from 'zod';
import type { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { createApiKey, listApiKeys, deleteApiKey } from '../../services/api-keys.js';
import { requireAuth } from '../../middleware/auth.js';

const createApiKeySchema = z.object({
  name: z.string().min(1).max(100),
  expiresAt: z.string().datetime().optional(),
});

const apiKeyParamsSchema = z.object({
  id: z.string().uuid(),
});

const apiKeyRoutes: FastifyPluginAsync = async (app: FastifyInstance) => {
  app.addHook('preHandler', requireAuth);

  // POST /api-keys — create a new API key
  app.post('/', async (request, reply) => {
    const parsed = createApiKeySchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(422).send({
        statusCode: 422,
        error: 'ValidationError',
        message: parsed.error.message,
        details: parsed.error.flatten(),
      });
    }

    const created = await createApiKey({
      userId: request.userId!,
      name: parsed.data.name,
      expiresAt: parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : null,
    });

    return reply.code(201).send({
      id: created.id,
      keyPrefix: created.keyPrefix,
      plaintextKey: created.plaintextKey,
      name: created.name,
      expiresAt: created.expiresAt,
      createdAt: created.createdAt,
    });
  });

  // GET /api-keys — list user's API keys (no plaintext returned)
  app.get('/', async (request) => {
    const keys = await listApiKeys(request.userId!);
    return {
      data: keys.map((k) => ({
        id: k.id,
        keyPrefix: k.keyPrefix,
        name: k.name,
        lastUsedAt: k.lastUsedAt,
        expiresAt: k.expiresAt,
        createdAt: k.createdAt,
      })),
    };
  });

  // DELETE /api-keys/:id — revoke and delete an API key
  app.delete('/:id', async (request, reply) => {
    const parsed = apiKeyParamsSchema.safeParse(request.params);
    if (!parsed.success) {
      return reply.code(422).send({
        statusCode: 422,
        error: 'ValidationError',
        message: parsed.error.message,
      });
    }

    const deleted = await deleteApiKey(parsed.data.id, request.userId!);
    if (!deleted) {
      return reply.code(404).send({
        statusCode: 404,
        error: 'NotFound',
        message: 'API key not found',
      });
    }

    return reply.code(204).send();
  });
};

export default apiKeyRoutes;
