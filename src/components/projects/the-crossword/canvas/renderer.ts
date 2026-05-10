import { CELL_SIZE, COLORS, LETTER_FONT_RATIO, NUMBER_FONT_RATIO, NUMBER_PADDING } from "./constants";
import type { Camera } from "./camera";
import { worldToScreen, visibleBounds } from "./camera";
import type { Animation } from "./animations";
import { getAnimationProgress, isAnimationActive, springEase, easeOut, solveBounce } from "./animations";
import type { EntryData } from "../types";

export interface RenderCell {
  row: number;
  col: number;
  letter: string;
  locked: boolean;
  number: number | null;
  acrossEntryId: string | null;
  downEntryId: string | null;
}

export interface RenderState {
  cells: Map<string, RenderCell>;
  selectedEntryId: string | null;
  selectedCells: Set<string>;
  activeCellKey: string | null;
  entries: Map<string, EntryData>;
  animations: Animation[];
}

function cellKey(row: number, col: number): string {
  return `${row},${col}`;
}

export function buildCellMap(entries: Map<string, EntryData>): Map<string, RenderCell> {
  const cells = new Map<string, RenderCell>();
  const numbering: Map<string, number> = new Map();
  let num = 0;

  const sortedEntries = [...entries.values()].filter((e) => e.unlocked).sort((a, b) => {
    if (a.row !== b.row) return a.row - b.row;
    if (a.col !== b.col) return a.col - b.col;
    return a.direction === "across" ? -1 : 1;
  });

  for (const entry of sortedEntries) {
    const startKey = cellKey(entry.row, entry.col);
    if (!numbering.has(startKey)) {
      numbering.set(startKey, ++num);
    }

    for (let i = 0; i < entry.length; i++) {
      const r = entry.direction === "down" ? entry.row + i : entry.row;
      const c = entry.direction === "across" ? entry.col + i : entry.col;
      const key = cellKey(r, c);

      const existing = cells.get(key);
      if (existing) {
        if (entry.direction === "across") existing.acrossEntryId = entry.id;
        else existing.downEntryId = entry.id;
        if (entry.solvedBy) existing.locked = true;
        if (!existing.letter && entry.solvedBy) existing.letter = entry.word[i];
      } else {
        cells.set(key, {
          row: r,
          col: c,
          letter: entry.solvedBy ? entry.word[i] : "",
          locked: !!entry.solvedBy,
          number: numbering.get(key) || null,
          acrossEntryId: entry.direction === "across" ? entry.id : null,
          downEntryId: entry.direction === "down" ? entry.id : null,
        });
      }
    }
  }

  return cells;
}

export function render(
  ctx: CanvasRenderingContext2D,
  cam: Camera,
  canvasW: number,
  canvasH: number,
  state: RenderState,
) {
  const dpr = window.devicePixelRatio || 1;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, canvasW, canvasH);

  const bounds = visibleBounds(cam, canvasW, canvasH);
  const fontSize = CELL_SIZE * LETTER_FONT_RATIO * cam.zoom;
  const numFontSize = CELL_SIZE * NUMBER_FONT_RATIO * cam.zoom;
  const cellScreenSize = CELL_SIZE * cam.zoom;

  if (cellScreenSize < 2) return;

  const animMap = new Map<string, Animation>();
  for (const anim of state.animations) {
    animMap.set(cellKey(anim.row, anim.col), anim);
  }

  for (const [key, cell] of state.cells) {
    if (
      cell.row < bounds.minRow ||
      cell.row > bounds.maxRow ||
      cell.col < bounds.minCol ||
      cell.col > bounds.maxCol
    )
      continue;

    const { sx, sy } = worldToScreen(
      cell.col * CELL_SIZE,
      cell.row * CELL_SIZE,
      cam,
      canvasW,
      canvasH,
    );

    const anim = animMap.get(key);
    let scale = 1;
    let bgColor: string = cell.locked ? COLORS.cellLocked : COLORS.cellEmpty;

    if (anim && isAnimationActive(anim)) {
      const t = getAnimationProgress(anim);
      if (anim.type === "wrong") {
        const fade = 1 - easeOut(t);
        const r = 245;
        const g = Math.round(198 + (253 - 198) * easeOut(t));
        const b = Math.round(198 + (245 - 198) * easeOut(t));
        bgColor = `rgb(${r},${g},${b})`;
        if (fade <= 0) bgColor = COLORS.cellEmpty;
      } else if (anim.type === "unlock") {
        scale = springEase(t);
      } else if (anim.type === "solve") {
        scale = solveBounce(t);
        const greenFade = t < 0.5 ? 1 - t * 2 : 0;
        if (greenFade > 0) {
          const r = Math.round(232 + (232 - 180) * greenFade * -1);
          const g = Math.round(223 + (245 - 223) * greenFade);
          const b = Math.round(200 + (200 - 170) * greenFade * -1);
          bgColor = `rgb(${r},${g},${b})`;
        } else {
          bgColor = COLORS.cellLocked;
        }
      }
    }

    if (state.selectedCells.has(key)) {
      if (key === state.activeCellKey) {
        bgColor = COLORS.cellSelected;
      } else if (!cell.locked) {
        bgColor = COLORS.cellHighlighted;
      }
    }

    const drawX = sx + (cellScreenSize * (1 - scale)) / 2;
    const drawY = sy + (cellScreenSize * (1 - scale)) / 2;
    const drawSize = cellScreenSize * scale;

    ctx.fillStyle = bgColor;
    ctx.fillRect(drawX, drawY, drawSize, drawSize);
    ctx.strokeStyle = state.selectedCells.has(key) ? COLORS.borderSelected : COLORS.border;
    ctx.lineWidth = state.selectedCells.has(key) ? 1.5 : 0.5;
    ctx.strokeRect(drawX, drawY, drawSize, drawSize);

    if (cell.number && cellScreenSize > 12) {
      ctx.fillStyle = COLORS.numberColor;
      ctx.font = `600 ${numFontSize}px Nunito, sans-serif`;
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillText(
        String(cell.number),
        drawX + NUMBER_PADDING * cam.zoom,
        drawY + NUMBER_PADDING * cam.zoom,
      );
    }

    if (cell.letter && cell.locked && cellScreenSize > 8) {
      ctx.fillStyle = COLORS.letterLocked;
      ctx.font = `700 ${fontSize}px Nunito, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(cell.letter, drawX + drawSize / 2, drawY + drawSize / 2 + 1);
    }
  }
}

function lerpColor(a: string, b: string, t: number): string {
  const pa = hexToRgb(a);
  const pb = hexToRgb(b);
  if (!pa || !pb) return a;
  const r = Math.round(pa.r + (pb.r - pa.r) * t);
  const g = Math.round(pa.g + (pb.g - pa.g) * t);
  const bl = Math.round(pa.b + (pb.b - pa.b) * t);
  return `rgb(${r},${g},${bl})`;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const m = hex.match(/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
  if (!m) return null;
  return { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) };
}
