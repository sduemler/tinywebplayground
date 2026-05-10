import { CELL_SIZE, MIN_ZOOM, MAX_ZOOM } from "./constants";

export interface Camera {
  x: number;
  y: number;
  zoom: number;
}

export function createCamera(centerRow: number, centerCol: number): Camera {
  return {
    x: (centerCol + 0.5) * CELL_SIZE,
    y: (centerRow + 0.5) * CELL_SIZE,
    zoom: 0.5,
  };
}

export function worldToScreen(
  wx: number,
  wy: number,
  cam: Camera,
  canvasW: number,
  canvasH: number,
): { sx: number; sy: number } {
  return {
    sx: (wx - cam.x) * cam.zoom + canvasW / 2,
    sy: (wy - cam.y) * cam.zoom + canvasH / 2,
  };
}

export function screenToWorld(
  sx: number,
  sy: number,
  cam: Camera,
  canvasW: number,
  canvasH: number,
): { wx: number; wy: number } {
  return {
    wx: (sx - canvasW / 2) / cam.zoom + cam.x,
    wy: (sy - canvasH / 2) / cam.zoom + cam.y,
  };
}

export function screenToCell(
  sx: number,
  sy: number,
  cam: Camera,
  canvasW: number,
  canvasH: number,
): { row: number; col: number } {
  const { wx, wy } = screenToWorld(sx, sy, cam, canvasW, canvasH);
  return {
    row: Math.floor(wy / CELL_SIZE),
    col: Math.floor(wx / CELL_SIZE),
  };
}

export function clampZoom(zoom: number): number {
  return Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom));
}

export function zoomToward(
  cam: Camera,
  sx: number,
  sy: number,
  canvasW: number,
  canvasH: number,
  delta: number,
): Camera {
  const factor = delta > 0 ? 0.9 : 1.1;
  const newZoom = clampZoom(cam.zoom * factor);
  const { wx, wy } = screenToWorld(sx, sy, cam, canvasW, canvasH);
  return {
    x: wx - (sx - canvasW / 2) / newZoom,
    y: wy - (sy - canvasH / 2) / newZoom,
    zoom: newZoom,
  };
}

export function pan(cam: Camera, dx: number, dy: number): Camera {
  return {
    x: cam.x - dx / cam.zoom,
    y: cam.y - dy / cam.zoom,
    zoom: cam.zoom,
  };
}

export function visibleBounds(cam: Camera, canvasW: number, canvasH: number) {
  const tl = screenToWorld(0, 0, cam, canvasW, canvasH);
  const br = screenToWorld(canvasW, canvasH, cam, canvasW, canvasH);
  return {
    minRow: Math.floor(tl.wy / CELL_SIZE) - 1,
    maxRow: Math.ceil(br.wy / CELL_SIZE) + 1,
    minCol: Math.floor(tl.wx / CELL_SIZE) - 1,
    maxCol: Math.ceil(br.wx / CELL_SIZE) + 1,
  };
}
