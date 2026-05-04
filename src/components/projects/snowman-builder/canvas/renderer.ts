import type { GameState, Snowball, SnowLayer } from "../types";
import {
  SKY_COLOR_TOP,
  SKY_COLOR_BOTTOM,
  SNOW_COLOR,
  SNOW_SHADOW_COLOR,
  SNOWBALL_FILL,
  SNOWBALL_EDGE,
  SNOWBALL_STROKE,
  GROUND_COLOR,
  GROUND_FRACTION,
} from "./constants";

export function drawSky(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number
): void {
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, SKY_COLOR_TOP);
  grad.addColorStop(1, SKY_COLOR_BOTTOM);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
}

export function drawSnowLayer(
  ctx: CanvasRenderingContext2D,
  layer: SnowLayer,
  canvasHeight: number
): void {
  const w = layer.heights.length;
  const groundHeight = canvasHeight * GROUND_FRACTION;
  const groundTop = canvasHeight - groundHeight;

  ctx.fillStyle = GROUND_COLOR;
  ctx.fillRect(0, groundTop, w, groundHeight);

  ctx.beginPath();
  ctx.moveTo(0, groundTop);
  for (let x = 0; x < w; x++) {
    ctx.lineTo(x, groundTop - layer.heights[x]);
  }
  ctx.lineTo(w, groundTop);
  ctx.closePath();
  ctx.fillStyle = SNOW_COLOR;
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(0, groundTop - layer.heights[0]);
  for (let x = 1; x < w; x++) {
    ctx.lineTo(x, groundTop - layer.heights[x]);
  }
  ctx.strokeStyle = SNOW_SHADOW_COLOR;
  ctx.lineWidth = 2;
  ctx.stroke();
}

export function drawSnowball(
  ctx: CanvasRenderingContext2D,
  ball: Snowball
): void {
  ctx.save();
  ctx.translate(ball.x, ball.y);

  const grad = ctx.createRadialGradient(
    -ball.radius * 0.2,
    -ball.radius * 0.2,
    ball.radius * 0.1,
    0,
    0,
    ball.radius
  );
  grad.addColorStop(0, SNOWBALL_FILL);
  grad.addColorStop(1, SNOWBALL_EDGE);

  ctx.beginPath();
  ctx.arc(0, 0, ball.radius, 0, Math.PI * 2);
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.strokeStyle = SNOWBALL_STROKE;
  ctx.lineWidth = 1;
  ctx.stroke();

  const dotDist = ball.radius * 0.6;
  const dotX = Math.cos(ball.rotation) * dotDist;
  const dotY = Math.sin(ball.rotation) * dotDist;
  ctx.beginPath();
  ctx.arc(dotX, dotY, Math.max(2, ball.radius * 0.08), 0, Math.PI * 2);
  ctx.fillStyle = "rgba(140, 165, 185, 0.35)";
  ctx.fill();

  ctx.restore();
}

export function render(
  ctx: CanvasRenderingContext2D,
  state: GameState
): void {
  const { canvasWidth: w, canvasHeight: h } = state;
  ctx.clearRect(0, 0, w, h);

  drawSky(ctx, w, h);

  if (state.snowLayer) {
    drawSnowLayer(ctx, state.snowLayer, h);
  }

  const sorted = [...state.snowballs].sort((a, b) => a.y - b.y);
  for (const ball of sorted) {
    drawSnowball(ctx, ball);
  }
}
