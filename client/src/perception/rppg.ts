/**
 * Remote photoplethysmography (rPPG): recover a pulse — heart rate + a relative
 * "arousal" reading — from the average colour of a facial skin ROI over time.
 *
 * This is the involuntary "body" channel. It is deliberately confidence-tagged and
 * allowed to be wrong: webcam rPPG correlates well with ground truth under good
 * conditions (r>0.75) and poorly under motion/lighting — so every read carries an
 * SNR-derived confidence and nothing downstream treats it as truth.
 *
 * Pure signal processing (no DOM) so it can be unit-tested. The ROI pixel sampling
 * lives in the MediaPipe loop and feeds green-channel means in here.
 */

const WINDOW_SEC = 10; // analysis window
const MIN_SEC = 5; // need at least this much buffered before a reading
const COMPUTE_EVERY_S = 0.4;
const BPM_LO = 42;
const BPM_HI = 180;
const TARGET_FS = 30; // resample grid
const WAVEFORM_LEN = 72;

export type RppgSample = { t: number; v: number };

export type RppgState = {
  buf: RppgSample[];
  bpmEma: number | null;
  conf: number; // 0–1, SNR-derived
  baselineSamples: number[];
  baselineBpm: number | null;
  arousal: number; // 0–1 relative to this person's own baseline HR
  waveform: number[]; // normalized recent pulse trace (for the sparkline)
  lastComputeT: number;
};

export function createRppgState(): RppgState {
  return {
    buf: [],
    bpmEma: null,
    conf: 0,
    baselineSamples: [],
    baselineBpm: null,
    arousal: 0.5,
    waveform: [],
    lastComputeT: -Infinity,
  };
}

/** Push one ROI colour sample (green-channel mean, 0–255) at time t (seconds). */
export function pushRppgSample(state: RppgState, t: number, v: number): void {
  state.buf.push({ t, v });
  const cutoff = t - WINDOW_SEC;
  while (state.buf.length > 2 && state.buf[0]!.t < cutoff) state.buf.shift();
}

/** Goertzel power of a real signal at a given frequency (Hz). */
export function goertzelPower(x: number[], fs: number, freqHz: number): number {
  const k = freqHz / fs; // cycles per sample
  const w = 2 * Math.PI * k;
  const cw = Math.cos(w);
  const sw = Math.sin(w);
  const coeff = 2 * cw;
  let s1 = 0;
  let s2 = 0;
  for (let i = 0; i < x.length; i++) {
    const s0 = x[i]! + coeff * s1 - s2;
    s2 = s1;
    s1 = s0;
  }
  const real = s1 - s2 * cw;
  const imag = s2 * sw;
  return real * real + imag * imag;
}

/** Linear-interpolate irregular samples onto a uniform grid of N points. */
function resampleUniform(buf: RppgSample[], n: number): number[] {
  const t0 = buf[0]!.t;
  const t1 = buf[buf.length - 1]!.t;
  const span = t1 - t0;
  const out = new Array<number>(n);
  let j = 0;
  for (let i = 0; i < n; i++) {
    const tt = t0 + (span * i) / (n - 1);
    while (j < buf.length - 2 && buf[j + 1]!.t < tt) j++;
    const a = buf[j]!;
    const b = buf[Math.min(j + 1, buf.length - 1)]!;
    const dt = b.t - a.t || 1e-6;
    const frac = Math.max(0, Math.min(1, (tt - a.t) / dt));
    out[i] = a.v + (b.v - a.v) * frac;
  }
  return out;
}

/** Subtract a moving-average (high-pass) then Hamming-window in place. */
function detrendWindow(x: number[], win: number): number[] {
  const n = x.length;
  const out = new Array<number>(n);
  const half = Math.max(1, Math.floor(win / 2));
  // prefix sums for moving mean
  const pre = new Array<number>(n + 1);
  pre[0] = 0;
  for (let i = 0; i < n; i++) pre[i + 1] = pre[i]! + x[i]!;
  for (let i = 0; i < n; i++) {
    const lo = Math.max(0, i - half);
    const hi = Math.min(n, i + half + 1);
    const mean = (pre[hi]! - pre[lo]!) / (hi - lo);
    out[i] = x[i]! - mean;
  }
  // Hamming
  for (let i = 0; i < n; i++) {
    const wnd = 0.54 - 0.46 * Math.cos((2 * Math.PI * i) / (n - 1));
    out[i] = out[i]! * wnd;
  }
  return out;
}

