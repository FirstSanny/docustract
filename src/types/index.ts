// Shared TypeScript types for DocuStract

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  role: 'admin' | 'editor' | 'viewer';
  createdAt: Date;
  updatedAt: Date;
}

export interface ApiKey {
  id: string;
  userId: string;
  keyPrefix: string; // e.g., "dsk_live_"
  keyHash: string;
  name: string;
  lastUsedAt: Date | null;
  expiresAt: Date | null;
  createdAt: Date;
}

export interface Document {
  id: string;
  userId: string;
  name: string;
  mimeType: string;
  sizeBytes: number;
  status: 'pending' | 'processing' | 'done' | 'failed';
  storageId: string | null;
  storagePreviewUrl: string | null;
  storageDownloadUrl: string | null;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface Pipeline {
  id: string;
  userId: string;
  documentId: string;
  type: string;
  status: 'queued' | 'running' | 'done' | 'failed';
  result: Record<string, unknown> | null;
  errorMessage: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaginationParams {
  limit: number;
  offset: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
}

export interface ApiError {
  statusCode: number;
  error: string;
  message: string;
}
