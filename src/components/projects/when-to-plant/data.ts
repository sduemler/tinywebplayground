// Map geometry and county data, prepared once on load.

import { geoPath } from "d3-geo";
import { feature, mesh } from "topojson-client";
import type { GeometryCollection, Topology } from "topojson-specification";
import countiesJson from "@data/when-to-plant/counties.json";
import topoJson from "@data/when-to-plant/map.topo.json";
import type { County } from "./engine";

export const MAP_WIDTH = 975;
export const MAP_HEIGHT = 610;

type Box = [x: number, y: number, w: number, h: number];

export const COUNTIES = countiesJson as unknown as Record<string, County>;

const topo = topoJson as unknown as Topology<{
  counties: GeometryCollection;
  states: GeometryCollection<{ name: string }>;
  nation: GeometryCollection;
}>;

// The shapes are already projected (Albers USA, 975×610), so no projection is needed.
const path = geoPath();

export interface CountyShape {
  fips: string;
  d: string;
}

export interface StateShape {
  fips: string;
  name: string;
  d: string;
  box: Box;
}

export const COUNTY_SHAPES: CountyShape[] = feature(topo, topo.objects.counties)
  .features.filter((f) => COUNTIES[f.id as string])
  .map((f) => ({ fips: f.id as string, d: path(f) ?? "" }));

export const STATE_SHAPES: StateShape[] = feature(topo, topo.objects.states)
  .features.map((f) => {
    const [[x0, y0], [x1, y1]] = path.bounds(f);
    return {
      fips: f.id as string,
      name: f.properties.name,
      d: path(f) ?? "",
      box: [x0, y0, x1 - x0, y1 - y0] as Box,
    };
  })
  .sort((a, b) => a.name.localeCompare(b.name));

export const STATE_BY_FIPS = new Map(STATE_SHAPES.map((s) => [s.fips, s]));

export const STATE_BORDERS = path(mesh(topo, topo.objects.states, (a, b) => a !== b)) ?? "";
export const NATION_OUTLINE = path(mesh(topo, topo.objects.nation)) ?? "";

/** Counties of a state, alphabetical. */
export function countiesOf(stateFips: string): { fips: string; name: string }[] {
  return COUNTY_SHAPES.filter((c) => c.fips.startsWith(stateFips))
    .map((c) => ({ fips: c.fips, name: COUNTIES[c.fips].n }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export const FULL_VIEW: Box = [0, 0, MAP_WIDTH, MAP_HEIGHT];
/** Closest zoom: about 14× the whole map. */
export const MIN_VIEW_WIDTH = MAP_WIDTH / 14;

export const isZoomedIn = (view: Box) => view[2] < MAP_WIDTH * 0.98;

/**
 * Keeps a dragged or zoomed view sensible: aspect ratio fixed, zoom between the whole
 * map and MIN_VIEW_WIDTH, and the view's center somewhere over the map.
 */
export function clampView([x, y, w, h]: Box): Box {
  const aspect = MAP_WIDTH / MAP_HEIGHT;
  const width = Math.min(MAP_WIDTH, Math.max(MIN_VIEW_WIDTH, w));
  if (width >= MAP_WIDTH * 0.98) return FULL_VIEW;
  const height = width / aspect;
  const cx = Math.min(MAP_WIDTH, Math.max(0, x + w / 2));
  const cy = Math.min(MAP_HEIGHT, Math.max(0, y + h / 2));
  return [cx - width / 2, cy - height / 2, width, height];
}

/** Zoom by `factor` (>1 = closer) keeping the map point `anchor` where it is on screen. */
export function zoomView(view: Box, factor: number, anchor?: [number, number]): Box {
  const [x, y, w, h] = view;
  const [ax, ay] = anchor ?? [x + w / 2, y + h / 2];
  const nw = w / factor;
  const nh = h / factor;
  return clampView([ax - ((ax - x) / w) * nw, ay - ((ay - y) / h) * nh, nw, nh]);
}

/** A viewBox that frames a state with some margin, keeping the map's aspect ratio. */
export function viewForState(stateFips: string): Box {
  const state = STATE_BY_FIPS.get(stateFips);
  if (!state) return FULL_VIEW;
  const [x, y, w, h] = state.box;
  const pad = 0.12;
  let vw = w * (1 + pad * 2);
  let vh = h * (1 + pad * 2);
  const aspect = MAP_WIDTH / MAP_HEIGHT;
  if (vw / vh > aspect) vh = vw / aspect;
  else vw = vh * aspect;
  // Don't zoom in past ~12× (tiny states like Rhode Island or DC).
  const minW = MAP_WIDTH / 12;
  if (vw < minW) {
    vw = minW;
    vh = minW / aspect;
  }
  return [x + w / 2 - vw / 2, y + h / 2 - vh / 2, vw, vh];
}

/** Nearest county to a point, by its population center (good enough for "use my location"). */
export function nearestCounty(lat: number, lon: number): string | null {
  let best: string | null = null;
  let bestD = Infinity;
  const cos = Math.cos((lat * Math.PI) / 180);
  for (const [fips, c] of Object.entries(COUNTIES)) {
    const dx = (c.c[0] - lon) * cos;
    const dy = c.c[1] - lat;
    const d = dx * dx + dy * dy;
    if (d < bestD) {
      bestD = d;
      best = fips;
    }
  }
  // More than ~2.5° away from every county: not in the US.
  return bestD < 6 ? best : null;
}

let zipTable: Promise<Record<string, string>> | null = null;

/** ZIP → county FIPS, fetched the first time someone searches. */
export function loadZips(): Promise<Record<string, string>> {
  zipTable ??= fetch("/data/when-to-plant/zips.json").then((r) => {
    if (!r.ok) throw new Error(`zips.json ${r.status}`);
    return r.json();
  });
  zipTable.catch(() => (zipTable = null));
  return zipTable;
}
