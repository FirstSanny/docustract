-- Migration: 003_create_documents
-- Description: Documents table for uploaded documents

CREATE TABLE IF NOT EXISTS documents (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  mime_type   TEXT NOT NULL,
  size_bytes  BIGINT NOT NULL CHECK (size_bytes >= 0),
  status      TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'done', 'failed')) DEFAULT 'pending',
  metadata    JSONB DEFAULT '{}',
  created_at  TIMESTAMP NOT NULL DEFAULT now(),
  updated_at  TIMESTAMP NOT NULL DEFAULT now()
);

-- Index for listing documents by user (common query)
CREATE INDEX IF NOT EXISTS documents_user_id_idx ON documents (user_id);

-- Index for status filtering
CREATE INDEX IF NOT EXISTS documents_status_idx ON documents (status);

-- Index for user + status combined queries
CREATE INDEX IF NOT EXISTS documents_user_status_idx ON documents (user_id, status);

-- Index for recent documents (ordered by created_at)
CREATE INDEX IF NOT EXISTS documents_created_at_idx ON documents (created_at DESC);
