# Eurorack — Architecture & Context

Session-priming doc so a fresh Claude can add/change a module without re-reading every file. Read this alongside `CLAUDE.md`'s "Eurorack Module Convention" section.

---

## Signal chain

```
osc    → oscGain   ┐
                   ├─ sourceMix ─ envelope ─ filter ─┬→ crushWet.a (dry)
noise  → noiseGain ┘                                 └→ distortion → bitCrusher → crushWet.b (wet)

crushWet ─┬→ fxMixer.a (dry)
          └→ delay → reverb → fxMixer.b (wet)

fxMixer → swirlInput → swirlEffect (chorus | phaser | vibrato) → swirlOutput
swirlOutput → scopeGain → analyser (oscilloscope)
swirlOutput → outputGain → Tone.getDestination()
```

- **Envelope is always in the chain.** In drone mode it's forced to `(0, 0, 1, 0)` — pass-through at unity. In trigger mode it applies the user's ADSR. See `applyEnvelopeState()` in `audio.ts`.
- **`crushWet` is a CrossFade** — `a` is the clean filter output, `b` is `filter → distortion → bitCrusher`. Mix slider = `crushWet.fade`.
- **`fxMixer` is another CrossFade** — `a` is dry-post-crush, `b` is delay + reverb.
- **`swirlEffect` is rebuilt on mode change.** Chorus/Phaser/Vibrato don't share a useful base class, so `buildSwirlEffect()` disposes the old node, creates a new one of the right type, re-applies `currentSwirlRate/Depth/Feedback/Mix`, and reconnects `swirlInput → swirlEffect → swirlOutput`. Per-effect dry/wet is via each effect's built-in `wet` param.
- **LFO targets** are the signals in `getTargetSignal()`: `osc.detune`, `filter.frequency`, `filter.Q`, `outputGain.gain`, `fxMixer.fade`. All LFOs use `convert = false; units = "number"` so Tone's auto-conversion doesn't zero out the base value — see `applyLfoRouting()`.

---

## File map

| File | Role |
|---|---|
| `audio.ts` | All Tone.js node lifecycle, signal chain, exported setters. The only file that talks to Tone. |
| `store.ts` | Zustand store with **flat** fields (no nesting, no persist). Every module has its own `XxxLevel` / `setXxx` pair. |
| `types.ts` | Shared types: `WaveType`, `LfoTarget`, `NoiseType`, `SwirlMode`, `SeqStep`. |
| `notes.ts` | `noteToHz()` + keyboard layout constants. |
| `utils.ts` | `makeLogSliderMap()` for log-scaled sliders. |
| `ModuleHelp.tsx` | Shared "?" popover. **Every module must mount this as the first child of its `.module` div.** |
| `Eurorack.tsx` | Top-level container. Hosts the Oscillator inline (not as a separate file) and assembles rack rows. |
| `Eurorack.module.css` | Shared styles for `.module`, knobs, sliders, per-module selectors. |
| `Oscilloscope.tsx`, `WaveSelector.tsx`, `Keyboard.tsx` | Oscillator-local widgets. |
| `Filter.tsx`, `Mixer.tsx`, `Crush.tsx`, `Space.tsx`, `Swirl.tsx`, `Adsr.tsx`, `Lfo.tsx`, `Sequencer.tsx`, `Random.tsx` | Module components. |

---

## Module component pattern

Every module follows this shape:

```tsx
import { useCallback } from "react";
import { useSynthStore } from "./store";
import { initAudio, setXxx } from "./audio";
import ModuleHelp from "./ModuleHelp";
import styles from "./Eurorack.module.css";

const palette: React.CSSProperties = {
  ["--module-bg" as string]: "linear-gradient(180deg, #... 0%, #... 100%)",
  ["--module-border" as string]: "rgba(..., 0.35)",
  ["--module-text" as string]: "#...",
  ["--module-accent" as string]: "#...",
  ["--module-track" as string]: "#...",
  ["--module-width" as string]: "calc(var(--module-u, 40px) * <U>)",
};

export default function MyModule() {
  const { value, setValue: storeSet } = useSynthStore();

  const handleChange = useCallback((e) => {
    const v = /* ... */;
    storeSet(v);                            // 1. update store
    initAudio().then(() => setXxx(v));      // 2. push to audio node
  }, [storeSet]);

  return (
    <div className={styles.module} style={palette}>
      <ModuleHelp title="..." description="..." controls={[...]} />
      <h3 className={styles.moduleHeader}>My Module</h3>
      <div className={styles.moduleBody}>
        {/* .moduleKnobRow > .moduleKnob(s) */}
      </div>
    </div>
  );
}
```

