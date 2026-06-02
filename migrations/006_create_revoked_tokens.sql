-- Migration: 006_create_revoked_tokens
-- Description: Revoked refresh tokens for token rotation and logout

CREATE TABLE IF NOT EXISTS revoked_tokens (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  jti         TEXT NOT NULL,  -- JWT ID from the revoked token's header
  revoked_at  TIMESTAMP NOT NULL DEFAULT now(),
  expires_at  TIMESTAMP NOT NULL  -- When the token would have expired
);

-- Index for fast revocation checks
CREATE INDEX IF NOT EXISTS revoked_tokens_jti_idx ON revoked_tokens (jti);
-- Index for cleanup of old records
CREATE INDEX IF NOT EXISTS revoked_tokens_expires_at_idx ON revoked_tokens (expires_at);