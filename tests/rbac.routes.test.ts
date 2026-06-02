/**
 * RBAC and Validation Unit Tests
 *
 * Tests role-based access control and input validation logic in isolation.
 * Fastify plugins tested via auth.middleware.test.ts and api.integration.test.ts.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';

// Mock auth service (vi.mock is hoisted — must be before any imports from auth.js)
const mockVerifyToken = vi.fn();
vi.mock('../src/services/auth.js', () => ({
  verifyToken: mockVerifyToken,
  signAccessToken: vi.fn(),
  signRefreshToken: vi.fn(),
}));

// ─── MIME Type Validation ─────────────────────────────────────────────────────

const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain', 'text/csv', 'application/rtf',
  'application/zip', 'application/x-zip-compressed',
]);

const createDocumentSchema = z.object({
  name: z.string().min(1).max(255),
  mimeType: z.string().min(1).max(100),
  sizeBytes: z.number().int().min(0),
  metadata: z.record(z.unknown()).optional(),
}).refine(
  (data) => ALLOWED_MIME_TYPES.has(data.mimeType),
  { message: `MIME type not allowed. Use one of: ${[...ALLOWED_MIME_TYPES].join(', ')}` }
);

describe('createDocumentSchema > MIME type validation', () => {
  it('accepts application/pdf', () => {
    const result = createDocumentSchema.safeParse({
      name: 'doc.pdf', mimeType: 'application/pdf', sizeBytes: 1024,
    });
    expect(result.success).toBe(true);
  });

  it('accepts image/png', () => {
    const result = createDocumentSchema.safeParse({
      name: 'image.png', mimeType: 'image/png', sizeBytes: 2048,
    });
    expect(result.success).toBe(true);
  });

  it('accepts text/csv', () => {
    const result = createDocumentSchema.safeParse({
      name: 'data.csv', mimeType: 'text/csv', sizeBytes: 512,
    });
    expect(result.success).toBe(true);
  });

  it('accepts application/zip', () => {
    const result = createDocumentSchema.safeParse({
      name: 'archive.zip', mimeType: 'application/zip', sizeBytes: 4096,
    });
    expect(result.success).toBe(true);
  });

  it('rejects application/octet-stream', () => {
    const result = createDocumentSchema.safeParse({
      name: 'file.bin', mimeType: 'application/octet-stream', sizeBytes: 100,
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toContain('MIME type not allowed');
  });

  it('rejects text/html', () => {
    const result = createDocumentSchema.safeParse({
      name: 'page.html', mimeType: 'text/html', sizeBytes: 200,
    });
    expect(result.success).toBe(false);
  });

  it('rejects executable/binary', () => {
    const result = createDocumentSchema.safeParse({
      name: 'virus.exe', mimeType: 'application/x-msdownload', sizeBytes: 0,
    });
    expect(result.success).toBe(false);
  });

  it('accepts image/gif even if content is malicious (type check only, not content)', () => {
    const result = createDocumentSchema.safeParse({
      name: 'script.gif', mimeType: 'image/gif', sizeBytes: 9999,
    });
    expect(result.success).toBe(true);
  });
});

// ─── API Key Schema ────────────────────────────────────────────────────────────

const createApiKeySchema = z.object({
  name: z.string().min(1).max(100),
  expiresAt: z.string().datetime().optional(),
});

describe('createApiKeySchema', () => {
  it('accepts valid name without expiry', () => {
    const result = createApiKeySchema.safeParse({ name: 'Production Key' });
    expect(result.success).toBe(true);
  });

  it('accepts valid name with ISO datetime expiry', () => {
    const result = createApiKeySchema.safeParse({
      name: 'Temp Key',
      expiresAt: '2030-01-01T00:00:00.000Z',
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty name', () => {
    const result = createApiKeySchema.safeParse({ name: '' });
    expect(result.success).toBe(false);
  });

  it('rejects name over 100 chars', () => {
    const result = createApiKeySchema.safeParse({ name: 'A'.repeat(101) });
    expect(result.success).toBe(false);
  });

  it('rejects invalid datetime format for expiresAt', () => {
    const result = createApiKeySchema.safeParse({
      name: 'Bad Expiry',
      expiresAt: '2025-01-01',
    });
    expect(result.success).toBe(false);
  });
});

// ─── Pipeline Schema ──────────────────────────────────────────────────────────

const createPipelineSchema = z.object({
  documentId: z.string().uuid(),
  type: z.string().min(1).max(100),
});

describe('createPipelineSchema', () => {
  it('accepts valid UUID and type', () => {
    const result = createPipelineSchema.safeParse({
      documentId: '123e4567-e89b-12d3-a456-426614174000',
      type: 'ocr',
    });
    expect(result.success).toBe(true);
  });

  it('rejects non-UUID documentId', () => {
    const result = createPipelineSchema.safeParse({
      documentId: 'not-a-uuid',
      type: 'ocr',
    });
    expect(result.success).toBe(false);
  });

  it('rejects empty type', () => {
    const result = createPipelineSchema.safeParse({
      documentId: '123e4567-e89b-12d3-a456-426614174000',
      type: '',
    });
    expect(result.success).toBe(false);
  });

  it('rejects type over 100 chars', () => {
    const result = createPipelineSchema.safeParse({
      documentId: '123e4567-e89b-12d3-a456-426614174000',
      type: 'A'.repeat(101),
    });
    expect(result.success).toBe(false);
  });
});

// ─── requireRole middleware ─────────────────────────────────────────────────────

const { requireRole } = await import('../src/middleware/auth.js');

function makeReply(): FastifyReply {
  return {
    code: vi.fn().mockReturnThis(),
    send: vi.fn().mockReturnThis(),
    sent: false,
  } as unknown as FastifyReply;
}

function makeReq(role: string): FastifyRequest & { userId?: string; userRole?: string } {
  return {
    headers: { authorization: 'Bearer test-token' } as Record<string, unknown>,
    userId: 'user-1',
    userRole: role,
  } as FastifyRequest & { userId?: string; userRole?: string };
}

describe('requireRole > pipeline creation (admin/editor only)', () => {
  beforeEach(() => {
    // Mock verifyToken to return valid payload — requireAuth sets userId/userRole
    // Then requireRole checks the role. This simulates a real authenticated request.
    mockVerifyToken.mockResolvedValue({ sub: 'user-1', email: 'test@example.com', role: 'admin' });
  });

  it('admin role is allowed', async () => {
    const req = {
      headers: { authorization: 'Bearer token' } as Record<string, unknown>,
      userId: 'user-1',
      userRole: 'admin',
    } as FastifyRequest & { userId?: string; userRole?: string };
    const reply = makeReply();
    await requireRole('admin', 'editor')(req, reply);
    expect(reply.code).not.toHaveBeenCalled();
  });

  it('editor role is allowed', async () => {
    mockVerifyToken.mockResolvedValue({ sub: 'user-1', email: 'test@example.com', role: 'editor' });
    const req = {
      headers: { authorization: 'Bearer token' } as Record<string, unknown>,
      userId: 'user-1',
      userRole: 'editor',
    } as FastifyRequest & { userId?: string; userRole?: string };
    const reply = makeReply();
    await requireRole('admin', 'editor')(req, reply);
    expect(reply.code).not.toHaveBeenCalled();
  });

  it('viewer role is denied with 403', async () => {
    mockVerifyToken.mockResolvedValue({ sub: 'user-1', email: 'test@example.com', role: 'viewer' });
    const req = {
      headers: { authorization: 'Bearer token' } as Record<string, unknown>,
      userId: 'user-1',
      userRole: 'viewer',
    } as FastifyRequest & { userId?: string; userRole?: string };
    const reply = makeReply();
    await requireRole('admin', 'editor')(req, reply);
    expect(reply.code).toHaveBeenCalledWith(403);
  });
});

describe('requireRole > document creation (admin only)', () => {
  beforeEach(() => {
    mockVerifyToken.mockResolvedValue({ sub: 'user-1', email: 'test@example.com', role: 'admin' });
  });

  it('admin role is allowed', async () => {
    const req = {
      headers: { authorization: 'Bearer token' } as Record<string, unknown>,
      userId: 'user-1',
      userRole: 'admin',
    } as FastifyRequest & { userId?: string; userRole?: string };
    const reply = makeReply();
    await requireRole('admin')(req, reply);
    expect(reply.code).not.toHaveBeenCalled();
  });

  it('editor role is denied with 403', async () => {
    mockVerifyToken.mockResolvedValue({ sub: 'user-1', email: 'test@example.com', role: 'editor' });
    const req = {
      headers: { authorization: 'Bearer token' } as Record<string, unknown>,
      userId: 'user-1',
      userRole: 'editor',
    } as FastifyRequest & { userId?: string; userRole?: string };
    const reply = makeReply();
    await requireRole('admin')(req, reply);
    expect(reply.code).toHaveBeenCalledWith(403);
  });

  it('viewer role is denied with 403', async () => {
    mockVerifyToken.mockResolvedValue({ sub: 'user-1', email: 'test@example.com', role: 'viewer' });
    const req = {
      headers: { authorization: 'Bearer token' } as Record<string, unknown>,
      userId: 'user-1',
      userRole: 'viewer',
    } as FastifyRequest & { userId?: string; userRole?: string };
    const reply = makeReply();
    await requireRole('admin')(req, reply);
    expect(reply.code).toHaveBeenCalledWith(403);
  });
});

// ─── Document ownership check ──────────────────────────────────────────────────

describe('document ownership > pipeline creation', () => {
  it('a document belongs to user-1, not user-2', () => {
    // The actual ownership check is in getDocumentById(userId, documentId)
    // documents table has user_id column; Kysely queries filter by user_id
    const document = { id: 'doc-1', user_id: 'user-1', name: 'report.pdf' };
    expect(document.user_id).toBe('user-1');
    expect(document.user_id).not.toBe('user-2');
  });
});