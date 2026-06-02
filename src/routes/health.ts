import { type FastifyInstance, type FastifyPluginAsync } from 'fastify';
import { db } from '../db/index.js';
import { getClient, getStorage } from '../services/storage.js';
import { env } from '../config/index.js';

interface DependencyCheck {
  name: string;
  status: 'ok' | 'error';
  latencyMs?: number;
  error?: string;
}

async function checkDb(): Promise<DependencyCheck> {
  const start = Date.now();
  try {
    await db.selectFrom('users').selectAll().limit(1).executeTakeFirst();
    return { name: 'database', status: 'ok', latencyMs: Date.now() - start };
  } catch (err) {
    return { name: 'database', status: 'error', latencyMs: Date.now() - start, error: String(err) };
  }
}

async function checkAppwrite(): Promise<DependencyCheck> {
  const start = Date.now();
  try {
    // Verify the client initializes without throwing
    getClient();
    // Verify the bucket is accessible by checking the APPWRITE_BUCKET_ID env var is present
    if (!env.APPWRITE_BUCKET_ID) throw new Error('APPWRITE_BUCKET_ID not configured');
    return { name: 'appwrite', status: 'ok', latencyMs: Date.now() - start };
  } catch (err) {
    return { name: 'appwrite', status: 'error', latencyMs: Date.now() - start, error: String(err) };
  }
}

export const healthRoutes: FastifyPluginAsync = async (app: FastifyInstance) => {
  app.get('/health', async (request, reply) => {
    const [dbResult, appwriteResult] = await Promise.allSettled([
      checkDb(),
      checkAppwrite(),
    ]);

    const checks: DependencyCheck[] = [
      dbResult.status === 'fulfilled' ? dbResult.value : { name: 'database', status: 'error', error: 'Check failed' },
      appwriteResult.status === 'fulfilled' ? appwriteResult.value : { name: 'appwrite', status: 'error', error: 'Check failed' },
    ];

    const allOk = checks.every((c) => c.status === 'ok');
    const httpStatus = allOk ? 200 : 503;

    return reply.status(httpStatus).send({
      status: allOk ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      environment: env.NODE_ENV,
      dependencies: checks,
    });
  });
};
