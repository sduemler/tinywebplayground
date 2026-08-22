// Builds the dataset for the "Behind the Counter" map project.
//
// Walks Paolo fromTOKYO's "Japan Behind the Counter" playlist, pulls each
// episode's description, finds the Google Maps link for the shop featured in
// that episode, resolves the shortlink to real coordinates, and writes the
// result to src/data/behind-the-counter/places.json.
//
// Run with: node scripts/build-behind-the-counter.mjs
//
// Requires yt-dlp on PATH (brew install yt-dlp).
//
// Coordinates come from the `!3d<lat>!4d<lng>` pair inside the resolved URL's
// `data=` parameter -- NOT from the `@lat,lng,zoom` segment, which is the map
// viewport and can sit 50km off the actual place.
//
// Episodes the script can't resolve automatically are looked up in
// scripts/behind-the-counter-overrides.json; anything still unresolved is
// flagged `needsReview` and listed in the summary at the end.

import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const execFileAsync = promisify(execFile);
const __dirname = dirname(fileURLToPath(import.meta.url));

const PLAYLIST =
  "https://www.youtube.com/playlist?list=PLcpuu5BzmasDxcvK9jgblzzNzv3gUgcGU";
const OUT_PATH = resolve(
  __dirname,
  "..",
  "src",
  "data",
  "behind-the-counter",
  "places.json",
);
const OVERRIDES_PATH = resolve(
  __dirname,
  "behind-the-counter-overrides.json",
);

const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)";
const MAPS_LINK =
  /https?:\/\/(?:goo\.gl\/maps\/|maps\.app\.goo\.gl\/|g\.page\/)[^\s)]+/g;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function ytdlp(args) {
  const { stdout } = await execFileAsync("yt-dlp", ["--no-update", ...args], {
    maxBuffer: 64 * 1024 * 1024,
  });
  return stdout;
}

// The playlist in one call: ids, titles, thumbnails, durations.
async function fetchPlaylist() {
  const out = await ytdlp(["--flat-playlist", "--dump-json", PLAYLIST]);
  return out
    .trim()
    .split("\n")
    .map((line) => JSON.parse(line))
    .map((e) => ({
      videoId: e.id,
      title: e.title,
      durationSec: e.duration ?? null,
      thumbnail: `https://i.ytimg.com/vi/${e.id}/hqdefault.jpg`,
    }));
}

async function fetchDescription(videoId) {
  const out = await ytdlp([
    "--skip-download",
    "--print",
    "%(upload_date)s",
    "--print",
    "%(description)s",
    `https://www.youtube.com/watch?v=${videoId}`,
  ]);
  const [uploadDate, ...rest] = out.split("\n");
  return { uploadDate: uploadDate.trim(), description: rest.join("\n") };
}

// Newer descriptions advertise Paolo's own vending machine in Shibuya. That
// link is not the episode's shop and must never become a pin. The heading and
// the link sit on separate lines, so a link is judged by the lines above it.
// MAPS_LINK only matches Google Maps hosts, and the sole promo link on those
// hosts is the vending machine -- so this stays deliberately narrow. Matching
// on merch/Squarespace/etc. would false-positive on the sponsor line that
// opens most descriptions and wrongly discard the real shop link below it.
const PROMO = /vending\s*machine/i;

function extractShopLink(description) {
  const lines = description.split("\n");
  for (let i = 0; i < lines.length; i += 1) {
    const found = lines[i].match(MAPS_LINK);
    if (!found) continue;

    // Look back over the nearest few non-empty lines for a promo heading.
    let checked = 0;
    let promo = PROMO.test(lines[i]);
    for (let j = i - 1; j >= 0 && checked < 2 && !promo; j -= 1) {
      if (!lines[j].trim()) continue;
      checked += 1;
      if (PROMO.test(lines[j])) promo = true;
    }
    if (!promo) return found[0];
  }
  return null;
}

