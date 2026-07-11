/**
 * Phase 0 spike — prove the external contracts before building any domain logic.
 * Run: npm run spike -w server
 * Needs server/.env with DIGITAL_OCEAN_MODEL_ACCESS_KEY (and DATABASE_URL for check 4).
 *
 * Checks: (1) model list + expected names, (2) chat completion, (3) forced
 * tool-call = our structured-output path, (4) Postgres connectivity.
 */
import OpenAI from 'openai';
import pg from 'pg';
import { loadEnv } from './config/env.js';

async function main(): Promise<void> {
  const env = loadEnv();
  const results: Record<string, string> = {};

  if (!env.DIGITAL_OCEAN_MODEL_ACCESS_KEY) {
    console.error('✗ DIGITAL_OCEAN_MODEL_ACCESS_KEY is not set. Add it to server/.env');
    process.exit(1);
  }

  const openai = new OpenAI({
    apiKey: env.DIGITAL_OCEAN_MODEL_ACCESS_KEY,
    baseURL: env.DO_INFERENCE_BASE_URL,
  });

  // 1. Model list + confirm the names we plan to use actually exist.
  try {
    const models = await openai.models.list();
    const ids = models.data.map((m) => m.id);
    results['1_models'] =
      `OK — ${ids.length} models. ` +
      `FAST(${env.MODEL_FAST})=${ids.includes(env.MODEL_FAST)}, ` +
      `SMART(${env.MODEL_SMART})=${ids.includes(env.MODEL_SMART)}`;
  } catch (e) {
    results['1_models'] = `FAIL — ${(e as Error).message}`;
  }

  // 2. Plain chat completion.
  try {
    const r = await openai.chat.completions.create({
      model: env.MODEL_FAST,
      messages: [{ role: 'user', content: 'Reply with exactly one word: pong' }],
      max_completion_tokens: 16,
    });
    results['2_chat'] = `OK — "${r.choices[0]?.message?.content?.trim()}"`;
  } catch (e) {
    results['2_chat'] = `FAIL — ${(e as Error).message}`;
  }

  // 3. Forced tool-call — the structured-output path the whole backend relies on.
  try {
    const r = await openai.chat.completions.create({
      model: env.MODEL_FAST,
      messages: [
        { role: 'user', content: 'A conversation partner is smiling and leaning in. Emit a nudge.' },
      ],
      tools: [
        {
          type: 'function',
          function: {
            name: 'emit_nudge',
            description: 'Emit a single hedged, actionable nudge with a confidence level.',
            parameters: {
              type: 'object',
              properties: {
                text: { type: 'string' },
                confidence: { type: 'string', enum: ['low', 'medium', 'high'] },
              },
              required: ['text', 'confidence'],
            },
          },
        },
      ],
      tool_choice: { type: 'function', function: { name: 'emit_nudge' } },
      max_completion_tokens: 128,
    });
    const call = r.choices[0]?.message?.tool_calls?.[0];
    const args = call && 'function' in call ? JSON.parse(call.function.arguments) : null;
    results['3_toolcall'] = args ? `OK — ${JSON.stringify(args)}` : 'FAIL — no tool call returned';
  } catch (e) {
    results['3_toolcall'] = `FAIL — ${(e as Error).message}`;
  }

  // 4. Postgres connectivity (optional until Phase 1).
  if (env.DATABASE_URL) {
    const c = new pg.Client({
      connectionString: env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    });
    try {
      await c.connect();
      const r = await c.query('select version()');
      results['4_postgres'] = `OK — ${String(r.rows[0].version).slice(0, 40)}...`;
    } catch (e) {
      results['4_postgres'] = `FAIL — ${(e as Error).message}`;
    } finally {
      await c.end().catch(() => undefined);
    }
  } else {
    results['4_postgres'] = 'SKIP — DATABASE_URL not set';
  }

  console.log('\n=== Phase 0 spike ===');
  for (const [k, v] of Object.entries(results)) console.log(`${k.padEnd(12)} ${v}`);
  const failed = Object.values(results).some((v) => v.startsWith('FAIL'));
  console.log(failed ? '\n❌ Failures found — resolve before Phase 1.\n' : '\n✅ Spike passed.\n');
  process.exit(failed ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
