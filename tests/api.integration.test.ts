/**
 * API Integration Tests
 *
 * Uses Fastify's inject() to test HTTP behavior without a live server.
 * Mocks are created at runtime (not via vi.mock hoisting) to avoid
 * ESM import ordering issues.
 *
 * Run with: npm run test
 */

import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import Fastify, { type FastifyInstance, type FastifyPluginAsync } from 'fastify';
import { serializerCompiler, validatorCompiler, type ZodTypeProvider } from 'fastify-type-provider-zod';
import bcrypt from 'bcrypt';
import { SignJWT, jwtVerify } from 'jose';

// ─── Timestamp helper ────────────────────────────────────────────────────────

function ts(): Date { return new Date(); }

// ─── In-memory data stores (shared across mocked services) ─────────────────────

const users = new Map<string, {
  id: string; email: string; password_hash: string;
  role: 'admin' | 'editor' | 'viewer';
  created_at: Date; updated_at: Date;
}>();

const documents = new Map<string, {
  id: string; user_id: string; name: string; mime_type: string;
  size_bytes: number; status: string; metadata: Record<string, unknown>;
  created_at: Date; updated_at: Date;
}>();

const pipelines = new Map<string, {
  id: string; user_id: string; document_id: string; type: string;
  status: string; result: Record<string, unknown> | null; error_message: string | null;
  created_at: Date; updated_at: Date;
}>();

const apiKeys = new Map<string, {
  id: string; user_id: string; key_prefix: string; key_hash: string;
  name: string; last_used_at: Date | null; expires_at: Date | null;
  created_at: Date;
}>();

const JWT_SECRET = 'test-jwt-secret-that-is-at-least-32-chars';

// ─── Token helper ────────────────────────────────────────────────────────────

async function signAccessToken(user: { id: string; email: string; role: string }): Promise<string> {
  return new SignJWT({ email: user.email, role: user.role })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime('15m')
    .sign(new TextEncoder().encode(JWT_SECRET));
}

async function signRefreshToken(userId: string): Promise<string> {
  return new SignJWT({})
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(new TextEncoder().encode(JWT_SECRET));
}

async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(JWT_SECRET));
    return payload as { sub: string; email: string; role: string };
  } catch {
    return null;
  }
}

function resetStores() {
  users.clear();
  documents.clear();
  pipelines.clear();
  apiKeys.clear();
}

// ─── Mock services (as Fastify plugins) ─────────────────────────────────────

const mockAuthPlugin: FastifyPluginAsync = async (app) => {
  app.post('/register', async (request, reply) => {
    const body = request.body as { email?: string; password?: string };
    if (!body?.email || !body?.password) {
      return reply.code(422).send({ statusCode: 422, error: 'ValidationError', message: 'Missing fields' });
    }
    if (body.password.length < 8) {
      return reply.code(422).send({ statusCode: 422, error: 'ValidationError', message: 'Password too short' });
    }
    if (users.has(body.email.toLowerCase())) {
      return reply.code(409).send({ statusCode: 409, error: 'Conflict', message: 'An account with this email already exists' });
    }
    const id = crypto.randomUUID();
    const user = {
      id,
      email: body.email.toLowerCase(),
      password_hash: await bcrypt.hash(body.password, 12),
      role: 'viewer' as const,
      created_at: ts(),
      updated_at: ts(),
    };
    users.set(user.email, user);
    const [accessToken, refreshToken] = await Promise.all([
      signAccessToken({ id, email: user.email, role: user.role }),
      signRefreshToken(id),
    ]);
    return reply.code(201).send({ accessToken, refreshToken, user: { id, email: user.email, role: user.role } });
  });

  app.post('/login', async (request, reply) => {
    const body = request.body as { email?: string; password?: string };
    if (!body?.email || !body?.password) {
      return reply.code(422).send({ statusCode: 422, error: 'ValidationError', message: 'Missing fields' });
    }
    const user = users.get(body.email.toLowerCase());
    if (!user) {
      return reply.code(401).send({ statusCode: 401, error: 'Unauthorized', message: 'Invalid email or password' });
    }
    if (!(await bcrypt.compare(body.password, user.password_hash))) {
      return reply.code(401).send({ statusCode: 401, error: 'Unauthorized', message: 'Invalid email or password' });
    }
    const [accessToken, refreshToken] = await Promise.all([
      signAccessToken({ id: user.id, email: user.email, role: user.role }),
      signRefreshToken(user.id),
    ]);
    return { accessToken, refreshToken, user: { id: user.id, email: user.email, role: user.role } };
  });

  app.post('/refresh', async (request, reply) => {
    const body = request.body as { refreshToken?: string };
    if (!body?.refreshToken) {
      return reply.code(422).send({ statusCode: 422, error: 'ValidationError', message: 'Missing refresh token' });
    }
    const payload = await verifyToken(body.refreshToken);
    if (!payload) {
      return reply.code(401).send({ statusCode: 401, error: 'Unauthorized', message: 'Invalid or expired refresh token' });
    }
    const user = [...users.values()].find(u => u.id === payload.sub);
    if (!user) {
      return reply.code(401).send({ statusCode: 401, error: 'Unauthorized', message: 'User not found' });
    }
    const accessToken = await signAccessToken({ id: user.id, email: user.email, role: user.role });
    return { accessToken };
  });

  app.get('/me', { preHandler: [async (request, reply) => {
    const header = request.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      return reply.code(401).send({ statusCode: 401, error: 'Unauthorized', message: 'Missing or invalid Authorization header' });
    }
    const payload = await verifyToken(header.slice(7));
    if (!payload) {
      return reply.code(401).send({ statusCode: 401, error: 'Unauthorized', message: 'Invalid or expired token' });
    }
    request.userId = payload.sub;
    request.userRole = payload.role;
  }] }, async (request, reply) => {
    const user = [...users.values()].find(u => u.id === request.userId);
    if (!user) {
      return reply.code(404).send({ statusCode: 404, error: 'NotFound', message: 'User not found' });
    }
    return { id: user.id, email: user.email, role: user.role };
  });
};

