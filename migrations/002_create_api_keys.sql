-- Migration: 002_create_api_keys
-- Description: API keys for programmatic access

CREATE TABLE IF NOT EXISTS api_keys (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  key_prefix  TEXT NOT NULL,  -- e.g., "dsk_live_xxxx"
  key_hash    TEXT NOT NULL,  -- SHA-256 hash of the full key
  name        TEXT NOT NULL,
  last_used_at TIMESTAMP,
  expires_at  TIMESTAMP,
  created_at  TIMESTAMP NOT NULL DEFAULT now()
);

-- Index for looking up key by prefix (unique)
CREATE UNIQUE INDEX IF NOT EXISTS api_keys_prefix_idx ON api_keys (key_prefix);

-- Index for listing keys by user
CREATE INDEX IF NOT EXISTS api_keys_user_id_idx ON api_keys (user_id);
