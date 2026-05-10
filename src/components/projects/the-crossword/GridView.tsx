import { useRef, useEffect, useCallback, useState, useMemo } from "react";
import styles from "./GridView.module.css";
import { useCrosswordStore } from "./store";
import type { Camera } from "./canvas/camera";
import { createCamera, screenToCell } from "./canvas/camera";
import type { RenderState, RenderCell } from "./canvas/renderer";
import { render, buildCellMap } from "./canvas/renderer";
import {
  createGestureState,
  handleMouseDown,
  handleMouseMove,
  handleMouseUp,
  handleWheel,
  handleTouchStart,
  handleTouchMove,
  handleTouchEnd,
} from "./canvas/interactions";
import type { Animation } from "./canvas/animations";
import { createSolveAnimation } from "./canvas/animations";
import type { EntryData, PuzzleJson } from "./types";
import CluePanel from "./CluePanel";

interface Props {
  puzzleData: PuzzleJson;
  entries: Map<string, EntryData>;
  onSolve?: (entryId: string, answer: string) => Promise<{ correct: boolean }>;
  resetViewTrigger?: number;
}

export default function GridView({ puzzleData, entries, onSolve, resetViewTrigger }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const camRef = useRef<Camera>(
    createCamera(puzzleData.centerRow, puzzleData.centerCol),
  );
  const gestureRef = useRef(createGestureState());
  const animationsRef = useRef<Animation[]>([]);
  const cellMapRef = useRef<Map<string, RenderCell>>(new Map());
  const rafRef = useRef<number>(0);
  const needsRedrawRef = useRef(true);
  const isDraggingRef = useRef(false);
  const dragDistRef = useRef(0);

  const selectedEntryId = useCrosswordStore((s) => s.selectedEntryId);
  const setSelectedEntry = useCrosswordStore((s) => s.setSelectedEntry);

  const [canvasSize, setCanvasSize] = useState({ w: 0, h: 0 });
  const flyToRef = useRef<{
    startCam: Camera;
    targetCam: Camera;
    startTime: number;
    duration: number;
  } | null>(null);

  useEffect(() => {
    cellMapRef.current = buildCellMap(entries);
    needsRedrawRef.current = true;
  }, [entries]);

  useEffect(() => {
    if (!resetViewTrigger) return;
    const overviewCam = createCamera(puzzleData.centerRow, puzzleData.centerCol);
    flyToRef.current = {
      startCam: { ...camRef.current },
      targetCam: overviewCam,
      startTime: Date.now(),
      duration: 500,
    };
    setSelectedEntry(null);
    needsRedrawRef.current = true;
  }, [resetViewTrigger, puzzleData, setSelectedEntry]);

  useEffect(() => {
    if (!selectedEntryId) return;
    if (canvasSize.w === 0 || canvasSize.h === 0) return;
    const entry = entries.get(selectedEntryId);
    if (!entry) return;

    const midIdx = (entry.length - 1) / 2;
    const targetRow =
      entry.direction === "down" ? entry.row + midIdx : entry.row;
    const targetCol =
      entry.direction === "across" ? entry.col + midIdx : entry.col;
    const targetX = (targetCol + 0.5) * 40;
    const targetY = (targetRow + 0.5) * 40;

    const padding = 3;
    const cluePanelHeight = 140;
    const availW = canvasSize.w;
    const availH = canvasSize.h - cluePanelHeight;
    const entryW = (entry.direction === "across" ? entry.length + padding : 1 + padding) * 40;
    const entryH = (entry.direction === "down" ? entry.length + padding : 1 + padding) * 40;
    const fitZoom = Math.min(availW / entryW, availH / entryH);
    const targetZoom = Math.min(fitZoom, 1.8);

    flyToRef.current = {
      startCam: { ...camRef.current },
      targetCam: { x: targetX, y: targetY, zoom: targetZoom },
      startTime: Date.now(),
      duration: 400,
    };
    needsRedrawRef.current = true;
  }, [selectedEntryId, entries, canvasSize]);

  const getSelectedCells = useCallback((): Set<string> => {
    if (!selectedEntryId) return new Set();
    const entry = entries.get(selectedEntryId);
    if (!entry) return new Set();
    const cells = new Set<string>();
    for (let i = 0; i < entry.length; i++) {
      const r = entry.direction === "down" ? entry.row + i : entry.row;
      const c = entry.direction === "across" ? entry.col + i : entry.col;
      cells.add(`${r},${c}`);
    }
    return cells;
  }, [selectedEntryId, entries]);

  const drawFrame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const hasAnims = animationsRef.current.length > 0;
    if (hasAnims) {
      animationsRef.current = animationsRef.current.filter(
        (a) => Date.now() - a.startTime < a.duration + a.delay,
      );
      needsRedrawRef.current = true;
    }

    if (flyToRef.current) {
      const { startCam, targetCam, startTime, duration } = flyToRef.current;
      const elapsed = Date.now() - startTime;
      const raw = Math.min(elapsed / duration, 1);
      const t = 1 - Math.pow(1 - raw, 3); // ease-out cubic
      camRef.current = {
        x: startCam.x + (targetCam.x - startCam.x) * t,
        y: startCam.y + (targetCam.y - startCam.y) * t,
        zoom: startCam.zoom + (targetCam.zoom - startCam.zoom) * t,
      };
      needsRedrawRef.current = true;
      if (raw >= 1) flyToRef.current = null;
    }

    if (needsRedrawRef.current) {
      const state: RenderState = {
        cells: cellMapRef.current,
        selectedEntryId,
        selectedCells: getSelectedCells(),
        activeCellKey: null,
        entries,
        animations: animationsRef.current,
      };
      render(ctx, camRef.current, canvasSize.w, canvasSize.h, state);
      needsRedrawRef.current = false;
    }

    rafRef.current = requestAnimationFrame(drawFrame);
  }, [canvasSize, selectedEntryId, entries, getSelectedCells]);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(drawFrame);
    return () => cancelAnimationFrame(rafRef.current);
  }, [drawFrame]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((es) => {
      const { width, height } = es[0].contentRect;
      const dpr = window.devicePixelRatio || 1;
      const canvas = canvasRef.current;
      if (canvas) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
      }
      setCanvasSize({ w: width, h: height });
      needsRedrawRef.current = true;
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    flyToRef.current = null;
    gestureRef.current = handleMouseDown(
      e.nativeEvent,
      gestureRef.current,
    );
    isDraggingRef.current = false;
    dragDistRef.current = 0;
  }, []);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    const result = handleMouseMove(
      e.nativeEvent,
      gestureRef.current,
      camRef.current,
    );
    if (result) {
      gestureRef.current = result.gesture;
      camRef.current = result.cam;
      needsRedrawRef.current = true;
      dragDistRef.current += Math.abs(e.movementX) + Math.abs(e.movementY);
      if (dragDistRef.current > 5) isDraggingRef.current = true;
    }
  }, []);

  const onMouseUp = useCallback(
    (e: React.MouseEvent) => {
      gestureRef.current = handleMouseUp(gestureRef.current);
      if (!isDraggingRef.current) {
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;
        const sx = e.clientX - rect.left;
        const sy = e.clientY - rect.top;
        const { row, col } = screenToCell(
          sx,
          sy,
          camRef.current,
          canvasSize.w,
          canvasSize.h,
        );
        const key = `${row},${col}`;
        const cell = cellMapRef.current.get(key);
        if (cell) {
          const entryId = cell.acrossEntryId || cell.downEntryId;
          if (entryId && entryId !== selectedEntryId) {
            setSelectedEntry(entryId);
          } else if (entryId === selectedEntryId && cell.downEntryId && cell.acrossEntryId) {
            setSelectedEntry(
              selectedEntryId === cell.acrossEntryId
                ? cell.downEntryId
                : cell.acrossEntryId,
            );
          }
        } else {
          setSelectedEntry(null);
        }
        needsRedrawRef.current = true;
      }
    },
    [canvasSize, selectedEntryId, setSelectedEntry],
  );

  const onWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      flyToRef.current = null;
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      camRef.current = handleWheel(
        e.nativeEvent,
        camRef.current,
        rect,
        canvasSize.w,
        canvasSize.h,
      );
      needsRedrawRef.current = true;
    },
    [canvasSize],
  );

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    flyToRef.current = null;
    gestureRef.current = handleTouchStart(
      e.nativeEvent,
      gestureRef.current,
      camRef.current,
    );
    isDraggingRef.current = false;
    dragDistRef.current = 0;
  }, []);

  const onTouchMove = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault();
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      const result = handleTouchMove(
        e.nativeEvent,
        gestureRef.current,
        camRef.current,
        rect,
        canvasSize.w,
        canvasSize.h,
      );
      if (result) {
        gestureRef.current = result.gesture;
        camRef.current = result.cam;
        needsRedrawRef.current = true;
        isDraggingRef.current = true;
      }
    },
    [canvasSize],
  );

  const onTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      gestureRef.current = handleTouchEnd(gestureRef.current);
      if (!isDraggingRef.current && e.changedTouches.length === 1) {
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;
        const touch = e.changedTouches[0];
        const sx = touch.clientX - rect.left;
        const sy = touch.clientY - rect.top;
        const { row, col } = screenToCell(
          sx,
          sy,
          camRef.current,
          canvasSize.w,
          canvasSize.h,
        );
        const key = `${row},${col}`;
        const cell = cellMapRef.current.get(key);
        if (cell) {
          const entryId = cell.acrossEntryId || cell.downEntryId;
          if (entryId) setSelectedEntry(entryId);
        } else {
          setSelectedEntry(null);
        }
        needsRedrawRef.current = true;
      }
    },
    [canvasSize, setSelectedEntry],
  );

  const selectedEntry = selectedEntryId ? entries.get(selectedEntryId) : null;

  const prefilled = useMemo(() => {
    if (!selectedEntry || selectedEntry.solvedBy) return [];
    const result: (string | null)[] = [];
    for (let i = 0; i < selectedEntry.length; i++) {
      const r = selectedEntry.direction === "down" ? selectedEntry.row + i : selectedEntry.row;
      const c = selectedEntry.direction === "across" ? selectedEntry.col + i : selectedEntry.col;
      const cell = cellMapRef.current.get(`${r},${c}`);
      if (cell && cell.locked && cell.letter) {
        result.push(cell.letter);
      } else {
        result.push(null);
      }
    }
    return result;
  }, [selectedEntry, entries]);

  const handleSolveWithAnimation = useCallback(
    async (entryId: string, answer: string): Promise<{ correct: boolean }> => {
      if (!onSolve) return { correct: false };
      const result = await onSolve(entryId, answer);
      if (result.correct) {
        const entry = entries.get(entryId);
        if (entry) {
          const staggerDelay = 80;
          for (let i = 0; i < entry.length; i++) {
            const r = entry.direction === "down" ? entry.row + i : entry.row;
            const c = entry.direction === "across" ? entry.col + i : entry.col;
            animationsRef.current.push(
              createSolveAnimation(r, c, i * staggerDelay),
            );
          }
          needsRedrawRef.current = true;
        }
      }
      return result;
    },
    [onSolve, entries],
  );

  return (
    <div ref={containerRef} className={styles.container}>
      <canvas
        ref={canvasRef}
        className={styles.canvas}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={() => {
          gestureRef.current = handleMouseUp(gestureRef.current);
        }}
        onWheel={onWheel}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      />
      {selectedEntry && !selectedEntry.solvedBy && (
        <CluePanel entry={selectedEntry} prefilled={prefilled} onSubmit={handleSolveWithAnimation} />
      )}
    </div>
  );
}
