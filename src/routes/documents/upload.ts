import type { FastifyInstance, FastifyPluginAsync, FastifyRequest } from 'fastify';
import { createDocument, updateDocument } from '../../services/documents.js';
import { uploadFile } from '../../services/storage.js';
import { requireAuth, requireRole } from '../../middleware/auth.js';

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'text/csv',
  'application/rtf',
  'application/zip',
  'application/x-zip-compressed',
]);

const uploadRoutes: FastifyPluginAsync = async (app: FastifyInstance) => {
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
};

export { ALLOWED_MIME_TYPES };
export default uploadRoutes;
