#!/usr/bin/env node

/**
 * Renders the media clues the way CluePanel does (media block + clue text +
 * answer slots), into a self-contained HTML file you open in a browser. For QA
 * of the audio/gif/image clues before launch. Reads media-clues.json; touches
 * nothing live. By default shows one of each type (audio, gif, image); pass
 * --all to render every media clue.
 *
 * Usage:
 *   npm run preview-media
 *   node scripts/preview-media.mjs --all
 */

import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const INPUT = resolve(__dirname, "../src/data/the-crossword/media-clues.json");
const OUTPUT = resolve(__dirname, "../media-preview.html");
const showAll = process.argv.includes("--all");

const all = JSON.parse(readFileSync(INPUT, "utf-8")).filter((c) => c.media);
const isGif = (c) => /\.gif($|\?)/i.test(c.media.src);

let chosen;
if (showAll) {
  chosen = all;
} else {
  const audio = all.find((c) => c.media.type === "audio");
  const gif = all.find((c) => c.media.type === "image" && isGif(c));
  const image = all.find((c) => c.media.type === "image" && !isGif(c));
  chosen = [audio, gif, image].filter(Boolean);
}

const esc = (s) =>
  String(s).replace(/[&<>"]/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[m]));

// Public-dir assets are served at "/media/..."; for a file:// preview rewrite to
// the on-disk relative path from the project root (where this HTML is written).
const localSrc = (src) => esc(src.replace(/^\//, "public/"));

function mediaBlock(c) {
  const { type, src, alt } = c.media;
  if (type === "audio") {
    return `<audio class="mediaAudio" src="${localSrc(src)}" controls preload="metadata"></audio>`;
  }
  if (type === "video") {
    return `<video class="media" src="${localSrc(src)}" controls preload="metadata"></video>`;
  }
  return `<img class="media" src="${localSrc(src)}" alt="${esc(alt ?? "Clue image")}">`;
}

function slots(word) {
  return [...word]
    .map(() => `<div class="slot"><span class="slotLetter"></span></div>`)
    .join("");
}

function kind(c) {
  return c.media.type === "audio" ? "audio" : isGif(c) ? "gif (animated image)" : "image";
}

const panels = chosen
  .map(
    (c) => `
  <figure class="card">
    <figcaption class="cap">
      <span class="kbadge">${esc(kind(c))}</span>
      <code>${esc(c.media.src)}</code>
      <span class="ans">answer: ${esc(c.word)}</span>
      <span class="sty">${esc(c.style)}</span>
    </figcaption>
    <div class="panel">
      ${mediaBlock(c)}
      <div class="clueText">${esc(c.clue)}</div>
      <div class="slotsRow">
        <div class="slots">${slots(c.word)}</div>
        <button class="submit" disabled>Check</button>
      </div>
    </div>
  </figure>`,
  )
  .join("");

const html = `<!doctype html><html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Media clue preview</title>
<style>
  :root{
    --color-bg:#fef9e7;--color-text:#3b2a1a;--color-muted:#8c6d4f;--color-surface:#fffdf5;
    --color-border:#e4d4a0;--color-accent:#c97b2e;--radius:14px;--transition:160ms ease;
    --accent:#2a3d5c;--font-body:'Nunito',-apple-system,system-ui,sans-serif;
  }
  body{background:var(--color-bg);color:var(--color-text);font-family:var(--font-body);margin:0;padding:24px;}
  h1{font-size:20px;} .sub{color:var(--color-muted);font-size:13px;margin-bottom:20px;}
  .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,360px));gap:24px;align-items:start;}
  figure{margin:0;}
  .cap{display:flex;flex-wrap:wrap;gap:8px;align-items:center;font-size:12px;color:var(--color-muted);margin-bottom:8px;}
  .kbadge{background:var(--color-accent);color:#fff;border-radius:8px;padding:1px 8px;font-weight:700;}
  .cap code{background:#fff;border:1px solid var(--color-border);border-radius:6px;padding:1px 6px;}
  .ans{color:var(--accent);font-weight:700;} .sty{background:#f5e6c8;border-radius:8px;padding:1px 8px;}
  /* --- copied from CluePanel.module.css so this matches the real clue panel --- */
  .panel{background:var(--color-surface);border:2px solid var(--color-border);border-radius:var(--radius);padding:1rem 1.25rem;box-shadow:0 4px 20px rgba(0,0,0,.15);}
  .clueText{font-size:1rem;color:var(--color-text);line-height:1.5;margin-bottom:.75rem;}
  .media{display:block;width:100%;max-height:180px;object-fit:contain;border-radius:8px;margin-bottom:.6rem;background:var(--color-bg);border:1px solid var(--color-border);}
  .mediaAudio{display:block;width:100%;margin-bottom:.6rem;}
  .slotsRow{display:flex;align-items:flex-end;gap:.5rem;}
  .slots{flex:1;display:flex;gap:4px;min-width:0;flex-wrap:wrap;}
  .slot{flex:0 1 2rem;min-width:1rem;height:2.4rem;display:flex;align-items:center;justify-content:center;border-bottom:2.5px solid var(--color-border);}
  .submit{padding:.6rem 1.25rem;font-size:.9rem;font-weight:600;border:none;border-radius:8px;background:var(--accent);color:#fff;flex-shrink:0;align-self:center;opacity:.4;}
</style></head><body>
<h1>🖼️ Media clue preview</h1>
<div class="sub">${showAll ? `All ${chosen.length} media clues.` : "One of each type."} Rendered like the live clue panel (answer shown for QA — players don't see it). ${all.length} media clues total.</div>
<div class="grid">${panels}</div>
</body></html>`;

writeFileSync(OUTPUT, html);
console.log(`Wrote ${OUTPUT}`);
console.log(`  ${chosen.length} panel(s): ${chosen.map(kind).join(", ")}`);
console.log(`Open it: open "${OUTPUT}"`);
