/**
 * Turn a raw signal trajectory into a *story*: discrete moments, a face↔body
 * congruence timeline, the single biggest "tell" (body arousal the face conceals),
 * and a single-camera responsiveness read. Pure — no I/O, shared by client & server.
 *
 * This is the layer that makes the debrief specific instead of averaged. It never
 * labels emotions; it describes observable signal *shifts* and their divergence,
 * always as grounded facts the LLM narrates rather than invents.
 */
import type { SignalFrame } from '../domain/signals.js';
import type { TranscriptTurn } from '../contracts/debrief.js';

export type MomentChannel = 'engagement' | 'arousal' | 'valence' | 'attention';

export interface Moment {
  t: number;
  channel: MomentChannel;
  direction: 'rise' | 'fall';
  /** 0–1 magnitude of the shift */
  magnitude: number;
  before: number;
  after: number;
  /** nearest transcript line around the shift (cause / context), if any */
  coText?: string;
  coSpeaker?: 'user' | 'partner';
}

export interface TheTell {
  t: number;
  /** arousal elevation above this person's own baseline, 0–1 */
  arousalElevation: number;
  /** heart rate at the moment, if available */
  bpm: number | null;
  faceDesc: string;
  bodyDesc: string;
  /** 0–1 strength of the divergence */
  strength: number;
}

export interface CongruencePoint {
  t: number;
  face: number; // normalized facial valence, ~-1..1
  body: number; // arousal 0..1
}

export interface Responsiveness {
  /** 0–1 or null when not computable */
  score: number | null;
  label: 'flat' | 'moderate' | 'lively' | null;
  basis: string;
}

export interface Analysis {
  moments: Moment[];
  theTell: TheTell | null;
  congruence: CongruencePoint[];
  responsiveness: Responsiveness;
  /** grounded, event-based lines for the debrief prompt */
  factLines: string[];
}

type Series = { t: number; v: number }[];

function series(frames: SignalFrame[], pick: (f: SignalFrame) => number | undefined): Series {
  const out: Series = [];
  for (const f of frames) {
    const v = pick(f);
    if (typeof v === 'number' && Number.isFinite(v)) out.push({ t: f.t, v });
  }
  return out;
}

function smooth(s: Series, win: number): Series {
  if (s.length === 0) return s;
  const half = Math.max(0, Math.floor(win / 2));
  return s.map((pt, i) => {
    let sum = 0;
    let n = 0;
    for (let j = Math.max(0, i - half); j <= Math.min(s.length - 1, i + half); j++) {
      sum += s[j]!.v;
      n++;
    }
    return { t: pt.t, v: sum / n };
  });
}

function nearestTurn(
  transcript: TranscriptTurn[],
  t: number,
  windowSec: number,
): TranscriptTurn | undefined {
  let best: TranscriptTurn | undefined;
  let bestDist = Infinity;
  for (const turn of transcript) {
    // prefer a line just BEFORE the shift (likely cause)
    const dist = turn.t <= t ? (t - turn.t) * 0.7 : turn.t - t;
    if (Math.abs(turn.t - t) <= windowSec && dist < bestDist) {
      bestDist = dist;
      best = turn;
    }
  }
  return best;
}

/**
 * Detect sustained shifts in a channel: for each point compare a smoothed value to
 * one ~lookahead seconds later; peaks in |delta| above threshold become moments.
 */
