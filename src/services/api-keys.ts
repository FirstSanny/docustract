import crypto from 'crypto';
import { db } from '../db/index.js';
import type { ApiKeyTable } from '../db/index.js';
import type { User } from '../types/index.js';

export interface ApiKey {
  id: string;
  userId: string;
  keyPrefix: string;
  name: string;
  lastUsedAt: Date | null;
  expiresAt: Date | null;
  createdAt: Date;
}

export interface CreateApiKeyInput {
  userId: string;
  name: string;
  expiresAt?: Date | null;
}

export interface CreatedApiKey extends ApiKey {
  /** Only returned once at creation — the plaintext key the user must save */
  plaintextKey: string;
}

const KEY_PREFIX = 'dsk_live_';

function hashKey(plaintextKey: string): string {
  return crypto.createHash('sha256').update(plaintextKey).digest('hex');
}

function generatePlaintextKey(): string {
  return `${KEY_PREFIX}${crypto.randomBytes(24).toString('base64url')}`;
}

export async function createApiKey(input: CreateApiKeyInput): Promise<CreatedApiKey> {
  const plaintextKey = generatePlaintextKey();
  const prefix = plaintextKey.slice(0, KEY_PREFIX.length + 4); // e.g. "dsk_live_abc1"
  const keyHash = hashKey(plaintextKey);

  const row = await db
    .insertInto('api_keys')
    // @ts-ignore -- id/created_at have DB defaults
    .values({
      user_id: input.userId,
      key_prefix: prefix,
      key_hash: keyHash,
      name: input.name,
      expires_at: input.expiresAt ?? null,
    })
    .returningAll()
    .executeTakeFirst();

  if (!row) throw new Error('Failed to create API key');

  return {
    id: row.id,
    userId: row.user_id,
    keyPrefix: row.key_prefix,
    name: row.name,
    lastUsedAt: row.last_used_at,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
    plaintextKey,
  };
}

export async function listApiKeys(userId: string): Promise<ApiKey[]> {
  const rows = await db
    .selectFrom('api_keys')
    .selectAll()
    .where('user_id', '=', userId)
    .orderBy('created_at', 'desc')
    .execute();
  return rows.map(dbApiKeyToApiKey);
}

export async function deleteApiKey(id: string, userId: string): Promise<boolean> {
  const result = await db
    .deleteFrom('api_keys')
    .where('id', '=', id)
    .where('user_id', '=', userId)
    .executeTakeFirst();
  return result.numDeletedRows > 0;
}

export async function verifyApiKey(plaintextKey: string): Promise<{ userId: string; keyId: string } | null> {
  const prefix = plaintextKey.slice(0, KEY_PREFIX.length + 4);
  const rows = await db
    .selectFrom('api_keys')
    .selectAll()
    .where('key_prefix', '=', prefix)
    .execute();

  for (const row of rows) {
    if (crypto.timingSafeEqual(Buffer.from(hashKey(plaintextKey)), Buffer.from(row.key_hash))) {
      // Check expiry
      if (row.expires_at && new Date(row.expires_at) < new Date()) {
        return null;
      }
      // Update last_used_at
      await db
        .updateTable('api_keys')
        .set({ last_used_at: new Date() })
        .where('id', '=', row.id)
        .executeTakeFirst();
      return { userId: row.user_id, keyId: row.id };
    }
  }
  return null;
}

function dbApiKeyToApiKey(row: ApiKeyTable): ApiKey {
  return {
    id: row.id,
    userId: row.user_id,
    keyPrefix: row.key_prefix,
    name: row.name,
    lastUsedAt: row.last_used_at,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
  };
}