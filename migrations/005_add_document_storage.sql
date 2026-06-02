-- Migration: 005_add_document_storage
-- Description: Add Appwrite storage columns to documents table

ALTER TABLE documents
  ADD COLUMN IF NOT EXISTS storage_id TEXT,
  ADD COLUMN IF NOT EXISTS storage_preview_url TEXT,
  ADD COLUMN IF NOT EXISTS storage_download_url TEXT;