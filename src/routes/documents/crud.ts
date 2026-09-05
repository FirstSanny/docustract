import { z } from 'zod';
import type { FastifyInstance, FastifyPluginAsync } from 'fastify';
import {
  createDocument,
  deleteDocument,
  getDocumentById,
  listDocuments,
  updateDocument,
} from '../../services/documents.js';
import { deleteFile } from '../../services/storage.js';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { ALLOWED_MIME_TYPES } from './upload.js';

const paginationSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

const createDocumentSchema = z
  .object({
    name: z.string().min(1).max(255),
    mimeType: z.string().min(1).max(100),
    sizeBytes: z.number().int().min(0),
    metadata: z.record(z.unknown()).optional(),
  })
  .refine((data) => ALLOWED_MIME_TYPES.has(data.mimeType), {
    message: `MIME type not allowed. Use one of: ${[...ALLOWED_MIME_TYPES].join(', ')}`,
  });

const updateDocumentSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  status: z.enum(['pending', 'processing', 'done', 'failed']).optional(),
  metadata: z.record(z.unknown()).optional(),
});

const documentParamsSchema = z.object({
  id: z.string().uuid(),
});

const crudRoutes: FastifyPluginAsync = async (app: FastifyInstance) => {
  app.post('/', { preHandler: [requireAuth, requireRole('admin')] }, async (request, reply) => {
    const parsed = createDocumentSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(422).send({
        statusCode: 422,
        error: 'ValidationError',
        message: parsed.error.message,
        details: parsed.error.flatten(),
      });
    }

    const doc = await createDocument({ ...parsed.data, userId: request.userId! });
    return reply.code(201).send(doc);
  });

  app.get('/', async (request, reply) => {
    const parsed = paginationSchema.safeParse(request.query);
    if (!parsed.success) {
      return reply.code(422).send({
        statusCode: 422,
        error: 'ValidationError',
        message: parsed.error.message,
      });
    }

    const result = await listDocuments(request.userId!, parsed.data);
    return {
      data: result.data,
      meta: {
        total: result.total,
        limit: result.limit,
        offset: result.offset,
      },
    };
  });

  app.get('/:id', async (request, reply) => {
    const parsed = documentParamsSchema.safeParse(request.params);
    if (!parsed.success) {
      return reply.code(422).send({
        statusCode: 422,
        error: 'ValidationError',
        message: parsed.error.message,
      });
    }

    const doc = await getDocumentById(parsed.data.id, request.userId!);
    if (!doc) {
      return reply.code(404).send({
        statusCode: 404,
        error: 'NotFound',
        message: 'Document not found',
      });
    }

    return doc;
  });

  app.patch(
    '/:id',
    { preHandler: [requireAuth, requireRole('admin', 'editor')] },
    async (request, reply) => {
      const paramsParsed = documentParamsSchema.safeParse(request.params);
      if (!paramsParsed.success) {
        return reply.code(422).send({
          statusCode: 422,
          error: 'ValidationError',
          message: paramsParsed.error.message,
        });
      }

      const bodyParsed = updateDocumentSchema.safeParse(request.body);
      if (!bodyParsed.success) {
        return reply.code(422).send({
          statusCode: 422,
          error: 'ValidationError',
          message: bodyParsed.error.message,
          details: bodyParsed.error.flatten(),
        });
      }

      const doc = await updateDocument(paramsParsed.data.id, request.userId!, bodyParsed.data);
      if (!doc) {
        return reply.code(404).send({
          statusCode: 404,
          error: 'NotFound',
          message: 'Document not found',
        });
      }

      return doc;
    },
  );

  app.delete('/:id', async (request, reply) => {
    const parsed = documentParamsSchema.safeParse(request.params);
    if (!parsed.success) {
      return reply.code(422).send({
        statusCode: 422,
        error: 'ValidationError',
        message: parsed.error.message,
      });
    }

    const existing = await getDocumentById(parsed.data.id, request.userId!);
    if (!existing) {
      return reply.code(404).send({
        statusCode: 404,
        error: 'NotFound',
        message: 'Document not found',
      });
    }

    const deleted = await deleteDocument(parsed.data.id, request.userId!);
    if (!deleted) {
      return reply.code(404).send({
        statusCode: 404,
        error: 'NotFound',
        message: 'Document not found',
      });
    }

    if (existing.storageId) {
      try {
        await deleteFile(existing.storageId);
      } catch (err) {
        request.log.warn(
          { err, fileId: existing.storageId },
          'Failed to delete file from Appwrite',
        );
      }
    }

    return reply.code(204).send();
  });
};

export default crudRoutes;
