/**
 * Health endpoint tests
 *
 * Validates the /health endpoint and its dependency checks.
 * Uses the createHealthRoutes factory with injected mocks so the
 * tests are hermetic and do not require a live Postgres or Appwrite.
 */

import { describe, it, expect, vi } from 'vitest';
import Fastify, { type FastifyInstance } from 'fastify';
import { createHealthRoutes, type AppwriteProbe } from '../src/routes/health.js';

// Ensure required env vars are present before any module that imports
// ../src/config is loaded (config calls process.exit(1) on missing vars).
vi.hoisted(() => {
  process.env.NODE_ENV = 'test';
  process.env.DATABASE_URL = 'postgresql://localhost:5432/docustract_test';
  process.env.JWT_SECRET = 'a-very-long-secret-that-is-at-least-32-chars-long';
  process.env.APPWRITE_ENDPOINT = 'https://appwrite.example.test/v1';
  process.env.APPWRITE_PROJECT_ID = 'test-project';
  process.env.APPWRITE_SECRET = 'test-secret';
  process.env.APPWRITE_BUCKET_ID = 'documents';
});

interface FakeDb {
  selectFrom: ReturnType<typeof vi.fn>;
}

function makeFakeDb(behavior: 'ok' | 'throw'): FakeDb {
  return {
    selectFrom: vi.fn().mockImplementation(() => {
      if (behavior === 'throw') {
        return {
          selectAll: () => ({
            limit: () => ({
              executeTakeFirst: () => Promise.reject(new Error('connection refused')),
            }),
          }),
        };
      }
      return {
        selectAll: () => ({
          limit: () => ({
            executeTakeFirst: () => Promise.resolve({ id: '1' }),
          }),
        }),
      };
    }),
  };
}

function buildProbe(behavior: 'ok' | 'throw' | 'slow' | 'serverError'): AppwriteProbe {
  return async (_endpoint, { timeoutMs, fetchImpl }) => {
    if (behavior === 'slow') {
      await new Promise((resolve) => setTimeout(resolve, timeoutMs + 100));
      return;
    }
    if (behavior === 'throw') {
      throw new Error('ECONNREFUSED');
    }
    if (behavior === 'serverError') {
      const f = fetchImpl ?? fetch;
      const res = new Response('Internal Server Error', { status: 500 });
      // Re-create a mock Response that's "ok" false but reachable
      const mockRes = {
        ok: false,
        status: 503,
      } as unknown as Response;
      // Use real fetch behavior simulation: probe checks res.status < 500 — must throw
      if (mockRes.status >= 500) {
        throw new Error(`Appwrite health responded ${mockRes.status}`);
      }
      return;
    }
    return;
  };
}

async function buildApp(opts: {
  dbBehavior?: 'ok' | 'throw';
  probeBehavior?: 'ok' | 'throw' | 'slow' | 'serverError';
  timeoutMs?: number;
}): Promise<FastifyInstance> {
  const app = Fastify({ logger: false });
  const deps: any = {
    db: makeFakeDb(opts.dbBehavior ?? 'ok') as any,
    appwriteProbe: buildProbe(opts.probeBehavior ?? 'ok'),
    timeoutMs: opts.timeoutMs ?? 100,
  };
  await app.register(createHealthRoutes(deps));
  return app;
}

