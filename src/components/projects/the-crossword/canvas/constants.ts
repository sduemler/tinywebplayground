export const CELL_SIZE = 40;
export const MIN_ZOOM = 0.15;
export const MAX_ZOOM = 3.0;
export const LETTER_FONT_RATIO = 0.55;
export const NUMBER_FONT_RATIO = 0.25;
export const NUMBER_PADDING = 2;

export const COLORS = {
  background: "#fef9e7",
  cellEmpty: "#fffdf5",
  cellLocked: "#e8dfc8",
  cellSelected: "#d4e6f7",
  cellHighlighted: "#e8f0f8",
  cellWrong: "#f5c6c6",
  cellUnlocking: "#d4e6f7",
  border: "#c8b88a",
  separatorBorder: "#8c6d4f",
  borderSelected: "#2a3d5c",
  letterColor: "#3b2a1a",
  letterLocked: "#5a4530",
  numberColor: "#8c6d4f",
  accent: "#2a3d5c",
} as const;
