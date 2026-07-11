import { describe, expect, it } from 'vitest';
import { estimateEmotion } from './estimateEmotion';

describe('estimateEmotion', () => {
  it('leans positive when smiling with low furrow', () => {
    const e = estimateEmotion({
      smile: 0.7,
      browRaise: 0.1,
      browFurrow: 0.05,
      eyeOpenness: 0.9,
      gazeAway: 0.05,
      jawOpen: 0.05,
    });
    expect(e.positive).toBeGreaterThan(e.tense);
    expect(e.positive + e.calm + e.tense + e.uncertain).toBeCloseTo(1, 5);
  });

  it('leans tense when furrowed and jaw open', () => {
    const e = estimateEmotion({
      smile: 0.05,
      browRaise: 0.1,
      browFurrow: 0.7,
      eyeOpenness: 0.7,
      gazeAway: 0.2,
      jawOpen: 0.4,
    });
    expect(e.tense).toBeGreaterThan(e.positive);
  });
});
