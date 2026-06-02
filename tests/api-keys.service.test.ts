/**
 * API Keys Service Unit Tests
 *
 * Tests src/services/api-keys.ts using mocked Kysely DB.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockExecuteTakeFirst = vi.fn();
const mockExecute = vi.fn();

const mockDb = {
  insertInto: vi.fn(),
  selectFrom: vi.fn(),
  deleteFrom: vi.fn(),
  updateTable: vi.fn(),
};

vi.mock('../src/db/index.js', () => ({ db: mockDb }));

beforeEach(() => {
  vi.clearAllMocks();
  mockExecuteTakeFirst.mockReset();
  mockExecute.mockReset();
});

// Helper to reset modules and re-import with fresh mocks
async function getService() {
  const mod = await import('../src/services/api-keys.js');
  return {
    createApiKey: mod.createApiKey,
    listApiKeys: mod.listApiKeys,
    deleteApiKey: mod.deleteApiKey,
    verifyApiKey: mod.verifyApiKey,
  };
}

const now = new Date();

function setupInsertMock(row: Record<string, unknown>) {
  mockDb.insertInto.mockReturnValue({
    values: () => ({
      returningAll: () => ({ executeTakeFirst: mockExecuteTakeFirst.mockResolvedValue(row) }),
    }),
  });
}

function setupSelectMock(rows: Record<string, unknown>[]) {
  mockDb.selectFrom.mockReturnValue({
    selectAll: () => ({
      where: () => ({
        orderBy: () => ({
          execute: mockExecute.mockResolvedValue(rows),
        }),
        execute: mockExecute.mockResolvedValue(rows),
      }),
      execute: mockExecute.mockResolvedValue(rows),
    }),
  });
}

function setupDeleteMock(numDeletedRows = 1) {
  mockDb.deleteFrom.mockReturnValue({
    where: () => ({
      where: () => ({
        executeTakeFirst: mockExecuteTakeFirst.mockResolvedValue({
          numDeletedRows: BigInt(numDeletedRows),
        }),
      }),
    }),
    executeTakeFirst: mockExecuteTakeFirst.mockResolvedValue({
      numDeletedRows: BigInt(numDeletedRows),
    }),
  });
}

function setupUpdateMock() {
  mockDb.updateTable.mockReturnValue({
    set: () => ({
      where: () => ({
        executeTakeFirst: mockExecuteTakeFirst.mockResolvedValue({}),
      }),
    }),
  });
}

// ─── createApiKey ──────────────────────────────────────────────────────────────

describe('api-keys service > createApiKey', () => {
  it('creates a key and returns plaintext once', async () => {
    const { createApiKey } = await getService();
    setupInsertMock({
      id: 'key-123', user_id: 'user-456', key_prefix: 'dsk_live_abc1',
      name: 'My Key', last_used_at: null, expires_at: null, created_at: now,
    });

    const result = await createApiKey({ userId: 'user-456', name: 'My Key' });

    expect(result.id).toBe('key-123');
    expect(result.userId).toBe('user-456');
    expect(result.keyPrefix).toBe('dsk_live_abc1');
    expect(result.plaintextKey).toMatch(/^dsk_live_/);
    expect(result.plaintextKey).toBeTruthy();
    expect(result.name).toBe('My Key');
  });

  it('sets expiresAt when provided', async () => {
    const { createApiKey } = await getService();
    const expiresAt = new Date('2030-01-01');
    setupInsertMock({
      id: 'key-789', user_id: 'user-456', key_prefix: 'dsk_live_def2',
      name: 'Expiring', last_used_at: null, expires_at: expiresAt, created_at: now,
    });

    const result = await createApiKey({ userId: 'user-456', name: 'Expiring', expiresAt });

    expect(result.expiresAt).toEqual(expiresAt);
    expect(mockDb.insertInto).toHaveBeenCalledWith('api_keys');
  });

  it('throws when db insert returns null', async () => {
    const { createApiKey } = await getService();
    setupInsertMock(null);

    await expect(createApiKey({ userId: 'user-456', name: 'Key' }))
      .rejects.toThrow('Failed to create API key');
  });
});

// ─── listApiKeys ───────────────────────────────────────────────────────────────

describe('api-keys service > listApiKeys', () => {
  it('returns keys sorted by created_at desc', async () => {
    const { listApiKeys } = await getService();
    setupSelectMock([
      { id: 'key-2', user_id: 'user-456', key_prefix: 'dsk_live_xyz', name: 'Key 2', last_used_at: null, expires_at: null, created_at: now },
      { id: 'key-1', user_id: 'user-456', key_prefix: 'dsk_live_abc', name: 'Key 1', last_used_at: null, expires_at: null, created_at: new Date(now.getTime() - 1000) },
    ]);

    const keys = await listApiKeys('user-456');

    expect(keys).toHaveLength(2);
    expect(keys[0].id).toBe('key-2');
    expect(keys[1].id).toBe('key-1');
  });

  it('returns empty array when user has no keys', async () => {
    const { listApiKeys } = await getService();
    setupSelectMock([]);

    const keys = await listApiKeys('user-no-keys');

    expect(keys).toHaveLength(0);
  });

  it('maps DB row fields to camelCase correctly', async () => {
    const { listApiKeys } = await getService();
    setupSelectMock([{
      id: 'k1', user_id: 'u1', key_prefix: 'dsk_live_x',
      name: 'Test', last_used_at: now, expires_at: null, created_at: now,
    }]);

    const keys = await listApiKeys('u1');

    expect(keys[0].keyPrefix).toBe('dsk_live_x');
    expect(keys[0].lastUsedAt).toEqual(now);
  });
});

// ─── deleteApiKey ──────────────────────────────────────────────────────────────

describe('api-keys service > deleteApiKey', () => {
  it('returns true when key exists and belongs to user', async () => {
    const { deleteApiKey } = await getService();
    setupDeleteMock(1);

    const result = await deleteApiKey('key-123', 'user-456');

    expect(result).toBe(true);
    expect(mockDb.deleteFrom).toHaveBeenCalledWith('api_keys');
  });

  it('returns false when key does not exist', async () => {
    const { deleteApiKey } = await getService();
    setupDeleteMock(0);

    const result = await deleteApiKey('nonexistent', 'user-456');

    expect(result).toBe(false);
  });
});

// ─── verifyApiKey ──────────────────────────────────────────────────────────────

describe('api-keys service > verifyApiKey', () => {
  it('returns null when no keys match the prefix', async () => {
    const { verifyApiKey } = await getService();
    setupSelectMock([]);

    const result = await verifyApiKey('dsk_live_unknown_base64url_value');

    expect(result).toBeNull();
  });

  it('queries DB with the correct key prefix', async () => {
    const { verifyApiKey } = await getService();
    setupSelectMock([]);

    await verifyApiKey('dsk_live_abc1some_extra_chars');

    // selectFrom is called with 'api_keys' and then .selectAll().where('key_prefix', '=', 'dsk_live_abc1')
    expect(mockDb.selectFrom).toHaveBeenCalledWith('api_keys');
  });

  it('throws when db selectAll().where().execute() fails', async () => {
    const { verifyApiKey } = await getService();
    mockDb.selectFrom.mockReturnValue({
      selectAll: () => ({
        where: () => ({
          execute: vi.fn().mockRejectedValue(new Error('DB error')),
        }),
      }),
    });

    await expect(verifyApiKey('dsk_live_abc1test')).rejects.toThrow('DB error');
  });

  it('throws when db updateTable fails', async () => {
    const { verifyApiKey } = await getService();
    const hash = 'a'.repeat(64);
    setupSelectMock([{
      id: 'key-123', user_id: 'user-456', key_prefix: 'dsk_live_',
      key_hash: hash, name: 'Test', last_used_at: null, expires_at: null, created_at: now,
    }]);
    mockDb.updateTable.mockReturnValue({
      set: () => ({
        where: () => ({
          executeTakeFirst: vi.fn().mockRejectedValue(new Error('Update failed')),
        }),
      }),
    });

    // Won't match (hash mismatch), so returns null before hitting update
    const result = await verifyApiKey('dsk_live_test_value_that_wont_match_hash');
    expect(result).toBeNull();
  });
});

// ─── dbApiKeyToApiKey mapping ──────────────────────────────────────────────────

describe('api-keys service > dbApiKeyToApiKey (via listApiKeys)', () => {
  it('handles null last_used_at and expires_at', async () => {
    const { listApiKeys } = await getService();
    setupSelectMock([{
      id: 'k1', user_id: 'u1', key_prefix: 'dsk_live_x',
      name: 'Test', last_used_at: null, expires_at: null, created_at: now,
    }]);

    const keys = await listApiKeys('u1');

    expect(keys[0].lastUsedAt).toBeNull();
    expect(keys[0].expiresAt).toBeNull();
  });

  it('handles populated last_used_at and expires_at', async () => {
    const { listApiKeys } = await getService();
    const lastUsed = new Date();
    const expires = new Date('2030-01-01');
    setupSelectMock([{
      id: 'k1', user_id: 'u1', key_prefix: 'dsk_live_x',
      name: 'Test', last_used_at: lastUsed, expires_at: expires, created_at: now,
    }]);

    const keys = await listApiKeys('u1');

    expect(keys[0].lastUsedAt).toEqual(lastUsed);
    expect(keys[0].expiresAt).toEqual(expires);
  });
});