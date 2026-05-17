import type { DrumPack, DrumSample } from "./types";

export const PACKS: DrumPack[] = [
  {
    slug: "linn",
    name: "Linn-style",
    description: "Classic 80s digital drum hits.",
    samples: [
      { id: "linn:kick", name: "Kick", file: "/audio/drums/linn/kick.mp3", packSlug: "linn", category: "kick" },
      { id: "linn:snare", name: "Snare", file: "/audio/drums/linn/snare.mp3", packSlug: "linn", category: "snare" },
      { id: "linn:hat-closed", name: "Closed Hat", file: "/audio/drums/linn/hat-closed.mp3", packSlug: "linn", category: "hat" },
      { id: "linn:hat-open", name: "Open Hat", file: "/audio/drums/linn/hat-open.mp3", packSlug: "linn", category: "hat" },
      { id: "linn:crash", name: "Crash", file: "/audio/drums/linn/crash.mp3", packSlug: "linn", category: "cymbal" },
      { id: "linn:ride", name: "Ride", file: "/audio/drums/linn/ride.mp3", packSlug: "linn", category: "cymbal" },
      { id: "linn:clap", name: "Clap", file: "/audio/drums/linn/clap.mp3", packSlug: "linn", category: "clap" },
      { id: "linn:tom-low", name: "Low Tom", file: "/audio/drums/linn/tom-low.mp3", packSlug: "linn", category: "tom" },
      { id: "linn:tom-mid", name: "Mid Tom", file: "/audio/drums/linn/tom-mid.mp3", packSlug: "linn", category: "tom" },
      { id: "linn:tom-high", name: "High Tom", file: "/audio/drums/linn/tom-high.mp3", packSlug: "linn", category: "tom" },
      { id: "linn:conga-low", name: "Low Conga", file: "/audio/drums/linn/conga-low.mp3", packSlug: "linn", category: "perc" },
      { id: "linn:conga-high", name: "High Conga", file: "/audio/drums/linn/conga-high.mp3", packSlug: "linn", category: "perc" },
      { id: "linn:cowbell", name: "Cowbell", file: "/audio/drums/linn/cowbell.mp3", packSlug: "linn", category: "perc" },
      { id: "linn:cabasa", name: "Cabasa", file: "/audio/drums/linn/cabasa.mp3", packSlug: "linn", category: "perc" },
      { id: "linn:tambourine", name: "Tambourine", file: "/audio/drums/linn/tambourine.mp3", packSlug: "linn", category: "perc" },
      { id: "linn:side-stick", name: "Side Stick", file: "/audio/drums/linn/side-stick.mp3", packSlug: "linn", category: "perc" },
    ],
  },
  {
    slug: "606",
    name: "Roland TR-606",
    description: "Tight, dry analog hits from the Roland TR-606.",
    samples: [
      { id: "606:kick", name: "Kick", file: "/audio/drums/606/kick.mp3", packSlug: "606", category: "kick" },
      { id: "606:snare", name: "Snare", file: "/audio/drums/606/snare.mp3", packSlug: "606", category: "snare" },
      { id: "606:hat-closed", name: "Closed Hat", file: "/audio/drums/606/hat-closed.mp3", packSlug: "606", category: "hat" },
      { id: "606:hat-open", name: "Open Hat", file: "/audio/drums/606/hat-open.mp3", packSlug: "606", category: "hat" },
      { id: "606:cymbal", name: "Cymbal", file: "/audio/drums/606/cymbal.mp3", packSlug: "606", category: "cymbal" },
      { id: "606:tom-high", name: "High Tom", file: "/audio/drums/606/tom-high.mp3", packSlug: "606", category: "tom" },
      { id: "606:tom-low", name: "Low Tom", file: "/audio/drums/606/tom-low.mp3", packSlug: "606", category: "tom" },
    ],
  },
  {
    slug: "808",
    name: "Roland TR-808",
    description: "Booming, iconic Roland TR-808 with sub kicks and crisp percussion.",
    samples: [
      { id: "808:kick-long", name: "Kick (Long)", file: "/audio/drums/808/kick-long.mp3", packSlug: "808", category: "kick" },
      { id: "808:kick-short", name: "Kick (Short)", file: "/audio/drums/808/kick-short.mp3", packSlug: "808", category: "kick" },
      { id: "808:snare", name: "Snare", file: "/audio/drums/808/snare.mp3", packSlug: "808", category: "snare" },
      { id: "808:clap", name: "Clap", file: "/audio/drums/808/clap.mp3", packSlug: "808", category: "clap" },
      { id: "808:hat-closed", name: "Closed Hat", file: "/audio/drums/808/hat-closed.mp3", packSlug: "808", category: "hat" },
      { id: "808:hat-open", name: "Open Hat", file: "/audio/drums/808/hat-open.mp3", packSlug: "808", category: "hat" },
      { id: "808:cymbal", name: "Cymbal", file: "/audio/drums/808/cymbal.mp3", packSlug: "808", category: "cymbal" },
      { id: "808:tom-high", name: "High Tom", file: "/audio/drums/808/tom-high.mp3", packSlug: "808", category: "tom" },
      { id: "808:tom-low", name: "Low Tom", file: "/audio/drums/808/tom-low.mp3", packSlug: "808", category: "tom" },
      { id: "808:rim", name: "Rim", file: "/audio/drums/808/rim.mp3", packSlug: "808", category: "perc" },
      { id: "808:clave", name: "Clave", file: "/audio/drums/808/clave.mp3", packSlug: "808", category: "perc" },
      { id: "808:cowbell", name: "Cowbell", file: "/audio/drums/808/cowbell.mp3", packSlug: "808", category: "perc" },
    ],
  },
  {
    slug: "909",
    name: "Roland TR-909",
    description: "Punchy Roland TR-909 — house and techno cornerstone.",
    samples: [
      { id: "909:kick", name: "Kick", file: "/audio/drums/909/kick.mp3", packSlug: "909", category: "kick" },
      { id: "909:kick-tape", name: "Kick (Tape)", file: "/audio/drums/909/kick-tape.mp3", packSlug: "909", category: "kick" },
      { id: "909:snare", name: "Snare", file: "/audio/drums/909/snare.mp3", packSlug: "909", category: "snare" },
      { id: "909:clap", name: "Clap", file: "/audio/drums/909/clap.mp3", packSlug: "909", category: "clap" },
      { id: "909:hat-closed", name: "Closed Hat", file: "/audio/drums/909/hat-closed.mp3", packSlug: "909", category: "hat" },
      { id: "909:hat-open", name: "Open Hat", file: "/audio/drums/909/hat-open.mp3", packSlug: "909", category: "hat" },
      { id: "909:ride", name: "Ride", file: "/audio/drums/909/ride.mp3", packSlug: "909", category: "cymbal" },
      { id: "909:tom-high", name: "High Tom", file: "/audio/drums/909/tom-high.mp3", packSlug: "909", category: "tom" },
      { id: "909:tom-low", name: "Low Tom", file: "/audio/drums/909/tom-low.mp3", packSlug: "909", category: "tom" },
      { id: "909:rim", name: "Rim", file: "/audio/drums/909/rim.mp3", packSlug: "909", category: "perc" },
    ],
  },
  {
    slug: "classic",
    name: "Classic Multi",
    description: "Clean acoustic-style drum kit, vinyl-warm.",
    samples: [
      { id: "classic:kick", name: "Kick", file: "/audio/drums/classic/kick.mp3", packSlug: "classic", category: "kick" },
      { id: "classic:kick-alt", name: "Kick (Alt)", file: "/audio/drums/classic/kick-alt.mp3", packSlug: "classic", category: "kick" },
      { id: "classic:snare", name: "Snare", file: "/audio/drums/classic/snare.mp3", packSlug: "classic", category: "snare" },
      { id: "classic:snare-alt", name: "Snare (Alt)", file: "/audio/drums/classic/snare-alt.mp3", packSlug: "classic", category: "snare" },
      { id: "classic:hat-closed", name: "Closed Hat", file: "/audio/drums/classic/hat-closed.mp3", packSlug: "classic", category: "hat" },
      { id: "classic:hat-open", name: "Open Hat", file: "/audio/drums/classic/hat-open.mp3", packSlug: "classic", category: "hat" },
      { id: "classic:crash", name: "Crash", file: "/audio/drums/classic/crash.mp3", packSlug: "classic", category: "cymbal" },
      { id: "classic:ride", name: "Ride", file: "/audio/drums/classic/ride.mp3", packSlug: "classic", category: "cymbal" },
      { id: "classic:tom-high", name: "High Tom", file: "/audio/drums/classic/tom-high.mp3", packSlug: "classic", category: "tom" },
      { id: "classic:tom-mid", name: "Mid Tom", file: "/audio/drums/classic/tom-mid.mp3", packSlug: "classic", category: "tom" },
      { id: "classic:tom-low", name: "Floor Tom", file: "/audio/drums/classic/tom-low.mp3", packSlug: "classic", category: "tom" },
      { id: "classic:rim", name: "Rim", file: "/audio/drums/classic/rim.mp3", packSlug: "classic", category: "perc" },
    ],
  },
  {
    slug: "big-break",
    name: "Big Break",
    description: "Vintage break-beat hybrid with a tape-saturated edge.",
    samples: [
      { id: "big-break:kick", name: "Kick", file: "/audio/drums/big-break/kick.mp3", packSlug: "big-break", category: "kick" },
      { id: "big-break:kick-rock", name: "Kick (Rock)", file: "/audio/drums/big-break/kick-rock.mp3", packSlug: "big-break", category: "kick" },
      { id: "big-break:snare", name: "Snare", file: "/audio/drums/big-break/snare.mp3", packSlug: "big-break", category: "snare" },
      { id: "big-break:snare-degraded", name: "Snare (Degraded)", file: "/audio/drums/big-break/snare-degraded.mp3", packSlug: "big-break", category: "snare" },
      { id: "big-break:hat-closed", name: "Closed Hat", file: "/audio/drums/big-break/hat-closed.mp3", packSlug: "big-break", category: "hat" },
      { id: "big-break:hat-open", name: "Open Hat", file: "/audio/drums/big-break/hat-open.mp3", packSlug: "big-break", category: "hat" },
      { id: "big-break:ride", name: "Ride", file: "/audio/drums/big-break/ride.mp3", packSlug: "big-break", category: "cymbal" },
      { id: "big-break:tom", name: "Tom", file: "/audio/drums/big-break/tom.mp3", packSlug: "big-break", category: "tom" },
      { id: "big-break:shaker", name: "Shaker", file: "/audio/drums/big-break/shaker.mp3", packSlug: "big-break", category: "perc" },
      { id: "big-break:tambourine", name: "Tambourine", file: "/audio/drums/big-break/tambourine.mp3", packSlug: "big-break", category: "perc" },
    ],
  },
  {
    slug: "dirty-dusty",
    name: "Dirty Dusty",
    description: "Lo-fi degraded drums for grimy beats.",
    samples: [
      { id: "dirty-dusty:kick", name: "Kick", file: "/audio/drums/dirty-dusty/kick.mp3", packSlug: "dirty-dusty", category: "kick" },
      { id: "dirty-dusty:kick-crunch", name: "Kick (Crunch)", file: "/audio/drums/dirty-dusty/kick-crunch.mp3", packSlug: "dirty-dusty", category: "kick" },
      { id: "dirty-dusty:snare", name: "Snare", file: "/audio/drums/dirty-dusty/snare.mp3", packSlug: "dirty-dusty", category: "snare" },
      { id: "dirty-dusty:snare-alt", name: "Snare (Alt)", file: "/audio/drums/dirty-dusty/snare-alt.mp3", packSlug: "dirty-dusty", category: "snare" },
      { id: "dirty-dusty:hat-closed", name: "Closed Hat", file: "/audio/drums/dirty-dusty/hat-closed.mp3", packSlug: "dirty-dusty", category: "hat" },
      { id: "dirty-dusty:hat-open", name: "Open Hat", file: "/audio/drums/dirty-dusty/hat-open.mp3", packSlug: "dirty-dusty", category: "hat" },
      { id: "dirty-dusty:tom-high", name: "High Tom", file: "/audio/drums/dirty-dusty/tom-high.mp3", packSlug: "dirty-dusty", category: "tom" },
      { id: "dirty-dusty:tom-low", name: "Floor Tom", file: "/audio/drums/dirty-dusty/tom-low.mp3", packSlug: "dirty-dusty", category: "tom" },
      { id: "dirty-dusty:rim", name: "Rim", file: "/audio/drums/dirty-dusty/rim.mp3", packSlug: "dirty-dusty", category: "perc" },
      { id: "dirty-dusty:shaker", name: "Shaker", file: "/audio/drums/dirty-dusty/shaker.mp3", packSlug: "dirty-dusty", category: "perc" },
      { id: "dirty-dusty:tambourine", name: "Tambourine", file: "/audio/drums/dirty-dusty/tambourine.mp3", packSlug: "dirty-dusty", category: "perc" },
      { id: "dirty-dusty:click", name: "Click", file: "/audio/drums/dirty-dusty/click.mp3", packSlug: "dirty-dusty", category: "fx" },
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

/**
 * Find the best-matching sample in `newPackSlug` for an existing sample ID.
 * Priority:
 *   1. Same id suffix (e.g. `linn:kick` → `<newpack>:kick`)
 *   2. Same display name
 *   3. First sample with same category
 *   4. Returns null — caller should keep the existing sample
 */
export function findEquivalentSample(
  sourceSampleId: string,
  newPackSlug: string
): string | null {
  const source = findSample(sourceSampleId);
  const newPack = findPack(newPackSlug);
  if (!source || !newPack) return null;
  if (source.packSlug === newPackSlug) return source.id;

  const suffix = sourceSampleId.includes(":")
    ? sourceSampleId.split(":").slice(1).join(":")
    : sourceSampleId;
  const candidateId = `${newPackSlug}:${suffix}`;
  const byId = newPack.samples.find((s) => s.id === candidateId);
  if (byId) return byId.id;

  const byName = newPack.samples.find(
    (s) => s.name.toLowerCase() === source.name.toLowerCase()
  );
  if (byName) return byName.id;

  const byCategory = newPack.samples.find((s) => s.category === source.category);
  if (byCategory) return byCategory.id;

  return null;
}