export type HrResult = { bpm: number; snr: number; conf: number; waveform: number[] };

/** Analyze the buffer for a dominant pulse frequency. Returns null if too short. */
export function analyzeHr(buf: RppgSample[]): HrResult | null {
  if (buf.length < 20) return null;
  const dur = buf[buf.length - 1]!.t - buf[0]!.t;
  if (dur < MIN_SEC) return null;

  const n = Math.min(512, Math.max(64, Math.round(dur * TARGET_FS)));
  const fs = n / dur;
  const grid = resampleUniform(buf, n);
  const win = Math.round(fs * 0.75); // remove drift slower than ~0.7 Hz
  const x = detrendWindow(grid, win);

  let peakBpm = 0;
  let peakPow = 0;
  let sum = 0;
  let count = 0;
  let secondPow = 0;
  const powers: Array<{ bpm: number; p: number }> = [];
  for (let bpm = BPM_LO; bpm <= BPM_HI; bpm++) {
    const p = goertzelPower(x, fs, bpm / 60);
    powers.push({ bpm, p });
    sum += p;
    count++;
    if (p > peakPow) {
      peakPow = p;
      peakBpm = bpm;
    }
  }
  // second-highest peak outside ±8 bpm of the main peak (prominence)
  for (const { bpm, p } of powers) {
    if (Math.abs(bpm - peakBpm) > 8 && p > secondPow) secondPow = p;
  }
  const meanPow = sum / Math.max(1, count);
  const snr = peakPow / (meanPow || 1e-9);
  const prominence = peakPow / (secondPow || 1e-9);

  // Confidence: needs both a strong SNR and a clear dominant peak.
  const snrConf = clamp01((snr - 2.5) / (8 - 2.5));
  const promConf = clamp01((prominence - 1.3) / (3 - 1.3));
  const conf = clamp01(0.5 * snrConf + 0.5 * promConf);

  // Waveform for the sparkline: normalized detrended tail.
  const tail = x.slice(-WAVEFORM_LEN);
  const amp = Math.max(1e-6, Math.max(...tail.map(Math.abs)));
  const waveform = tail.map((v) => v / amp);

  return { bpm: peakBpm, snr, conf, waveform };
}

/** Fold a new reading into the state (EMA + baseline + arousal). Call each frame. */
export function updateRppg(state: RppgState, t: number): void {
  if (t - state.lastComputeT < COMPUTE_EVERY_S) return;
  state.lastComputeT = t;
  const res = analyzeHr(state.buf);
  if (!res || res.conf < 0.12) {
    // decay confidence when we can't get a clean read
    state.conf = state.conf * 0.6;
    return;
  }

  if (state.bpmEma === null) {
    state.bpmEma = res.bpm;
  } else {
    const jump = Math.abs(res.bpm - state.bpmEma);
    if (jump > 25 && res.conf < 0.5) {
      // likely artefact — ignore this reading
      state.conf = state.conf * 0.8;
      return;
    }
    const alpha = 0.18 + 0.5 * res.conf;
    state.bpmEma = state.bpmEma * (1 - alpha) + res.bpm * alpha;
  }
  state.conf = res.conf;
  state.waveform = res.waveform;

  // Baseline = median of the first handful of confident readings.
  if (res.conf > 0.4 && state.baselineBpm === null) {
    state.baselineSamples.push(state.bpmEma);
    if (state.baselineSamples.length >= 6) {
      const sorted = [...state.baselineSamples].sort((a, b) => a - b);
      state.baselineBpm = sorted[Math.floor(sorted.length / 2)]!;
    }
  }

  // Arousal: sigmoid of HR elevation vs this person's own baseline.
  if (state.baselineBpm !== null && state.bpmEma !== null) {
    const z = (state.bpmEma - state.baselineBpm) / 8;
    const raw = 1 / (1 + Math.exp(-z));
    // pull toward neutral when confidence is low
    state.arousal = 0.5 + (raw - 0.5) * (0.4 + 0.6 * state.conf);
  }
}

export function rppgReading(state: RppgState): {
  bpm: number | null;
  conf: number;
  arousal: number;
  hasBaseline: boolean;
} {
  return {
    bpm: state.bpmEma === null ? null : Math.round(state.bpmEma),
    conf: state.conf,
    arousal: state.arousal,
    hasBaseline: state.baselineBpm !== null,
  };
}

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}
