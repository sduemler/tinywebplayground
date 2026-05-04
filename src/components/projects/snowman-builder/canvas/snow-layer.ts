import type { SnowLayer } from "../types";
import {
  MAX_SNOW_FRACTION,
  MAX_REAL_SNOW_CM,
  NOISE_FREQUENCIES,
  NOISE_AMPLITUDES,
  GROUND_FRACTION,
} from "./constants";

export function createSnowLayer(
  canvasWidth: number,
  canvasHeight: number,
  realSnowCm: number
): SnowLayer {
  const snowFraction =
    MAX_SNOW_FRACTION * Math.min(realSnowCm / MAX_REAL_SNOW_CM, 1.0);
  const baseHeight = canvasHeight * snowFraction;

  const heights = new Float32Array(canvasWidth);
  const originalHeights = new Float32Array(canvasWidth);

  for (let x = 0; x < canvasWidth; x++) {
    let noise = 0;
    for (let i = 0; i < NOISE_FREQUENCIES.length; i++) {
      noise += Math.sin(x * NOISE_FREQUENCIES[i]) * NOISE_AMPLITUDES[i];
    }
    const h = baseHeight * (1 + noise);
    heights[x] = h;
    originalHeights[x] = h;
  }

  let totalOriginalSnow = 0;
  for (let i = 0; i < originalHeights.length; i++) {
    totalOriginalSnow += originalHeights[i];
  }

  return { heights, originalHeights, totalOriginalSnow };
}

export function clearSnowAt(
  layer: SnowLayer,
  centerX: number,
  radius: number,
  clearRate: number
): number {
  const left = Math.max(0, Math.floor(centerX - radius));
  const right = Math.min(layer.heights.length - 1, Math.ceil(centerX + radius));
  let collected = 0;

  for (let c = left; c <= right; c++) {
    const dist = Math.abs(c - centerX);
    const overlapDepth = Math.max(0, radius - dist);
    const amount = Math.min(overlapDepth * clearRate, layer.heights[c]);
    layer.heights[c] -= amount;
    collected += amount;
  }

  return collected;
}

export function getGroundY(
  layer: SnowLayer,
  x: number,
  canvasHeight: number
): number {
  const col = Math.max(0, Math.min(layer.heights.length - 1, Math.round(x)));
  const groundTop = canvasHeight * (1 - GROUND_FRACTION);
  return groundTop - layer.heights[col];
}

export function getPercentCleared(layer: SnowLayer): number {
  if (layer.totalOriginalSnow === 0) return 1;
  let currentTotal = 0;
  for (let i = 0; i < layer.heights.length; i++) {
    currentTotal += layer.heights[i];
  }
  return 1 - currentTotal / layer.totalOriginalSnow;
}

export function getPixelsPerCm(
  canvasHeight: number,
  realSnowCm: number
): number {
  if (realSnowCm === 0) return 0;
  const snowFraction =
    MAX_SNOW_FRACTION * Math.min(realSnowCm / MAX_REAL_SNOW_CM, 1.0);
  const snowHeightPx = canvasHeight * snowFraction;
  return snowHeightPx / realSnowCm;
}
