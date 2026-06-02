import { describe, it, expect } from 'vitest';
import { z } from 'zod';

describe('Config validation', () => {
  it('should have valid Zod schema for environment', () => {
    const envSchema = z.object({
      NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
      PORT: z.coerce.number().default(3000),
      DATABASE_URL: z.string().url(),
      JWT_SECRET: z.string().min(32),
      JWT_EXPIRES_IN: z.string().default('7d'),
      REFRESH_TOKEN_EXPIRES_IN: z.string().default('30d'),
    });

    const validEnv = {
      DATABASE_URL: 'postgresql://localhost:5432/docustract',
      JWT_SECRET: 'a-very-long-secret-that-is-at-least-32-chars',
    };

    const result = envSchema.safeParse(validEnv);
    expect(result.success).toBe(true);
  });

  it('should reject DATABASE_URL that is not a valid URL', () => {
    const envSchema = z.object({
      NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
      PORT: z.coerce.number().default(3000),
      DATABASE_URL: z.string().url(),
      JWT_SECRET: z.string().min(32),
    });

    const invalidEnv = {
      DATABASE_URL: 'not-a-valid-url',
      JWT_SECRET: 'a-very-long-secret-that-is-at-least-32-chars',
    };

    const result = envSchema.safeParse(invalidEnv);
    expect(result.success).toBe(false);
  });
});

describe('Zod type inference', () => {
  it('should infer correct types from schema', () => {
    const schema = z.object({
      id: z.string().uuid(),
      email: z.string().email(),
      role: z.enum(['admin', 'editor', 'viewer']),
    });

    const parsed = schema.parse({
      id: '550e8400-e29b-41d4-a716-446655440000',
      email: 'user@example.com',
      role: 'editor',
    });

    expect(parsed.id).toBe('550e8400-e29b-41d4-a716-446655440000');
    expect(parsed.email).toBe('user@example.com');
    expect(parsed.role).toBe('editor');
  });
});
