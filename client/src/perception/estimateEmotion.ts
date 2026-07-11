/** Soft state probabilities from blendshape-derived cues — experimental, not a diagnosis. */

export type EmotionProbs = {
  calm: number;
  positive: number;
  tense: number;
  uncertain: number;
};

export type EmotionInputs = {
  smile: number;
  browRaise: number;
  browFurrow: number;
  eyeOpenness: number;
  gazeAway: number;
  jawOpen: number;
};

function softmax4(logits: EmotionProbs): EmotionProbs {
  const keys = Object.keys(logits) as (keyof EmotionProbs)[];
  const max = Math.max(...keys.map((k) => logits[k]));
  const exps = keys.map((k) => Math.exp(logits[k] - max));
  const sum = exps.reduce((a, b) => a + b, 0) || 1;
  const out = { calm: 0, positive: 0, tense: 0, uncertain: 0 };
  keys.forEach((k, i) => {
    out[k] = exps[i]! / sum;
  });
  return out;
}

/**
 * Heuristic 4-way distribution from observable facial descriptors.
 * Hedged by design: use as relative probabilities, never a hard label.
 */
export function estimateEmotion(raw: EmotionInputs): EmotionProbs {
  const positive =
    raw.smile * 2.4 + raw.browRaise * 0.25 - raw.browFurrow * 0.9 - raw.gazeAway * 0.2;
  const tense =
    raw.browFurrow * 2.2 +
    raw.jawOpen * 0.45 +
    (1 - raw.eyeOpenness) * 0.35 -
    raw.smile * 0.7;
  const uncertain =
    raw.browRaise * 1.35 + raw.gazeAway * 1.0 + (1 - raw.eyeOpenness) * 0.4 - raw.smile * 0.3;
  const calm =
    1.4 -
    Math.abs(raw.smile - 0.12) * 1.2 -
    raw.browFurrow * 1.1 -
    raw.gazeAway * 0.55 -
    raw.jawOpen * 0.35;

  return softmax4({ calm, positive, tense, uncertain });
}