// Follow redirects by hand so we only ever read headers, never page bodies.
async function resolveShortlink(url, hops = 5) {
  let current = url;
  for (let i = 0; i < hops; i += 1) {
    const res = await fetch(current, {
      redirect: "manual",
      headers: { "User-Agent": UA },
    });
    const next = res.headers.get("location");
    if (!next) return current;
    current = new URL(next, current).toString();
    if (/[?&!]!?3d/.test(current) || current.includes("!3d")) return current;
  }
  return current;
}

function parseResolved(url) {
  // Google hands back three different shapes depending on the link's vintage:
  //   1. /maps/place/<name>/@...!3d<lat>!4d<lng>   -- the common modern form
  //   2. /maps/search/<lat>,+<lng>?...             -- older share links
  //   3. /maps?q=<address>&ftid=...                -- address only, no coords
  // Note `@lat,lng,zoom` is the viewport, not the place, and is never used.
  let lat = null;
  let lng = null;

  const data = url.match(/!3d(-?\d+\.?\d*)!4d(-?\d+\.?\d*)/);
  if (data) {
    lat = Number(data[1]);
    lng = Number(data[2]);
  }

  if (lat === null) {
    const search = url.match(
      /\/maps\/search\/(-?\d+\.\d+),\+?(-?\d+\.\d+)/,
    );
    if (search) {
      lat = Number(search[1]);
      lng = Number(search[2]);
    }
  }

  let query = null;
  if (lat === null) {
    const q = new URL(url).searchParams.get("q");
    if (q) {
      const asCoords = q.match(/^(-?\d+\.\d+),\s*(-?\d+\.\d+)$/);
      if (asCoords) {
        lat = Number(asCoords[1]);
        lng = Number(asCoords[2]);
      } else {
        query = q; // an address -- geocode it below
      }
    }
  }

  const place = url.match(/\/maps\/place\/([^/@?]+)/);
  let shopName = null;
  if (place && place[1]) {
    try {
      shopName = decodeURIComponent(place[1]).replace(/\+/g, " ").trim();
    } catch {
      shopName = place[1].replace(/\+/g, " ").trim();
    }
  }

  return { lat, lng, shopName: shopName || null, query };
}

// Google's older share links return a Japanese postal address instead of
// coordinates. Nominatim barely covers small Japanese businesses, but Japan's
// national mapping agency (GSI) geocodes these to the exact building, so it is
// tried first. Addresses arrive full-width and in 丁目/番/号 form
// ("東京都目黒区上目黒２丁目８−５"); GSI wants "東京都目黒区上目黒2-8-5".
function normalizeJpAddress(raw) {
  let s = raw.replace(/〒\s*\d{3}-?\d{4}/, "");
  s = s.normalize("NFKC");
  s = s.replace(/[−–—ー]/g, "-");
  s = s.replace(/丁目/g, "-").replace(/番地/g, "-").replace(/番/g, "-").replace(/号/g, "");
  const m = s.match(/(\S*?[都道府県].*?\d+(?:-\d+)*)/);
  return (m ? m[1] : s).trim();
}

async function geocodeJp(address) {
  const url =
    "https://msearch.gsi.go.jp/address-search/AddressSearch?q=" +
    encodeURIComponent(address);
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "tinywebplayground/1.0 (behind-the-counter map)" },
    });
    if (!res.ok) return null;
    const hits = await res.json();
    if (!Array.isArray(hits) || !hits.length) return null;
    const [lng, lat] = hits[0].geometry.coordinates;
    return { lat, lng };
  } catch {
    return null;
  }
}

// Forward-geocode a free-text address or shop name via Nominatim.
async function geocodeQuery(query) {
  const url =
    "https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=" +
    encodeURIComponent(query);
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "tinywebplayground/1.0 (behind-the-counter map)" },
    });
    if (!res.ok) return null;
    const [hit] = await res.json();
    if (!hit) return null;
    return { lat: Number(hit.lat), lng: Number(hit.lon) };
  } catch {
    return null;
  }
}