const mockDocumentsPlugin: FastifyPluginAsync = async (app) => {
  app.addHook('preHandler', async (request, reply) => {
    const header = request.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      return reply.code(401).send({ statusCode: 401, error: 'Unauthorized', message: 'Missing or invalid Authorization header' });
    }
    const payload = await verifyToken(header.slice(7));
    if (!payload) {
      return reply.code(401).send({ statusCode: 401, error: 'Unauthorized', message: 'Invalid or expired token' });
    }
    request.userId = payload.sub;
  });

  app.post('/', async (request, reply) => {
    const body = request.body as { name?: string; mimeType?: string; sizeBytes?: number; metadata?: Record<string, unknown> };
    if (!body?.name || !body?.mimeType || typeof body.sizeBytes !== 'number') {
      return reply.code(422).send({ statusCode: 422, error: 'ValidationError', message: 'Invalid document data' });
    }
    const doc = {
      id: crypto.randomUUID(),
      user_id: request.userId!,
      name: body.name,
      mime_type: body.mimeType,
      size_bytes: body.sizeBytes,
      status: 'pending',
      metadata: body.metadata ?? {},
      created_at: ts(),
      updated_at: ts(),
    };
    documents.set(doc.id, doc);
    return reply.code(201).send({
      id: doc.id, userId: doc.user_id, name: doc.name, mimeType: doc.mime_type,
      sizeBytes: doc.size_bytes, status: doc.status, metadata: doc.metadata,
      createdAt: doc.created_at, updatedAt: doc.updated_at,
    });
  });

  app.get('/', async (request, reply) => {
    const query = request.query as { limit?: string; offset?: string };
    const limit = Math.min(parseInt(query.limit ?? '20') || 20, 100);
    const offset = parseInt(query.offset ?? '0') || 0;
    const all = [...documents.values()].filter(d => d.user_id === request.userId)
      .sort((a, b) => b.created_at.getTime() - a.created_at.getTime());
    return {
      data: all.slice(offset, offset + limit).map(d => ({
        id: d.id, userId: d.user_id, name: d.name, mimeType: d.mime_type,
        sizeBytes: d.size_bytes, status: d.status, metadata: d.metadata,
        createdAt: d.created_at, updatedAt: d.updated_at,
      })),
      meta: { total: all.length, limit, offset },
    };
  });

  app.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    if (!/^[0-9a-f-]{36}$/i.test(id)) {
      return reply.code(422).send({ statusCode: 422, error: 'ValidationError', message: 'Invalid UUID' });
    }
    const doc = documents.get(id);
    if (!doc || doc.user_id !== request.userId) {
      return reply.code(404).send({ statusCode: 404, error: 'NotFound', message: 'Document not found' });
    }
    return {
      id: doc.id, userId: doc.user_id, name: doc.name, mimeType: doc.mime_type,
      sizeBytes: doc.size_bytes, status: doc.status, metadata: doc.metadata,
      createdAt: doc.created_at, updatedAt: doc.updated_at,
    };
  });

  app.patch('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as { name?: string; status?: string; metadata?: Record<string, unknown> };
    const doc = documents.get(id);
    if (!doc || doc.user_id !== request.userId) {
      return reply.code(404).send({ statusCode: 404, error: 'NotFound', message: 'Document not found' });
    }
    const updated = { ...doc, ...body, updated_at: ts() };
    documents.set(id, updated);
    return {
      id: updated.id, userId: updated.user_id, name: updated.name, mimeType: updated.mime_type,
      sizeBytes: updated.size_bytes, status: updated.status, metadata: updated.metadata,
      createdAt: updated.created_at, updatedAt: updated.updated_at,
    };
  });

  app.delete('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const doc = documents.get(id);
    if (!doc || doc.user_id !== request.userId) {
      return reply.code(404).send({ statusCode: 404, error: 'NotFound', message: 'Document not found' });
    }
    documents.delete(id);
    return reply.code(204).send();
  });
};

