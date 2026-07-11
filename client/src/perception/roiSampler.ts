/**
 * Sample the mean colour of a forehead + cheek skin ROI from the live video,
 * using MediaPipe face-mesh landmarks to place the box. Feeds rPPG.
 *
 * Green channel carries the strongest pulse signal in skin, so we return the
 * green mean (0–255). Everything is best-effort: returns null if the frame or
 * landmarks aren't usable.
 */

type Pt = { x: number; y: number };

// Forehead patch + both cheeks (indices into the 468-point face mesh). Skin-rich,
// relatively low-motion regions favoured by the rPPG literature.
const ROI_INDICES = [10, 67, 109, 151, 337, 297, 338, 50, 205, 280, 425];

const MAX_DIM = 320; // downscale the drawn frame for cheap getImageData

let canvas: HTMLCanvasElement | null = null;
let ctx: CanvasRenderingContext2D | null = null;

function ensureCanvas(w: number, h: number): CanvasRenderingContext2D | null {
  if (!canvas) canvas = document.createElement('canvas');
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
  }
  if (!ctx) ctx = canvas.getContext('2d', { willReadFrequently: true });
  return ctx;
}

/** Mean green (0–255) over the forehead/cheek ROI, or null if unavailable. */
export function sampleRoiGreen(
  video: HTMLVideoElement,
  landmarks: Pt[] | undefined,
): number | null {
  if (!landmarks || landmarks.length < 468) return null;
  const vw = video.videoWidth;
  const vh = video.videoHeight;
  if (!vw || !vh) return null;

  const scale = Math.min(1, MAX_DIM / Math.max(vw, vh));
  const cw = Math.round(vw * scale);
  const ch = Math.round(vh * scale);
  const c = ensureCanvas(cw, ch);
  if (!c) return null;

  try {
    c.drawImage(video, 0, 0, cw, ch);
  } catch {
    return null;
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const idx of ROI_INDICES) {
    const p = landmarks[idx];
    if (!p) continue;
    const px = p.x * cw;
    const py = p.y * ch;
    if (px < minX) minX = px;
    if (py < minY) minY = py;
    if (px > maxX) maxX = px;
    if (py > maxY) maxY = py;
  }
  if (!isFinite(minX)) return null;

  // Shrink the box slightly to stay on skin, and clamp to canvas.
  const padX = (maxX - minX) * 0.1;
  const padY = (maxY - minY) * 0.1;
  const x = Math.max(0, Math.floor(minX + padX));
  const y = Math.max(0, Math.floor(minY + padY));
  const w = Math.min(cw - x, Math.ceil(maxX - minX - 2 * padX));
  const h = Math.min(ch - y, Math.ceil(maxY - minY - 2 * padY));
  if (w < 2 || h < 2) return null;

  let img: ImageData;
  try {
    img = c.getImageData(x, y, w, h);
  } catch {
    return null;
  }
  const data = img.data;
  let sum = 0;
  let count = 0;
  // Sample every other pixel for speed.
  for (let i = 0; i < data.length; i += 8) {
    sum += data[i + 1]!; // green
    count++;
  }
  return count > 0 ? sum / count : null;
}
