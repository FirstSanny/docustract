import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('7d'),
  REFRESH_TOKEN_EXPIRES_IN: z.string().default('30d'),
  CORS_ORIGINS: z.string().default('http://localhost:3000'),
  // Appwrite
  APPWRITE_ENDPOINT: z.string().url().default('https://fra.cloud.appwrite.io/v1'),
  APPWRITE_PROJECT_ID: z.string().min(1),
  APPWRITE_SECRET: z.string().min(1),
  APPWRITE_BUCKET_ID: z.string().default('documents'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables:', parsed.error.flatten());
  process.exit(1);
}

export const env = parsed.data;

export type Env = z.infer<typeof envSchema>;
