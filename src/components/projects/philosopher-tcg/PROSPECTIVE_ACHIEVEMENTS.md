# Prospective Achievements — First Principles

Ideas for future achievements, **not yet implemented**. The live set (20: 10
completionist + 10 luck) lives in `data/achievements.ts`. Add any of these by
appending to that array; each needs a `check(ctx)` and the UI is data-driven so
no component changes are required for simple ones.

The current `AchievementCtx` exposes: `owned`, `prevOwned`, `packsOpened`, `pack`.
Items below that need **new state** (a store field + persistence) are flagged.

---

## A. Reflection & dedication
*Leverages the daily question gate — the most on-theme category for a philosophy game.*

- **The Examined Life** — answer your first reflection question. *(needs: reflections-answered counter)*
- **Symposium** — answer 25 reflection questions total. *(same counter)*
- **Treatise** — write a 100+ word reflection. *(check answer length at submit time)*
- **Peripatetic** — open a pack 7 days in a row. *(needs: daily streak — last-active date + streak count)*
- **The Long Game** — maintain a 30-day streak. *(same streak state)*

## B. Collection depth & breadth (completionist)
*Mostly free to compute from `owned`.*

- **The Canon** — collect all 7 legendaries. *(derivable now)*
- **Rank and File** — collect every card of one rarity (e.g. all commons). *(derivable now)*
- **Renaissance Soul** — own at least one card from all 5 schools. *(quick, early-game unlock; derivable now)*
- **Halfway to Wisdom** — collect 25 of 50 unique cards. *(milestone before the full set; derivable now)*
- **Great Library** — own 250 total cards including duplicates. *(sum of `owned`; derivable now)*
- **Playset** — own 4+ copies of a single card. *(a rung below the existing "10 copies"; derivable now)*

## C. More pulls / luck
*Non-missable, rollable anytime — consistent with the existing luck set.*

- **Eternal Recurrence** — pull a card that was also in your previous pack. *(Nietzsche pun; needs: remember last pack's ids)*
- **The Whole Spectrum** — pull at least one card of every rarity over time. *(needs: "rarities ever seen" set — or fold into B)*
- **Outlier** — open a pack where one card's Influence is 30+ higher than both others. *(pure pack check; free)*

## D. Secret / flavor (optional)

- **Memento Mori** — reset your collection at least once. *(hook the `reset` action)*
- **Know Thyself** — open the focus overlay on your highest-Influence owned card. *(needs: tiny hook on focus)*

---

## Notes / decisions to make later

- Most of **B**, plus **Outlier** and the secret ones, read from state that already
  exists — cheapest to add.
- **A** (reflections counter, streaks) and **Eternal Recurrence** (last-pack memory)
  need small additive persisted state in the store (`partialize`).
- Adding these pushes the total past 20 — consider splitting the Achievements tab
  into more sections (e.g. **Mastery / Fortune / Devotion**) or letting the two
  current sections grow.

### Suggested first batch (best fit for the loops the game actually has)
The Examined Life · Symposium · Peripatetic · The Canon · Renaissance Soul ·
Great Library · Eternal Recurrence
