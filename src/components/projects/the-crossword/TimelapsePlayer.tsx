import { useRef, useEffect, useState, useCallback } from "react";
import styles from "./TimelapsePlayer.module.css";
import { CELL_SIZE, COLORS } from "./canvas/constants";
import type { EntryData, SolveEvent, PuzzleJson } from "./types";

interface Props {
  puzzleData: PuzzleJson;
  entries: Map<string, EntryData>;
  solveHistory: SolveEvent[];
  fullscreen?: boolean;
  onClose: () => void;
}

const SPEEDS = [1, 2, 5, 10, 25];
const BASE_INTERVAL = 400;

function solveColor(index: number, total: number): string {
  const t = total > 1 ? index / (total - 1) : 0;
  const r = Math.round(200 - t * 158);
  const g = Math.round(220 - t * 120);
  const b = Math.round(240 - t * 20);
  return `rgb(${r},${g},${b})`;
}

export default function TimelapsePlayer({
  puzzleData,
  entries,
  solveHistory,
  fullscreen = false,
  onClose,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(false);
  const [speedIdx, setSpeedIdx] = useState(2);
  const [frame, setFrame] = useState(0);
  const frameRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const totalFrames = solveHistory.length;

  const cellsAtFrame = useCallback(
    (upTo: number) => {
      const filled = new Map<string, { color: string; letter: string }>();
      for (let i = 0; i < upTo && i < solveHistory.length; i++) {
        const event = solveHistory[i];
        const entry = entries.get(event.entryId);
        if (!entry) continue;
        const color = solveColor(i, totalFrames);
        for (let j = 0; j < entry.length; j++) {
          const r =
            entry.direction === "down" ? entry.row + j : entry.row;
          const c =
            entry.direction === "across" ? entry.col + j : entry.col;
          filled.set(`${r},${c}`, { color, letter: entry.word[j] });
        }
      }
      return filled;
    },
    [entries, solveHistory, totalFrames],
  );

  const drawCanvas = useCallback(
    (currentFrame: number) => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;

      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const cw = rect.width;
      const ch = rect.height;
      canvas.width = cw * dpr;
      canvas.height = ch * dpr;
      canvas.style.width = `${cw}px`;
      canvas.style.height = `${ch}px`;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, cw, ch);

      const { gridWidth, gridHeight } = puzzleData;
      const padX = fullscreen ? 40 : 16;
      const padY = fullscreen ? 40 : 16;
      const availW = cw - padX * 2;
      const availH = ch - padY * 2;
      const scale = Math.min(availW / (gridWidth * CELL_SIZE), availH / (gridHeight * CELL_SIZE));
      const offsetX = padX + (availW - gridWidth * CELL_SIZE * scale) / 2;
      const offsetY = padY + (availH - gridHeight * CELL_SIZE * scale) / 2;
      const cellPx = CELL_SIZE * scale;

      ctx.fillStyle = COLORS.background;
      ctx.fillRect(0, 0, cw, ch);

      for (const entry of entries.values()) {
        if (!entry.unlocked) continue;
        for (let i = 0; i < entry.length; i++) {
          const r = entry.direction === "down" ? entry.row + i : entry.row;
          const c = entry.direction === "across" ? entry.col + i : entry.col;
          const x = offsetX + c * cellPx;
          const y = offsetY + r * cellPx;
          ctx.fillStyle = "#eee8d5";
          ctx.fillRect(x, y, cellPx, cellPx);
        }
      }

      const filled = cellsAtFrame(currentFrame);
      for (const [key, { color, letter }] of filled) {
        const [rs, cs] = key.split(",").map(Number);
        const x = offsetX + cs * cellPx;
        const y = offsetY + rs * cellPx;
        ctx.fillStyle = color;
        ctx.fillRect(x, y, cellPx, cellPx);

        if (cellPx > 6 && fullscreen) {
          const fontSize = cellPx * 0.5;
          ctx.fillStyle = "#fff";
          ctx.font = `700 ${fontSize}px Nunito, sans-serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(letter, x + cellPx / 2, y + cellPx / 2 + 1);
        }
      }

      if (cellPx > 1) {
        ctx.strokeStyle = "rgba(0,0,0,0.06)";
        ctx.lineWidth = 0.5;
        for (const entry of entries.values()) {
          if (!entry.unlocked) continue;
          for (let i = 0; i < entry.length; i++) {
            const r = entry.direction === "down" ? entry.row + i : entry.row;
            const c = entry.direction === "across" ? entry.col + i : entry.col;
            ctx.strokeRect(offsetX + c * cellPx, offsetY + r * cellPx, cellPx, cellPx);
          }
        }
      }
    },
    [puzzleData, entries, cellsAtFrame, fullscreen],
  );

  useEffect(() => {
    drawCanvas(frame);
  }, [frame, drawCanvas]);

  useEffect(() => {
    if (!playing) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    const interval = BASE_INTERVAL / SPEEDS[speedIdx];
    timerRef.current = setInterval(() => {
      frameRef.current += 1;
      if (frameRef.current > totalFrames) {
        frameRef.current = totalFrames;
        setPlaying(false);
      }
      setFrame(frameRef.current);
    }, interval);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [playing, speedIdx, totalFrames]);

  const togglePlay = () => {
    if (frame >= totalFrames) {
      frameRef.current = 0;
      setFrame(0);
    }
    setPlaying((p) => !p);
  };

  const cycleSpeed = () => {
    setSpeedIdx((i) => (i + 1) % SPEEDS.length);
  };

  const handleScrub = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    frameRef.current = val;
    setFrame(val);
    setPlaying(false);
  };

  if (totalFrames === 0) {
    return (
      <div className={fullscreen ? styles.fullscreen : styles.mini}>
        <div className={styles.empty}>No solves yet</div>
        <button className={styles.closeBtn} onClick={onClose}>
          &times;
        </button>
      </div>
    );
  }

  return (
    <div className={fullscreen ? styles.fullscreen : styles.mini}>
      <button className={styles.closeBtn} onClick={onClose}>
        &times;
      </button>
      <div ref={containerRef} className={styles.canvasWrap}>
        <canvas ref={canvasRef} className={styles.canvas} />
      </div>
      <div className={styles.controls}>
        <button className={styles.playBtn} onClick={togglePlay}>
          {playing ? "⏸" : "▶"}
        </button>
        <input
          type="range"
          className={styles.scrubber}
          min={0}
          max={totalFrames}
          value={frame}
          onChange={handleScrub}
        />
        <span className={styles.counter}>
          {frame}/{totalFrames}
        </span>
        <button className={styles.speedBtn} onClick={cycleSpeed}>
          {SPEEDS[speedIdx]}x
        </button>
      </div>
    </div>
  );
}