const mockPipelinesPlugin: FastifyPluginAsync = async (app) => {
  app.addHook('preHandler', async (request, reply) => {
    const header = request.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      return reply.code(401).send({ statusCode: 401, error: 'Unauthorized', message: 'Missing or invalid Authorization header' });
    }
    const payload = await verifyToken(header.slice(7));
    if (!payload) {
      return reply.code(401).send({ statusCode: 401, error: 'Unauthorized', message: 'Invalid or expired token' });
    }
    request.userId = payload.sub;
  });

  app.post('/', async (request, reply) => {
    const body = request.body as { documentId?: string; type?: string };
    if (!body?.documentId || !body?.type) {
      return reply.code(422).send({ statusCode: 422, error: 'ValidationError', message: 'Missing fields' });
    }
    if (!/^[0-9a-f-]{36}$/i.test(body.documentId)) {
      return reply.code(422).send({ statusCode: 422, error: 'ValidationError', message: 'Invalid documentId UUID' });
    }
    // Validate document ownership before creating pipeline
    const doc = documents.get(body.documentId);
    if (!doc || doc.user_id !== request.userId) {
      return reply.code(404).send({ statusCode: 404, error: 'NotFound', message: 'Document not found' });
    }
    const p = {
      id: crypto.randomUUID(),
      user_id: request.userId!,
      document_id: body.documentId,
      type: body.type,
      status: 'queued',
      result: null,
      error_message: null,
      created_at: ts(),
      updated_at: ts(),
    };
    pipelines.set(p.id, p);
    return reply.code(201).send({
      id: p.id, userId: p.user_id, documentId: p.document_id, type: p.type,
      status: p.status, result: p.result, errorMessage: p.error_message,
      createdAt: p.created_at, updatedAt: p.updated_at,
    });
  });

  app.get('/', async (request, reply) => {
    const query = request.query as { limit?: string; offset?: string };
    const limit = Math.min(parseInt(query.limit ?? '20') || 20, 100);
    const offset = parseInt(query.offset ?? '0') || 0;
    const all = [...pipelines.values()].filter(p => p.user_id === request.userId)
      .sort((a, b) => b.created_at.getTime() - a.created_at.getTime());
    return {
      data: all.slice(offset, offset + limit).map(p => ({
        id: p.id, userId: p.user_id, documentId: p.document_id, type: p.type,
        status: p.status, result: p.result, errorMessage: p.error_message,
        createdAt: p.created_at, updatedAt: p.updated_at,
      })),
      meta: { total: all.length, limit, offset },
    };
  });

  app.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    if (!/^[0-9a-f-]{36}$/i.test(id)) {
      return reply.code(422).send({ statusCode: 422, error: 'ValidationError', message: 'Invalid UUID' });
    }
    const p = pipelines.get(id);
    if (!p || p.user_id !== request.userId) {
      return reply.code(404).send({ statusCode: 404, error: 'NotFound', message: 'Pipeline not found' });
    }
    return {
      id: p.id, userId: p.user_id, documentId: p.document_id, type: p.type,
      status: p.status, result: p.result, errorMessage: p.error_message,
      createdAt: p.created_at, updatedAt: p.updated_at,
    };
  });

  app.get('/:id/status', async (request, reply) => {
    const { id } = request.params as { id: string };
    const p = pipelines.get(id);
    if (!p || p.user_id !== request.userId) {
      return reply.code(404).send({ statusCode: 404, error: 'NotFound', message: 'Pipeline not found' });
    }
    return { id: p.id, status: p.status };
  });

  app.get('/:id/result', async (request, reply) => {
    const { id } = request.params as { id: string };
    const p = pipelines.get(id);
    if (!p || p.user_id !== request.userId) {
      return reply.code(404).send({ statusCode: 404, error: 'NotFound', message: 'Pipeline not found' });
    }
    if (!p.result) {
      return reply.code(422).send({ statusCode: 422, error: 'ResultNotReady', message: 'Pipeline result is not available yet' });
    }
    return { id: p.id, result: p.result };
  });

  app.delete('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const p = pipelines.get(id);
    if (!p || p.user_id !== request.userId) {
      return reply.code(404).send({ statusCode: 404, error: 'NotFound', message: 'Pipeline not found' });
    }
    pipelines.delete(id);
    return reply.code(204).send();
  });
};

const mockApiKeysPlugin: FastifyPluginAsync = async (app) => {
  app.addHook('preHandler', async (request, reply) => {
    const header = request.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      return reply.code(401).send({ statusCode: 401, error: 'Unauthorized', message: 'Missing or invalid Authorization header' });
    }
    const payload = await verifyToken(header.slice(7));
    if (!payload) {
      return reply.code(401).send({ statusCode: 401, error: 'Unauthorized', message: 'Invalid or expired token' });
    }
    request.userId = payload.sub;
  });

  app.post('/', async (request, reply) => {
    const body = request.body as { name?: string; expiresAt?: string };
    if (!body?.name) {
      return reply.code(422).send({ statusCode: 422, error: 'ValidationError', message: 'Invalid request body' });
    }
    const id = crypto.randomUUID();
    const prefix = 'dsk_live_' + id.slice(0, 4);
    const keyHash = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(prefix + 'secret'))))
      .map(b => b.toString(16).padStart(2, '0')).join('');
    const key = {
      id,
      user_id: request.userId!,
      key_prefix: prefix,
      key_hash: keyHash,
      name: body.name,
      last_used_at: null,
      expires_at: body.expiresAt ? new Date(body.expiresAt) : null,
      created_at: ts(),
    };
    apiKeys.set(id, key);
    const plaintextKey = `dsk_live_${id.replace(/-/g, '').slice(0, 8)}_${id.slice(0, 12).replace(/-/g, '')}`;
    return reply.code(201).send({
      id: key.id,
      keyPrefix: key.key_prefix,
      plaintextKey,
      name: key.name,
      expiresAt: key.expires_at,
      createdAt: key.created_at,
    });
  });

  app.get('/', async (request, reply) => {
    const keys = [...apiKeys.values()].filter(k => k.user_id === request.userId)
      .sort((a, b) => b.created_at.getTime() - a.created_at.getTime());
    return {
      data: keys.map(k => ({
        id: k.id,
        keyPrefix: k.key_prefix,
        name: k.name,
        lastUsedAt: k.last_used_at,
        expiresAt: k.expires_at,
        createdAt: k.created_at,
      })),
    };
  });

  app.delete('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    if (!/^[0-9a-f-]{36}$/i.test(id)) {
      return reply.code(422).send({ statusCode: 422, error: 'ValidationError', message: 'Invalid UUID' });
    }
    const key = apiKeys.get(id);
    if (!key || key.user_id !== request.userId) {
      return reply.code(404).send({ statusCode: 404, error: 'NotFound', message: 'API key not found' });
    }
    apiKeys.delete(id);
    return reply.code(204).send();
  });
};

