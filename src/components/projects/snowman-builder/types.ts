export interface Snowball {
  id: number;
  x: number;
  y: number;
  radius: number;
  vx: number;
  vy: number;
  rotation: number;
  isDragging: boolean;
  stackedOn: number | null;
}

export interface SnowLayer {
  heights: Float32Array;
  originalHeights: Float32Array;
  totalOriginalSnow: number;
}

export interface GameState {
  snowballs: Snowball[];
  snowLayer: SnowLayer | null;
  nextId: number;
  draggingId: number | null;
  mouseX: number;
  mouseY: number;
  lastMouseX: number;
  lastMouseY: number;
  isComplete: boolean;
  decorationAlpha: number;
  canvasWidth: number;
  canvasHeight: number;
}

export type Phase = "loading" | "location-prompt" | "no-snow" | "playing" | "complete";

export interface SnowfallData {
  totalCm: number;
  totalInches: number;
  locationName: string;
  latitude: number;
  longitude: number;
}

export interface GeocodingResult {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  country: string;
  admin1?: string;
}
