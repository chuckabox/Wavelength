import OpenAI from 'openai';
import { loadEnv } from '../config/env.js';
import { AppError } from '../errors.js';

/**
 * Thin wrapper over DigitalOcean Gradient (OpenAI-compatible). Phase 2 grows this
 * with streaming + a `structured()` forced-tool-call helper; for now it exposes
 * just what the Phase 0 spike needs.
 */
let cached: OpenAI | null = null;

function client(): OpenAI {
  if (cached) return cached;
  const env = loadEnv();
  if (!env.DIGITAL_OCEAN_MODEL_ACCESS_KEY) {
    throw AppError.upstream('DIGITAL_OCEAN_MODEL_ACCESS_KEY not configured');
  }
  cached = new OpenAI({
    apiKey: env.DIGITAL_OCEAN_MODEL_ACCESS_KEY,
    baseURL: env.DO_INFERENCE_BASE_URL,
  });
  return cached;
}

export async function listModels(): Promise<string[]> {
  const res = await client().models.list();
  return res.data.map((m) => m.id);
}

export async function chat(model: string, prompt: string): Promise<string> {
  const res = await client().chat.completions.create({
    model,
    messages: [{ role: 'user', content: prompt }],
    max_completion_tokens: 256,
  });
  return res.choices[0]?.message?.content ?? '';
}