const healthPlugin: FastifyPluginAsync = async (app) => {
  app.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }));
};

// ─── Test app factory ────────────────────────────────────────────────────────

function buildTestApp(): FastifyInstance {
  const app = Fastify({ logger: false }).withTypeProvider<ZodTypeProvider>();
  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  // Extend FastifyRequest with userId (mirrors middleware/auth.ts)
  app.addHook('onRequest', async (request) => {
    (request as any).userId = undefined;
    (request as any).userRole = undefined;
  });

  app.register(healthPlugin);
  app.register(mockAuthPlugin, { prefix: '/api/v1/auth' });
  app.register(mockDocumentsPlugin, { prefix: '/api/v1/documents' });
  app.register(mockPipelinesPlugin, { prefix: '/api/v1/pipelines' });
  app.register(mockApiKeysPlugin, { prefix: '/api/v1/api-keys' });

  return app;
}

// ─── Fixtures ────────────────────────────────────────────────────────────────

const TEST_USER_ID = '11111111-1111-1111-1111-111111111111';
const TEST_DOC_ID = '22222222-2222-2222-2222-222222222222';
const ADMIN_USER_ID = '33333333-3333-3333-3333-333333333333';

let testApp: FastifyInstance;
let userToken: string;
let adminToken: string;

beforeAll(async () => {
  testApp = buildTestApp();
  await testApp.ready();

  // Seed a test user (bcrypt hash of 'password123')
  const testHash = await bcrypt.hash('password123', 12);
  users.set('test@example.com', {
    id: TEST_USER_ID,
    email: 'test@example.com',
    password_hash: testHash,
    role: 'editor',
    created_at: ts(),
    updated_at: ts(),
  });

  // Seed a test document
  documents.set(TEST_DOC_ID, {
    id: TEST_DOC_ID,
    user_id: TEST_USER_ID, // owned by TEST_USER so pipelines can reference it
    name: 'test-document.pdf',
    mime_type: 'application/pdf',
    size_bytes: 4096,
    status: 'pending',
    metadata: {},
    created_at: ts(),
    updated_at: ts(),
  });

  userToken = await signAccessToken({ id: TEST_USER_ID, email: 'test@example.com', role: 'editor' });
  adminToken = await signAccessToken({ id: ADMIN_USER_ID, email: 'admin@example.com', role: 'admin' });
});

afterAll(async () => {
  resetStores();
  await testApp.close();
});

// ─── Health ──────────────────────────────────────────────────────────────────

describe('GET /health', () => {
  it('returns 200 with ok status', async () => {
    const res = await testApp.inject({ method: 'GET', url: '/health' });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.status).toBe('ok');
    expect(body.timestamp).toBeDefined();
  });
});

// ─── Auth: POST /api/v1/auth/register ───────────────────────────────────────

describe('POST /api/v1/auth/register', () => {
  beforeEach(() => resetStores());

  it('registers a new user and returns tokens', async () => {
    const res = await testApp.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: { email: 'new@example.com', password: 'securepassword123' },
    });
    expect(res.statusCode).toBe(201);
    const body = JSON.parse(res.body);
    expect(body.accessToken).toBeDefined();
    expect(body.refreshToken).toBeDefined();
    expect(body.user.email).toBe('new@example.com');
    expect(body.user.role).toBe('viewer'); // default role
  });

  it('returns 409 for duplicate email', async () => {
    await testApp.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: { email: 'test@example.com', password: 'password123' },
    });
    const res = await testApp.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: { email: 'test@example.com', password: 'password456' },
    });
    expect(res.statusCode).toBe(409);
    const body = JSON.parse(res.body);
    expect(body.error).toBe('Conflict');
  });

  it('returns 422 for password too short', async () => {
    const res = await testApp.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: { email: 'user@example.com', password: 'short' },
    });
    expect(res.statusCode).toBe(422);
  });

  it('returns 422 for missing email', async () => {
    const res = await testApp.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: { password: 'password123' },
    });
    expect(res.statusCode).toBe(422);
  });
});

// ─── Auth: POST /api/v1/auth/login ─────────────────────────────────────────

