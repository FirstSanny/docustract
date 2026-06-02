import { z } from 'zod';
import type { FastifyInstance, FastifyPluginAsync } from 'fastify';
import {
  createPipeline,
  deletePipeline,
  getPipelineById,
  listPipelines,
} from '../../services/pipelines.js';
import { getDocumentById } from '../../services/documents.js';
import { requireAuth, requireRole } from '../../middleware/auth.js';

const paginationSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

const createPipelineSchema = z.object({
  documentId: z.string().uuid(),
  type: z.string().min(1).max(100),
});

const pipelineParamsSchema = z.object({
  id: z.string().uuid(),
});

const pipelinesRoutes: FastifyPluginAsync = async (app: FastifyInstance) => {
  // POST /pipelines — requires admin or editor role
  app.post('/', { preHandler: [requireAuth, requireRole('admin', 'editor')] }, async (request, reply) => {
    const parsed = createPipelineSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(422).send({
        statusCode: 422,
        error: 'ValidationError',
        message: parsed.error.message,
        details: parsed.error.flatten(),
      });
    }

    const document = await getDocumentById(parsed.data.documentId, request.userId!);
    if (!document) {
      return reply.code(404).send({
        statusCode: 404,
        error: 'NotFound',
        message: 'Document not found',
      });
    }

    const pipeline = await createPipeline({ ...parsed.data, userId: request.userId! });
    return reply.code(201).send(pipeline);
  });

  // GET /pipelines
  app.get('/', async (request, reply) => {
    const parsed = paginationSchema.safeParse(request.query);
    if (!parsed.success) {
      return reply.code(422).send({
        statusCode: 422,
        error: 'ValidationError',
        message: parsed.error.message,
      });
    }

    const result = await listPipelines(request.userId!, parsed.data);
    return {
      data: result.data,
      meta: {
        total: result.total,
        limit: result.limit,
        offset: result.offset,
      },
    };
  });

  // GET /pipelines/:id
  app.get('/:id', async (request, reply) => {
    const parsed = pipelineParamsSchema.safeParse(request.params);
    if (!parsed.success) {
      return reply.code(422).send({
        statusCode: 422,
        error: 'ValidationError',
        message: parsed.error.message,
      });
    }

    const pipeline = await getPipelineById(parsed.data.id, request.userId!);
    if (!pipeline) {
      return reply.code(404).send({
        statusCode: 404,
        error: 'NotFound',
        message: 'Pipeline not found',
      });
    }

    return pipeline;
  });

  // GET /pipelines/:id/status
  app.get('/:id/status', async (request, reply) => {
    const parsed = pipelineParamsSchema.safeParse(request.params);
    if (!parsed.success) {
      return reply.code(422).send({
        statusCode: 422,
        error: 'ValidationError',
        message: parsed.error.message,
      });
    }

    const pipeline = await getPipelineById(parsed.data.id, request.userId!);
    if (!pipeline) {
      return reply.code(404).send({
        statusCode: 404,
        error: 'NotFound',
        message: 'Pipeline not found',
      });
    }

    return { id: pipeline.id, status: pipeline.status };
  });

  // GET /pipelines/:id/result
  app.get('/:id/result', async (request, reply) => {
    const parsed = pipelineParamsSchema.safeParse(request.params);
    if (!parsed.success) {
      return reply.code(422).send({
        statusCode: 422,
        error: 'ValidationError',
        message: parsed.error.message,
      });
    }

    const pipeline = await getPipelineById(parsed.data.id, request.userId!);
    if (!pipeline) {
      return reply.code(404).send({
        statusCode: 404,
        error: 'NotFound',
        message: 'Pipeline not found',
      });
    }

    if (!pipeline.result) {
      return reply.code(422).send({
        statusCode: 422,
        error: 'ResultNotReady',
        message: 'Pipeline result is not available yet',
      });
    }

    return { id: pipeline.id, result: pipeline.result };
  });

  // DELETE /pipelines/:id
  app.delete('/:id', async (request, reply) => {
    const parsed = pipelineParamsSchema.safeParse(request.params);
    if (!parsed.success) {
      return reply.code(422).send({
        statusCode: 422,
        error: 'ValidationError',
        message: parsed.error.message,
      });
    }

    const deleted = await deletePipeline(parsed.data.id, request.userId!);
    if (!deleted) {
      return reply.code(404).send({
        statusCode: 404,
        error: 'NotFound',
        message: 'Pipeline not found',
      });
    }

    return reply.code(204).send();
  });
};

export default pipelinesRoutes;
