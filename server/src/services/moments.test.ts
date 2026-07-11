import { describe, expect, it } from 'vitest';
import { analyzeSession, type SignalFrame, type TranscriptTurn } from 'shared';

/** Build a synthetic session: a masked-arousal segment (face steady, body spikes)
 *  plus an engagement drop, so we can assert on moments + The Tell. */
function buildSession(): { frames: SignalFrame[]; transcript: TranscriptTurn[] } {
  const frames: SignalFrame[] = [];
  for (let i = 0; i < 150; i++) {
    const t = i * 0.2; // 30s at 5 Hz
    const masked = t >= 12 && t < 20; // face calm, body aroused
    const drop = t >= 22 && t < 28; // engagement falls
    const engagement = drop ? 0.42 : 0.78;
    const valence = masked ? 0.25 : drop ? -0.2 : 0.3; // face stays positive while masked
    const arousal = masked ? 0.9 : 0.5;
    const bpm = Math.round(62 + arousal * 22);
    frames.push({
      t,
      engagement,
      valence,
      attention: engagement * 0.9,
      signals: { arousal, bpm, motionEnergy: 0.3, smile: valence > 0 ? 0.4 : 0.1 },
      confidence: 'medium',
    });
  }
  const transcript: TranscriptTurn[] = [
    { speaker: 'user', t: 11, text: 'So about the deadline next week' },
    { speaker: 'partner', t: 21, text: 'yeah, sure, that works' },
  ];
  return { frames, transcript };
}

describe('analyzeSession', () => {
  const { frames, transcript } = buildSession();
  const a = analyzeSession(frames, transcript);

  it('surfaces The Tell when body arousal diverges from a steady face', () => {
    expect(a.theTell).not.toBeNull();
    // masked window is 12–20s
    expect(a.theTell!.t).toBeGreaterThanOrEqual(11);
    expect(a.theTell!.t).toBeLessThanOrEqual(21);
    expect(a.theTell!.bpm).toBeGreaterThan(75);
    expect(a.theTell!.arousalElevation).toBeGreaterThan(0.2);
  });

  it('detects the engagement drop as a moment', () => {
    const engFall = a.moments.find((m) => m.channel === 'engagement' && m.direction === 'fall');
    expect(engFall).toBeTruthy();
    expect(engFall!.t).toBeGreaterThan(18);
    expect(engFall!.t).toBeLessThan(30);
  });

  it('attaches co-occurring transcript to a moment', () => {
    const withText = a.moments.filter((m) => m.coText);
    expect(withText.length).toBeGreaterThan(0);
  });

  it('produces grounded, event-based fact lines', () => {
    expect(a.factLines.length).toBeGreaterThan(2);
    expect(a.factLines.join('\n')).toMatch(/bpm|arousal|divergence/i);
  });

  it('computes a responsiveness read', () => {
    expect(a.responsiveness.score).not.toBeNull();
    expect(['flat', 'moderate', 'lively']).toContain(a.responsiveness.label);
  });

  it('returns a congruence timeline', () => {
    expect(a.congruence.length).toBeGreaterThan(10);
    expect(a.congruence[0]).toHaveProperty('face');
    expect(a.congruence[0]).toHaveProperty('body');
  });
});
