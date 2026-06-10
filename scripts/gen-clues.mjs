#!/usr/bin/env node
// Generates crossword clues for puzzle-002 via the Gemini API.
//
// Reads scripts/clue-gen-config.json for category targets and prompt context,
// chunks requests per category, normalizes/dedupes results, and writes a
// resumable staging file plus a final clues.json.
//
// Usage:
//   GEMINI_API_KEY=... node scripts/gen-clues.mjs
//   GEMINI_API_KEY=... node scripts/gen-clues.mjs --category "US Birds"
//   GEMINI_API_KEY=... node scripts/gen-clues.mjs --finalize
//
// Flags:
//   --category <name>  Generate only the named category (case-insensitive substring match).
//   --regenerate       Wipe matched categories from staging before generating (requires --category).
//   --finalize         Skip generation; just promote staging.json → clues.json.
//   --shuffle          When finalizing, shuffle each category before slicing to target (random pick instead of "first N").
//   --model <id>       Override Gemini model (default: gemini-2.5-flash).
//   --dry-run          Print one example prompt + exit (no API calls, no file writes).

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..");

const args = process.argv.slice(2);
const flag = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] ?? true : null;
};

const ONLY_CATEGORY = flag("--category");
const REGENERATE = args.includes("--regenerate");
const FINALIZE_ONLY = args.includes("--finalize");
const SHUFFLE = args.includes("--shuffle");
const DRY_RUN = args.includes("--dry-run");
const MODEL = flag("--model") || "gemini-2.5-flash";

if (REGENERATE && !ONLY_CATEGORY) {
  console.error("--regenerate requires --category <name>. Refusing to wipe all of staging.");
  process.exit(1);
}

const config = JSON.parse(readFileSync(join(REPO_ROOT, "scripts/clue-gen-config.json"), "utf8"));

const stagingPath = join(REPO_ROOT, config.stagingPath);
const outputPath = join(REPO_ROOT, config.outputPath);
const v1Path = join(REPO_ROOT, config.v1ExclusionPath);

// ---- Load existing state ----

const v1Exclusions = new Set();
if (existsSync(v1Path)) {
  for (const c of JSON.parse(readFileSync(v1Path, "utf8"))) {
    v1Exclusions.add(normalizeWord(c.word));
  }
} else {
  // First run: archive current clues.json (the v1 set) as the exclusion list.
  if (existsSync(outputPath)) {
    const current = readFileSync(outputPath, "utf8");
    writeFileSync(v1Path, current);
    for (const c of JSON.parse(current)) v1Exclusions.add(normalizeWord(c.word));
    console.log(`Archived ${v1Exclusions.size} v1 clues → ${config.v1ExclusionPath}`);
  }
}

// Also exclude hand-curated media-clue answers, so the generator never emits a
// word already claimed by media-clues.json (build-layout places generated
// entries first and would otherwise silently drop the hand-authored clue).
if (config.mediaCluesPath) {
  const mediaPath = join(REPO_ROOT, config.mediaCluesPath);
  if (existsSync(mediaPath)) {
    let mediaCount = 0;
    for (const c of JSON.parse(readFileSync(mediaPath, "utf8"))) {
      v1Exclusions.add(normalizeWord(c.word));
      mediaCount++;
    }
    console.log(`Excluding ${mediaCount} hand-curated media-clue answers from generation`);
  }
}

let staging = { clues: [], categoryTotals: {} };
if (existsSync(stagingPath)) {
  staging = JSON.parse(readFileSync(stagingPath, "utf8"));
  console.log(`Resuming from staging: ${staging.clues.length} clues so far`);
}

// ---- Regenerate: wipe matched categories from staging before generating ----

if (REGENERATE) {
  const needle = String(ONLY_CATEGORY).toLowerCase();
  const matched = config.categories.filter((c) => c.generate && c.name.toLowerCase().includes(needle));
  if (matched.length === 0) {
    console.error(`--regenerate: no generate-eligible category matched "${ONLY_CATEGORY}"`);
    process.exit(1);
  }
  const wipeSet = new Set(matched.map((c) => c.name));
  const before = staging.clues.length;
  staging.clues = staging.clues.filter((c) => !wipeSet.has(c.category));
  const removed = before - staging.clues.length;
  console.log(`Regenerate: removed ${removed} existing clue${removed === 1 ? "" : "s"} from ${[...wipeSet].join(", ")}`);
  writeFileSync(stagingPath, JSON.stringify(staging, null, 2));
}

