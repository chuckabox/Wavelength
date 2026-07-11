import { FaceLandmarker, type NormalizedLandmark } from '@mediapipe/tasks-vision';

type Connection = { start: number; end: number };

/** Iris centers (pupil-position proxy). Present when the model emits 478 landmarks. */
const PUPIL_LEFT = 473;
const PUPIL_RIGHT = 468;

function drawConnections(
  ctx: CanvasRenderingContext2D,
  landmarks: NormalizedLandmark[],
  connections: Connection[],
  width: number,
  height: number,
  stroke: string,
  lineWidth: number,
) {
  ctx.beginPath();
  ctx.strokeStyle = stroke;
  ctx.lineWidth = lineWidth;
  for (const { start, end } of connections) {
    const a = landmarks[start];
    const b = landmarks[end];
    if (!a || !b) continue;
    ctx.moveTo(a.x * width, a.y * height);
    ctx.lineTo(b.x * width, b.y * height);
  }
  ctx.stroke();
}

function drawDot(
  ctx: CanvasRenderingContext2D,
  landmarks: NormalizedLandmark[],
  index: number,
  width: number,
  height: number,
  fill: string,
  radius: number,
) {
  const p = landmarks[index];
  if (!p) return;
  ctx.beginPath();
  ctx.fillStyle = fill;
  ctx.arc(p.x * width, p.y * height, radius, 0, Math.PI * 2);
  ctx.fill();
}

/**
 * Per-feature face geometry overlay — tesselation underlay + eyes / brows /
 * lips / iris rings / pupil dots. Visual only; does not derive signals.
 */
export function drawFaceMesh(
  ctx: CanvasRenderingContext2D,
  landmarks: NormalizedLandmark[],
  width: number,
  height: number,
) {
  ctx.clearRect(0, 0, width, height);
  if (landmarks.length === 0) return;

  // Faint mesh underlay so it still reads as "tracking"
  drawConnections(
    ctx,
    landmarks,
    FaceLandmarker.FACE_LANDMARKS_TESSELATION as Connection[],
    width,
    height,
    'rgba(45, 90, 140, 0.1)',
    0.5,
  );
  drawConnections(
    ctx,
    landmarks,
    FaceLandmarker.FACE_LANDMARKS_FACE_OVAL as Connection[],
    width,
    height,
    'rgba(45, 90, 140, 0.35)',
    1.1,
  );

  // Eyebrows — amber
  drawConnections(
    ctx,
    landmarks,
    FaceLandmarker.FACE_LANDMARKS_LEFT_EYEBROW as Connection[],
    width,
    height,
    'rgba(210, 145, 40, 0.85)',
    1.4,
  );
  drawConnections(
    ctx,
    landmarks,
    FaceLandmarker.FACE_LANDMARKS_RIGHT_EYEBROW as Connection[],
    width,
    height,
    'rgba(210, 145, 40, 0.85)',
    1.4,
  );

  // Eyes — cyan outline
  drawConnections(
    ctx,
    landmarks,
    FaceLandmarker.FACE_LANDMARKS_LEFT_EYE as Connection[],
    width,
    height,
    'rgba(40, 175, 210, 0.9)',
    1.35,
  );
  drawConnections(
    ctx,
    landmarks,
    FaceLandmarker.FACE_LANDMARKS_RIGHT_EYE as Connection[],
    width,
    height,
    'rgba(40, 175, 210, 0.9)',
    1.35,
  );

  // Lips — magenta
  drawConnections(
    ctx,
    landmarks,
    FaceLandmarker.FACE_LANDMARKS_LIPS as Connection[],
    width,
    height,
    'rgba(200, 70, 140, 0.85)',
    1.35,
  );

  // Iris rings — green (only when 478-point model is emitting iris landmarks)
  if (landmarks.length >= 478) {
    drawConnections(
      ctx,
      landmarks,
      FaceLandmarker.FACE_LANDMARKS_LEFT_IRIS as Connection[],
      width,
      height,
      'rgba(55, 175, 90, 0.9)',
      1.2,
    );
    drawConnections(
      ctx,
      landmarks,
      FaceLandmarker.FACE_LANDMARKS_RIGHT_IRIS as Connection[],
      width,
      height,
      'rgba(55, 175, 90, 0.9)',
      1.2,
    );

    // Pupils — filled dots at iris centers
    const pupilR = Math.max(2.2, Math.min(width, height) * 0.006);
    drawDot(ctx, landmarks, PUPIL_LEFT, width, height, 'rgba(20, 140, 70, 0.95)', pupilR);
    drawDot(ctx, landmarks, PUPIL_RIGHT, width, height, 'rgba(20, 140, 70, 0.95)', pupilR);
  }
}
