import type { FastifyInstance, FastifyPluginAsync } from 'fastify';
import rateLimit from '@fastify/rate-limit';
import registerRoutes from './register.js';
import tokenRoutes from './token.js';
import profileRoutes from './profile.js';

const authRoutes: FastifyPluginAsync = async (app: FastifyInstance) => {
  await app.register(rateLimit, {
    global: false,
    max: 10,
    timeWindow: '1 minute',
    keyGenerator: (request) => request.ip,
  });

  await app.register(registerRoutes);
  await app.register(tokenRoutes);
  await app.register(profileRoutes);
};

export default authRoutes;
