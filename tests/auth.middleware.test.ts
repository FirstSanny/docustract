/**
 * Auth Middleware Unit Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { FastifyRequest, FastifyReply } from 'fastify';

// Mock jose before importing the module
vi.mock('../src/services/auth.js', () => ({
  verifyToken: vi.fn(),
}));

const { verifyToken } = await import('../src/services/auth.js');
const { requireAuth, requireRole } = await import('../src/middleware/auth.js');

function makeReply(): FastifyReply {
  return {
    code: vi.fn().mockReturnThis(),
    send: vi.fn().mockReturnThis(),
    sent: false,
  } as unknown as FastifyReply;
}

function makeReq(authorization = 'Bearer token', userId?: string, userRole?: string): FastifyRequest {
  return {
    headers: { authorization } as Record<string, unknown>,
    userId,
    userRole,
  } as unknown as FastifyRequest;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('requireAuth', () => {
  it('returns 401 when Authorization header is missing', async () => {
    const req = makeReq(undefined as unknown as string);
    const reply = makeReply();

    await requireAuth(req, reply);

    expect(reply.code).toHaveBeenCalledWith(401);
    expect(reply.send).toHaveBeenCalledWith(expect.objectContaining({
      statusCode: 401,
      error: 'Unauthorized',
    }));
  });

  it('returns 401 when Authorization does not start with Bearer', async () => {
    const req = makeReq('Basic abc123');
    const reply = makeReply();

    await requireAuth(req, reply);

    expect(reply.code).toHaveBeenCalledWith(401);
  });

  it('calls verifyToken with the token after Bearer prefix', async () => {
    const req = makeReq('Bearer my-token');
    const reply = makeReply();
    verifyToken.mockResolvedValue(null);

    await requireAuth(req, reply);

    expect(verifyToken).toHaveBeenCalledWith('my-token');
  });

  it('returns 401 when verifyToken returns null (invalid token)', async () => {
    const req = makeReq('Bearer bad-token');
    const reply = makeReply();
    verifyToken.mockResolvedValue(null);

    await requireAuth(req, reply);

    expect(reply.code).toHaveBeenCalledWith(401);
  });

  it('sets userId and userRole on the request when token is valid', async () => {
    const req = makeReq() as FastifyRequest & { userId?: string; userRole?: string };
    const reply = makeReply();
    verifyToken.mockResolvedValue({ sub: 'user-123', email: 'test@example.com', role: 'admin' });

    await requireAuth(req, reply);

    expect(req.userId).toBe('user-123');
    expect(req.userRole).toBe('admin');
    expect(reply.code).not.toHaveBeenCalled();
  });
});

describe('requireRole', () => {
  it('returns 403 when userRole is not in the allowed roles', async () => {
    const req = makeReq() as FastifyRequest & { userId?: string; userRole?: string };
    const reply = makeReply();
    verifyToken.mockResolvedValue({ sub: 'user-123', email: 'x@x.com', role: 'viewer' });

    const middleware = requireRole('admin', 'editor');
    await middleware(req, reply);

    // requireAuth sets the role, then requireRole sees 'viewer' is not in ['admin','editor']
    expect(reply.code).toHaveBeenCalledWith(403);
    expect(reply.send).toHaveBeenCalledWith(expect.objectContaining({
      statusCode: 403,
      error: 'Forbidden',
    }));
  });

  it('allows request when userRole matches an allowed role (admin)', async () => {
    const req = makeReq() as FastifyRequest & { userId?: string; userRole?: string };
    const reply = makeReply();
    verifyToken.mockResolvedValue({ sub: 'user-123', email: 'x@x.com', role: 'admin' });

    const middleware = requireRole('admin', 'editor');
    await middleware(req, reply);

    expect(reply.code).not.toHaveBeenCalled();
  });

  it('allows request when userRole matches an allowed role (editor)', async () => {
    const req = makeReq() as FastifyRequest & { userId?: string; userRole?: string };
    const reply = makeReply();
    verifyToken.mockResolvedValue({ sub: 'user-123', email: 'x@x.com', role: 'editor' });

    const middleware = requireRole('admin', 'editor');
    await middleware(req, reply);

    expect(reply.code).not.toHaveBeenCalled();
  });

  it('allows request when userRole is admin on admin-only endpoint', async () => {
    const req = makeReq() as FastifyRequest & { userId?: string; userRole?: string };
    const reply = makeReply();
    verifyToken.mockResolvedValue({ sub: 'user-123', email: 'x@x.com', role: 'admin' });

    const middleware = requireRole('admin');
    await middleware(req, reply);

    expect(reply.code).not.toHaveBeenCalled();
  });

  it('returns 401 when token is invalid (requireAuth fails first)', async () => {
    const req = makeReq('Bearer bad') as FastifyRequest & { userId?: string; userRole?: string };
    const reply = { code: vi.fn().mockReturnThis(), send: vi.fn().mockReturnThis(), sent: false } as unknown as FastifyReply;
    verifyToken.mockResolvedValue(null);

    const middleware = requireRole('admin');
    await middleware(req, reply);

    expect(reply.code).toHaveBeenCalledWith(401);
  });
});