import { db } from '../db/index.js';
import type { DocumentRow, NewDocument } from '../db/index.js';
import type { Document, PaginationParams, PaginatedResult } from '../types/index.js';

export interface CreateDocumentInput {
  userId: string;
  name: string;
  mimeType: string;
  sizeBytes: number;
  metadata?: Record<string, unknown>;
}

export interface UpdateDocumentInput {
  name?: string;
  status?: Document['status'];
  storageId?: string | null;
  storagePreviewUrl?: string | null;
  storageDownloadUrl?: string | null;
  metadata?: Record<string, unknown>;
}

export async function createDocument(input: CreateDocumentInput): Promise<Document> {
  const values: NewDocument = {
    user_id: input.userId,
    name: input.name,
    mime_type: input.mimeType,
    size_bytes: input.sizeBytes,
    metadata: input.metadata ?? {},
  };

  const row = await db
    .insertInto('documents')
    .values(values)
    .returningAll()
    .executeTakeFirst();

  if (!row) throw new Error('Failed to create document');
  return dbDocumentToDocument(row);
}

export async function getDocumentById(id: string, userId: string): Promise<Document | null> {
  const row = await db
    .selectFrom('documents')
    .selectAll()
    .where('id', '=', id)
    .where('user_id', '=', userId)
    .executeTakeFirst();

  if (!row) return null;
  return dbDocumentToDocument(row);
}

export async function listDocuments(
  userId: string,
  params: PaginationParams,
): Promise<PaginatedResult<Document>> {
  const { limit, offset } = params;

  const [rows, countRow] = await Promise.all([
    db
      .selectFrom('documents')
      .selectAll()
      .where('user_id', '=', userId)
      .orderBy('created_at', 'desc')
      .limit(limit)
      .offset(offset)
      .execute(),
    db
      .selectFrom('documents')
      .select((eb) => eb.fn.countAll().as('count'))
      .where('user_id', '=', userId)
      .executeTakeFirst(),
  ]);

  return {
    data: rows.map(dbDocumentToDocument),
    total: Number(countRow?.count ?? 0),
    limit,
    offset,
  };
}

export async function updateDocument(
  id: string,
  userId: string,
  input: UpdateDocumentInput,
): Promise<Document | null> {
  const row = await db
    .updateTable('documents')
    .set({
      name: input.name,
      status: input.status,
      storage_id: input.storageId,
      storage_preview_url: input.storagePreviewUrl,
      storage_download_url: input.storageDownloadUrl,
      metadata: input.metadata,
      updated_at: new Date(),
    })
    .where('id', '=', id)
    .where('user_id', '=', userId)
    .returningAll()
    .executeTakeFirst();

  if (!row) return null;
  return dbDocumentToDocument(row);
}

export async function deleteDocument(id: string, userId: string): Promise<boolean> {
  const result = await db
    .deleteFrom('documents')
    .where('id', '=', id)
    .where('user_id', '=', userId)
    .executeTakeFirst();

  return result.numDeletedRows > 0;
}

function dbDocumentToDocument(row: DocumentRow): Document {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    mimeType: row.mime_type,
    sizeBytes: row.size_bytes,
    status: row.status,
    storageId: row.storage_id,
    storagePreviewUrl: row.storage_preview_url,
    storageDownloadUrl: row.storage_download_url,
    metadata: row.metadata,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
