# Architecture

The studio is three pipelines with one shared contract.

```
  PRODUCT                CAPTURE                    FILM
  ───────                ───────                    ────
  MarketView      →   Playwright flows      →   capture manifest
  reference build     capture/flows/*.ts        public/assets/screenshots/
                      redact → shoot →          manifest.json
                      scan → record regions     (pixels + named regions)
                                                        │
                                                        ▼
  BRAND + PRODUCT  →  STORYBOARD (data)  →  StoryboardFilm  →  MP4 + stills
  src/brands/         src/storyboards/       one component      output/
  src/products/       scenes as data         + scene registry
                                                        │
                                                        ▼
                                                 QA (measured)
                                                 ffprobe · contact sheets
                                                 loop seam · loudness
                                                 docs/QA_REPORT.md
```

The contract between them is the **capture manifest**: pixels plus the
normalised bounding box of every named element. A scene says
`{ region: "buy" }`; it never says `{ x: 0.17, y: 0.44 }`. Rename the element in
the product and the next render fails with the name that broke, rather than
quietly framing the wrong part of the screen.

## Layers

| Layer | Path | Knows about |
| --- | --- | --- |
| Product facts | `src/products/` | What the product does, with a source for every claim |
| Brand | `src/brands/`, `src/types/brand.ts` | Colour, type, radii, logo, motion personality |
| Format | `src/types/format.ts` | Resolution, safe area, type scale, UI presentation |
| Storyboard | `src/types/storyboard.ts`, `src/storyboards/` | Scenes, timing, transitions, audio |
| Scenes | `src/scenes/` | How one kind of beat looks and moves |
| Primitives | `src/motion/`, `src/camera/`, `src/typography/`, `src/effects/`, `src/components/`, `src/transitions/` | Reusable motion, nothing product-specific |
| Engine | `src/compositions/StoryboardFilm.tsx` | Turning scene data into a timeline |
| Output | `src/rendering/` | Which editions exist and how they encode |
| Capture | `capture/`, `configs/` | Driving a real product safely |
| Tooling | `scripts/` | CLI, validation, audio synthesis, QA |

Dependencies point one way: primitives know nothing about MarketView, scenes
know nothing about which film they are in, and the engine knows nothing about
what a scene looks like.

## The two abstractions that carry the system

### 1. Format

A `FormatSpec` is not a resolution. It carries the safe area, a five-step type
scale, a text measure and a **UI presentation mode** — `panorama`, `column` or
`billboard`. Scenes ask the format how big things should be. That is what makes
the vertical edition a recomposition rather than a crop:

- `panorama` (widescreen and 4:3) — a landscape window, height-limited so its
  chrome and the scene caption both fit. Each format declares its own
  `uiHeightShare`: at 4:3 the 16:9 value would produce a window wider than the
  frame.
- `column` (vertical) — a **portrait** window. The capture is cropped to the
  region that matters so the interface fills a phone, instead of a shrunken
  desktop card marooned in empty space.
- `billboard` (conference) — larger type, slower motion, and walkthrough scenes
  that open already framed on the target region, because small UI chrome does
  not read from four metres away.

### 2. Storyboard

A storyboard is data, validated by Zod. A scene is a tagged union member:

```ts
{
  id: "network",
  kind: "uiWalkthrough",
  purpose: "Show the live network: Africa view, then a real dive into Kenya.",
  seconds: 6.0,
  capture: "markets-network",
  thenCapture: "markets-kenya",   // a real state change, mid-scene
  thenAt: 3.5,
  to: { region: "map", pad: 0.06 },
  move: [0.55, 3.1],
  cursor:   [{ at: 3.2, x: 0.545, y: 0.52, click: true }],
  callouts: [{ at: 4.2, text: "Kenya · 15 markets live", x: 0.7, y: 0.17, tone: "good" }],
  transitionOut: { kind: "maskWipe", seconds: 0.4, direction: "left" },
}
```

`purpose` is required. A scene that cannot say why it exists does not get to
exist, and the QA report prints it back.

**Scene kinds** — all six are used by a shipped film:

| Kind | Does |
| --- | --- |
| `statement` | Kinetic type on a brand field. The film's voice. |
| `brandReveal` | Identity lands, the interface rises behind it. |
| `uiWalkthrough` | A framed move *inside* a real product surface, with cursor and callouts. |
| `featureMontage` | Capabilities as rows, each anchored to a real region of the UI. |
| `apiBeat` | A request types out, a real response shape lands. |
| `closing` | Identity, positioning, verified numbers, CTA. |

Adding a kind means adding a variant to the schema and an entry in
`src/scenes/index.tsx`. Nothing else changes.

## Timing

Transitions overlap their neighbours, so a film is shorter than the sum of its
scenes:

```
total = Σ scene frames − Σ transition frames (excluding the last scene's)
```

`storyboardFrames()` is the single implementation. `Root.tsx`, the renderer, the
QA expectations and the audio cue placement all call it, so a re-timed scene
cannot leave a black tail. A test asserts the reference edition is exactly 900
frames, and another asserts every authored duration lands on a whole frame.

## Determinism

Frame *n* must produce the same pixels on every render.

- No `Math.random()`. `src/utils/seed.ts` derives values from a string seed.
- No `Date.now()`, no CSS animations, no transitions.
- Captures are taken under a frozen clock (`page.clock.setFixedTime`) with CSS
  animations disabled, so date-derived UI does not drift between capture runs.
- Fonts are bundled, not fetched.
- Film grain is a static SVG turbulence pattern, not per-frame noise: animated
  grain costs a full-frame repaint every frame and encodes badly at these
  bitrates.

## Why there is no 3D

Evaluated and rejected — see `RESEARCH.md`. The cinematic need is depth on flat
UI: a perspective tilt, a parallax plane, a window that rises on an angle. CSS
3D transforms deliver that at a fraction of the cost and with no WebGL context
to fail inside a headless renderer. `src/camera/Camera.tsx` owns the whole
transform stack so no scene invents its own.