describe('POST /api/v1/auth/login', () => {
  beforeEach(() => {
    resetStores();
    users.set('test@example.com', {
      id: TEST_USER_ID, email: 'test@example.com',
      password_hash: bcrypt.hashSync('password123', 12),
      role: 'editor', created_at: ts(), updated_at: ts(),
    });
  });

  it('logs in with correct credentials and returns tokens', async () => {
    const res = await testApp.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { email: 'test@example.com', password: 'password123' },
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.accessToken).toBeDefined();
    expect(body.refreshToken).toBeDefined();
    expect(body.user.email).toBe('test@example.com');
  });

  it('returns 401 for wrong password', async () => {
    const res = await testApp.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { email: 'test@example.com', password: 'wrongpassword' },
    });
    expect(res.statusCode).toBe(401);
    const body = JSON.parse(res.body);
    expect(body.error).toBe('Unauthorized');
  });

  it('returns 401 for non-existent user', async () => {
    const res = await testApp.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { email: 'ghost@example.com', password: 'password123' },
    });
    expect(res.statusCode).toBe(401);
  });

  it('returns 422 for missing fields', async () => {
    const res = await testApp.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { email: 'test@example.com' },
    });
    expect(res.statusCode).toBe(422);
  });
});

// ─── Auth: POST /api/v1/auth/refresh ──────────────────────────────────────

describe('POST /api/v1/auth/refresh', () => {
  beforeEach(() => resetStores());

  it('returns 401 for invalid token', async () => {
    const res = await testApp.inject({
      method: 'POST',
      url: '/api/v1/auth/refresh',
      payload: { refreshToken: 'invalid-token' },
    });
    expect(res.statusCode).toBe(401);
  });

  it('returns 422 for missing token', async () => {
    const res = await testApp.inject({
      method: 'POST',
      url: '/api/v1/auth/refresh',
      payload: {},
    });
    expect(res.statusCode).toBe(422);
  });
});

// ─── Auth: GET /api/v1/auth/me ─────────────────────────────────────────────