function detectShifts(
  s: Series,
  channel: MomentChannel,
  threshold: number,
  transcript: TranscriptTurn[],
): Moment[] {
  if (s.length < 6) return [];
  // frames are ~5 Hz; a ~2s lookahead ≈ 10 samples, ~1s smoothing ≈ 5.
  const sm = smooth(s, 5);
  const L = Math.min(12, Math.max(4, Math.round(sm.length / 8)));
  const cand: Moment[] = [];
  for (let i = 0; i + L < sm.length; i++) {
    const before = sm[i]!.v;
    const after = sm[i + L]!.v;
    const delta = after - before;
    if (Math.abs(delta) < threshold) continue;
    // local maximum of |delta| check
    const prevDelta = i > 0 ? sm[i]!.v - sm[i - 1]!.v : 0;
    void prevDelta;
    const midT = (sm[i]!.t + sm[i + L]!.t) / 2;
    cand.push({
      t: Math.round(midT * 10) / 10,
      channel,
      direction: delta > 0 ? 'rise' : 'fall',
      magnitude: Math.min(1, Math.abs(delta)),
      before: Math.round(before * 100) / 100,
      after: Math.round(after * 100) / 100,
    });
  }
  // Non-max suppression: keep the strongest within any ~L-window cluster.
  cand.sort((a, b) => b.magnitude - a.magnitude);
  const kept: Moment[] = [];
  for (const m of cand) {
    if (kept.some((k) => Math.abs(k.t - m.t) < (L / 5) * 1.5)) continue;
    const turn = nearestTurn(transcript, m.t, 3.5);
    if (turn) {
      m.coText = turn.text;
      m.coSpeaker = turn.speaker;
    }
    kept.push(m);
  }
  return kept;
}

function faceValence(f: SignalFrame): number | undefined {
  if (typeof f.valence === 'number') return f.valence;
  if (typeof f.engagement === 'number') return (f.engagement - 0.5) * 2;
  return undefined;
}

function median(nums: number[]): number | null {
  if (nums.length === 0) return null;
  const s = [...nums].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)]!;
}

/** Full analysis over a session's frames + transcript. */
export function analyzeSession(
  frames: SignalFrame[],
  transcript: TranscriptTurn[] = [],
): Analysis {
  const sorted = [...frames].sort((a, b) => a.t - b.t);

  const eng = series(sorted, (f) => f.engagement);
  const val = series(sorted, faceValence);
  const att = series(sorted, (f) => f.attention);
  const arousalSeries = series(sorted, (f) => f.signals?.arousal);
  const bpmS = series(sorted, (f) => f.signals?.bpm);
  const motion = series(sorted, (f) => f.signals?.motionEnergy);

  const moments = [
    ...detectShifts(eng, 'engagement', 0.12, transcript),
    ...detectShifts(arousalSeries, 'arousal', 0.14, transcript),
    ...detectShifts(val, 'valence', 0.3, transcript),
    ...detectShifts(att, 'attention', 0.14, transcript),
  ]
    .sort((a, b) => b.magnitude - a.magnitude)
    .slice(0, 6)
    .sort((a, b) => a.t - b.t);

  // Congruence timeline (subsampled to keep it light).
  const congruence: CongruencePoint[] = [];
  const step = Math.max(1, Math.floor(sorted.length / 120));
  for (let i = 0; i < sorted.length; i += step) {
    const f = sorted[i]!;
    const fv = faceValence(f);
    const ar = f.signals?.arousal;
    if (typeof fv === 'number' && typeof ar === 'number') {
      congruence.push({ t: Math.round(f.t * 10) / 10, face: fv, body: ar });
    }
  }

  // The Tell: arousal most elevated above baseline while the face is least negative.
  let theTell: TheTell | null = null;
  const baselineArousal = median(arousalSeries.slice(0, Math.max(3, Math.floor(arousalSeries.length * 0.25))).map((p) => p.v));
  if (baselineArousal !== null && arousalSeries.length > 6) {
    let bestScore = 0;
    let bestFrame: SignalFrame | null = null;
    let bestElev = 0;
    for (const f of sorted) {
      const ar = f.signals?.arousal;
      if (typeof ar !== 'number') continue;
      const fv = faceValence(f) ?? 0;
      const elevation = Math.max(0, ar - baselineArousal);
      const faceCalmness = 1 - Math.max(0, Math.min(1, -fv)); // 1 = not negative
      const score = Math.min(1, elevation * 2) * faceCalmness;
      if (score > bestScore) {
        bestScore = score;
        bestFrame = f;
        bestElev = elevation;
      }
    }
    if (bestFrame && bestScore > 0.22) {
      const bpm = bestFrame.signals?.bpm;
      theTell = {
        t: Math.round(bestFrame.t * 10) / 10,
        arousalElevation: Math.round(bestElev * 100) / 100,
        bpm: typeof bpm === 'number' ? Math.round(bpm) : null,
        faceDesc: 'face read steady — no matching negative shift',
        bodyDesc:
          typeof bpm === 'number'
            ? `arousal ~${Math.round(bestElev * 100)}% above their baseline; heart rate ~${Math.round(bpm)} bpm`
            : `arousal ~${Math.round(bestElev * 100)}% above their baseline`,
        strength: Math.round(bestScore * 100) / 100,
      };
    }
  }

  // Responsiveness (single-camera proxy): animation × expressive variability.
  const responsiveness = computeResponsiveness(motion, val);

  const factLines = buildFactLines(moments, theTell, responsiveness, bpmS, arousalSeries, baselineArousal);

  return { moments, theTell, congruence, responsiveness, factLines };
}

