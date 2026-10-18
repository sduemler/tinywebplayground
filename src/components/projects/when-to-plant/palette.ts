// Map colors for When To Plant.
//
// The eight group hues follow the dataviz skill's categorical order (blue, orange,
// aqua, yellow, magenta, green, violet, red), re-stepped into earthier tones and
// validated against the map's cream surface (#f6ecd3): lightness band, chroma floor,
// adjacent-pair color-blind separation and normal-vision separation all pass.
// No eight hues can be told apart in every pair under color blindness, so the map
// always has a second channel: the group name in the tooltip and county panel, the
// one-group filter chips, and an optional hatch pattern (45° / 135° lines) that
// splits the pairs that collide (green/orange, orange/yellow, yellow/aqua, green/red).

import type { GroupId } from "@data/when-to-plant/crops";

export const GROUP_COLORS: Record<GroupId, string> = {
  brassicas: "#2f7bab",
  roots: "#e06a2c",
  legumes: "#22a77c",
  cucurbits: "#d99a00",
  herbs: "#de76a0",
  greens: "#2e7a1e",
  alliums: "#7b55c0",
  nightshades: "#c9363a",
};

/** Hatch angle per group when patterns are on; null = solid. */
export const GROUP_HATCH: Record<GroupId, 45 | 135 | null> = {
  greens: null,
  roots: 45,
  brassicas: null,
  cucurbits: 135,
  herbs: null,
  legumes: 45,
  alliums: null,
  nightshades: 135,
};

export const REST_COLOR = "#e3d5b3";
export const MUTED_COLOR = "#efe5cc";
export const SURFACE = "#f6ecd3";
export const INK = "#3b2a1a";