describe('GET /health', () => {
  it('returns 200 with ok status when all dependencies are healthy', async () => {
    const app = await buildApp({ dbBehavior: 'ok', probeBehavior: 'ok' });
    const res = await app.inject({ method: 'GET', url: '/health' });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.status).toBe('ok');
    expect(body.timestamp).toBeDefined();
    expect(body.dependencies).toHaveLength(2);

    const dbCheck = body.dependencies.find((c: any) => c.name === 'database');
    const appwriteCheck = body.dependencies.find((c: any) => c.name === 'appwrite');
    expect(dbCheck.status).toBe('ok');
    expect(appwriteCheck.status).toBe('ok');
    expect(typeof dbCheck.latencyMs).toBe('number');
    expect(typeof appwriteCheck.latencyMs).toBe('number');
    await app.close();
  });

  it('returns 503 with degraded status when the database is down', async () => {
    const app = await buildApp({ dbBehavior: 'throw', probeBehavior: 'ok' });
    const res = await app.inject({ method: 'GET', url: '/health' });
    expect(res.statusCode).toBe(503);
    const body = JSON.parse(res.body);
    expect(body.status).toBe('degraded');
    const dbCheck = body.dependencies.find((c: any) => c.name === 'database');
    const appwriteCheck = body.dependencies.find((c: any) => c.name === 'appwrite');
    expect(dbCheck.status).toBe('error');
    expect(dbCheck.error).toContain('connection refused');
    expect(appwriteCheck.status).toBe('ok');
    await app.close();
  });

  it('returns 503 with degraded status when Appwrite is unreachable', async () => {
    const app = await buildApp({ dbBehavior: 'ok', probeBehavior: 'throw' });
    const res = await app.inject({ method: 'GET', url: '/health' });
    expect(res.statusCode).toBe(503);
    const body = JSON.parse(res.body);
    expect(body.status).toBe('degraded');
    const appwriteCheck = body.dependencies.find((c: any) => c.name === 'appwrite');
    expect(appwriteCheck.status).toBe('error');
    expect(appwriteCheck.error).toContain('ECONNREFUSED');
    await app.close();
  });

  it('returns 503 when Appwrite returns 5xx', async () => {
    const app = await buildApp({ dbBehavior: 'ok', probeBehavior: 'serverError' });
    const res = await app.inject({ method: 'GET', url: '/health' });
    expect(res.statusCode).toBe(503);
    const body = JSON.parse(res.body);
    const appwriteCheck = body.dependencies.find((c: any) => c.name === 'appwrite');
    expect(appwriteCheck.status).toBe('error');
    expect(appwriteCheck.error).toContain('Appwrite health responded');
    await app.close();
  });

  it('returns 503 when both dependencies are unhealthy', async () => {
    const app = await buildApp({ dbBehavior: 'throw', probeBehavior: 'throw' });
    const res = await app.inject({ method: 'GET', url: '/health' });
    expect(res.statusCode).toBe(503);
    const body = JSON.parse(res.body);
    expect(body.status).toBe('degraded');
    expect(body.dependencies.every((c: any) => c.status === 'error')).toBe(true);
    await app.close();
  });

  it('times out a slow Appwrite probe within the configured budget', async () => {
    // Probe configured to "slow" (sleeps past timeout); timeout=50ms
    // We pass a custom default probe that times out via AbortController
    // by constructing a probe that uses fetch with a short timeout.
    const app = Fastify({ logger: false });
    const fetchStub: typeof fetch = (() => {
      return new Promise((_resolve, reject) => {
        // Never resolves — relies on AbortController to fire
      }) as unknown as Promise<Response>;
    }) as unknown as typeof fetch;

    // Wrap fetchStub so that the AbortController signal can interrupt it
    const abortableFetch: typeof fetch = (input, init) => {
      return new Promise((resolve, reject) => {
        const p = fetchStub(input, init);
        if (init?.signal) {
          init.signal.addEventListener('abort', () => {
            const err = new Error('aborted');
            err.name = 'AbortError';
            reject(err);
          });
        }
        p.then(resolve, reject);
      });
    };

    await app.register(
      createHealthRoutes({
        db: makeFakeDb('ok') as any,
        fetchImpl: abortableFetch,
        timeoutMs: 50,
      }),
    );

    const start = Date.now();
    const res = await app.inject({ method: 'GET', url: '/health' });
    const elapsed = Date.now() - start;

    expect(res.statusCode).toBe(503);
    const body = JSON.parse(res.body);
    const appwriteCheck = body.dependencies.find((c: any) => c.name === 'appwrite');
    expect(appwriteCheck.status).toBe('error');
    // Probe should be bounded by the timeout (~50ms) plus check bookkeeping
    expect(elapsed).toBeLessThan(1000);
    await app.close();
  });
});
