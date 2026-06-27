// Builds the data for the "From Akeelah to Z" project: screen performances where
// a single character says at least one word starting with every letter A–Z
// (an alphabetic pangram of dialogue), plus 25/26 near-misses.
//
// Pipeline:
//   1. Parse two sources of character-attributed movie dialogue:
//        - Cornell Movie-Dialogs Corpus (617 films)
//        - MovieSum (~2,200 screenplays, carries an imdb_id per film)
//   2. For each character, find the FIRST word they say starting with each letter.
//      Rule: case-insensitive; names + hyphenated words (Xavier, x-ray) count, but
//      a bare single letter ("X", a radio call-sign "X22", "INXS" written "IN X S")
//      does NOT count for a rare letter — the word must be a real multi-letter word.
//   3. Keep characters covering 26/26 (perfect) or 25/26 (near-miss); merge + dedupe.
//   4. Enrich with the real actor via TMDB (by imdb_id when available, else search).
//   5. Write src/data/akeelah/pangram-actors.json.
//
// Run with:  node --env-file=.env scripts/build-akeelah.mjs
// Flags:     --count-only      print counts and exit (no TMDB)
//            --source cornell|moviesum|both   (default both)
//            --limit N         only enrich the first N entries (faster dev runs)
//            --no-train        skip the big MovieSum train split (val+test only)
//
// Sources:
//   Cornell © Danescu-Niculescu-Mizil & Lee (2011):
//     https://www.cs.cornell.edu/~cristian/Cornell_Movie-Dialogs_Corpus.html
//   MovieSum (Saxena & Keller, 2024):
//     https://huggingface.co/datasets/rohitsaxena/MovieSum
// We commit only the derived aggregate list, never the raw scripts.

import { execSync } from "node:child_process";
import { createReadStream, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createInterface } from "node:readline";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const CACHE = resolve(__dirname, ".cache", "akeelah");
const CORPUS = resolve(CACHE, "cornell movie-dialogs corpus");
const MOVIESUM = resolve(CACHE, "moviesum");
const TMDB_CACHE = resolve(CACHE, "tmdb");
const OUT_PATH = resolve(__dirname, "..", "src", "data", "akeelah", "pangram-actors.json");
const ZIP_URL = "https://www.cs.cornell.edu/~cristian/data/cornell_movie_dialogs_corpus.zip";
const MS_BASE = "https://huggingface.co/datasets/rohitsaxena/MovieSum/resolve/main";
const SEP = " +++$+++ ";
const ALPHABET = [..."abcdefghijklmnopqrstuvwxyz"];
const ONE_LETTER_WORDS = new Set(["a", "i", "o"]); // the only legit single-letter words

const arg = (flag) => {
  const i = process.argv.indexOf(flag);
  return i !== -1 ? process.argv[i + 1] : undefined;
};
const COUNT_ONLY = process.argv.includes("--count-only");
const NO_TRAIN = process.argv.includes("--no-train");
const SOURCE = arg("--source") || "both";
const LIMIT = arg("--limit") ? Number(arg("--limit")) : Infinity;

// ---------------------------------------------------------------------------
// Shared: tokenize text into a character's letter coverage
// ---------------------------------------------------------------------------
function makeAcc() {
  return { letters: new Set(), example: {}, wordCount: 0 };
}

// Strip leading/trailing non-letters but keep internal apostrophes/hyphens
// (so "X-ray" and "don't" survive, but "XF-" → "XF" and "X's'" → "X's").
const cleanCore = (raw) => raw.replace(/^[^a-zA-Z]+/, "").replace(/[^a-zA-Z]+$/, "");

// Single-letter words that can legitimately precede another word. Anything else
// that's a lone letter before a word means the word was split by a stray space
// (the scraped scripts do this a lot, e.g. "our very e xistence" → "existence").
const ALLOWED_PREV = new Set(["a", "i"]);

