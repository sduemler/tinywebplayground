import type { Camera } from "./camera";
import { pan, zoomToward, clampZoom, screenToWorld } from "./camera";

export interface GestureState {
  isPanning: boolean;
  lastX: number;
  lastY: number;
  pinchDist: number;
  pinchZoom: number;
}

export function createGestureState(): GestureState {
  return { isPanning: false, lastX: 0, lastY: 0, pinchDist: 0, pinchZoom: 1 };
}

export function handleMouseDown(
  e: MouseEvent,
  gesture: GestureState,
): GestureState {
  return { ...gesture, isPanning: true, lastX: e.clientX, lastY: e.clientY };
}

export function handleMouseMove(
  e: MouseEvent,
  gesture: GestureState,
  cam: Camera,
): { gesture: GestureState; cam: Camera } | null {
  if (!gesture.isPanning) return null;
  const dx = e.clientX - gesture.lastX;
  const dy = e.clientY - gesture.lastY;
  return {
    gesture: { ...gesture, lastX: e.clientX, lastY: e.clientY },
    cam: pan(cam, dx, dy),
  };
}

export function handleMouseUp(gesture: GestureState): GestureState {
  return { ...gesture, isPanning: false };
}

export function handleWheel(
  e: WheelEvent,
  cam: Camera,
  rect: DOMRect,
  canvasW: number,
  canvasH: number,
): Camera {
  const sx = e.clientX - rect.left;
  const sy = e.clientY - rect.top;
  return zoomToward(cam, sx, sy, canvasW, canvasH, e.deltaY);
}

function touchDist(t1: Touch, t2: Touch): number {
  return Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
}

export function handleTouchStart(
  e: TouchEvent,
  gesture: GestureState,
  cam: Camera,
): GestureState {
  if (e.touches.length === 1) {
    return {
      ...gesture,
      isPanning: true,
      lastX: e.touches[0].clientX,
      lastY: e.touches[0].clientY,
    };
  }
  if (e.touches.length === 2) {
    return {
      ...gesture,
      isPanning: false,
      pinchDist: touchDist(e.touches[0], e.touches[1]),
      pinchZoom: cam.zoom,
    };
  }
  return gesture;
}

export function handleTouchMove(
  e: TouchEvent,
  gesture: GestureState,
  cam: Camera,
  rect: DOMRect,
  canvasW: number,
  canvasH: number,
): { gesture: GestureState; cam: Camera } | null {
  if (e.touches.length === 1 && gesture.isPanning) {
    const dx = e.touches[0].clientX - gesture.lastX;
    const dy = e.touches[0].clientY - gesture.lastY;
    return {
      gesture: {
        ...gesture,
        lastX: e.touches[0].clientX,
        lastY: e.touches[0].clientY,
      },
      cam: pan(cam, dx, dy),
    };
  }
  if (e.touches.length === 2 && gesture.pinchDist > 0) {
    const dist = touchDist(e.touches[0], e.touches[1]);
    const scale = dist / gesture.pinchDist;
    const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2 - rect.left;
    const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2 - rect.top;
    const newZoom = clampZoom(gesture.pinchZoom * scale);
    const { wx, wy } = screenToWorld(midX, midY, cam, canvasW, canvasH);
    return {
      gesture,
      cam: {
        x: wx - (midX - canvasW / 2) / newZoom,
        y: wy - (midY - canvasH / 2) / newZoom,
        zoom: newZoom,
      },
    };
  }
  return null;
}

export function handleTouchEnd(gesture: GestureState): GestureState {
  return { ...gesture, isPanning: false, pinchDist: 0 };
}