function std(nums: number[]): number {
  if (nums.length < 2) return 0;
  const m = nums.reduce((a, b) => a + b, 0) / nums.length;
  return Math.sqrt(nums.reduce((a, b) => a + (b - m) ** 2, 0) / nums.length);
}

function computeResponsiveness(motion: Series, val: Series): Responsiveness {
  if (motion.length < 8 && val.length < 8) {
    return { score: null, label: null, basis: 'not enough signal' };
  }
  const meanMotion = motion.length
    ? motion.reduce((a, b) => a + b.v, 0) / motion.length
    : 0;
  const expressiveVar = std(val.map((p) => p.v));
  // animation + how much the face varies → aliveness/responsiveness
  const score = Math.max(0, Math.min(1, meanMotion * 1.4 + expressiveVar * 1.2));
  const label = score < 0.33 ? 'flat' : score < 0.6 ? 'moderate' : 'lively';
  return {
    score: Math.round(score * 100) / 100,
    label,
    basis: 'single-camera proxy: facial motion energy + expressive variability',
  };
}

function buildFactLines(
  moments: Moment[],
  theTell: TheTell | null,
  responsiveness: Responsiveness,
  bpmS: Series,
  arousalS: Series,
  baselineArousal: number | null,
): string[] {
  const lines: string[] = [];
  if (bpmS.length > 3) {
    const bpms = bpmS.map((p) => p.v);
    const lo = Math.round(Math.min(...bpms));
    const hi = Math.round(Math.max(...bpms));
    lines.push(`Heart rate (rPPG, experimental) ranged ~${lo}–${hi} bpm over the session.`);
  }
  if (baselineArousal !== null && arousalS.length > 3) {
    const peak = Math.max(...arousalS.map((p) => p.v));
    lines.push(
      `Body arousal peaked ~${Math.round((peak - baselineArousal) * 100)}% above their own baseline.`,
    );
  }
  for (const m of moments) {
    const dir = m.direction === 'rise' ? 'rose' : 'dropped';
    const co = m.coText ? ` — around then, ${m.coSpeaker ?? 'someone'} said: "${truncate(m.coText, 80)}"` : '';
    lines.push(
      `${cap(m.channel)} ${dir} from ${fmt(m.channel, m.before)} to ${fmt(m.channel, m.after)} near ${fmtTime(m.t)}${co}.`,
    );
  }
  if (theTell) {
    lines.push(
      `Biggest face/body divergence near ${fmtTime(theTell.t)}: ${theTell.bodyDesc}, while the ${theTell.faceDesc}.`,
    );
  }
  if (responsiveness.score !== null) {
    lines.push(
      `Overall responsiveness read as ${responsiveness.label} (${Math.round((responsiveness.score ?? 0) * 100)}%, ${responsiveness.basis}).`,
    );
  }
  return lines;
}

function fmt(channel: MomentChannel, v: number): string {
  if (channel === 'valence') return v.toFixed(2);
  return `${Math.round(v * 100)}%`;
}
function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
function truncate(s: string, n: number): string {
  return s.length > n ? s.slice(0, n - 1) + '…' : s;
}
function fmtTime(t: number): string {
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}
