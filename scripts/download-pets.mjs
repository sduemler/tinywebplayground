#!/usr/bin/env node
// Download OSRS pet sprites from the Old School RuneScape Wiki.
// Run: node scripts/download-pets.mjs
//
// When adding new bosses to bosses.ts, add the pet entry below and re-run.

import { writeFile, mkdir, readdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const IMAGES_DIR = join(ROOT, 'public/images/projects/pets');

// Pet name → local filename
// Wiki image names match the pet's in-game name (spaces → underscores, .png)
// Chaos Elemental and Chaos Fanatic share the same pet sprite.
const PETS = [
  { wikiName: 'Abyssal orphan', file: 'abyssal-orphan.png' },
  { wikiName: 'Ikkle hydra', file: 'ikkle-hydra.png' },
  { wikiName: 'Callisto cub', file: 'callisto-cub.png' },
  { wikiName: 'Hellpuppy', file: 'hellpuppy.png' },
  { wikiName: 'Pet chaos elemental', file: 'pet-chaos-elemental.png' },
  { wikiName: 'Pet zilyana', file: 'pet-zilyana.png' },
  { wikiName: 'Pet dark core', file: 'pet-dark-core.png' },
  { wikiName: 'Pet dagannoth prime', file: 'pet-dagannoth-prime.png' },
  { wikiName: 'Pet dagannoth rex', file: 'pet-dagannoth-rex.png' },
  { wikiName: 'Pet dagannoth supreme', file: 'pet-dagannoth-supreme.png' },
  { wikiName: 'Pet general graardor', file: 'pet-general-graardor.png' },
  { wikiName: 'Baby mole', file: 'baby-mole.png' },
  { wikiName: 'Noon', file: 'noon.png' },
  { wikiName: 'Kalphite princess', file: 'kalphite-princess.png' },
  { wikiName: 'Prince black dragon', file: 'prince-black-dragon.png' },
  { wikiName: 'Pet kraken', file: 'pet-kraken.png' },
  { wikiName: "Pet kree'arra", file: 'pet-kreearra.png' },
  { wikiName: "Pet k'ril tsutsaroth", file: 'pet-kril-tsutsaroth.png' },
  { wikiName: 'Little nightmare', file: 'little-nightmare.png' },
  { wikiName: 'Muphin', file: 'muphin.png' },
  { wikiName: 'Sraracha', file: 'sraracha.png' },
  { wikiName: "Scorpia's offspring", file: 'scorpias-offspring.png' },
  { wikiName: 'Skotos', file: 'skotos.png' },
  { wikiName: 'Tiny tempor', file: 'tiny-tempor.png' },
  { wikiName: 'Pet smoke devil', file: 'pet-smoke-devil.png' },
  { wikiName: 'Venenatis spiderling', file: 'venenatis-spiderling.png' },
  { wikiName: "Vet'ion jr.", file: 'vetion-jr.png' },
  { wikiName: 'Vorki', file: 'vorki.png' },
  { wikiName: 'Phoenix', file: 'phoenix.png' },
  { wikiName: 'Pet snakeling', file: 'pet-snakeling.png' },
  { wikiName: 'Olmlet', file: 'olmlet.png' },
  { wikiName: "Lil' zik", file: 'lil-zik.png' },
  { wikiName: "Tumeken's guardian", file: 'tumekens-guardian.png' },
  { wikiName: 'Youngllef', file: 'youngllef.png' },
  { wikiName: 'Nexling', file: 'nexling.png' },
  { wikiName: 'Smolcano', file: 'smolcano.png' },
  // Added July 2023+
  { wikiName: 'Moxi', file: 'moxi.png' },
  { wikiName: 'Nid', file: 'nid.png' },
  { wikiName: 'Beef', file: 'beef.png' },
  { wikiName: 'Dom', file: 'dom.png' },
  { wikiName: 'Baron', file: 'baron.png' },
  { wikiName: 'Huberte', file: 'huberte.png' },
  { wikiName: "Lil'viathan", file: 'lilviathan.png' },
  { wikiName: 'Bran', file: 'bran.png' },
  { wikiName: 'Scurry', file: 'scurry.png' },
  { wikiName: 'Gull', file: 'gull.png' },
  { wikiName: 'Smol heredit', file: 'smol-heredit.png' },
  { wikiName: 'Butch', file: 'butch.png' },
  { wikiName: 'Wisp', file: 'wisp.png' },
  { wikiName: 'Yami', file: 'yami.png' },
];

async function downloadImage(wikiName, dest) {
  // Use the OSRS Wiki API to get the direct image URL
  const encodedName = encodeURIComponent(wikiName.replace(/ /g, '_') + '.png');
  const apiUrl = `https://oldschool.runescape.wiki/w/Special:FilePath/${encodedName}`;

  const res = await fetch(apiUrl, { redirect: 'follow' });
  if (!res.ok) return false;

  const buffer = Buffer.from(await res.arrayBuffer());
  await writeFile(dest, buffer);
  return true;
}

async function main() {
  await mkdir(IMAGES_DIR, { recursive: true });

  // Check which files already exist
  let existing = new Set();
  if (existsSync(IMAGES_DIR)) {
    const files = await readdir(IMAGES_DIR);
    existing = new Set(files);
  }

  const toFetch = PETS.filter((p) => !existing.has(p.file));
  console.log(`${existing.size} already cached, fetching ${toFetch.length} new pet sprites…\n`);

  let fetched = 0;
  let failed = 0;

  for (const pet of toFetch) {
    try {
      const dest = join(IMAGES_DIR, pet.file);
      const ok = await downloadImage(pet.wikiName, dest);
      if (ok) {
        console.log(`  ✓  ${pet.wikiName} → ${pet.file}`);
        fetched++;
      } else {
        console.log(`  ✗  ${pet.wikiName}: download failed`);
        failed++;
      }
    } catch (err) {
      console.log(`  ✗  ${pet.wikiName}: ${err.message}`);
      failed++;
    }
  }

  console.log(`\nDone: ${fetched} downloaded, ${failed} failed, ${PETS.length - toFetch.length} already cached.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