const stagingWords = new Set(staging.clues.map((c) => normalizeWord(c.word)));

// ---- Finalize-only path ----

if (FINALIZE_ONLY) {
  finalize();
  process.exit(0);
}

// ---- Main loop ----

if (!process.env.GEMINI_API_KEY && !DRY_RUN) {
  console.error("Missing GEMINI_API_KEY env var. Set it to an AI Studio API key.");
  process.exit(1);
}

const categoriesToProcess = config.categories.filter((c) => {
  if (!c.generate) return false;
  if (ONLY_CATEGORY && !c.name.toLowerCase().includes(String(ONLY_CATEGORY).toLowerCase())) return false;
  return true;
});

const MAX_REQUESTS = config.maxRequests ?? Infinity;
let requestCount = 0;

for (const category of categoriesToProcess) {
  const target = Math.ceil(category.target * (1 + config.bufferPercent / 100));
  const existing = staging.clues.filter((c) => c.category === category.name).length;
  const needed = target - existing;

  if (needed <= 0) {
    console.log(`✓ ${category.name}: ${existing}/${target} (complete)`);
    continue;
  }

  console.log(`→ ${category.name}: ${existing}/${target} (need ${needed})`);

  let remaining = needed;
  let consecutiveEmpty = 0;
  let consecutive429 = 0;

  while (remaining > 0 && consecutiveEmpty < 3) {
    if (requestCount >= MAX_REQUESTS) {
      console.error(`  ! Hit maxRequests cap (${MAX_REQUESTS}). Stopping before sending another API call.`);
      console.error(`  ! Bump 'maxRequests' in scripts/clue-gen-config.json if you want to continue.`);
      process.exit(3);
    }

    const chunkAsk = Math.min(config.chunkSize, remaining + 5); // small overage to absorb dedup loss
    const prompt = buildPrompt(category, chunkAsk);

    if (DRY_RUN) {
      console.log("\n===== DRY RUN PROMPT =====\n" + prompt + "\n=========================");
      process.exit(0);
    }

    let batch;
    try {
      requestCount += 1;
      batch = await callGemini(prompt);
      consecutive429 = 0;
    } catch (err) {
      if (err.status === 429) {
        consecutive429 += 1;
        if (consecutive429 >= 5) {
          console.error(`  ! 5 consecutive 429s — likely hit the daily quota. Stopping. Resume tomorrow or use a different model/key.`);
          process.exit(2);
        }
        const wait = err.retryAfterMs ?? 30_000;
        console.error(`  ! Rate-limited (429). Waiting ${Math.round(wait / 1000)}s before retry [${consecutive429}/5].`);
        await sleep(wait);
      } else {
        console.error(`  ! Gemini error: ${err.message}. Retrying in 5s.`);
        await sleep(5000);
      }
      continue;
    }

    const accepted = [];
    for (const raw of batch) {
      const cleaned = normalizeClue(raw, category.name);
      if (!cleaned) continue;
      if (v1Exclusions.has(cleaned.word)) continue;
      if (stagingWords.has(cleaned.word)) continue;
      stagingWords.add(cleaned.word);
      accepted.push(cleaned);
    }

    if (accepted.length === 0) {
      consecutiveEmpty += 1;
      console.log(`  · batch yielded 0 new clues (${consecutiveEmpty}/3 empty in a row)`);
    } else {
      consecutiveEmpty = 0;
      staging.clues.push(...accepted);
      remaining -= accepted.length;
      console.log(`  + ${accepted.length} accepted (${needed - remaining}/${needed}) [${requestCount}/${MAX_REQUESTS} reqs]`);
      writeFileSync(stagingPath, JSON.stringify(staging, null, 2));
    }

    await sleep(config.requestSleepMs ?? 7000); // gemini-2.5-flash free tier is ~10 RPM; 7s keeps us safely under
  }

  if (remaining > 0) {
    console.log(`  ! ${category.name}: stopped short by ${remaining} after empty streak — rerun later or relax constraints`);
  }
}

