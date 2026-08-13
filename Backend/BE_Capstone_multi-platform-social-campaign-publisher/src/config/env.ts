import { z } from 'zod';

/**
 * All environment variables are validated at boot. A misconfigured
 * deployment fails fast with a clear message instead of misbehaving at
 * runtime (§17/§24 of the build spec).
 */
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),

  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  REDIS_URL: z.string().min(1, 'REDIS_URL is required'),

  ENCRYPTION_KEY: z
    .string()
    .min(1, 'ENCRYPTION_KEY is required')
    .refine((v) => Buffer.from(v, 'base64').length === 32, {
      message: 'ENCRYPTION_KEY must decode to exactly 32 bytes (AES-256)',
    }),
  WEBHOOK_SECRET: z.string().min(16, 'WEBHOOK_SECRET must be at least 16 characters'),

  FAKE_PLATFORM_BASE_URL: z.string().url(),
  FAKE_PLATFORM_WEBHOOK_TARGET_URL: z.string().url(),

  AI_PROVIDER: z.enum(['none', 'openai', 'gemini', 'ollama']).default('none'),
  AI_API_KEY: z.string().optional().default(''),
  AI_MONTHLY_BUDGET_USD: z.coerce.number().nonnegative().default(5),
});

export type Env = z.infer<typeof envSchema>;

function loadEnv(): Env {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    // eslint-disable-next-line no-console
    console.error('Invalid environment configuration:', parsed.error.flatten().fieldErrors);
    throw new Error('Environment validation failed — see printed field errors above.');
  }
  return parsed.data;
}

export const env = loadEnv();