// Nominatim is free but asks for <=1 req/sec and a real User-Agent.
async function reverseGeocode(lat, lng) {
  const url =
    `https://nominatim.openstreetmap.org/reverse?format=jsonv2` +
    `&lat=${lat}&lon=${lng}&zoom=10&accept-language=en`;
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "tinywebplayground/1.0 (behind-the-counter map)" },
    });
    if (!res.ok) return null;
    const data = await res.json();
    const a = data.address ?? {};
    return a.city || a.town || a.county || a.province || a.state || null;
  } catch {
    return null;
  }
}

async function loadOverrides() {
  try {
    return JSON.parse(await readFile(OVERRIDES_PATH, "utf8"));
  } catch {
    return {};
  }
}

async function main() {
  console.log("Fetching playlist…");
  const episodes = await fetchPlaylist();
  console.log(`  ${episodes.length} episodes`);

  const overrides = await loadOverrides();
  const places = [];

  for (const [i, ep] of episodes.entries()) {
    process.stdout.write(`[${i + 1}/${episodes.length}] ${ep.videoId} … `);
    const { uploadDate, description } = await fetchDescription(ep.videoId);

    let lat = null;
    let lng = null;
    let shopName = null;

    const link = extractShopLink(description);
    if (link) {
      try {
        const resolved = await resolveShortlink(link);
        const parsed = parseResolved(resolved);
        ({ lat, lng, shopName } = parsed);
        // Address-only links carry no coordinates; geocode the address.
        if (lat === null && parsed.query) {
          let hit = null;
          if (/[\u3000-\u30ff\u4e00-\u9fff]/.test(parsed.query)) {
            hit = await geocodeJp(normalizeJpAddress(parsed.query));
            await sleep(400);
          }
          if (!hit) {
            hit = await geocodeQuery(parsed.query);
            await sleep(1100);
          }
          if (hit) ({ lat, lng } = hit);
        }
      } catch (err) {
        console.log(`resolve failed (${err.message})`);
      }
      await sleep(200);
    }

    const ov = overrides[ep.videoId];
    if (ov) {
      shopName = ov.shopName ?? shopName;
      if (ov.lat != null && ov.lng != null) {
        lat = ov.lat;
        lng = ov.lng;
      } else if (lat === null && ov.query) {
        const hit = await geocodeQuery(ov.query);
        if (hit) ({ lat, lng } = hit);
        await sleep(1100);
      }
    }

    places.push({
      ...ep,
      shopName,
      lat,
      lng,
      city: null,
      uploadDate: uploadDate
        ? `${uploadDate.slice(0, 4)}-${uploadDate.slice(4, 6)}-${uploadDate.slice(6, 8)}`
        : null,
      mapsUrl:
        lat != null && lng != null
          ? `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
          : null,
      needsReview: lat == null || lng == null,
    });

    console.log(lat != null ? `${shopName ?? "?"} (${lat}, ${lng})` : "NEEDS REVIEW");
  }

  console.log("\nReverse-geocoding cities…");
  for (const p of places) {
    if (p.lat == null) continue;
    p.city = overrides[p.videoId]?.city ?? (await reverseGeocode(p.lat, p.lng));
    await sleep(1100);
  }

  places.sort((a, b) => (a.uploadDate < b.uploadDate ? 1 : -1));
  await writeFile(OUT_PATH, `${JSON.stringify(places, null, 2)}\n`, "utf8");

  const review = places.filter((p) => p.needsReview);
  console.log(`\nWrote ${places.length} places → ${OUT_PATH}`);
  console.log(`Resolved: ${places.length - review.length} / ${places.length}`);
  if (review.length) {
    console.log(`\nNeeds manual coordinates (add to ${OVERRIDES_PATH}):`);
    for (const p of review) console.log(`  ${p.videoId}  ${p.title}`);
  }
}

main().catch((err) => {
  console.error("\nBuild failed:", err);
  process.exit(1);
});
