import type { SimulationNodeDatum } from 'd3-force';

export interface Genre {
  id: string;
  label: string;
  artists: string[];
  x: number;
  y: number;
}

export interface Connection {
  source: string;
  target: string;
  bridgeArtist?: string;
}

export interface GenreNode extends Genre, SimulationNodeDatum {}
