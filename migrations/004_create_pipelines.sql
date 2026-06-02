-- Migration: 004_create_pipelines
-- Description: Pipelines table for document processing workflows

CREATE TABLE IF NOT EXISTS pipelines (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  document_id   UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  type          TEXT NOT NULL,
  status        TEXT NOT NULL CHECK (status IN ('queued', 'running', 'done', 'failed')) DEFAULT 'queued',
  result        JSONB,
  error_message TEXT,
  created_at    TIMESTAMP NOT NULL DEFAULT now(),
  updated_at    TIMESTAMP NOT NULL DEFAULT now()
);

-- Index for listing pipelines by user
CREATE INDEX IF NOT EXISTS pipelines_user_id_idx ON pipelines (user_id);

-- Index for pipelines by document
CREATE INDEX IF NOT EXISTS pipelines_document_id_idx ON pipelines (document_id);

-- Index for status filtering (find queued/running pipelines)
CREATE INDEX IF NOT EXISTS pipelines_status_idx ON pipelines (status);

-- Index for user + status combined queries
CREATE INDEX IF NOT EXISTS pipelines_user_status_idx ON pipelines (user_id, status);

-- Index for recent pipelines
CREATE INDEX IF NOT EXISTS pipelines_created_at_idx ON pipelines (created_at DESC);