console.log(`\nStaging total: ${staging.clues.length} clues`);
console.log(`API requests this run: ${requestCount}/${MAX_REQUESTS}`);
console.log(`Run again with --finalize to promote staging → ${config.outputPath}`);

// ---- Prompt builder ----

function buildPrompt(category, n) {
  const jeopardyPct = Math.round(config.jeopardyStyleRatio * 100);
  const { min, max } = config.wordLength;

  return `You are generating crossword clues for a collaborative web crossword puzzle. Quality matters more than speed — every clue you produce will be human-reviewed before being placed.

PUZZLE CONTEXT
- Target audience: internet-native adults, late 20s to 40s, collaborative play (multiple solvers share one grid).
- Tone: warm, curious, playful. Not academic, not condescending.
- The puzzle has 23 categories with weighted targets. Pop culture is ~51% of the puzzle; knowledge categories anchor the rest.

V1 FEEDBACK (DO NOT REPEAT THESE MISTAKES)
- ${config.v1Feedback.tooMuchDictionary}
- ${config.v1Feedback.tooSimilar}
- ${config.v1Feedback.skewedHard}
- ${config.v1Feedback.moreUSBirds}
- ${config.v1Feedback.moreAnime}
- ${config.v1Feedback.morePopCulture}

WORD CONSTRAINTS
- ${min}–${max} letters, A–Z only. No spaces, hyphens, apostrophes, accents, or digits in the WORD field.
- The WORD is the answer the solver types. It will be displayed in uppercase.
- Multi-word answers ARE allowed but must be written without spaces (e.g., "BIGBANG", "STARWARS"). Use sparingly.
- CRITICAL: compound/multi-word answers MUST be widely recognized real terms. Do NOT invent portmanteaus or stitch words together. If "TENNISACE" or "FIVESTRIKE" or "CRICKETTEST" isn't how people actually refer to the thing, use the single-word form (ACE, STRIKE, TEST) or pick a different clue subject entirely.
- Every WORD must be a real term, proper noun, or established phrase. Before outputting, verify each one passes the "would a fan of this category recognize this exact word?" check.
- The CLUE may contain any natural-language text including punctuation.

CATEGORY: ${category.name}
SCOPE: ${category.note}

CATEGORY BOUNDARY RULES (avoid producing clues that belong to other categories)
- Sports = events/teams/leagues/moments. Celebrities/athletes = the people.
- History = real documented events/people. Mythology/folklore/religion = stories, deities, scripture, fairy tales, holidays-as-tradition.
- Tech = computing, internet, gadgets, post-1950 tech, gaming hardware. Science = physics/biology/chemistry/geology/astronomy/space and classical inventions.
- Anime/manga overrides Books, TV, and Movies for any anime-native IP.
- Cross-medium franchises (LOTR, Harry Potter, GoT, Marvel, Star Wars): route to the medium the CLUE references, not the original medium. Comics clues require a comics-specific reference.
- Videogames = the games themselves. Consoles/controllers/gaming companies-as-businesses = Tech.
- Music = songs, albums, lyrics, bands, instruments, genres. Artist personal-life trivia = Celebrities/athletes.
- Food = the dish; Geography = the region.
- Dictionary clues are about the WORD itself (definition/etymology/synonym), not what it refers to.
- If a clue could plausibly belong to a more specific category (Birds vs Animals, Anime vs TV), use the more specific one.

STYLE MIX
Produce a mix of two styles, roughly ${jeopardyPct}% Jeopardy / ${100 - jeopardyPct}% crossword across this batch.
- crossword: ${config.styles.crossword}
- jeopardy: ${config.styles.jeopardy}
Each clue must be tagged with its style.

DIFFICULTY MIX
- ~50% easy (most adults will get it), ~33% medium (needs the category interest), ~17% hard (specialty knowledge). NEVER produce clues so obscure that a category fan would have to look them up.
- Vary clue length, structure, and angle within the batch. Two clues for the same word should never feel interchangeable.

OUTPUT FORMAT
Return ONLY a JSON array. No prose, no markdown fences, no preamble. Each element:
{ "word": "UPPERCASE", "clue": "Clue text.", "category": "${category.name}", "style": "crossword" | "jeopardy" }

The category field is your self-tag — set it to "${category.name}" for every clue in this batch. If you find yourself writing a clue that doesn't really fit that category, REWRITE it to fit, do not change the category tag.

Produce exactly ${n} clues for the category above. Do not repeat words within the batch.`;
}

