import { db } from '../db/index.js';
import type { PipelineTable } from '../db/index.js';
import type { Pipeline, PaginationParams, PaginatedResult } from '../types/index.js';

export interface CreatePipelineInput {
  userId: string;
  documentId: string;
  type: string;
}

export async function createPipeline(input: CreatePipelineInput): Promise<Pipeline> {
  const row = await db
    .insertInto('pipelines')
    // @ts-ignore -- id/created_at/updated_at have DB defaults
    .values({
      user_id: input.userId,
      document_id: input.documentId,
      type: input.type,
    })
    .returningAll()
    .executeTakeFirst();

  if (!row) throw new Error('Failed to create pipeline');
  return dbPipelineToPipeline(row);
}

export async function getPipelineById(id: string, userId: string): Promise<Pipeline | null> {
  const row = await db
    .selectFrom('pipelines')
    .selectAll()
    .where('id', '=', id)
    .where('user_id', '=', userId)
    .executeTakeFirst();

  if (!row) return null;
  return dbPipelineToPipeline(row);
}

export async function listPipelines(
  userId: string,
  params: PaginationParams,
): Promise<PaginatedResult<Pipeline>> {
  const { limit, offset } = params;

  const [rows, countRow] = await Promise.all([
    db
      .selectFrom('pipelines')
      .selectAll()
      .where('user_id', '=', userId)
      .orderBy('created_at', 'desc')
      .limit(limit)
      .offset(offset)
      .execute(),
    db
      .selectFrom('pipelines')
      .select((eb) => eb.fn.countAll().as('count'))
      .where('user_id', '=', userId)
      .executeTakeFirst(),
  ]);

  return {
    data: rows.map(dbPipelineToPipeline),
    total: Number(countRow?.count ?? 0),
    limit,
    offset,
  };
}

export async function deletePipeline(id: string, userId: string): Promise<boolean> {
  const result = await db
    .deleteFrom('pipelines')
    .where('id', '=', id)
    .where('user_id', '=', userId)
    .executeTakeFirst();

  return result.numDeletedRows > 0;
}

function dbPipelineToPipeline(row: PipelineTable): Pipeline {
  return {
    id: row.id,
    userId: row.user_id,
    documentId: row.document_id,
    type: row.type,
    status: row.status,
    result: row.result,
    errorMessage: row.error_message,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
