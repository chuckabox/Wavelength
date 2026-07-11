import { z } from 'zod';

export const ConfidenceSchema = z.enum(['low', 'medium', 'high']);
export type Confidence = z.infer<typeof ConfidenceSchema>;

/**
 * One ~1 Hz sample of derived, privacy-preserving signals from the client-side
 * perception loop. Raw video/audio never leaves the browser — only these features
 * reach the server.
 */
export const SignalFrameSchema = z.object({
  /** seconds since session start */
  t: z.number().nonnegative(),
  engagement: z.number().min(0).max(1).optional(),
  valence: z.number().min(-1).max(1).optional(),
  attention: z.number().min(0).max(1).optional(),
  /** raw derived signal snapshot (smile, gaze, lean, ...) */
  signals: z.record(z.string(), z.number()).optional(),
  confidence: ConfidenceSchema.optional(),
});
export type SignalFrame = z.infer<typeof SignalFrameSchema>;