// ---- Gemini call ----

async function callGemini(prompt) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${process.env.GEMINI_API_KEY}`;
  const body = {
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.9,
      topP: 0.95,
      responseMimeType: "application/json",
      // Disable Gemini 2.5 Flash's "thinking" tokens — they're billed at a higher
      // rate and don't help for creative clue generation. Setting budget to 0
      // forces the model to respond directly.
      thinkingConfig: { thinkingBudget: 0 },
    },
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    const err = new Error(`HTTP ${res.status}: ${text.slice(0, 300)}`);
    err.status = res.status;
    if (res.status === 429) {
      // Gemini puts a retryDelay (e.g. "27s") in the error details. Parse if present.
      const match = text.match(/"retryDelay"\s*:\s*"(\d+)s"/);
      if (match) err.retryAfterMs = parseInt(match[1], 10) * 1000;
    }
    throw err;
  }

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Empty Gemini response");

  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    // Fallback: extract first JSON array from the text
    const match = text.match(/\[[\s\S]*\]/);
    if (!match) throw new Error("Response was not valid JSON");
    parsed = JSON.parse(match[0]);
  }

  if (!Array.isArray(parsed)) throw new Error("Response was not an array");
  return parsed;
}

// ---- Normalization & dedup ----

function normalizeWord(word) {
  return String(word || "").toUpperCase().replace(/[^A-Z]/g, "");
}

function normalizeClue(raw, categoryName) {
  if (!raw || typeof raw !== "object") return null;
  const word = normalizeWord(raw.word);
  if (!word) return null;
  if (word.length < config.wordLength.min || word.length > config.wordLength.max) return null;

  const clue = String(raw.clue || "").trim();
  if (!clue) return null;
  if (clue.toUpperCase().includes(word)) return null; // clue must not contain the answer

  const style = raw.style === "jeopardy" ? "jeopardy" : "crossword";

  // Sanity-check Gemini's self-tagged category. We trust the requested category
  // (it's the source of truth), but warn loudly when Gemini disagreed — those
  // entries are the most likely off-category drift and deserve a human look.
  if (raw.category && raw.category !== categoryName) {
    console.warn(`  ⚠ category drift on "${word}": Gemini tagged "${raw.category}", requested "${categoryName}"`);
  }

  return { word, clue, category: categoryName, style };
}

// ---- Finalize ----

function finalize() {
  if (!existsSync(stagingPath)) {
    console.error(`No staging file at ${config.stagingPath}. Run generation first.`);
    process.exit(1);
  }
  const final = JSON.parse(readFileSync(stagingPath, "utf8")).clues;
  // Trim buffer overage back to per-category target counts, preserving order.
  const byCategory = new Map();
  for (const c of final) {
    if (!byCategory.has(c.category)) byCategory.set(c.category, []);
    byCategory.get(c.category).push(c);
  }
  const trimmed = [];
  for (const cat of config.categories) {
    if (!cat.generate) continue;
    const bucket = byCategory.get(cat.name) ?? [];
    if (bucket.length < cat.target) {
      console.warn(`  ! ${cat.name}: only ${bucket.length}/${cat.target} — promoting anyway, fill the gap by hand or rerun`);
    }
    const pool = SHUFFLE ? shuffle(bucket) : bucket;
    trimmed.push(...pool.slice(0, cat.target));
  }
  writeFileSync(outputPath, JSON.stringify(trimmed, null, 2));
  console.log(`✓ Wrote ${trimmed.length} clues → ${config.outputPath}${SHUFFLE ? " (shuffled per category)" : ""}`);
  console.log(`  Buffer overage retained in staging (${final.length - trimmed.length} extras for QA swaps).`);
}

// Fisher-Yates shuffle. Returns a new array; does not mutate the input.
function shuffle(arr) {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// ---- Utils ----

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}
