import { Kysely, PostgresDialect } from 'kysely';
import pg from 'pg';
import { env } from '../config/index.js';

export interface Database {
  users: UserTable;
  api_keys: ApiKeyTable;
  documents: DocumentTable;
  pipelines: PipelineTable;
  revoked_tokens: RevokedTokenTable;
}

export interface RevokedTokenTable {
  id?: string;
  user_id: string;
  jti: string;
  revoked_at?: Date;
  expires_at: Date;
}

export interface UserTable {
  id: string;
  email: string;
  password_hash: string;
  role: 'admin' | 'editor' | 'viewer';
  created_at: Date;
  updated_at: Date;
}

export interface ApiKeyTable {
  id: string;
  user_id: string;
  key_prefix: string;
  key_hash: string;
  name: string;
  last_used_at: Date | null;
  expires_at: Date | null;
  created_at: Date;
}

export interface DocumentTable {
  id: string;
  user_id: string;
  name: string;
  mime_type: string;
  size_bytes: number;
  status: 'pending' | 'processing' | 'done' | 'failed';
  storage_id: string | null;
  storage_preview_url: string | null;
  storage_download_url: string | null;
  metadata: Record<string, unknown>;
  created_at: Date;
  updated_at: Date;
}

export interface PipelineTable {
  id: string;
  user_id: string;
  document_id: string;
  type: string;
  status: 'queued' | 'running' | 'done' | 'failed';
  result: Record<string, unknown> | null;
  error_message: string | null;
  created_at: Date;
  updated_at: Date;
}

const dialect = new PostgresDialect({
  pool: async () => new pg.Pool({ connectionString: env.DATABASE_URL }),
});

export const db = new Kysely<Database>({ dialect });

export async function closeDb(): Promise<void> {
  await db.destroy();
}