**Non-negotiables:**
1. `ModuleHelp` must be the first child of the `.module` div (absolute-positioned "?" button).
2. The handler idiom is always `storeSet → initAudio().then(setXxx)`. Never call the audio setter without `initAudio()` first — `initAudio()` is idempotent and guards against the user touching a slider before the AudioContext has been resumed.
3. Width is declared in rack units via `--module-width` using `calc(var(--module-u, 40px) * N)`. Current widths: Mixer/Filter/Crush/Random 6U, Space/Adsr/Swirl 8U, Oscillator/Sequencer/Lfo 20U. Stay close to the per-column width so the three-column layout stays tidy.
4. Use CSS variables (`--module-bg`, etc.) — never hardcode colors in the component. The shared `.moduleSlider`, `.moduleKnob`, etc. read the palette vars.
5. Reuse shared CSS selectors: `.moduleKnobRow`, `.moduleKnob`, `.moduleKnobLabel`, `.moduleKnobValue`, `.moduleSlider`, `.moduleSubSection`, `.moduleSubHeader`, `.moduleDivider`, `.moduleSelect`.

---

## Adding a new module — checklist

1. **Types** — add any new enums/interfaces to `types.ts`.
2. **audio.ts** — add private Tone node handles, state mirrors (`currentXxx`), construct inside `initAudio()` in the correct spot in the signal chain, wire connections, add exported setters, update `dispose()` to stop + dispose + null-out.
3. **store.ts** — add flat fields to `SynthStore`, defaults in the `create()` initializer, and setters at the bottom. Keep the order consistent with declaration order.
4. **Component file** — follow the pattern above. Pick a palette that's visually distinct from existing modules.
5. **Eurorack.tsx** — import and render it in the appropriate `.moduleColumn`. Current layout: column 1 = Oscillator + Sequencer + Lfo (20U), column 2 = Mixer + Filter + Crush + Random (6U), column 3 = Space + Adsr + Swirl (8U). All three columns live in a single `.modulesRow`.
6. **Eurorack.module.css** — add any module-specific selectors at the bottom of the file.
7. **ARCHITECTURE.md** (this file) — update the signal chain diagram + module list if the topology changes.

---

## Trigger-mode refcount (Sequencer + Random)

Sequencer and Random **both** need the envelope to be in trigger mode (non-pass-through) so each step/note shapes through ADSR. But the user has their own Drone/Trigger toggle in the Oscillator module. These two concerns are decoupled via a refcount:

```
effectiveTriggerMode = userTriggerMode || forcedTriggerCount > 0
```

- `userTriggerMode` is what the Drone/Trigger toggle sets.
- `forcedTriggerCount` is incremented by `pushForcedTriggerMode()` (called from `startSequencer`/`startRandom`) and decremented by `popForcedTriggerMode()` (called from `stopSequencer`/`stopRandom`).
- `setTriggerMode()` only touches the hardware envelope when the effective mode actually flips. If the user toggles while a forced source is active, their preference is stored silently and restored when the last force ends.
- `applyEnvelopeState()`, `setEnvAttack`/`Decay`/`Sustain`/`Release`, and `setWaveType` all check `effectiveTriggerMode()` instead of a raw flag.

**If you add another autonomous source** (e.g., an arpeggiator), call `pushForcedTriggerMode()` on start and `popForcedTriggerMode()` on stop. That's it — no other state to manage.

---

## Transport refcount (Sequencer only for now)

