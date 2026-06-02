import { z } from 'zod';
import type { FastifyInstance, FastifyPluginAsync, FastifyRequest } from 'fastify';
import {
  createDocument,
  deleteDocument,
  getDocumentById,
  listDocuments,
  updateDocument,
} from '../../services/documents.js';
import { uploadFile, deleteFile } from '../../services/storage.js';
import { requireAuth, requireRole } from '../../middleware/auth.js';

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

const ALLOWED_MIME_TYPES = new Set([
  // PDF
  'application/pdf',
  // Images
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  // Office documents
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  // Plain text and markup
  'text/plain',
  'text/csv',
  'application/rtf',
  // Archives
  'application/zip',
  'application/x-zip-compressed',
]);

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

const documentsRoutes: FastifyPluginAsync = async (app: FastifyInstance) => {
  // Upload and create require admin (resource creation)
  app.post(
    '/upload',
    { preHandler: [requireAuth, requireRole('admin')] },
    async (request: FastifyRequest, reply) => {
      try {
        const data = await request.file({
          limits: { fileSize: MAX_FILE_SIZE },
        });

        if (!data) {
          return reply.code(400).send({
            statusCode: 400,
            error: 'BadRequest',
            message: 'No file provided',
          });
        }

        if (!ALLOWED_MIME_TYPES.has(data.mimetype)) {
          return reply.code(415).send({
            statusCode: 415,
            error: 'UnsupportedMediaType',
            message: `File type '${data.mimetype}' is not allowed. Supported types: PDF, images, Word, Excel, PowerPoint, plain text, CSV, RTF, and ZIP.`,
          });
        }

        const chunks: Buffer[] = [];
        for await (const chunk of data.file) {
          chunks.push(chunk);
        }
        const fileBuffer = Buffer.concat(chunks);

        const uploadResult = await uploadFile({
          fileData: fileBuffer,
          fileName: data.filename,
          mimeType: data.mimetype,
        });

        const doc = await createDocument({
          userId: request.userId!,
          name: data.filename,
          mimeType: data.mimetype,
          sizeBytes: fileBuffer.length,
          metadata: {},
        });

        const updated = await updateDocument(doc.id, request.userId!, {
          storageId: uploadResult.id,
          storagePreviewUrl: uploadResult.previewUrl,
          storageDownloadUrl: uploadResult.downloadUrl,
        });

        return reply.code(201).send(updated ?? doc);
      } catch (err) {
        request.log.error(err, 'File upload failed');
        return reply.code(500).send({
          statusCode: 500,
          error: 'UploadError',
          message: 'Failed to upload file',
        });
      }
    },
  );

  // POST /documents — admin only (resource creation)
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

  // GET /documents — all authenticated users
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

  // GET /documents/:id
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

  // PATCH /documents/:id — admin or editor only (status changes, etc.)
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

  // DELETE /documents/:id
  app.delete('/:id', async (request, reply) => {
    const parsed = documentParamsSchema.safeParse(request.params);
    if (!parsed.success) {
      return reply.code(422).send({
        statusCode: 422,
        error: 'ValidationError',
        message: parsed.error.message,
      });
    }

    // Fetch first to get storage ID for cleanup
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

    // Clean up file from Appwrite storage
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

export default documentsRoutes;
