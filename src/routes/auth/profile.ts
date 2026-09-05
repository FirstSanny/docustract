import type { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { getUserById } from '../../services/auth.js';
import { requireAuth } from '../../middleware/auth.js';

const profileRoutes: FastifyPluginAsync = async (app: FastifyInstance) => {
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

  app.get('/me/role', { preHandler: [requireAuth] }, async (request) => {
    return { role: request.userRole };
  });
};

export default profileRoutes;
