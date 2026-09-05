import { Kysely, PostgresDialect, type Generated, type Insertable, type Selectable, type Updateable } from 'kysely';
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
  id: Generated<string>;
  user_id: string;
  jti: string;
  revoked_at: Generated<Date>;
  expires_at: Date;
}

export type NewRevokedToken = Insertable<RevokedTokenTable>;
export type RevokedToken = Selectable<RevokedTokenTable>;

export interface UserTable {
  id: Generated<string>;
  email: string;
  password_hash: string;
  role: 'admin' | 'editor' | 'viewer';
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}

export type NewUser = Insertable<UserTable>;
export type UserRow = Selectable<UserTable>;

export interface ApiKeyTable {
  id: Generated<string>;
  user_id: string;
  key_prefix: string;
  key_hash: string;
  name: string;
  last_used_at: Generated<Date | null>;
  expires_at: Date | null;
  created_at: Generated<Date>;
}

export type NewApiKey = Insertable<ApiKeyTable>;
export type ApiKeyRow = Selectable<ApiKeyTable>;

export interface DocumentTable {
  id: Generated<string>;
  user_id: string;
  name: string;
  mime_type: string;
  size_bytes: number;
  status: Generated<'pending' | 'processing' | 'done' | 'failed'>;
  storage_id: Generated<string | null>;
  storage_preview_url: Generated<string | null>;
  storage_download_url: Generated<string | null>;
  metadata: Record<string, unknown>;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}

export type NewDocument = Insertable<DocumentTable>;
export type DocumentRow = Selectable<DocumentTable>;
export type DocumentUpdate = Updateable<DocumentTable>;

export interface PipelineTable {
  id: Generated<string>;
  user_id: string;
  document_id: string;
  type: string;
  status: Generated<'queued' | 'running' | 'done' | 'failed'>;
  result: Generated<Record<string, unknown> | null>;
  error_message: Generated<string | null>;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}

export type NewPipeline = Insertable<PipelineTable>;
export type PipelineRow = Selectable<PipelineTable>;

const dialect = new PostgresDialect({
  pool: async () => new pg.Pool({ connectionString: env.DATABASE_URL }),
});

export const db = new Kysely<Database>({ dialect });

export async function closeDb(): Promise<void> {
  await db.destroy();
}