// Reject tokens that aren't real words, so a letter isn't "earned" by junk:
//   - a repeated single char ("xxx", "zzzz" — censoring/emphasis)
//   - a single-letter code ("X-Z" — really "Malcolm X" garbled)
//   - an uppercase Roman numeral ("XVI", "XX", "XL" — read as a number)
//   - a consonant blob ("xkb", "xqt+kfj'k" — corrupted/garbled), keeping acronyms ("XYZ")
//   - specific scraped-script garbage ("xou" = "you", "xeen" = phonetic gibberish)
const ROMAN = /^M{0,4}(CM|CD|D?C{0,3})(XC|XL|L?X{0,3})(IX|IV|V?I{0,3})$/;
const BAD_TOKENS = new Set(["xou", "xeen"]);
function isJunk(core) {
  if (BAD_TOKENS.has(core.toLowerCase())) return true;
  if (/[^\p{L}'\-]/u.test(core)) return true; // internal symbol → mojibake ("x;k", "xqt+kfj")
  if (/^(.)\1{2,}$/i.test(core)) return true;
  if (/^[a-z]-[a-z]$/i.test(core)) return true;
  if (core === core.toUpperCase() && /^[IVXLCDM]{2,}$/.test(core) && ROMAN.test(core)) return true;
  const lettersOnly = core.replace(/[^a-zA-Z]/g, "");
  const hasVowel = /[aeiouy]/i.test(core);
  if (!hasVowel && lettersOnly.length >= 4) return true;
  if (!hasVowel && lettersOnly.length === 3 && core !== core.toUpperCase()) return true;
  if (lettersOnly.length > 18) return true;
  return false;
}

// A few words of surrounding dialogue, so the readout reads like
// "… and the [Xmen] were …". Stored as [before, word, after].
const CONTEXT_WORDS = 3;
const CONTEXT_CHARS = 30;
function makeSnippet(words, i, core) {
  const clean = (s) => s.replace(/\s+/g, " ").trim();
  // keep the last CONTEXT_CHARS of `before` / first of `after`, on a word boundary
  const capEnd = (s) => (s.length <= CONTEXT_CHARS ? s : s.slice(-CONTEXT_CHARS).replace(/^\S*\s/, ""));
  const capStart = (s) => (s.length <= CONTEXT_CHARS ? s : s.slice(0, CONTEXT_CHARS).replace(/\s\S*$/, ""));
  const before = capEnd(clean(words.slice(Math.max(0, i - CONTEXT_WORDS), i).join(" ")));
  const after = capStart(clean(words.slice(i + 1, i + 1 + CONTEXT_WORDS).join(" ")));
  return [before, core, after];
}

function addText(acc, text) {
  const words = text.split(/\s+/);
  for (let i = 0; i < words.length; i++) {
    const core = cleanCore(words[i]);
    if (!core) continue;
    if (/[0-9]/.test(core)) continue; // codes like "X22", "MP3"
    const first = core[0].toLowerCase();
    if (first < "a" || first > "z") continue;
    const lettersOnly = core.replace(/[^a-zA-Z]/g, "");
    // a bare single letter only counts if it's a real one-letter word (a/i/o)
    if (lettersOnly.length < 2 && !ONE_LETTER_WORDS.has(first)) continue;
    if (isJunk(core)) continue;
    // a word split by a stray space ("e xistence" → "existence"): if the prior
    // token is a lone non-word letter, this is a fragment — don't count it.
    if (i > 0) {
      const prev = cleanCore(words[i - 1]);
      if (prev.length === 1 && !ALLOWED_PREV.has(prev.toLowerCase())) continue;
    }
    acc.wordCount++;
    if (!acc.letters.has(first)) {
      acc.letters.add(first);
      acc.example[first] = makeSnippet(words, i, core);
    }
  }
}

function finalizeAcc(acc, base) {
  const n = acc.letters.size;
  if (n < 25) return null;
  return {
    ...base,
    coverage: n,
    missingLetters: ALPHABET.filter((l) => !acc.letters.has(l)),
    wordCount: acc.wordCount,
    examples: acc.example,
  };
}

// ---------------------------------------------------------------------------
// Source 1: Cornell Movie-Dialogs Corpus
// ---------------------------------------------------------------------------
function ensureCornell() {
  if (existsSync(resolve(CORPUS, "movie_lines.txt"))) return;
  mkdirSync(CACHE, { recursive: true });
  const zip = resolve(CACHE, "cornell.zip");
  console.log("Downloading Cornell Movie-Dialogs Corpus…");
  execSync(`curl -sL -o "${zip}" "${ZIP_URL}"`, { stdio: "inherit" });
  execSync(`unzip -o -q "${zip}" -d "${CACHE}"`, { stdio: "inherit" });
}

function parseCornell() {
  ensureCornell();
  const read = (f) => readFileSync(resolve(CORPUS, f), "latin1").split("\n").filter(Boolean);
  const titles = new Map();
  for (const line of read("movie_titles_metadata.txt")) {
    const [mid, title, year] = line.split(SEP);
    titles.set(mid, { title, year });
  }
  const chars = new Map();
  for (const line of read("movie_characters_metadata.txt")) {
    const [cid, name, mid] = line.split(SEP);
    chars.set(cid, { name, movieID: mid, acc: makeAcc() });
  }
  for (const line of read("movie_lines.txt")) {
    const parts = line.split(SEP);
    const c = chars.get(parts[1]);
    if (c) addText(c.acc, parts[4] || "");
  }
  const entries = [];
  for (const c of chars.values()) {
    const t = titles.get(c.movieID);
    const e = finalizeAcc(c.acc, {
      source: "cornell",
      character: c.name,
      movieTitle: t?.title || "",
      year: t?.year && /^\d{4}$/.test(t.year) ? Number(t.year) : null,
      imdbId: null,
    });
    if (e) entries.push(e);
  }
  return entries;
}

// ---------------------------------------------------------------------------
// Source 2: MovieSum
// ---------------------------------------------------------------------------
function ensureMovieSum() {
  mkdirSync(MOVIESUM, { recursive: true });
  const splits = NO_TRAIN ? ["val", "test"] : ["train", "val", "test"];
  for (const s of splits) {
    const dest = resolve(MOVIESUM, `${s}.jsonl`);
    if (existsSync(dest)) continue;
    console.log(`Downloading MovieSum ${s}.jsonl…`);
    execSync(`curl -sL -o "${dest}" "${MS_BASE}/${s}.jsonl"`, { stdio: "inherit" });
  }
  return splits.map((s) => resolve(MOVIESUM, `${s}.jsonl`));
}

const decodeEntities = (s) =>
  s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(+d));

function cleanSpeaker(raw) {
  let n = decodeEntities(raw)
    .replace(/<[^>]*>/g, " ")
    .replace(/\([^)]*\)/g, " ") // (V.O.), (CONT'D), (O.S.) etc.
    .replace(/[^A-Za-z '.\-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
  return n;
}

const SPEAKER_NOISE = /(VOICE OVER|CONT|CONTINUED|INT\.|EXT\.|FADE|CUT TO)/;

function parseMovieSumScript(script) {
  // dialogue between one <character> tag and the next belongs to that character
  const chars = new Map(); // name -> acc
  const blockRe = /<character>([\s\S]*?)<\/character>([\s\S]*?)(?=<character>|$)/g;
  let m;
  while ((m = blockRe.exec(script)) !== null) {
    const name = cleanSpeaker(m[1]);
    if (!name || name.length < 1 || name.length > 40 || SPEAKER_NOISE.test(name)) continue;
    let acc = chars.get(name);
    if (!acc) chars.set(name, (acc = makeAcc()));
    for (const d of m[2].matchAll(/<dialogue>([\s\S]*?)<\/dialogue>/g)) {
      addText(acc, decodeEntities(d[1].replace(/<[^>]*>/g, " ")));
    }
  }
  return chars;
}

async function parseMovieSum() {
  const files = ensureMovieSum();
  const entries = [];
  for (const file of files) {
    const rl = createInterface({ input: createReadStream(file), crlfDelay: Infinity });
    for await (const line of rl) {
      if (!line.trim()) continue;
      let rec;
      try {
        rec = JSON.parse(line);
      } catch {
        continue;
      }
      const us = (rec.movie_name || "").lastIndexOf("_");
      const title = us > 0 ? rec.movie_name.slice(0, us) : rec.movie_name;
      const yr = us > 0 ? Number(rec.movie_name.slice(us + 1)) : null;
      const chars = parseMovieSumScript(rec.script || "");
      for (const [name, acc] of chars) {
        const e = finalizeAcc(acc, {
          source: "moviesum",
          character: name,
          movieTitle: title,
          year: Number.isFinite(yr) ? yr : null,
          imdbId: rec.imdb_id || null,
        });
        if (e) entries.push(e);
      }
    }
  }
  return entries;
}

// ---------------------------------------------------------------------------
// Merge + dedupe across sources
// ---------------------------------------------------------------------------
const normTitle = (t) => (t || "").toLowerCase().replace(/[^a-z0-9]+/g, "");
const movieKey = (e) => e.imdbId || `${normTitle(e.movieTitle)}|${e.year || ""}`;
const nameSig = (n) => (n || "").toUpperCase().replace(/[^A-Z ]/g, "").trim().split(/\s+/).filter(Boolean);

function mergeEntries(all) {
  all = all.filter((e) => !EXCLUDE.has(`${normTitle(e.movieTitle)}|${e.character.toUpperCase()}`));
  // share imdb_id across sources for the same movie (MovieSum has it, Cornell doesn't)
  const imdbByTitle = new Map();
  for (const e of all) {
    if (e.imdbId) imdbByTitle.set(`${normTitle(e.movieTitle)}|${e.year || ""}`, e.imdbId);
  }
  for (const e of all) {
    if (!e.imdbId) e.imdbId = imdbByTitle.get(`${normTitle(e.movieTitle)}|${e.year || ""}`) || null;
  }
  // dedupe by movie + character (match on shared name token); keep best coverage
  const byMovie = new Map();
  for (const e of all) {
    const k = movieKey(e);
    if (!byMovie.has(k)) byMovie.set(k, []);
    byMovie.get(k).push(e);
  }
  const kept = [];
  for (const list of byMovie.values()) {
    const merged = [];
    for (const e of list) {
      const sig = new Set(nameSig(e.character));
      const dup = merged.find((m) => nameSig(m.character).some((t) => t.length >= 3 && sig.has(t)));
      if (!dup) {
        merged.push(e);
      } else if (
        e.coverage > dup.coverage ||
        (e.coverage === dup.coverage && e.wordCount > dup.wordCount)
      ) {
        merged[merged.indexOf(dup)] = e;
      }
    }
    kept.push(...merged);
  }
  kept.sort((a, b) => b.coverage - a.coverage || b.wordCount - a.wordCount);
  return kept;
}

// ---------------------------------------------------------------------------
// TMDB enrichment (cached)
// ---------------------------------------------------------------------------
const TMDB = "https://api.themoviedb.org/3";
const KEY = process.env.TMDB_API_KEY;

// Hand-fixes for showcase (perfect) entries whose character name can't be matched
// to a TMDB cast credit automatically (initials / short names). Keyed by
// `${normTitle}|${UPPERCASE character}`.
const OVERRIDES = new Map([
  ["copycat|M.J.", "Holly Hunter"], // M.J. Monahan
  ["bigtimeadolescence|MO", "Griffin Gluck"], // Mo Harris
]);

// Drop known-bad entries (corpus mislabels with junk evidence). Keyed the same way.
const EXCLUDE = new Set([
  "innerspace|JOE", // no "Joe" in Innerspace; only x-evidence was the non-word "xuki"
  "killersoftheflowermoon|MOLLIE", // x-tokens are Osage phonetic spellings, not English words
  "haider|KHURRAM", // script is encoding-corrupted (mojibake); every token is garbled
]);

const norm = (s) =>
  (s || "")
    .toUpperCase()
    .replace(/\([^)]*\)/g, " ")
    .split(/[^A-Z]+/)
    .filter((w) => w.length >= 3);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function tmdb(path) {
  const cacheFile = resolve(TMDB_CACHE, encodeURIComponent(path) + ".json");
  if (existsSync(cacheFile)) return JSON.parse(readFileSync(cacheFile, "utf8"));
  let res;
  for (let attempt = 0; attempt < 4; attempt++) {
    res = await fetch(`${TMDB}${path}${path.includes("?") ? "&" : "?"}api_key=${KEY}`);
    if (res.status === 429) {
      await sleep(1000 * (attempt + 1));
      continue;
    }
    break;
  }
  if (!res.ok) throw new Error(`TMDB ${res.status}`);
  const json = await res.json();
  writeFileSync(cacheFile, JSON.stringify(json));
  return json;
}

function pickCast(credits, character) {
  const wanted = norm(character);
  let best = null;
  for (const cast of credits.cast || []) {
    const tokens = norm(cast.character);
    const hit = wanted.some((w) => tokens.includes(w));
    if (hit && (best === null || cast.order < best.order)) best = cast;
  }
  return best;
}

async function findMovie(entry) {
  if (entry.imdbId) {
    const found = await tmdb(`/find/${entry.imdbId}?external_source=imdb_id`);
    const m = found.movie_results?.[0];
    if (m) return m;
  }
  const q = encodeURIComponent(entry.movieTitle);
  const yr = entry.year ? `&primary_release_year=${entry.year}` : "";
  let search = await tmdb(`/search/movie?query=${q}${yr}`);
  if (!search.results?.length && yr) {
    search = await tmdb(`/search/movie?query=${q}`); // fallback without year
  }
  return search.results?.[0] || null;
}

async function enrich(entry) {
  const movie = await findMovie(entry);
  if (!movie) return;
  const credits = await tmdb(`/movie/${movie.id}/credits`);
  const cast = pickCast(credits, entry.character);
  entry.tmdbId = movie.id;
  entry.posterPath = movie.poster_path || null;
  if (movie.title) entry.movieTitle = movie.title;
  if (movie.release_date) entry.year = Number(movie.release_date.slice(0, 4)) || entry.year;
  if (cast) {
    entry.actor = cast.name;
    entry.actorProfilePath = cast.profile_path || null;
    entry.characterDisplay = cast.character || null;
  } else {
    const ov = OVERRIDES.get(`${normTitle(entry.movieTitle)}|${entry.character.toUpperCase()}`);
    if (ov) entry.actor = ov;
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  let all = [];
  let totalMovies = 0;
  if (SOURCE === "cornell" || SOURCE === "both") {
    const c = parseCornell();
    console.log(`Cornell: ${c.length} qualifying characters`);
    all.push(...c);
    totalMovies += 617;
  }
  if (SOURCE === "moviesum" || SOURCE === "both") {
    const ms = await parseMovieSum();
    console.log(`MovieSum: ${ms.length} qualifying characters`);
    all.push(...ms);
    totalMovies += NO_TRAIN ? 400 : 2200;
  }

  const entries = mergeEntries(all);
  const perfect = entries.filter((e) => e.coverage === 26);
  const near = entries.filter((e) => e.coverage === 25);
  const missX = near.filter((e) => e.missingLetters.includes("x")).length;
  console.log(`\nMerged → 26/26: ${perfect.length}   25/26: ${near.length}`);
  console.log(`(of the near-misses, ${missX} are missing only an X-word)\n`);
  if (COUNT_ONLY) return;

  if (!KEY) {
    console.error("TMDB_API_KEY not set — run with: node --env-file=.env scripts/build-akeelah.mjs");
    process.exit(1);
  }
  mkdirSync(TMDB_CACHE, { recursive: true });

  // Enrich every perfect, plus the most talkative near-misses (lead roles → the
  // most recognizable actors). Near-misses are already wordCount-sorted.
  const NEAR_ENRICH = 700;
  const perfectAll = entries.filter((e) => e.coverage === 26);
  const nearAll = entries.filter((e) => e.coverage === 25);
  let toEnrich = [...perfectAll, ...nearAll.slice(0, NEAR_ENRICH)];
  if (LIMIT !== Infinity) toEnrich = toEnrich.slice(0, LIMIT);
  let done = 0;
  for (const e of toEnrich) {
    try {
      await enrich(e);
    } catch (err) {
      console.warn(`  ! ${e.character} (${e.movieTitle}): ${err.message}`);
    }
    if (++done % 50 === 0) console.log(`  …enriched ${done}/${toEnrich.length}`);
  }

  // final dedupe by (movie, actor) — same person matched under two name forms
  const seen = new Map();
  const finalEntries = [];
  for (const e of toEnrich) {
    if (!e.actor) {
      finalEntries.push(e);
      continue;
    }
    const k = `${e.tmdbId || movieKey(e)}|${e.actor}`;
    const prev = seen.get(k);
    if (!prev) {
      seen.set(k, e);
      finalEntries.push(e);
    } else if (e.coverage > prev.coverage) {
      finalEntries[finalEntries.indexOf(prev)] = e;
      seen.set(k, e);
    }
  }

  // Ship: all perfects, plus a curated set of actor-matched near-misses.
  const NEAR_CAP = 400;
  const fPerfect = finalEntries.filter((e) => e.coverage === 26);
  const fNear = finalEntries
    .filter((e) => e.coverage === 25 && e.actor)
    .sort((a, b) => b.wordCount - a.wordCount)
    .slice(0, NEAR_CAP);

  const slim = (e) => ({
    character: e.character,
    characterDisplay: e.characterDisplay || null,
    movieTitle: e.movieTitle,
    year: e.year,
    coverage: e.coverage,
    missingLetters: e.missingLetters,
    examples: e.examples,
    actor: e.actor || null,
    posterPath: e.posterPath || null,
  });
  const shipped = [...fPerfect, ...fNear].map(slim);

  console.log(`\nShipping ${shipped.length} entries (${fPerfect.length} perfect, ${fNear.length} near).`);
  console.log(`Perfects with actor: ${fPerfect.filter((e) => e.actor).length}/${fPerfect.length}.`);

  const out = {
    source:
      "Cornell Movie-Dialogs Corpus (2011) + MovieSum (Saxena & Keller, 2024); actors via TMDB",
    builtAt: new Date().toISOString().slice(0, 10),
    rule:
      "A word counts toward its first letter case-insensitively; names and hyphenated words (Xavier, x-ray) count, but a bare single letter or a digit-code does not count for the rare letters. Based on screenplay dialogue, not a forensic transcript.",
    totalMovies,
    // perfect/near = totals discovered; shown = how many are in this file
    counts: {
      perfect: perfectAll.length,
      near: nearAll.length,
      perfectShown: fPerfect.length,
      nearShown: fNear.length,
    },
    entries: shipped,
  };
  mkdirSync(dirname(OUT_PATH), { recursive: true });
  writeFileSync(OUT_PATH, JSON.stringify(out, null, 2));
  console.log(`Wrote ${shipped.length} entries → ${OUT_PATH}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
