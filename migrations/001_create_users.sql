-- Migration: 001_create_users
-- Description: Users table for authentication

CREATE TABLE IF NOT EXISTS users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email       TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role        TEXT NOT NULL CHECK (role IN ('admin', 'editor', 'viewer')) DEFAULT 'viewer',
  created_at  TIMESTAMP NOT NULL DEFAULT now(),
  updated_at  TIMESTAMP NOT NULL DEFAULT now()
);

-- Index for case-insensitive email lookups
CREATE INDEX IF NOT EXISTS users_email_lower_idx ON users (lower(email));

-- Index for role-based queries
CREATE INDEX IF NOT EXISTS users_role_idx ON users (role);
