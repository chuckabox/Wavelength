import 'dotenv/config';
import { z } from 'zod';

/**
 * Environment contract. Validated once at startup — the server fails fast on
 * misconfiguration rather than crashing later at an inference call.
 */
const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(8080),
  LOG_LEVEL: z
    .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
    .default('info'),

  // DigitalOcean Gradient inference. Optional so the server can boot for /health,
  // but any inference call fails loudly if it is missing.
  DIGITAL_OCEAN_MODEL_ACCESS_KEY: z.string().min(1).optional(),
  DO_INFERENCE_BASE_URL: z.string().url().default('https://inference.do-ai.run/v1'),
  // Model names verified working on DO 2026-07-11; the Phase 0 spike re-confirms.
  MODEL_FAST: z.string().default('anthropic-claude-haiku-4.5'),
  MODEL_SMART: z.string().default('anthropic-claude-4.6-sonnet'),

  // Managed Postgres — optional until Phase 1.
  DATABASE_URL: z.string().url().optional(),

  // Comma-separated list of allowed browser origins.
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
});

export type Env = z.infer<typeof EnvSchema>;

let cached: Env | null = null;

export function loadEnv(): Env {
  if (cached) return cached;
  const parsed = EnvSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join('.') || '(root)'}: ${i.message}`)
      .join('\n');
    throw new Error(`Invalid environment configuration:\n${issues}`);
  }
  cached = parsed.data;
  return cached;
}
