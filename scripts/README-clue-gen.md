# Clue Generation — How to Run

This explains how to generate the ~2400 AI-written clues for **puzzle-002**.
The 100 hand-curated **media-format** clues are authored separately in
`src/data/the-crossword/media-clues.json` and merged at layout time.

---

## Prerequisites

1. **Node 18+** (you already have this — Astro requires it).
2. **Gemini API key** from [AI Studio](https://aistudio.google.com/apikey).
   The free tier is sufficient for this whole run; expect ~60–120 requests at
   the default chunk size.
3. Add the key to `.env` (gitignored) **OR** export it inline:
   ```bash
   export GEMINI_API_KEY="your-key-here"
   ```
   The script reads `process.env.GEMINI_API_KEY`. Never commit the key.

---

## The big picture

```
┌─────────────────────────┐    ┌────────────────────────┐    ┌──────────────────────┐
│ clues.json (v1, live)   │──▶ │ Auto-archived on first │──▶ │ clues-v1.json        │
│ ≈1000 entries           │    │ generation run         │    │ (exclusion list)     │
└─────────────────────────┘    └────────────────────────┘    └──────────────────────┘
                                                                       │
                                                                       ▼
                  ┌─────────────────────┐    ┌───────────────────────────────────────┐
                  │ clue-gen-config.json│──▶ │ gen-clues.mjs                         │
                  │ (targets + scopes)  │    │ • per-category Gemini calls           │
                  └─────────────────────┘    │ • dedup vs v1 + within staging        │
                                             │ • resumable via staging file          │
                                             └───────────────────────────────────────┘
                                                                       │
                                                                       ▼
                                                       ┌───────────────────────────┐
                                                       │ clues-staging.json        │
                                                       │ (≈2880, with buffer)      │
                                                       └───────────────────────────┘
                                                                       │
                                              ── HUMAN QA PASS ──▶     │
                                                                       │
                                                            --finalize │
                                                                       ▼
                                                       ┌───────────────────────────┐
                                                       │ clues.json (puzzle-002)   │
                                                       │ 2400 placed entries       │
                                                       └───────────────────────────┘
                                                                       │
                                                              + media-clues.json   │
                                                                       ▼
                                                                build-layout.mjs
```

---

## Step-by-step

### Step 1 — Sanity-check the config

Open `scripts/clue-gen-config.json` and confirm:

- Total of `target` across all categories (incl. media) sums to **2500**.
- `bufferPercent: 20` — produces ~2880 generated entries before trimming.
- `jeopardyStyleRatio: 0.42` — ~1000 of 2400 will be Jeopardy-style.
- Each generated category's `note` field accurately scopes it.

Tweak weights here, not in the script.

### Step 2 — Dry-run a single category prompt

Before burning any API quota, see what the prompt looks like:

```bash
npm run gen-clues -- --category "Anime" --dry-run
```

This prints the exact prompt that will be sent to Gemini for one batch and
exits. Review the boundary rules, scope text, and v1 feedback for accuracy.
**Edit `gen-clues.mjs` (`buildPrompt` function) if anything reads wrong.**

### Step 3 — Generate a single category as a smoke test

Pick a small category to validate end-to-end:

```bash
npm run gen-clues -- --category "Sports"
```

This will:
1. Archive `clues.json` → `clues-v1.json` (first run only).
2. Call Gemini in 25-clue chunks until Sports has ~60 entries in staging.
3. Write `src/data/the-crossword/clues-staging.json` after each chunk.

Inspect the output:

```bash
cat src/data/the-crossword/clues-staging.json | head -40
```

Confirm:
- Words are uppercase, A–Z only, 3–21 letters.
- Each entry has a `style` field (`"crossword"` or `"jeopardy"`).
- The mix matches the scope of the category.
- No duplicate words.
- No clue contains its own answer.

If the output is bad, **delete `clues-staging.json` and re-run**. The script
won't re-archive `clues-v1.json` (it persists), so dedup vs v1 is preserved.

### Step 4 — Generate the full set

When the smoke test looks good, run everything:

```bash
npm run gen-clues
```

This iterates through every `generate: true` category and produces
`category.target × 1.20` entries each. The full run takes roughly
**30–90 minutes** depending on Gemini latency and the 1.2s rate-limit
pause between batches.

The script is **resumable**: if it crashes, your laptop sleeps, or you
Ctrl-C, just rerun `npm run gen-clues`. It skips categories that already
hit their buffered target and resumes mid-category for the rest.

### Step 5 — Human QA pass (this is the important one)

Open `clues-staging.json` and review. You're looking for:

| Defect                                | What to do                                |
|---------------------------------------|-------------------------------------------|
| Wrong category assignment             | Move it or delete                         |
| Clue contains the answer              | Already filtered by script — should be 0  |
| Factually wrong                       | Delete (don't trust the LLM on facts)     |
| Obscure / specialist-only             | Delete (especially in Dictionary)         |
| Near-duplicate of another clue        | Delete one                                |
| Same word twice in different forms    | Keep the better clue, delete the other    |
| Jeopardy-style that doesn't read well | Delete or rewrite                         |
| Anything that violates boundary rules | Delete                                    |

You have a **20% buffer**, so cull aggressively. Better to land at 2380 great
clues than 2500 mediocre ones. If a category falls below target after culling,
re-run it:

```bash
npm run gen-clues -- --category "Movies"
```

It will top off only what's missing.

### Step 6 — Finalize

When QA is done:

```bash
npm run gen-clues:finalize
```

This:
- Trims each category to its **target** count (drops the buffer overage).
- Writes the trimmed set to `clues.json`.
- Retains the full staging file so the cut buffer entries are still around if
  you decide to swap one in later.

If any category is under target, finalize will warn but still write — you'll
need to either rerun that category, paste in hand-written replacements, or
accept the shortfall.

### Step 7 — Add the media clues

The 100 hand-curated media-format clues live in
`src/data/the-crossword/media-clues.json` (separate file, hand-authored).
The `build-layout.mjs` script merges them with `clues.json` at layout time —
no extra step here, just make sure the file exists with the right entries.

### Step 8 — Build the puzzle layout

```bash
npm run build-crossword
```

This consumes `clues.json` + `media-clues.json` and produces the placed
puzzle (`puzzle.json`). From here, follow the existing seed/deploy steps
in `crossword-v2.md` Phase I.

---

## Commands cheatsheet

```bash
# Inspect prompt without spending quota
npm run gen-clues -- --category "Tech" --dry-run

# Generate one category
npm run gen-clues -- --category "US Birds"

# Wipe a category from staging and regenerate it from scratch
npm run gen-clues -- --category "Sports" --regenerate

# Generate everything (resumable)
npm run gen-clues

# Override the Gemini model (default: gemini-2.5-flash)
npm run gen-clues -- --model gemini-1.5-flash

# Promote staging → clues.json (after QA), preserving generation order
npm run gen-clues:finalize

# Promote staging → clues.json with per-category shuffle (random pick from each bucket)
npm run gen-clues:finalize-shuffled
```

`--category` does a case-insensitive substring match: `"bird"` hits "US Birds",
`"myth"` hits "Mythology/folklore/religion".

---

## Files this touches

| Path                                            | Role                                   | Committed? |
|-------------------------------------------------|----------------------------------------|------------|
| `scripts/clue-gen-config.json`                  | Categories, targets, scopes            | yes        |
| `scripts/gen-clues.mjs`                         | Generator                              | yes        |
| `src/data/the-crossword/clues.json`             | Live clue set (v1 now, v2 after final) | yes        |
| `src/data/the-crossword/clues-v1.json`          | Auto-archived v1 (exclusion list)      | yes        |
| `src/data/the-crossword/clues-staging.json`     | Work-in-progress, with buffer overage  | yes        |
| `src/data/the-crossword/media-clues.json`       | Hand-authored media clues              | yes        |
| `.env`                                          | `GEMINI_API_KEY=...`                   | **NEVER**  |

Commit `clues-v1.json` and `clues-staging.json` — they're useful for audit
and resumability. The staging file is large but text; gzip-friendly.

---

## Tweaking categories mid-flight

If you decide a category needs more/fewer clues after some have been
generated:

1. Edit `target` in `clue-gen-config.json`.
2. Run `npm run gen-clues` — it will top up if the new target is higher, or
   simply not generate more if the existing count already exceeds the new
   buffered target. (Excess entries are trimmed at `--finalize` time.)

If you want to **drop** a category entirely after partial generation, set
`"generate": false` and delete its entries from `clues-staging.json` by hand,
then `--finalize`.

---

## Troubleshooting

**"Missing GEMINI_API_KEY"** — `export GEMINI_API_KEY=...` in your shell or
put it in `.env` and source it.

**HTTP 429 (rate limited)** — the script pauses 1.2s between calls; if you
still hit limits, raise the sleep in `gen-clues.mjs` near the bottom of the
generation loop.

**HTTP 404 "model not found"** — Google rotates models. List what your key
can access:

```bash
curl "https://generativelanguage.googleapis.com/v1beta/models?key=$GEMINI_API_KEY" \
  | jq '.models[] | select(.supportedGenerationMethods[] | contains("generateContent")) | .name'
```

Pass a working one via `--model`, e.g. `--model gemini-1.5-flash`.

**"batch yielded 0 new clues"** repeatedly — Gemini is producing duplicates
or invalid words. Three empty batches in a row will skip the category. Try:
- Running with `--dry-run` to inspect the prompt.
- Shrinking `chunkSize` in the config (forces more variety per call).
- Tightening or relaxing the `note` in the config for that category.

**Output isn't valid JSON** — Gemini occasionally wraps output in markdown
fences. The script tries to extract the array from such responses; if it
fails persistently, raise the temperature slightly lower (edit
`temperature: 0.9` → `0.7` in `gen-clues.mjs`).

**Want to start over** — delete `clues-staging.json` and rerun. Keep
`clues-v1.json` (it's the dedup baseline).

---

## Cost / quota

Default model `gemini-2.5-flash` is **free** in AI Studio with generous
limits (~15 RPM, ~1500 requests/day as of early 2026). A full run consumes roughly:
- ~120 requests (~25 clues each × 23 categories × ~1.2 calls/category avg)
- ~600K input tokens, ~150K output tokens

Well within free-tier daily limits as of early 2026. If you hit a quota,
the script will surface the HTTP error and retry after 5s — usually fine to
just leave it running.
