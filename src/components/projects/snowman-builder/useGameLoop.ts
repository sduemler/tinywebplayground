import { useEffect, useRef, useCallback } from "react";
import type { GameState, SnowLayer } from "./types";
import { render } from "./canvas/renderer";
import { drawDecorations } from "./canvas/decorations";
import {
  updatePhysics,
  hitTest,
  createSnowball,
  checkCompletion,
  getStackChain,
} from "./canvas/physics";
import { DECORATION_FADE_FRAMES } from "./canvas/constants";

interface UseGameLoopOptions {
  canvas: HTMLCanvasElement | null;
  snowLayer: SnowLayer | null;
  onComplete: () => void;
  onSnowballCountChange: (count: number) => void;
}

export function useGameLoop({
  canvas,
  snowLayer,
  onComplete,
  onSnowballCountChange,
}: UseGameLoopOptions) {
  const stateRef = useRef<GameState>({
    snowballs: [],
    snowLayer: null,
    nextId: 1,
    draggingId: null,
    mouseX: 0,
    mouseY: 0,
    lastMouseX: 0,
    lastMouseY: 0,
    isComplete: false,
    decorationAlpha: 0,
    canvasWidth: 0,
    canvasHeight: 0,
  });

  const rafRef = useRef<number>(0);
  const onCompleteRef = useRef(onComplete);
  const onCountRef = useRef(onSnowballCountChange);
  onCompleteRef.current = onComplete;
  onCountRef.current = onSnowballCountChange;

  useEffect(() => {
    if (snowLayer) {
      stateRef.current.snowLayer = snowLayer;
    }
  }, [snowLayer]);

  useEffect(() => {
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    function resize() {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      stateRef.current.canvasWidth = rect.width;
      stateRef.current.canvasHeight = rect.height;
    }

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);

    function getCanvasPos(e: MouseEvent | Touch): { x: number; y: number } {
      const rect = canvas!.getBoundingClientRect();
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    }

    function onMouseDown(e: MouseEvent) {
      const pos = getCanvasPos(e);
      const state = stateRef.current;
      const ball = hitTest(state, pos.x, pos.y);
      if (ball) {
        ball.isDragging = true;
        state.draggingId = ball.id;
        if (ball.stackedOn !== null) {
          const above = state.snowballs.filter(
            (b) => b.stackedOn === ball.id
          );
          for (const b of above) {
            b.stackedOn = null;
          }
          ball.stackedOn = null;
        }
        state.mouseX = pos.x;
        state.mouseY = pos.y;
        state.lastMouseX = pos.x;
        state.lastMouseY = pos.y;
      }
    }

    function onMouseMove(e: MouseEvent) {
      const state = stateRef.current;
      if (state.draggingId === null) return;
      const pos = getCanvasPos(e);
      state.lastMouseX = state.mouseX;
      state.lastMouseY = state.mouseY;
      state.mouseX = pos.x;
      state.mouseY = pos.y;
    }

    function onMouseUp() {
      const state = stateRef.current;
      if (state.draggingId !== null) {
        const ball = state.snowballs.find(
          (b) => b.id === state.draggingId
        );
        if (ball) {
          ball.isDragging = false;
          ball.vx = (state.mouseX - state.lastMouseX) * 0.3;
          ball.vy = (state.mouseY - state.lastMouseY) * 0.3;
        }
        state.draggingId = null;
      }
    }

    function onTouchStart(e: TouchEvent) {
      if (e.touches.length === 1) {
        e.preventDefault();
        const touch = e.touches[0];
        onMouseDown({
          clientX: touch.clientX,
          clientY: touch.clientY,
        } as MouseEvent);
      }
    }

    function onTouchMove(e: TouchEvent) {
      if (e.touches.length === 1 && stateRef.current.draggingId !== null) {
        e.preventDefault();
        const touch = e.touches[0];
        onMouseMove({
          clientX: touch.clientX,
          clientY: touch.clientY,
        } as MouseEvent);
      }
    }

    function onTouchEnd(e: TouchEvent) {
      if (stateRef.current.draggingId !== null) {
        e.preventDefault();
        onMouseUp();
      }
    }

    canvas.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    canvas.addEventListener("touchstart", onTouchStart, { passive: false });
    canvas.addEventListener("touchmove", onTouchMove, { passive: false });
    canvas.addEventListener("touchend", onTouchEnd, { passive: false });

    function loop() {
      const state = stateRef.current;
      if (state.snowLayer) {
        updatePhysics(state);

        if (!state.isComplete && checkCompletion(state)) {
          state.isComplete = true;
          onCompleteRef.current();
        }

        if (state.isComplete && state.decorationAlpha < 1) {
          state.decorationAlpha = Math.min(
            1,
            state.decorationAlpha + 1 / DECORATION_FADE_FRAMES
          );
        }
      }

      const dpr = window.devicePixelRatio || 1;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      render(ctx!, state);

      if (state.isComplete && state.decorationAlpha > 0) {
        const chain = getStackChain(state);
        if (chain) {
          drawDecorations(ctx!, chain, state.decorationAlpha);
        }
      }

      rafRef.current = requestAnimationFrame(loop);
    }

    rafRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafRef.current);
      observer.disconnect();
      canvas.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      canvas.removeEventListener("touchstart", onTouchStart);
      canvas.removeEventListener("touchmove", onTouchMove);
      canvas.removeEventListener("touchend", onTouchEnd);
    };
  }, [canvas]);

  const addSnowball = useCallback(() => {
    const state = stateRef.current;
    const ball = createSnowball(state);
    state.snowballs.push(ball);
    onCountRef.current(state.snowballs.length);
  }, []);

  const reset = useCallback(() => {
    const state = stateRef.current;
    state.snowballs = [];
    state.nextId = 1;
    state.draggingId = null;
    state.isComplete = false;
    state.decorationAlpha = 0;
    onCountRef.current(0);

    if (state.snowLayer) {
      for (let i = 0; i < state.snowLayer.heights.length; i++) {
        state.snowLayer.heights[i] = state.snowLayer.originalHeights[i];
      }
    }
  }, []);

  return { addSnowball, reset };
}
