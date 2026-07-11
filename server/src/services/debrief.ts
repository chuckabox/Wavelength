import { analyzeSession, type DebriefInput, type DebriefRequest, type SignalFrame } from 'shared';
import { stream, type ModelTier } from '../clients/gradient.js';
import { AppError } from '../errors.js';
import { logger } from '../logger.js';
import { getFrames } from '../repositories/frames.js';
import { cannedDebrief } from './fallbacks.js';
import { computeMetrics } from './metrics.js';

function normalizeDebriefRequest(req: DebriefRequest): DebriefInput {
  return { ...req, transcript: req.transcript ?? [] };
}

function formatTime(t: number) {
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

const DEBRIEF_SYSTEM = `You write post-conversation debriefs for Wavelength.

Rules:
- Be incredibly warm, empathetic, and conversational. Speak directly to the user like a supportive coach or friend. Do NOT sound like a clinical science paper or a sterile report.
- Gently suggest, never diagnose. Use soft emotion labels (happy/sad/tense/surprised/uncertain/calm) but hedge them kindly ("you seemed a bit tense", "you might have been uncertain").
- Highlight observable shifts in their signals (engagement, attention).
- Treat "body" (arousal/heart rate) signals as experimental. Never claim they reveal a hidden truth; simply note that a signal moved.
- Ground every claim in the provided facts. NEVER invent a timestamp, number, or quote.
- Include specific references to what they said (using quotes) and exactly when it happened. Always format times as minutes and seconds (e.g., "At 1:24...").

Structure (flowing prose, warm tone):
1) THE HEADLINE — if a face/body divergence ("The Tell") is provided, gently introduce it as an interesting moment of mixed signals. If there is no Tell, lead with the clearest engagement shift.
2) 2–3 EVENT-ANCHORED beats — tied to specific moments from the facts. Connect the signal shifts to what was exactly said ("Right around 1:24 when you mentioned...").
3) 1–2 kind, actionable things to try next time, tied to the specific moments discussed.

Keep it tight (~180–240 words). ALWAYS use mm:ss format for timestamps (e.g., 1:24) in your response, even if the provided facts use raw seconds. Write in flowing paragraphs without clinical labels or headers.`;

function framesFromRows(
  rows: Array<{
    t: number;
    engagement: number | null;
    valence: number | null;
    attention: number | null;
    signals: Record<string, number> | null;
    confidence: 'low' | 'medium' | 'high' | null;
  }>,
): SignalFrame[] {
  return rows.map((r) => ({
    t: r.t,
    engagement: r.engagement ?? undefined,
    valence: r.valence ?? undefined,
    attention: r.attention ?? undefined,
    signals: r.signals ?? undefined,
    confidence: r.confidence ?? undefined,
  }));
}

async function resolveFrames(req: DebriefRequest): Promise<SignalFrame[]> {
  if (req.frames && req.frames.length > 0) return req.frames;
  if (req.sessionId) {
    const rows = await getFrames(req.sessionId);
    return framesFromRows(rows);
  }
  return [];
}

function buildPrompt(req: DebriefInput, factLines: string[], tellLine: string | null): string {
  const parts: string[] = [];
  if (req.context) parts.push(`Session context: ${req.context}`);
  if (tellLine) {
    parts.push('THE TELL (lead with this — the biggest face/body divergence):');
    parts.push(`- ${tellLine}`);
  }
  parts.push('Grounded facts (computed in code — treat as true; do not add any others):');
  parts.push(...factLines.map((l) => `- ${l}`));

  if (req.transcript.length > 0) {
    parts.push('Transcript (speaker @ t minutes:seconds):');
    const clip = req.transcript.slice(0, 80);
    for (const turn of clip) {
      parts.push(`[${formatTime(turn.t)}] ${turn.speaker}: ${turn.text}`);
    }
    if (req.transcript.length > 80) {
      parts.push(`… (${req.transcript.length - 80} more turns omitted)`);
    }
  }

  parts.push('Write the debrief now.');
  return parts.join('\n');
}

/**
 * Yield debrief text deltas. On missing key / immediate upstream failure,
 * yields the full canned debrief as a single chunk instead of throwing.
 */
export async function* streamDebrief(raw: DebriefRequest): AsyncGenerator<string> {
  const req = normalizeDebriefRequest(raw);
  const frames = await resolveFrames(req);
  const metrics = computeMetrics(frames, req.transcript);
  const analysis = analyzeSession(frames, req.transcript);
  const tier: ModelTier = req.tier ?? 'smart';
  // Event-based facts (moments, arousal, The Tell) lead; speech-stat facts fill in.
  const factLines = [...analysis.factLines, ...metrics.factLines];
  const tellLine = analysis.theTell
    ? `Near ${formatTime(analysis.theTell.t)}, ${analysis.theTell.bodyDesc}, while the ${analysis.theTell.faceDesc}.`
    : null;
  const prompt = buildPrompt(req, factLines, tellLine);

  try {
    for await (const delta of stream({
      tier,
      system: DEBRIEF_SYSTEM,
      prompt,
      maxTokens: 1024,
    })) {
      yield delta;
    }
  } catch (err) {
    if (err instanceof AppError && err.code === 'upstream_error') {
      logger.warn(
        { code: err.code, message: err.message, tier },
        'Debrief falling back to canned copy',
      );
      yield cannedDebrief(metrics, req.context);
      return;
    }
    throw err;
  }
}
