# tinywebplayground — Design & Architecture Doc

This file gives Claude full context on the project so you don't need to re-explore it each session.

---

## Project Overview

A personal portfolio/playground site that hosts small interactive web tools. The home page (`/`) acts as a hub showing project cards. Each project lives at `/projects/<slug>` and is a self-contained mini-app.

**Live URL:** Deployed on Netlify (static output + serverless API routes).

---

## Before the Next Crossword: Required Fixes

**Whenever work starts on the next CROSSWORLD puzzle (puzzle-003+), fix these as part of that work, before it launches.** Both were found in the 2026-09-30 audit and deliberately left alone on the live puzzle-002.

1. **Answers are public.** Every answer (`word`) ships to the browser: `TheCrossword.tsx` imports `src/data/the-crossword/puzzle.json` whole (it's most of the ~1 MB bundle). The Firestore `puzzles/{id}/entries` docs also hold `word` and are world-readable (`firebase/firestore.rules`). So anyone can solve the whole puzzle from devtools or a script, and the server-side check in `solveClue` doesn't help. Anonymous auth makes the per-uid throttles easy to dodge too.
   - Strip `word` from the client JSON at build time (keep `length`).
   - Seed answers into a locked collection (e.g. `puzzles/{id}/answers/{entryId}`, `allow read: if false`) and have `solveClue` read them from there.
   - On a correct solve, copy `word` onto the public entry doc so solved letters still render (grid, timelapse, stats all read `entry.word` only for solved entries).
   - Remove the client-side `entry.word` comparison fallback in `CluePanel.tsx`.
2. **Firestore reads per visit.** `useFirebaseData` subscribes to the entire `entries` collection (2,500 docs), and `useSolveHistory` loads the whole `solveHistory` collection. That's up to ~5k reads per page load, against a free tier of 50k/day.
   - The static layout already ships in the bundle, so only subscribe to `where("unlocked", "==", true)`.
   - Load solve history only when the timelapse or stats modal is opened.

Delete this section once both are done.

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Astro 7 (static + React islands) |
| Interactive UI | React 19 (`client:load`) |
| State management | Zustand 5 (with persist middleware) |
| Styling | Custom CSS with CSS variables (no Tailwind) |
| Scoped styles | CSS Modules (`.module.css`) for components |
| Deployment | Netlify (adapter: `@astrojs/netlify`) |
| Language | TypeScript (strict, path aliases configured) |

**Path aliases** (configured in `tsconfig.json`):
- `@components/*` → `src/components/*`
- `@data/*` → `src/data/*`
- `@layouts/*` → `src/layouts/*`

---

## Directory Structure

```
src/
├── pages/
│   ├── index.astro                  # Home hub (prerendered)
│   ├── api/                         # Serverless API endpoints (NOT prerendered)
│   │   ├── search.ts
│   │   ├── details.ts
│   │   ├── posters.ts
│   │   ├── subscribe.ts             # Newsletter signup (Buttondown)
│   │   └── music/                   # Mixtape Mixup (Spotify + Deezer)
│   └── projects/
│       └── howlongtowatch.astro     # Project page (prerendered)
├── components/
│   ├── ProjectCard.astro            # Hub project card
│   ├── ProjectCard.module.css
│   └── projects/
│       └── how-long-to-watch/       # All React components for this project
├── layouts/
│   ├── BaseLayout.astro             # Root HTML shell (meta/OG, fonts, global CSS)
│   └── ProjectLayout.astro          # Project wrapper (header with back button)
├── data/
│   └── projects.ts                  # Project registry — add new projects here
├── styles/
│   └── global.css                   # Design tokens (CSS vars), typography, base styles
└── server/music/                    # Server-only helpers for the music API routes
```

---

## Design System

### Color Palette (`src/styles/global.css`)

```css
--color-bg:           #fef9e7;   /* Warm cream — page background */
--color-text:         #3b2a1a;   /* Dark brown — primary text */
--color-muted:        #8c6d4f;   /* Medium brown — secondary/meta text */
--color-surface:      #fffdf5;   /* Off-white — card/panel backgrounds */
--color-border:       #e4d4a0;   /* Tan — borders and dividers */
--color-accent:       #c97b2e;   /* Warm orange — CTAs, highlights, hover states */
--color-accent-light: #f5e6c8;   /* Light tan — accent backgrounds, footer */
--color-rich:         #6b3a2e;   /* Deep brown — emphasis, project card overlays */
--color-rich-text:    #fef5e4;   /* Light cream — text on dark backgrounds */
```

The aesthetic is **warm, earthy, analog** — like a worn notebook or old map. Avoid cool blues/grays; everything should feel golden/brown.

### Typography

- **Display font:** Fredoka One (Google Fonts) — used for page titles, project names, headings
- **Body font:** Nunito 400/600 (Google Fonts) — all other text
- **Base:** 16px, line-height 1.6

### Constants

```css
--radius:     14px;          /* Card/component border radius */
--transition: 160ms ease;    /* Hover/interaction animations */
```

### UI Patterns

- **Cards:** image thumbnail + title overlay on dark (`--color-rich`) background, `--radius` corners, hover lifts with `translateY(-4px)` + shadow
- **Grid:** 3 cols desktop → 2 cols (≤900px) → 1 col (≤560px), max-width 1100px
- **Tabs:** accent-colored active tab, border-bottom style
- **Modals:** semi-transparent overlay, centered card
- **Buttons:** circular `+` add buttons, accent-colored interactive elements
- **Focus states:** always visible for accessibility

---

## Layout System

### `BaseLayout.astro`
Provides the full HTML shell: `<html>`, `<head>` (meta, OG tags, the site's Google Fonts `<link>`s for Fredoka One + Nunito, favicon), `<body>`. Imports `global.css`. All pages use this.

**Props:** `title`, `description` (for meta/OG tags), `noindex` (optional; when `true`, emits `<meta name="robots" content="noindex, nofollow">` to keep a page out of search results), `image` (optional site-relative preview image for `og:image`; SVGs fall back to the app icon). Canonical + `og:image` URLs are absolute, built from `site` in `astro.config.mjs` (Netlify's `URL` env at build time) and omitted when it's unset (local builds).

**`head` slot:** page-specific `<head>` tags (extra font stylesheets, preloads) go in `<link slot="head" … />`, which works through both `BaseLayout` and `ProjectLayout`. Don't put `<link>` tags in the page body, and don't inject fonts from React.

### `ProjectLayout.astro`
Wraps project pages. Uses `BaseLayout`. Provides:
- Header with a `← Back` button (hover color from the project's `accentColor`)
- Project title in Fredoka One display font
- `<slot />` for the main content

**Props:** `project` (a full `Project` object from `src/data/projects.ts` — pages look themselves up with `projects.find((p) => p.slug === "...")!`), optional `subtitle`. Passes `project.image` through as the page's `og:image` and forwards the `head` slot.

Hub cards show a small "WIP" / "Soon" badge for projects whose `status` isn't `live`.

---

## Adding a New Project

### Step 1 — Register the project

Add an entry to `src/data/projects.ts`. **Always append new projects to the end of the array** unless the user explicitly specifies a different position.

```typescript
{
  slug: "my-new-project",         // Used for the URL: /projects/my-new-project
  title: "My New Project",
  description: "One-line summary shown on the hub card.",
  image: "/images/projects/my-new-project.webp",   // 400×260 recommended
  accentColor: "#hex",            // Primary color for the project's header
  status: "live" | "wip" | "coming-soon",
  tags: ["optional", "tag", "array"],
}
```

### Step 2 — Add a project image

Place a `.webp` image (recommended ~400×260px) at:
`public/images/projects/my-new-project.webp`

### Step 3 — Create the project page

Create `src/pages/projects/my-new-project.astro`:

```astro
---
export const prerender = true;
import ProjectLayout from "@layouts/ProjectLayout.astro";
import { projects } from "@data/projects";
// import your main component

const project = projects.find((p) => p.slug === "my-new-project")!;
---

<ProjectLayout project={project}>
  <!-- React component with client:load, or static Astro content -->
</ProjectLayout>
```

### Step 4 — Build project components

If the project needs interactive React UI, create a directory:
`src/components/projects/my-new-project/`

Typical files:
- `MyProject.tsx` — root React component, mount with `<MyProject client:load />`
- `MyProject.module.css` — scoped styles
- `types.ts` — TypeScript types
- `store.ts` — Zustand store if persistent state is needed
- `utils.ts` — helper functions

### Step 5 — Add API routes (if needed)

Create serverless endpoints at `src/pages/api/`:

```typescript
// src/pages/api/my-endpoint.ts
export const prerender = false;

import type { APIRoute } from "astro";

export const GET: APIRoute = async ({ url }) => {
  const param = url.searchParams.get("param");
  // ...
  return new Response(JSON.stringify(data), {
    headers: { "Content-Type": "application/json" },
  });
};
```

---

## Footer

The footer is the shared `src/components/SiteFooter.astro` component. `ProjectLayout` renders it automatically on every project page, and the hub (`src/pages/index.astro`) includes it directly — so do **not** add a footer inside individual project pages. Include `<SiteFooter />` in any new top-level page that doesn't use `ProjectLayout`.

**Content:** `© 2026 sduemler` + GitHub icon linking to `https://github.com/sduemler`

**Style:** `--color-accent-light` background, `--color-border` top border, `--color-muted` text, icon turns `--color-accent` on hover. Centered flex row. It styles itself from the theme CSS variables, so pages with scoped palette overrides (e.g. akeelah, typing-terror) retint it automatically.

---

## Presets Pattern (HowLongToWatch)

The app ships with 18 hardcoded preset collections (e.g., Harry Potter, MCU, Director filmographies) defined in `presets-data.ts`. Each preset is an array of TMDB IDs + media type. This is a useful pattern for future projects that need curated starter sets.

---

## Eurorack Module Convention

Every module in the eurorack project (`src/components/projects/eurorack/`) **must** include a `<ModuleHelp>` component as the first child of its `.module` div. It renders a "?" button in the top-right corner of the module and opens a popover explaining what the module does and what each of its controls does.

Usage:

```tsx
import ModuleHelp from "./ModuleHelp";

<div className={styles.module} style={palette}>
  <ModuleHelp
    title="Module Name"
    description="One or two sentences explaining what this module does in the signal chain."
    controls={[
      { name: "Ctrl Label", description: "What this slider/knob controls." },
      // one entry per visible control/slider
    ]}
  />
  <h3 className={styles.moduleHeader}>Module Name</h3>
  {/* ... */}
</div>
```

Any new eurorack module you add **must** follow this pattern.

---

## Existing Projects

| Slug | Title | Status | Notes |
|---|---|---|---|
| `the-crossword` | CROSSWORLD | live | Collaborative realtime crossword on Firebase (Firestore + Auth + Functions, config via `PUBLIC_FIREBASE_*` env vars). **Next puzzle must include the fixes in "Before the Next Crossword" above.** Has a completion overlay with a newsletter signup (`/api/subscribe` → Buttondown) and an archive page at `/projects/the-crossword-archive`. |
| `mixtape-mixup` | Mixtape Mixup | live | Heardle-style daily song game (formerly Music Guesser; `/projects/music-guesser` 301s here via `redirects` in `astro.config.mjs`, and `store.ts` moves old `music-guesser` localStorage saves to the `mixtape-mixup` key on load). API routes and server helpers are still under `api/music/` and `server/music/`. **Spotify app rules:** the Spotify keys belong to a developer app created after Feb 2026, so the batch `/tracks?ids=` endpoint and reading playlists are forbidden for it. Track metadata is fetched per track via `/tracks/{id}` (a few in parallel, in candidate order, so the daily pick is deterministic), and practice mode offers only the 10 preset tapes in `tracks-data.ts`; the old paste-your-own-Spotify-playlist box was removed. Search must keep `limit` ≤ 10. Audio previews come from Deezer via `/api/music/*`; preview URLs expire ~15 min, so the client fetches a fresh one per song via `/api/music/preview?id=<deezerId>`. **Preview matching is strict** (`server/music/deezer.ts`): the exact recording by ISRC (from Spotify's `external_ids`), else the same title and artist after stripping version suffixes like " - Remastered 2009"; a song with no match is skipped, never given another song's clip (that bug once played *And I Love Her* for *A Hard Day's Night*). Each track carries its `deezerId`. **Cassette/mixtape design:** walnut hi-fi ground (page `<style is:global>`), a champagne tape deck (`Deck.tsx`: audio + SVG `Cassette.tsx` whose reels spin while playing + latching piano-key lifelines). The cassette label is the tape's tracklist: each finished song's title is pen-written on it (SMIL clip reveal) in green (got it) or red (missed/skipped), 5 per side; `FlipCassette.tsx` turns the tape to side B for track 6, and players can tap it to peek at side A (it turns back when play moves on), and a paper J-card (`JCard.tsx`) holding the cover, title blanks and crossed-out guesses. Fonts: Gochi Hand (handwriting) + Barlow Semi Condensed (hardware/UI). Lifelines: blurry cover, play 30s, and **title blanks** (`titleBlanks()` in `utils.ts`; internal kind is still `'hint'` so saved progress stays compatible). The in-game name lives in `brand.ts` (`GAME_NAME`). |
| `howlongtowatch` | HowLongToWatch | live | TMDB API, Zustand, 18 presets |
| `historyofrock` | History of Rock | live | Interactive d3-force diagram of rock genre evolution (`useSimulation.ts`). Note the page file is `historyofrock.astro` (no hyphens). |
| `osrs-pet-chance-guesser` | OSRS Pet Chance Guesser | live | Boss pet drop-rate RNG simulator; pet icons in `public/images/projects/pets/`. |
| `who-are-you` | Who Are You? | live | Humor quiz — a dog detective asks 10 questions. Static data in `questions.ts`. |
| `haiku` | HAIKU | live | Joke "AI" haiku generator. |
| `dice-roller` | Tabletop Dice Roller | live | Keyboard-first dice notation parser (`2d6 + 3`). |
| `human-maintenance-guide` | Human Maintenance Guide | live | Static reference compendium (health/home/car/finance cadences). |
| `so-you-want-to-build-a-snowman` | So You Want to Build a Snowman | live | Snowman builder driven by real snowfall data; has a no-snow fallback screen. |
| `drum-machine` | Tiny Drum Machine | live | Vertical Linndrum-inspired step sequencer, twin to eurorack. |
| `eurorack` | Tiny Eurorack | live | Tone.js-based mini modular synth. Every module must include `<ModuleHelp>` — see Eurorack Module Convention above. |
| `still-here` | Still Here | live | WHO life-table survival pyramid. Data fetched at build time via `npm run build-life-tables` → `src/data/still-here/life-tables.json` (committed). Re-run if you want fresher numbers. |
| `from-akeelah-to-z` | From Akeelah to Z | live | Informational. Characters who say a word for every letter A–Z in one movie (26/26) plus 25/26 near-misses. Built via `npm run build-akeelah` from two sources — Cornell Movie-Dialogs Corpus + MovieSum (~2,200 screenplays, carries `imdb_id`) — downloaded to gitignored `scripts/.cache/` (~550MB); actors matched via TMDB (by `imdb_id` when available, cached on disk). Output `src/data/akeelah/pangram-actors.json` (committed, ~1.2MB / ~180KB brotli): ships all perfects (65) + a curated 400 of ~1,674 near-misses (actor-matched, most talkative). Each `examples[letter]` is a `[before, word, after]` context snippet so the UI can show the fulfilling word bolded in surrounding dialogue. Rule: case-insensitive; names/hyphenated words count, but bare single letters, digit-codes, Roman numerals, and junk tokens do NOT count for rare letters (see `isJunk`/`OVERRIDES`/`EXCLUDE` in the script). Needs `TMDB_API_KEY` in `.env`. **Intentional exception to the earthy palette:** this project uses a scoped warm-blue theme (per user request) — color tokens overridden on `.project-wrapper` via a page-scoped `<style is:global>` in `from-akeelah-to-z.astro` (accent `#3f72a4`); do NOT "correct" it back to gold/brown. |
| `typing-terror` | Typing Terror | live | A real WPM/accuracy typing test with a twist: each run gives 3 escalating passages from **one** public-domain book (innocuous → strange → very weird), and the UI **decays** across the three prompts. Random book-set per run; Zustand-`persist` store (`typing-terror-store`) keeps personal-best WPM + last 5 runs. Passages are a **curated static file** `src/data/typing-terror/passages.ts` (10 books × 3 tiers, normalized to clean ASCII, ~140–320 chars each) — tier selection is editorial, so there is **no build script**; source text was verified against the Project Gutenberg editions noted by each set's `gutenbergId`. The decay engine is CSS-only in `TypingTerror.module.css`, keyed off `data-tier="1|2|3"` on `.stage`/`.test` with a `--progress` ramp on tier 3; honors `prefers-reduced-motion`. **Intentional exception to the earthy palette:** scoped aged-parchment + blood-red (`#a01b1b`) theme via page `<style is:global>`, darkening to near-black/red at tier 3 — do NOT "correct" it back to gold/brown. To add/replace books, edit `passages.ts` (keep tiers 1-2-3, pure ASCII, ≤~320 chars). |
| `behind-the-counter` | Behind the Counter Map | live | Leaflet map (CARTO Voyager tiles via `PUBLIC_CARTO_BASEMAPS_KEY`, falling back to plain OSM tiles when unset; mounted `client:only="react"`) of every shop from Paolo fromTOKYO's "Japan Behind the Counter" YouTube series, with an episode list and embedded (youtube-nocookie) videos. Data is `src/data/behind-the-counter/places.json`, built by `npm run build-behind-the-counter` (needs `yt-dlp` on PATH): walks the playlist, pulls each episode's Google Maps link, and takes coordinates from the resolved URL's `!3d<lat>!4d<lng>` pair (NOT the `@lat,lng` viewport). Episodes it can't resolve go in `scripts/behind-the-counter-overrides.json`; anything still unresolved is flagged `needsReview`. |
| `philosopher-tcg` | First Principles | live | Dark-academia philosopher trading-card game. Single-player V1: animated grimoire booster-pack opening + collection gallery, persisted in localStorage (Zustand, key `philosopher-tcg:v1`). Full-bleed dark (uses `BaseLayout` directly, NOT `ProjectLayout`); own scoped fonts (Cormorant Garamond + IBM Plex Mono, `<link slot="head">` in the page) and stylesheet (`philosopher-tcg.css`, all selectors live under `.tcg-root`). 50 cards in `data/cards.ts`, 5 factions, 4 rarities. All 50 cards have public-domain portraits in `public/images/philosopher-tcg/` (Wikimedia Commons, no AI), style-matched per faction: Ancients = marble busts, Sages = traditional ink/manuscript portraits, Revolutionaries & Enlightened = oil portraits, Moderns = B&W photographs. **Daily pack gate:** players get **1 free pack/day**; after using it they can answer an open-ended philosophical prompt (`data/questions.ts`, rotates daily) to earn **1 bonus pack** (2/day max). Submitting the reflection first shows a snarky grimoire remark (`SNARKY_REMARKS` in `data/questions.ts`); answers of 60+ words roll a 1-in-10 chance of a genuine compliment (`GENUINE_REMARKS`, gold-glow styling) instead — the pack is claimed from that response screen. State lives in the store as `lastFreePackDate` / `bonusAnsweredDate` / `lastBonusPackDate` (local "YYYY-MM-DD" dates; helpers in `lib/daily.ts`); `PackOpener` shows the pack, the `QuestionGate`, or a locked state with a midnight countdown accordingly. **Admin/testing bypass:** visit `/projects/philosopher-tcg?dev` to enable `devMode` (unlimited packs, daily limit bypassed, plus a "Reset daily limits" button) — it's not persisted, so a normal visit is gated again. **20 achievements** (`data/achievements.ts`, 10 completionist + 10 luck) evaluate in the store's `recordPull`; an Xbox/PS-style popup (`AchievementToast.tsx`, slide-up + seal pop + Web Audio chime) fires on unlock, shown via the **Achievements** tab. Each card sets `portraitSrc` + `portraitPos`. The card art is a **full-width, near-square window** running from the top of the card down to the text block, with the name/influence overlaid on a dark scrim in cream/gold (see `Card.tsx` + `.card-portrait` in the CSS) — Pokémon/MTG full-art style. There is an **unlisted card-index route at `/projects/philosopher-tcg/all`** (`CardGallery.tsx`) that renders all 50 cards full-size grouped by faction, for proofing portraits/framing — it is intentionally **not linked from any page** and is `noindex`. Preserve the pack-opening animation rules (real occlusion, no opacity-fade-through, phase timings 1650/2400/3250ms) — see the prototype/handoff before tuning. |
| `history-of-the-world` | History of the World | live | 4.54-billion-year timeline on a parchment scroll, oldest at top. ~152 events in `src/data/history-of-the-world/events.ts` (deep-time entries use `ago`, later ones `year`; 8 color-coded categories; blurbs are 2–4 sentences: what happened + why it mattered). Same file holds `ERAS` (14 geologic/historical section headings, each anchored `before` an event id) and optional per-event `meanwhile` notes (what the world was doing in the long gap *before* that event, shown only inside an unrolled fold). The Transatlantic Slave Trade is deliberately under Empires & Politics (not Migrations) with explicit language about the atrocity. Calendar years always carry BCE/CE. Gaps ≥50 yrs start **folded** (labelled with their span); unrolling uses a power-curve scale `px = 72·years^0.3` in `timeline.ts` (10× the time ≈ 2× the length). Unrolled gaps show round-number ink ticks + a sticky fold-up button; a fixed wax-seal badge shows the date at the reading line; legend chips filter categories (gaps merge). **Paper art is found, not drawn:** `npm run build-history-scroll` slices a CC0 PublicDomainPictures parchment (Martina Stokow, #667614) into `scroll-top.webp` + a mirrored seamless `scroll-tile.webp`, turns a CC0 torn-paper photo (#677466) into `torn-bottom-mask.png`, and renders the hub card with node-canvas. Fonts: Pinyon Script (title) + IM Fell English / SC, linked in the page. Dark walnut-desk palette override in the page `<style is:global>`. |

---

## Environment Variables

- `TMDB_API_KEY` — Required for HowLongToWatch API routes. Set in Netlify environment settings (not committed).
- `BUTTONDOWN_API_KEY` — Required for the newsletter signup (`/api/subscribe`).
- `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET` — Required for Mixtape Mixup's `/api/music/*` routes (Spotify client-credentials flow; Deezer needs no key). They're for an app owned by someone else, whose Premium keeps it working; if it lapses the API stops, and the fallback is the shelved Deezer plan in `.claude/plans/mixtape-mixup-deezer.md` (local, untracked).
- `PUBLIC_FIREBASE_API_KEY`, `PUBLIC_FIREBASE_AUTH_DOMAIN`, `PUBLIC_FIREBASE_PROJECT_ID`, `PUBLIC_FIREBASE_STORAGE_BUCKET`, `PUBLIC_FIREBASE_MESSAGING_SENDER_ID`, `PUBLIC_FIREBASE_APP_ID` — Client-side Firebase config for CROSSWORLD (public by design).
- `PUBLIC_CARTO_BASEMAPS_KEY` — CARTO basemaps key for the Behind the Counter map (free non-commercial key from carto.com/basemaps/apikey; public by design, restrict it to the site's domain in CARTO's dashboard). Without it the map uses plain OSM tiles.

---

## Key Constraints

- **No Tailwind** — use CSS variables and CSS Modules only.
- **Warm earthy aesthetic** — no cool blues or generic modern colors.
- **Static pages, dynamic API routes** — project pages use `export const prerender = true`, API routes use `export const prerender = false`.
- **Footer** must appear on every page, styled to match the page's aesthetic.
- **Never commit `.env` files.**
- **Mobile-friendly is required** — every project and UI change must work on phones, not just desktop. Design/verify at narrow widths (≤600px, down to ~360px). Toolbars, control rows, and button groups must **wrap or stack into rows** rather than overlap, overflow, or clip each other; keep tap targets ≥34px; avoid fixed widths that force horizontal scrolling. When you add or change any on-screen controls, check the `@media (max-width: 600px)` behavior before considering the change done.
