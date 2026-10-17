#!/usr/bin/env node
// Downloads each Morning Rounds game's favicon into public/images/morning-rounds/icons/<id>.png
// (96×96) and lists the ids that got one in src/data/morning-rounds/icons.json. Games missing from
// that list show their letter tile instead. Re-run after adding games:
//   npm run build-morning-rounds-icons            (only games without an icon yet)
//   npm run build-morning-rounds-icons -- --all   (refetch everything)
//
// Order of preference: the site's own <link rel="apple-touch-icon"/"icon"> (largest first),
// then /favicon.ico, then Google's favicon service. ICO files are only used when they hold a
// PNG image, since sharp can't read the older BMP kind.
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const GAMES_TS = path.join(ROOT, "src/data/morning-rounds/games.ts");
const OUT_DIR = path.join(ROOT, "public/images/morning-rounds/icons");
const LIST = path.join(ROOT, "src/data/morning-rounds/icons.json");
const SIZE = 96;
const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36";

const refetchAll = process.argv.includes("--all");
const source = fs.readFileSync(GAMES_TS, "utf8");
const games = [...source.matchAll(/id: "([^"]+)",[\s\S]*?url: "([^"]+)"/g)].map((m) => ({
  id: m[1],
  url: m[2],
}));

async function get(url, timeoutMs = 12000) {
  const res = await fetch(url, {
    headers: { "User-Agent": UA, Accept: "*/*" },
    redirect: "follow",
    signal: AbortSignal.timeout(timeoutMs),
  });
  return res;
}

/** <link> icon candidates from the page, biggest first, .ico last. */
function iconLinks(html, baseUrl) {
  const out = [];
  for (const [tag] of html.matchAll(/<link\b[^>]*>/gi)) {
    const attr = (name) => tag.match(new RegExp(`\\b${name}\\s*=\\s*["']([^"']*)["']`, "i"))?.[1];
    const rel = (attr("rel") ?? "").toLowerCase();
    const href = attr("href");
    if (!href || !/\bicon\b|apple-touch-icon/.test(rel) || rel.includes("mask-icon")) continue;
    let url;
    try {
      url = new URL(href, baseUrl).toString();
    } catch {
      continue;
    }
    const sizes = attr("sizes") ?? "";
    const size = /svg/i.test(attr("type") ?? "") || /\.svg(\?|$)/i.test(url)
      ? 512
      : Math.max(0, ...[...sizes.matchAll(/(\d+)x\d+/gi)].map((m) => +m[1])) ||
        (rel.includes("apple-touch-icon") ? 180 : 32);
    out.push({ url, size, ico: /\.ico(\?|$)/i.test(url) });
  }
  return out.sort((a, b) => a.ico - b.ico || b.size - a.size);
}

/** The largest PNG stored inside an ICO file, or null. */
function pngFromIco(buf) {
  if (buf.readUInt16LE(0) !== 0 || buf.readUInt16LE(2) !== 1) return null;
  const count = buf.readUInt16LE(4);
  let best = null;
  for (let i = 0; i < count; i++) {
    const e = 6 + i * 16;
    const width = buf[e] || 256;
    const len = buf.readUInt32LE(e + 8);
    const off = buf.readUInt32LE(e + 12);
    const data = buf.subarray(off, off + len);
    const isPng = data.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
    if (isPng && (!best || width > best.width)) best = { width, data };
  }
  return best?.data ?? null;
}

/** Downloads one candidate and returns a SIZE×SIZE PNG, or null if it isn't a usable image. */
async function render(url, minWidth) {
  try {
    const res = await get(url);
    if (!res.ok) return null;
    let buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 50) return null;
    if (buf.readUInt16LE(0) === 0 && buf.readUInt16LE(2) === 1) buf = pngFromIco(buf);
    if (!buf) return null;
    const img = sharp(buf, { density: 300 });
    const meta = await img.metadata();
    if (!meta.width || meta.width < minWidth) return null;
    return await img
      .resize(SIZE, SIZE, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer();
  } catch {
    return null;
  }
}

async function iconFor(game) {
  const candidates = [];
  try {
    const res = await get(game.url);
    if (res.ok) candidates.push(...iconLinks(await res.text(), res.url));
  } catch {
    // page blocked or down: fall through to the fallbacks
  }
  const origin = new URL(game.url).origin;
  candidates.push({ url: `${origin}/favicon.ico`, size: 32, ico: true });
  const host = new URL(game.url).hostname;
  candidates.push({ url: `https://www.google.com/s2/favicons?domain=${host}&sz=128`, size: 32 });

  for (const c of candidates) {
    const png = await render(c.url, 32);
    if (png) return { png, from: c.url };
  }
  // last resort: accept a tiny icon rather than none
  for (const c of candidates) {
    const png = await render(c.url, 16);
    if (png) return { png, from: c.url };
  }
  return null;
}

fs.mkdirSync(OUT_DIR, { recursive: true });
const have = new Set(fs.existsSync(LIST) ? JSON.parse(fs.readFileSync(LIST, "utf8")) : []);
const ids = new Set(games.map((g) => g.id));

for (const game of games) {
  if (!refetchAll && have.has(game.id)) {
    console.log(`·  ${game.id} (already have it)`);
    continue;
  }
  const icon = await iconFor(game);
  if (icon) {
    fs.writeFileSync(path.join(OUT_DIR, `${game.id}.png`), icon.png);
    have.add(game.id);
    console.log(`✓  ${game.id}  ← ${icon.from}`);
  } else {
    have.delete(game.id);
    fs.rmSync(path.join(OUT_DIR, `${game.id}.png`), { force: true });
    console.log(`✗  ${game.id}  no favicon found, will show its letter`);
  }
}

// forget icons for games that were removed from the list
for (const id of [...have]) {
  if (!ids.has(id)) {
    have.delete(id);
    fs.rmSync(path.join(OUT_DIR, `${id}.png`), { force: true });
  }
}
fs.writeFileSync(LIST, JSON.stringify([...have].sort(), null, 2) + "\n");
console.log(`\n${have.size}/${games.length} games have icons → ${path.relative(ROOT, LIST)}`);
