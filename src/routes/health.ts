import { type FastifyInstance, type FastifyPluginAsync } from 'fastify';
import { db as defaultDb } from '../db/index.js';
import { env } from '../config/index.js';

export interface DependencyCheck {
  name: string;
  status: 'ok' | 'error';
  latencyMs?: number;
  error?: string;
}

export interface AppwriteProbeOptions {
  timeoutMs: number;
  fetchImpl?: typeof fetch;
}

const defaultAppwriteProbe = async (
  endpoint: string,
  options: AppwriteProbeOptions,
): Promise<void> => {
  const f = options.fetchImpl ?? fetch;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), options.timeoutMs);
  try {
    const res = await f(`${endpoint.replace(/\/$/, '')}/health`, {
      method: 'GET',
      signal: controller.signal,
    });
    if (!res.ok && res.status >= 500) {
      throw new Error(`Appwrite health responded ${res.status}`);
    }
  } finally {
    clearTimeout(timer);
  }
};

export type AppwriteProbe = typeof defaultAppwriteProbe;

const APPWRITE_TIMEOUT_MS = 2000;

export interface HealthDeps {
  db?: typeof defaultDb;
  appwriteProbe?: AppwriteProbe;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
}

async function checkDb(db: typeof defaultDb): Promise<DependencyCheck> {
  const start = Date.now();
  try {
    await db.selectFrom('users').selectAll().limit(1).executeTakeFirst();
    return { name: 'database', status: 'ok', latencyMs: Date.now() - start };
  } catch (err) {
    return { name: 'database', status: 'error', latencyMs: Date.now() - start, error: String(err) };
  }
}

async function checkAppwrite(
  probe: AppwriteProbe,
  endpoint: string,
  timeoutMs: number,
  fetchImpl?: typeof fetch,
): Promise<DependencyCheck> {
  const start = Date.now();
  if (!env.APPWRITE_BUCKET_ID) {
    return {
      name: 'appwrite',
      status: 'error',
      latencyMs: Date.now() - start,
      error: 'APPWRITE_BUCKET_ID not configured',
    };
  }
  try {
    await probe(endpoint, { timeoutMs, fetchImpl });
    return { name: 'appwrite', status: 'ok', latencyMs: Date.now() - start };
  } catch (err) {
    return { name: 'appwrite', status: 'error', latencyMs: Date.now() - start, error: String(err) };
  }
}

export function createHealthRoutes(deps: HealthDeps = {}): FastifyPluginAsync {
  return async (app: FastifyInstance) => {
    const db = deps.db ?? defaultDb;
    const probe = deps.appwriteProbe ?? defaultAppwriteProbe;
    const fetchImpl = deps.fetchImpl;
    const timeoutMs = deps.timeoutMs ?? APPWRITE_TIMEOUT_MS;

    app.get('/health', async (_request, reply) => {
      const [dbResult, appwriteResult] = await Promise.allSettled([
        checkDb(db),
        checkAppwrite(probe, env.APPWRITE_ENDPOINT, timeoutMs, fetchImpl),
      ]);

      const checks: DependencyCheck[] = [
        dbResult.status === 'fulfilled'
          ? dbResult.value
          : { name: 'database', status: 'error', error: 'Check failed' },
        appwriteResult.status === 'fulfilled'
          ? appwriteResult.value
          : { name: 'appwrite', status: 'error', error: 'Check failed' },
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
}

export const healthRoutes = createHealthRoutes();