describe('GET /api/v1/auth/me', () => {
  let authToken: string;

  beforeEach(async () => {
    resetStores();
    const user = {
      id: TEST_USER_ID, email: 'test@example.com',
      password_hash: bcrypt.hashSync('password123', 12),
      role: 'editor', created_at: ts(), updated_at: ts(),
    };
    users.set('test@example.com', user);
    authToken = await signAccessToken({ id: TEST_USER_ID, email: 'test@example.com', role: 'editor' });
  });

  it('returns user info when authenticated', async () => {
    const res = await testApp.inject({
      method: 'GET',
      url: '/api/v1/auth/me',
      headers: { authorization: `Bearer ${authToken}` },
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.id).toBe(TEST_USER_ID);
    expect(body.email).toBe('test@example.com');
  });

  it('returns 401 when no auth header', async () => {
    const res = await testApp.inject({ method: 'GET', url: '/api/v1/auth/me' });
    expect(res.statusCode).toBe(401);
    const body = JSON.parse(res.body);
    expect(body.error).toBe('Unauthorized');
  });

  it('returns 401 for invalid token', async () => {
    const res = await testApp.inject({
      method: 'GET',
      url: '/api/v1/auth/me',
      headers: { authorization: 'Bearer invalid-token' },
    });
    expect(res.statusCode).toBe(401);
  });
});

// ─── Documents: POST /api/v1/documents ─────────────────────────────────────

describe('POST /api/v1/documents', () => {
  beforeEach(() => resetStores());

  it('creates a document when authenticated', async () => {
    const res = await testApp.inject({
      method: 'POST',
      url: '/api/v1/documents',
      headers: { authorization: `Bearer ${userToken}` },
      payload: {
        name: 'invoice.pdf',
        mimeType: 'application/pdf',
        sizeBytes: 2048,
        metadata: { source: 'upload' },
      },
    });
    expect(res.statusCode).toBe(201);
    const body = JSON.parse(res.body);
    expect(body.id).toBeDefined();
    expect(body.name).toBe('invoice.pdf');
    expect(body.mimeType).toBe('application/pdf');
    expect(body.status).toBe('pending');
  });

  it('returns 401 without auth', async () => {
    const res = await testApp.inject({
      method: 'POST',
      url: '/api/v1/documents',
      payload: { name: 'test.pdf', mimeType: 'application/pdf', sizeBytes: 100 },
    });
    expect(res.statusCode).toBe(401);
  });

  it('returns 422 for missing required fields', async () => {
    const res = await testApp.inject({
      method: 'POST',
      url: '/api/v1/documents',
      headers: { authorization: `Bearer ${userToken}` },
      payload: { name: 'test.pdf' }, // missing mimeType and sizeBytes
    });
    expect(res.statusCode).toBe(422);
  });
});

// ─── Documents: GET /api/v1/documents ──────────────────────────────────────

describe('GET /api/v1/documents', () => {
  beforeEach(() => resetStores());

  it('returns paginated list of documents', async () => {
    const res = await testApp.inject({
      method: 'GET',
      url: '/api/v1/documents',
      headers: { authorization: `Bearer ${userToken}` },
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.data).toBeInstanceOf(Array);
    expect(body.meta.total).toBeDefined();
    expect(body.meta.limit).toBeDefined();
    expect(body.meta.offset).toBeDefined();
  });

  it('respects pagination params', async () => {
    const res = await testApp.inject({
      method: 'GET',
      url: '/api/v1/documents?limit=5&offset=0',
      headers: { authorization: `Bearer ${userToken}` },
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.meta.limit).toBe(5);
    expect(body.meta.offset).toBe(0);
  });

  it('returns 401 without auth', async () => {
    const res = await testApp.inject({ method: 'GET', url: '/api/v1/documents' });
    expect(res.statusCode).toBe(401);
  });
});

// ─── Documents: GET /api/v1/documents/:id ──────────────────────────────────

describe('GET /api/v1/documents/:id', () => {
  let authToken: string;

  beforeEach(async () => {
    resetStores();
    documents.set(TEST_DOC_ID, {
      id: TEST_DOC_ID, user_id: TEST_USER_ID, name: 'test-document.pdf',
      mime_type: 'application/pdf', size_bytes: 4096, status: 'pending',
      metadata: {}, created_at: ts(), updated_at: ts(),
    });
    authToken = await signAccessToken({ id: TEST_USER_ID, email: 'test@example.com', role: 'editor' });
  });

  it('returns document by id for owner', async () => {
    const res = await testApp.inject({
      method: 'GET',
      url: `/api/v1/documents/${TEST_DOC_ID}`,
      headers: { authorization: `Bearer ${authToken}` },
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.id).toBe(TEST_DOC_ID);
    expect(body.name).toBe('test-document.pdf');
  });

  it('returns 404 for non-existent document', async () => {
    const res = await testApp.inject({
      method: 'GET',
      url: '/api/v1/documents/00000000-0000-0000-0000-000000000000',
      headers: { authorization: `Bearer ${authToken}` },
    });
    expect(res.statusCode).toBe(404);
  });

  it('returns 404 for document owned by another user', async () => {
    const res = await testApp.inject({
      method: 'GET',
      url: `/api/v1/documents/${TEST_DOC_ID}`,
      headers: { authorization: `Bearer ${adminToken}` },
    });
    expect(res.statusCode).toBe(404);
  });

  it('returns 401 without auth', async () => {
    const res = await testApp.inject({ method: 'GET', url: `/api/v1/documents/${TEST_DOC_ID}` });
    expect(res.statusCode).toBe(401);
  });
});

// ─── Documents: PATCH /api/v1/documents/:id ────────────────────────────────

describe('PATCH /api/v1/documents/:id', () => {
  let authToken: string;

  beforeEach(async () => {
    resetStores();
    documents.set(TEST_DOC_ID, {
      id: TEST_DOC_ID, user_id: TEST_USER_ID, name: 'test-document.pdf',
      mime_type: 'application/pdf', size_bytes: 4096, status: 'pending',
      metadata: {}, created_at: ts(), updated_at: ts(),
    });
    authToken = await signAccessToken({ id: TEST_USER_ID, email: 'test@example.com', role: 'editor' });
  });

  it('updates document name', async () => {
    const res = await testApp.inject({
      method: 'PATCH',
      url: `/api/v1/documents/${TEST_DOC_ID}`,
      headers: { authorization: `Bearer ${authToken}` },
      payload: { name: 'renamed.pdf' },
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.name).toBe('renamed.pdf');
  });

  it('updates document status', async () => {
    const res = await testApp.inject({
      method: 'PATCH',
      url: `/api/v1/documents/${TEST_DOC_ID}`,
      headers: { authorization: `Bearer ${authToken}` },
      payload: { status: 'done' },
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.status).toBe('done');
  });

  it('returns 404 for non-existent document', async () => {
    const res = await testApp.inject({
      method: 'PATCH',
      url: '/api/v1/documents/00000000-0000-0000-0000-000000000000',
      headers: { authorization: `Bearer ${authToken}` },
      payload: { name: 'new-name.pdf' },
    });
    expect(res.statusCode).toBe(404);
  });

  it('returns 401 without auth', async () => {
    const res = await testApp.inject({
      method: 'PATCH',
      url: `/api/v1/documents/${TEST_DOC_ID}`,
      payload: { name: 'new-name.pdf' },
    });
    expect(res.statusCode).toBe(401);
  });
});

// ─── Documents: DELETE /api/v1/documents/:id ──────────────────────────────

describe('DELETE /api/v1/documents/:id', () => {
  let authToken: string;

  beforeEach(async () => {
    resetStores();
    documents.set(TEST_DOC_ID, {
      id: TEST_DOC_ID, user_id: TEST_USER_ID, name: 'test-document.pdf',
      mime_type: 'application/pdf', size_bytes: 4096, status: 'pending',
      metadata: {}, created_at: ts(), updated_at: ts(),
    });
    authToken = await signAccessToken({ id: TEST_USER_ID, email: 'test@example.com', role: 'editor' });
  });

  it('deletes document for owner and returns 204', async () => {
    const res = await testApp.inject({
      method: 'DELETE',
      url: `/api/v1/documents/${TEST_DOC_ID}`,
      headers: { authorization: `Bearer ${authToken}` },
    });
    expect(res.statusCode).toBe(204);
  });

  it('returns 404 for non-existent document', async () => {
    const res = await testApp.inject({
      method: 'DELETE',
      url: '/api/v1/documents/00000000-0000-0000-0000-000000000000',
      headers: { authorization: `Bearer ${authToken}` },
    });
    expect(res.statusCode).toBe(404);
  });

  it('returns 401 without auth', async () => {
    const res = await testApp.inject({
      method: 'DELETE',
      url: `/api/v1/documents/${TEST_DOC_ID}`,
    });
    expect(res.statusCode).toBe(401);
  });
});

// ─── Pipelines: POST /api/v1/pipelines ─────────────────────────────────────

describe('POST /api/v1/pipelines', () => {
  beforeEach(() => {
    resetStores();
    documents.set(TEST_DOC_ID, {
      id: TEST_DOC_ID,
      user_id: TEST_USER_ID,
      name: 'test-document.pdf',
      mime_type: 'application/pdf',
      size_bytes: 4096,
      status: 'pending',
      metadata: {},
      created_at: ts(),
      updated_at: ts(),
    });
  });

  it('creates a pipeline when authenticated', async () => {
    const res = await testApp.inject({
      method: 'POST',
      url: '/api/v1/pipelines',
      headers: { authorization: `Bearer ${userToken}` },
      payload: { documentId: TEST_DOC_ID, type: 'ocr' },
    });
    expect(res.statusCode).toBe(201);
    const body = JSON.parse(res.body);
    expect(body.id).toBeDefined();
    expect(body.documentId).toBe(TEST_DOC_ID);
    expect(body.type).toBe('ocr');
    expect(body.status).toBe('queued');
  });

  it('returns 401 without auth', async () => {
    const res = await testApp.inject({
      method: 'POST',
      url: '/api/v1/pipelines',
      payload: { documentId: TEST_DOC_ID, type: 'ocr' },
    });
    expect(res.statusCode).toBe(401);
  });

  it('returns 422 for invalid documentId', async () => {
    const res = await testApp.inject({
      method: 'POST',
      url: '/api/v1/pipelines',
      headers: { authorization: `Bearer ${userToken}` },
      payload: { documentId: 'not-a-uuid', type: 'ocr' },
    });
    expect(res.statusCode).toBe(422);
  });

  it('returns 404 when document belongs to another user', async () => {
    const foreignDocId = '44444444-4444-4444-4444-444444444444';
    documents.set(foreignDocId, {
      id: foreignDocId,
      user_id: '00000000-0000-0000-0000-000000000000', // different user
      name: 'foreign.pdf',
      mime_type: 'application/pdf',
      size_bytes: 1024,
      status: 'pending',
      metadata: {},
      created_at: ts(),
      updated_at: ts(),
    });
    const res = await testApp.inject({
      method: 'POST',
      url: '/api/v1/pipelines',
      headers: { authorization: `Bearer ${userToken}` },
      payload: { documentId: foreignDocId, type: 'ocr' },
    });
    expect(res.statusCode).toBe(404);
    expect(JSON.parse(res.body).error).toBe('NotFound');
  });
});

// ─── API Keys: POST /api/v1/api-keys ───────────────────────────────────────

describe('POST /api/v1/api-keys', () => {
  beforeEach(() => resetStores());

  it('creates a new API key and returns plaintext once', async () => {
    const res = await testApp.inject({
      method: 'POST',
      url: '/api/v1/api-keys',
      headers: { authorization: `Bearer ${userToken}` },
      payload: { name: 'Test Key' },
    });
    expect(res.statusCode).toBe(201);
    const body = JSON.parse(res.body);
    expect(body.id).toBeDefined();
    expect(body.keyPrefix).toMatch(/^dsk_live_[a-zA-Z0-9]{4}$/);
    expect(body.plaintextKey).toBeDefined();
    expect(body.name).toBe('Test Key');
    expect(body.plaintextKey).toMatch(/^dsk_live_/);
  });

  it('creates a key with an optional expiry date', async () => {
    const futureDate = new Date(Date.now() + 86400000).toISOString();
    const res = await testApp.inject({
      method: 'POST',
      url: '/api/v1/api-keys',
      headers: { authorization: `Bearer ${userToken}` },
      payload: { name: 'Expiring Key', expiresAt: futureDate },
    });
    expect(res.statusCode).toBe(201);
    const body = JSON.parse(res.body);
    expect(body.expiresAt).toBeDefined();
  });

  it('returns 422 when name is missing', async () => {
    const res = await testApp.inject({
      method: 'POST',
      url: '/api/v1/api-keys',
      headers: { authorization: `Bearer ${userToken}` },
      payload: {},
    });
    expect(res.statusCode).toBe(422);
  });

  it('returns 401 without auth', async () => {
    const res = await testApp.inject({
      method: 'POST',
      url: '/api/v1/api-keys',
      payload: { name: 'Key' },
    });
    expect(res.statusCode).toBe(401);
  });
});

// ─── API Keys: GET /api/v1/api-keys ────────────────────────────────────────

describe('GET /api/v1/api-keys', () => {
  beforeEach(() => resetStores());

  it('returns the user API key list (no plaintext)', async () => {
    // First create a key
    await testApp.inject({
      method: 'POST',
      url: '/api/v1/api-keys',
      headers: { authorization: `Bearer ${userToken}` },
      payload: { name: 'My Key' },
    });
    const res = await testApp.inject({
      method: 'GET',
      url: '/api/v1/api-keys',
      headers: { authorization: `Bearer ${userToken}` },
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.data).toBeInstanceOf(Array);
    expect(body.data.length).toBeGreaterThan(0);
    expect(body.data[0].plaintextKey).toBeUndefined();
    expect(body.data[0].keyPrefix).toMatch(/^dsk_live_[a-zA-Z0-9]{4}$/);
  });

  it('returns 401 without auth', async () => {
    const res = await testApp.inject({ method: 'GET', url: '/api/v1/api-keys' });
    expect(res.statusCode).toBe(401);
  });
});

// ─── API Keys: DELETE /api/v1/api-keys/:id ─────────────────────────────────

describe('DELETE /api/v1/api-keys/:id', () => {
  beforeEach(() => resetStores());

  it('deletes the user API key and returns 204', async () => {
    const createRes = await testApp.inject({
      method: 'POST',
      url: '/api/v1/api-keys',
      headers: { authorization: `Bearer ${userToken}` },
      payload: { name: 'To Delete' },
    });
    const { id } = JSON.parse(createRes.body);
    const res = await testApp.inject({
      method: 'DELETE',
      url: `/api/v1/api-keys/${id}`,
      headers: { authorization: `Bearer ${userToken}` },
    });
    expect(res.statusCode).toBe(204);

    // Verify it's gone from list
    const listRes = await testApp.inject({
      method: 'GET',
      url: '/api/v1/api-keys',
      headers: { authorization: `Bearer ${userToken}` },
    });
    const list = JSON.parse(listRes.body);
    expect(list.data.find((k: { id: string }) => k.id === id)).toBeUndefined();
  });

  it('returns 404 when deleting a non-existent key', async () => {
    const fakeId = '00000000-0000-0000-0000-000000000000';
    const res = await testApp.inject({
      method: 'DELETE',
      url: `/api/v1/api-keys/${fakeId}`,
      headers: { authorization: `Bearer ${userToken}` },
    });
    expect(res.statusCode).toBe(404);
  });

  it('returns 401 without auth', async () => {
    const fakeId = '00000000-0000-0000-0000-000000000000';
    const res = await testApp.inject({
      method: 'DELETE',
      url: `/api/v1/api-keys/${fakeId}`,
    });
    expect(res.statusCode).toBe(401);
  });
});

// ─── Pipelines: GET /api/v1/pipelines ──────────────────────────────────────

describe('GET /api/v1/pipelines', () => {
  beforeEach(() => resetStores());

  it('returns paginated pipeline list', async () => {
    const res = await testApp.inject({
      method: 'GET',
      url: '/api/v1/pipelines',
      headers: { authorization: `Bearer ${userToken}` },
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.data).toBeInstanceOf(Array);
    expect(body.meta).toBeDefined();
  });

  it('returns 401 without auth', async () => {
    const res = await testApp.inject({ method: 'GET', url: '/api/v1/pipelines' });
    expect(res.statusCode).toBe(401);
  });
});

// ─── Pipelines: GET /api/v1/pipelines/:id ─────────────────────────────────

describe('GET /api/v1/pipelines/:id', () => {
  beforeEach(() => resetStores());

  it('returns 404 for non-existent pipeline', async () => {
    const res = await testApp.inject({
      method: 'GET',
      url: '/api/v1/pipelines/00000000-0000-0000-0000-000000000000',
      headers: { authorization: `Bearer ${userToken}` },
    });
    expect(res.statusCode).toBe(404);
  });

  it('returns 422 for invalid UUID', async () => {
    const res = await testApp.inject({
      method: 'GET',
      url: '/api/v1/pipelines/not-a-uuid',
      headers: { authorization: `Bearer ${userToken}` },
    });
    expect(res.statusCode).toBe(422);
  });
});

// ─── Pipelines: GET /api/v1/pipelines/:id/status ──────────────────────────

describe('GET /api/v1/pipelines/:id/status', () => {
  beforeEach(() => resetStores());

  it('returns 404 for non-existent pipeline', async () => {
    const res = await testApp.inject({
      method: 'GET',
      url: '/api/v1/pipelines/00000000-0000-0000-0000-000000000000/status',
      headers: { authorization: `Bearer ${userToken}` },
    });
    expect(res.statusCode).toBe(404);
  });
});

// ─── Pipelines: GET /api/v1/pipelines/:id/result ──────────────────────────

describe('GET /api/v1/pipelines/:id/result', () => {
  beforeEach(() => resetStores());

  it('returns 404 for non-existent pipeline', async () => {
    const res = await testApp.inject({
      method: 'GET',
      url: '/api/v1/pipelines/00000000-0000-0000-0000-000000000000/result',
      headers: { authorization: `Bearer ${userToken}` },
    });
    expect(res.statusCode).toBe(404);
  });
});

// ─── Pipelines: DELETE /api/v1/pipelines/:id ───────────────────────────────

describe('DELETE /api/v1/pipelines/:id', () => {
  beforeEach(() => resetStores());

  it('returns 404 for non-existent pipeline', async () => {
    const res = await testApp.inject({
      method: 'DELETE',
      url: '/api/v1/pipelines/00000000-0000-0000-0000-000000000000',
      headers: { authorization: `Bearer ${userToken}` },
    });
    expect(res.statusCode).toBe(404);
  });

  it('returns 401 without auth', async () => {
    const res = await testApp.inject({
      method: 'DELETE',
      url: '/api/v1/pipelines/00000000-0000-0000-0000-000000000000',
    });
    expect(res.statusCode).toBe(401);
  });
});
