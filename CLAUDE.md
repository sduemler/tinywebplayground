# tinywebplayground — Design & Architecture Doc

This file gives Claude full context on the project so you don't need to re-explore it each session.

---

## Project Overview

A personal portfolio/playground site that hosts small interactive web tools. The home page (`/`) acts as a hub showing project cards. Each project lives at `/projects/<slug>` and is a self-contained mini-app.

**Live URL:** Deployed on Netlify (static output + serverless API routes).

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Astro 5 (static + React islands) |
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
│   │   └── presets.ts
│   └── projects/
│       └── howlongtowatch.astro     # Project page (prerendered)
├── components/
│   ├── ProjectCard.astro            # Hub project card
│   ├── ProjectCard.module.css
│   └── projects/
│       └── how-long-to-watch/       # All React components for this project
├── layouts/
│   ├── BaseLayout.astro             # Root HTML shell (meta, fonts, global CSS)
│   └── ProjectLayout.astro          # Project wrapper (header with back button)
├── data/
│   └── projects.ts                  # Project registry — add new projects here
├── styles/
│   └── global.css                   # Design tokens (CSS vars), typography, base styles
└── assets/                          # SVGs
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
Provides the full HTML shell: `<html>`, `<head>` (meta, OG tags, Google Fonts, favicon), `<body>`. Imports `global.css`. All pages use this.

**Props:** `title`, `description` (for meta/OG tags).

### `ProjectLayout.astro`
Wraps project pages. Uses `BaseLayout`. Provides:
- Sticky header with a `← Back` button (styled with the project's `accentColor`)
- Project title in Fredoka One display font
- `<slot />` for the main content

**Props:** `title`, `description`, `accentColor`.

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
// import your main component
---

<ProjectLayout
  title="My New Project"
  description="One-line summary."
  accentColor="#hex"
>
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

The footer lives in `src/pages/index.astro` (not in a shared layout — only appears on the hub). It must be included in any new top-level pages.

**Content:** `© 2026 sduemler` + GitHub icon linking to `https://github.com/sduemler`

**Style:** `--color-accent-light` background, `--color-border` top border, `--color-muted` text, icon turns `--color-accent` on hover. Centered flex row.

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
| `howlongtowatch` | HowLongToWatch | live | TMDB API, Zustand, 18 presets |
| `eurorack` | Tine Eurorack | live | Tone.js-based mini modular synth. Every module must include `<ModuleHelp>` — see Eurorack Module Convention above. |
| `still-here` | Still Here | live | WHO life-table survival pyramid. Data fetched at build time via `npm run build-life-tables` → `src/data/still-here/life-tables.json` (committed). Re-run if you want fresher numbers. |
| `from-akeelah-to-z` | From Akeelah to Z | live | Informational. Characters who say a word for every letter A–Z in one movie (26/26) plus 25/26 near-misses. Built via `npm run build-akeelah` from two sources — Cornell Movie-Dialogs Corpus + MovieSum (~2,200 screenplays, carries `imdb_id`) — downloaded to gitignored `scripts/.cache/` (~550MB); actors matched via TMDB (by `imdb_id` when available, cached on disk). Output `src/data/akeelah/pangram-actors.json` (committed, ~1.2MB / ~180KB brotli): ships all perfects (65) + a curated 400 of ~1,674 near-misses (actor-matched, most talkative). Each `examples[letter]` is a `[before, word, after]` context snippet so the UI can show the fulfilling word bolded in surrounding dialogue. Rule: case-insensitive; names/hyphenated words count, but bare single letters, digit-codes, Roman numerals, and junk tokens do NOT count for rare letters (see `isJunk`/`OVERRIDES`/`EXCLUDE` in the script). Needs `TMDB_API_KEY` in `.env`. **Intentional exception to the earthy palette:** this project uses a scoped warm-blue theme (per user request) — color tokens overridden on `.project-wrapper` via a page-scoped `<style is:global>` in `from-akeelah-to-z.astro` (accent `#3f72a4`); do NOT "correct" it back to gold/brown. |
| `typing-terror` | Typing Terror | live | A real WPM/accuracy typing test with a twist: each run gives 3 escalating passages from **one** public-domain book (innocuous → strange → very weird), and the UI **decays** across the three prompts. Random book-set per run; Zustand-`persist` store (`typing-terror-store`) keeps personal-best WPM + last 5 runs. Passages are a **curated static file** `src/data/typing-terror/passages.ts` (10 books × 3 tiers, normalized to clean ASCII, ~140–320 chars each) — tier selection is editorial, so there is **no build script**; source text was verified against the Project Gutenberg editions noted by each set's `gutenbergId`. The decay engine is CSS-only in `TypingTerror.module.css`, keyed off `data-tier="1|2|3"` on `.stage`/`.test` with a `--progress` ramp on tier 3; honors `prefers-reduced-motion`. **Intentional exception to the earthy palette:** scoped aged-parchment + blood-red (`#a01b1b`) theme via page `<style is:global>`, darkening to near-black/red at tier 3 — do NOT "correct" it back to gold/brown. To add/replace books, edit `passages.ts` (keep tiers 1-2-3, pure ASCII, ≤~320 chars). |

---

## Environment Variables

- `TMDB_API_KEY` — Required for HowLongToWatch API routes. Set in Netlify environment settings (not committed).

---

## Key Constraints

- **No Tailwind** — use CSS variables and CSS Modules only.
- **Warm earthy aesthetic** — no cool blues or generic modern colors.
- **Static pages, dynamic API routes** — project pages use `export const prerender = true`, API routes use `export const prerender = false`.
- **Footer** must appear on every page, styled to match the page's aesthetic.
- **Never commit `.env` files.**
- **Mobile-friendly is required** — every project and UI change must work on phones, not just desktop. Design/verify at narrow widths (≤600px, down to ~360px). Toolbars, control rows, and button groups must **wrap or stack into rows** rather than overlap, overflow, or clip each other; keep tap targets ≥34px; avoid fixed widths that force horizontal scrolling. When you add or change any on-screen controls, check the `@media (max-width: 600px)` behavior before considering the change done.
