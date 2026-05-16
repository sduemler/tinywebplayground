import type { DrumPack, DrumSample } from "./types";

export const PACKS: DrumPack[] = [
  {
    slug: "linn",
    name: "Linn-style",
    description: "Classic 80s digital drum hits.",
    samples: [
      { id: "linn:kick", name: "Kick", file: "/audio/drums/linn/kick.wav", packSlug: "linn", category: "kick" },
      { id: "linn:snare", name: "Snare", file: "/audio/drums/linn/snare.wav", packSlug: "linn", category: "snare" },
      { id: "linn:hat-closed", name: "Closed Hat", file: "/audio/drums/linn/hat-closed.wav", packSlug: "linn", category: "hat" },
      { id: "linn:hat-open", name: "Open Hat", file: "/audio/drums/linn/hat-open.wav", packSlug: "linn", category: "hat" },
      { id: "linn:crash", name: "Crash", file: "/audio/drums/linn/crash.wav", packSlug: "linn", category: "cymbal" },
      { id: "linn:ride", name: "Ride", file: "/audio/drums/linn/ride.wav", packSlug: "linn", category: "cymbal" },
      { id: "linn:clap", name: "Clap", file: "/audio/drums/linn/clap.wav", packSlug: "linn", category: "clap" },
      { id: "linn:tom-low", name: "Low Tom", file: "/audio/drums/linn/tom-low.wav", packSlug: "linn", category: "tom" },
      { id: "linn:tom-mid", name: "Mid Tom", file: "/audio/drums/linn/tom-mid.wav", packSlug: "linn", category: "tom" },
      { id: "linn:tom-high", name: "High Tom", file: "/audio/drums/linn/tom-high.wav", packSlug: "linn", category: "tom" },
      { id: "linn:conga-low", name: "Low Conga", file: "/audio/drums/linn/conga-low.wav", packSlug: "linn", category: "perc" },
      { id: "linn:conga-high", name: "High Conga", file: "/audio/drums/linn/conga-high.wav", packSlug: "linn", category: "perc" },
      { id: "linn:cowbell", name: "Cowbell", file: "/audio/drums/linn/cowbell.wav", packSlug: "linn", category: "perc" },
      { id: "linn:cabasa", name: "Cabasa", file: "/audio/drums/linn/cabasa.wav", packSlug: "linn", category: "perc" },
      { id: "linn:tambourine", name: "Tambourine", file: "/audio/drums/linn/tambourine.wav", packSlug: "linn", category: "perc" },
      { id: "linn:side-stick", name: "Side Stick", file: "/audio/drums/linn/side-stick.wav", packSlug: "linn", category: "perc" },
    ],
  },
];

const SAMPLE_INDEX: Map<string, DrumSample> = new Map();
for (const pack of PACKS) {
  for (const sample of pack.samples) {
    SAMPLE_INDEX.set(sample.id, sample);
  }
}

export function findSample(id: string): DrumSample | undefined {
  return SAMPLE_INDEX.get(id);
}

export function findPack(slug: string): DrumPack | undefined {
  return PACKS.find((p) => p.slug === slug);
}

export function getDefaultPack(): DrumPack {
  return PACKS[0];
}

export function allSamples(): DrumSample[] {
  return PACKS.flatMap((p) => p.samples);
}
