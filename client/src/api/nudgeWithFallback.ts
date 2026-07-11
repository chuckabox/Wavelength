import { ApiError } from '@/api/base';
import { requestNudge } from '@/api/nudge';
import type { Confidence, NudgeRequest, NudgeResponse } from 'shared';

const CANNED: Record<Confidence, string[]> = {
  low: [
    'Things look mostly steady — maybe check in with a short question when it feels natural?',
    'Soft signal only — you could pause briefly and invite their take, if it fits.',
  ],
  medium: [
    'They may be drifting a bit — maybe ask a question or hand them the floor?',
    'Engagement looks softer than earlier — a brief check-in question could help.',
  ],
  high: [
    'Partner attention looks low right now — consider a short question or a lighter topic shift.',
    'This might be a good moment to pause and ask what they think.',
  ],
};

export function localCannedNudge(confidence: Confidence, evidence: string[]): NudgeResponse {
  const options = CANNED[confidence];
  return {
    text: options[evidence.length % options.length]!,
    confidence,
    evidence,
  };
}

/** Prefer live /v1/nudge; fall back to local canned copy on network/API failure. */
export async function requestNudgeWithFallback(
  body: NudgeRequest,
): Promise<{ response: NudgeResponse; fallback: boolean }> {
  try {
    const response = await requestNudge(body);
    return { response, fallback: false };
  } catch (err) {
    console.warn('nudge failed, using local fallback', err);
    if (err instanceof ApiError || err instanceof TypeError) {
      return {
        response: localCannedNudge(body.confidence, body.evidence),
        fallback: true,
      };
    }
    throw err;
  }
}
