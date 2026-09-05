import type { FastifyInstance, FastifyPluginAsync } from 'fastify';
import uploadRoutes from './upload.js';
import crudRoutes from './crud.js';

const documentsRoutes: FastifyPluginAsync = async (app: FastifyInstance) => {
  await app.register(uploadRoutes);
  await app.register(crudRoutes);
};

export default documentsRoutes;