Sequencer uses `Tone.getTransport().scheduleRepeat()`. The transport is shared — if a future module (arpeggiator, clock-synced delay) also needs it, use `ensureTransport()` / `releaseTransport()`. They refcount start/stop of the shared transport so multiple clients don't step on each other.

Random does **not** use the transport — it's a plain `setTimeout` chain because its rate is randomized per-tick, which doesn't map cleanly to musical subdivisions.

---

## Sequencer specifics

- 16 steps, two rows of 8 in the UI. `seqLoopLength` (8 or 16) controls how many play; the rest are dimmed via `.seqCellDim`.
- Each step is a `SeqStep = { note: string; octave: number; on: boolean }`.
- Click the step label to toggle `on`. Click ▲/▼ arrows to shift pitch chromatically — the `shiftPitch()` helper handles octave wraparound.
- Live edits during playback: the component's `useEffect` calls `updateSequencerOpts({ loopLength, gate, steps })` whenever those change. `startSequencer` stores `opts` by reference inside `seqState.opts`; the scheduled callback reads it each tick, so mutating via `updateSequencerOpts` is enough — no restart.
- BPM has its own effect that calls `setSequencerBpm(bpm)` which ramps `Tone.Transport.bpm`.
- The scheduled callback uses `Tone.getDraw().schedule(() => s.onTick(i), time)` to marshal the UI highlight back to the main thread — calling React setState directly from the audio callback causes warnings.

---

## Random specifics

- Log-uniform pitch distribution (`Math.exp(randBetween(log(min), log(max)))`) so sweeps across wide ranges sound musical, not bottom-heavy.
- Min/Max clamping is in the component: dragging Min above Max nudges Max up, and vice versa. Same for Rate.
- The `stateRef` ref mirrors the latest store values so `handlePlay` can read them without stale closures — but the running random loop sees updates via `updateRandomOpts` in the effect.

---

## Defaults worth knowing

| Field | Default |
|---|---|
| `oscLevel` | 1 |
| `noiseLevel` | 0 (silent; `noise.start()` is called at init regardless) |
| `noiseType` | "white" |
| `crushDrive` / `crushBits` / `crushMix` | 0 / 16 / 0 (fully bypassed) |
| `swirlMode` / `swirlRate` / `swirlDepth` / `swirlFeedback` / `swirlMix` | "chorus" / 2 Hz / 0.5 / 0.2 / 0 (bypassed) |
| `seqBpm` / `seqLoopLength` / `seqGate` | 120 / 16 / 0.5 |
| `seqSteps` | 16 × A4, all on |
| `randHzMin` / `randHzMax` | 110 / 880 |
| `randRateMsMin` / `randRateMsMax` | 150 / 600 |
| `randGateMs` | 120 |

---

## Gotchas

- **Never mutate `seqSteps` in place** — always build a new array (the `setSeqStep` store helper already does this). Zustand shallow-compares references.
- **Noise is always running after init** — level is controlled via `noiseGain`, not `noise.start/stop`. If you mute it by stopping the node you can't resume without re-creating it.
- **`BitCrusher.bits` is a `Signal`**, not a plain number. Use `bitCrusher.bits.value = N`.
- **`Tone.Distortion.distortion` IS a plain property**, not a signal. Assignment is fine.
- **`dispose()` must stop Sequencer + Random first**, then tear down nodes. Otherwise timers/transport keep firing into disposed nodes → console spam.
- **Mobile viewport**: `.modulesRow` has `flex-wrap: wrap` so rows reflow. Keep new modules ≤ ~16U or mobile will horizontal-scroll.
- **Adding a new LFO target**: add the enum value to `types.ts` (`LfoTarget`), add it to `TARGET_DEPTH` in `audio.ts`, add the case to `getTargetSignal()`, and add the restoration case to `restoreTargetValue()`.
- **Swirl mode switches rebuild the node.** `setSwirlMode()` calls `buildSwirlEffect()` which disposes+recreates. Any `setSwirl*` setter called right after a mode change will act on the freshly-built node because the cached `currentSwirl*` values are re-applied inside `buildSwirlEffect()`. Don't cache a ref to `swirlEffect` outside `audio.ts`.
