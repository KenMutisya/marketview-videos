# Research

What the ecosystem looks like for code-driven product video, what this studio
took from it, and what it deliberately did not.

Conducted 27 October 2026 against the installed versions listed below.

## Installed versions

| | |
| --- | --- |
| Node | 26.8.1 |
| Remotion | 4.0.539 (`remotion`, `@remotion/cli`, `bundler`, `renderer`, `transitions`, `fonts`, `zod-types`) |
| React | 19.2.3 |
| Playwright | 1.64.1 (Chromium headless shell 156) |
| ffmpeg / ffprobe | 8.1.1 (Homebrew) |
| zod | 4.5.4 — pinned, see note below |
| Host | macOS 26.6 (darwin 25.6), 10 cores, 16 GB |

> **zod must be exactly 4.5.4.** Remotion 4.0.539 bundles `@remotion/zod-types`
> against that version and refuses to render on a mismatch with a "Version
> mismatch" error that does not name the render as the failure. `npm i zod@4.5.4
> --save-exact`, and keep every `@remotion/*` package pinned without a caret.

## Remotion: what the installed version actually offers

Checked against the installed packages and current documentation rather than
tutorials, several of which are written against pre-4.0 APIs.

- **Frame-based timing.** `useCurrentFrame()` plus `interpolate` and `spring`.
  Everything is a pure function of the frame, which is what makes a render
  reproducible. The studio enforces this: no `Math.random()`, no CSS keyframes,
  no `Date.now()` in a composition. Anything that wants randomness goes through
  `src/utils/seed.ts`.
- **`spring({ durationInFrames })`** lets a spring be given an exact length,
  which is what makes spring motion safe inside a fixed-length scene. Without
  it an under-damped spring can still be settling when the scene cuts.
  `durationRestThreshold: 0.001` avoids a visible truncation.
- **`<TransitionSeries>`** (`@remotion/transitions`) overlaps adjacent
  sequences. The total length is the sum of the scenes *minus* the sum of the
  transitions. Getting this wrong is the most common way one of these films
  ends up with a black tail, so the studio derives composition duration from
  `storyboardFrames()` rather than from a constant, and a test asserts it.
- **Custom `TransitionPresentation`s** are a small contract: a component that
  receives `presentationProgress` and `presentationDirection` and renders the
  children. All four of the studio's transitions are written this way.
- **`calculateMetadata`** can resolve duration and size at render time. The
  studio does not need it — duration is pure arithmetic over the storyboard —
  so it stays out.
- **`@remotion/fonts`** registers a `@font-face` and blocks the render until it
  loads. Preferred over `@remotion/google-fonts`, which fetches from a CDN at
  render time: a render that silently falls back to a system font changes the
  typography of every frame and still exits zero.
- **`delayRender` / `continueRender`** gate the render on async work. Used once,
  for fonts.
- **Node APIs** (`@remotion/bundler`, `@remotion/renderer`) do **not** read
  `remotion.config.ts`. The studio's programmatic renderer passes the same
  values explicitly; the config file covers only the CLI and Studio.

### Performance findings

Measured on this machine while building the launch film.

- **A full-frame CSS `filter: blur()` over a 3024 px screenshot is the single
  most expensive thing a frame can do.** The opening scene originally blurred
  its backdrop at render time and frames began exceeding the 30 s timeout, with
  the browser target closing under memory pressure at concurrency 6. Baking the
  same treatment once with ffmpeg (`scripts/make-derived-assets.ts`) removed the
  failure entirely and cost nothing visually. **Rule adopted: a static effect
  belongs in an asset, not in a frame.**
- **JPEG frame quality matters for dark gradients.** At Remotion's default
  quality of 80 the navy field showed visible blocking. 98 is visually
  indistinguishable from PNG here and still roughly three times faster to
  encode.
- **Concurrency 4 is the right setting on 10 cores / 16 GB** for 1920×1080 with
  2× retina screenshots in frame. 6 was unstable.
- Measured throughput: **46–61 ms/frame** across the four editions. The full
  four-film export is about 3.5 minutes of rendering.

## Open-source projects studied

Read from public READMEs and repository structure via the GitHub API. Nothing
was cloned or executed — a project that exists to run a browser and shell out
to ffmpeg is not something to run unexamined for a design survey.

### [Vincentwei1021/video-shotcraft](https://github.com/Vincentwei1021/video-shotcraft) — Apache-2.0

An agent skill with a library of ~150 "shot recipe cards", a rendered gallery of
motion previews, beat-cut editing and per-frame checking.

- **Taken:** the idea that *shots are data an agent selects*, not components an
  agent writes. The studio's scene kinds are a much smaller version of the same
  idea.
- **Taken:** per-frame checking as a required step, not an optional one.
- **Not taken:** a 150-entry recipe library. For one product and four editions
  that is a large surface of untested decoration. The studio implements six
  scene kinds and every one of them is used by a shipped film.

### [ashrafchowdury/programatic-demo](https://github.com/ashrafchowdury/programatic-demo) — MIT

Playwright records a real flow; Remotion adds a Screen Studio-style camera.

- **Taken, and the best idea in the survey: camera work derived from the
  interaction, not authored separately.** Their flow DSL records *where you
  clicked and when*, and the zoom follows. The studio's equivalent is the
  `regions` map in the capture manifest: the capture pipeline records the real
  bounding box of a named element, and scenes frame to `{ region: "buy" }`
  rather than to pixel coordinates. A layout change in the product then becomes
  a build error instead of a silently wrong shot.
- **Taken:** capture at a higher resolution than the render, so pushing in
  stays sharp. Captures are 2× DPR (3024×1890) for a 1920-wide film.
- **Not taken:** video-based capture. Their pipeline records a screencast. The
  studio takes stills and moves the camera inside them, which is deterministic,
  far cheaper to render, and re-framable afterwards without re-driving the
  browser. The cost is that genuinely animated product behaviour cannot be
  shown; see *Known limitations* in the README.

### [sub-level/marketing-videos](https://github.com/sub-level/marketing-videos) — MIT

Launch films written as Remotion compositions by a coding agent, with AI-generated
footage and a documented process.

- **Taken:** *one scene tree, many editions.* They ship six editions from one
  tree; the studio ships four from one `StoryboardFilm` component.
- **Taken, as a standard to hold to:** deriving motion grammar from a reference
  by **measuring** it — cap heights, per-letter arrival frames — rather than by
  impression. No reference film was supplied here (see `REFERENCE_ANALYSIS.md`),
  so the studio instead measures the *product*: every colour, radius and type
  step comes from MarketView's own design tokens.
- **Not taken:** generated footage. The brief is a product demonstration; the
  evidence should be the product.

### [jonny-1812/demo-video-factory](https://github.com/jonny-1812/demo-video-factory) — MIT

URL in, SaaS demo out, packaged as an agent skill with an MCP server.

- **Taken:** the shape of the CLI surface — register a product, capture, preview,
  render, export.
- **Not taken:** fully automatic generation from a URL. A film that nobody
  art-directed looks like a film that nobody art-directed.

## Technologies evaluated and rejected

| Considered | Decision |
| --- | --- |
| **Three.js / React Three Fiber** | **Rejected for this film.** The cinematic need here is depth on flat UI — a perspective tilt, a parallax plane, a window that rises. CSS 3D transforms give exactly that at a fraction of the render cost and with no WebGL context to fail in a headless renderer. A real 3D device mock-up would justify R3F; a tilted dashboard does not. Documented as the first thing to add if a device shot is wanted. |
| **GSAP** | **Rejected.** GSAP is a timeline driven by wall-clock time. Remotion needs a pure function of the frame. Using it would mean fighting it. |
| **Lottie / Rive** | **Rejected.** Both need an external authoring tool, which puts part of the film outside the repository and breaks "reproducible from versioned source". |
| **Canvas / WebGL effects** | **Rejected for now.** The grain and the network motif are SVG, which composites correctly and costs nothing. |
| **Playwright video recording** | **Rejected**, see above. Non-deterministic frame timing, far larger assets, and no way to re-frame a shot later. |
| **ffmpeg** | **Adopted**, for three jobs: baking static image treatments, extracting QA frames, and measuring the output (`ffprobe`, `ebur128`). |
| **Zod** | **Adopted** for storyboard validation. Storyboards are authored in TypeScript, so the compiler catches most mistakes; Zod catches the rest at module load with a readable path instead of a blank frame. |
| **A paid TTS service for narration** | **Rejected as a requirement.** The schema supports a narration track and ducks the music under it, but no film needs one and nothing breaks without a key. |
| **Licensed music** | **Rejected in favour of synthesis.** `scripts/synth.ts` generates the score and cues. ~400 lines of oscillators, envelopes, a one-pole filter and a Schroeder reverb, and the output is unambiguously ours to use. |

## What this studio does that the surveyed projects do not

- **The capture pipeline refuses to emit a screenshot containing personal data.**
  Identifiers in the product's fixture data are replaced in the DOM *before* the
  pixel is taken, and a scan after redaction fails the run if anything survives.
  None of the surveyed projects treat capture as a privacy boundary.
- **The loop seam is measured, not asserted.** `scripts/qa/loop.ts` extracts the
  first and last frame of a loop-safe edition and reports the mean pixel
  difference. The conference loop is at 0.00%.
- **Crop anchoring is derived from the shape of the region.** A UI strip much
  wider than its container keeps its left edge — the badge and the headline —
  instead of showing its middle. This one rule fixed every illegible crop in the
  feature montage and the conference risk scene.
