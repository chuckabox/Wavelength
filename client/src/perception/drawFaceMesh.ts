import { FaceLandmarker, type NormalizedLandmark } from '@mediapipe/tasks-vision';

type Connection = { start: number; end: number };

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

/** Light contour + faint tesselation — proof the landmarker is tracking. */
export function drawFaceMesh(
  ctx: CanvasRenderingContext2D,
  landmarks: NormalizedLandmark[],
  width: number,
  height: number,
) {
  ctx.clearRect(0, 0, width, height);
  if (landmarks.length === 0) return;

  drawConnections(
    ctx,
    landmarks,
    FaceLandmarker.FACE_LANDMARKS_TESSELATION as Connection[],
    width,
    height,
    'rgba(45, 90, 140, 0.12)',
    0.6,
  );
  drawConnections(
    ctx,
    landmarks,
    FaceLandmarker.FACE_LANDMARKS_CONTOURS as Connection[],
    width,
    height,
    'rgba(45, 90, 140, 0.28)',
    1,
  );
  drawConnections(
    ctx,
    landmarks,
    FaceLandmarker.FACE_LANDMARKS_FACE_OVAL as Connection[],
    width,
    height,
    'rgba(45, 90, 140, 0.4)',
    1.15,
  );
}
