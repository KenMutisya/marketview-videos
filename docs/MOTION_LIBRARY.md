# Motion library

Primitives are marked **shipped** (a rendered film uses it) or **unused**.

Seven of them are currently unused. That is a real finding, not a plan: they
were built while the scene kinds were still forming, and the scenes ended up
calling `reveal()` directly or solving the same problem inline. A component no
film uses is a component nothing has tested, so each one below is either a
candidate for a scene that needs it or a candidate for deletion.

## Timing — `src/motion/timing.ts`

| Export | What it does |
| --- | --- |
| `reveal({frame, fps, delay, motion, accent})` | 0→1 spring progress from the active motion personality. The basis of every entrance. |
| `revealWindow({..., out, outFrames})` | A reveal that also closes, for elements that live for part of a scene. |
| `staggerDelay(index, motion, base)` | Delay for the nth item in a group. |
| `ramp(frame, from, to, easing)` | Clamped 0→1 across a window. Camera moves. |
| `EASE_OUT` / `EASE_IN_OUT` / `EASE_IN` | `cubic-bezier(.16,1,.3,1)` and friends. |

Springs are given `durationInFrames` so they cannot still be settling when a
scene cuts, and `durationRestThreshold: 0.001` so they are not visibly
truncated.

## Entrances — `src/motion/primitives.tsx`

| Component | Props | Notes |
| --- | --- | --- |
| shipped · `<Reveal>` | `delay, exitAt, direction, distance, from, accent` | Opacity + offset + optional scale. The workhorse. |
| **unused** · `<Stagger>` | `children[], delay, step, …` | Reveals children in sequence. |
| **unused** · `<MaskReveal>` | `delay, durationInFrames, direction` | Hard-edged clip-path wipe. For type that should not fade. |
| **unused** · `<BlurIn>` | `delay, amount` | Rack-focus entrance. Sharpens and settles. |

## Typography — `src/typography/`

| Component | Notes |
| --- | --- |
| shipped · `<KineticHeadline lines emphasise …>` | The film's primary device. Words rise behind a mask; `emphasise` carries named words in the accent. `wordStagger` defaults to 2 frames. |
| shipped · `<Eyebrow>` | Uppercase, tracked, 700. Sets context before a headline. |
| shipped · `<Lede>` | Supporting sentence, measured to the format. |
| shipped · `<AnimatedCounter to prefix suffix grouped>` | Decelerating count-up; lands exactly on `to`. |
| **unused** · `<TextHighlight>` | Wiping brand-colour underline on a word. |
| shipped · `fitSize(lines, maxWidth, maxSize)` | Sizes a headline from its longest line so it never wraps. |

## Camera — `src/camera/Camera.tsx`

**None of this is used by a shipped film.** The walkthrough and chat scenes
build their own transform inline, which is the duplication `<Camera>` exists to
prevent. Either the scenes should be moved onto it or it should go.

| Export | Notes |
| --- | --- |
| **unused** · `<Camera move={{zoom, pan, tilt, swing, window, easing}}>` | One transform stack for the whole studio. Perspective + translate + scale + rotate. |
| **unused** · `useAmbientPush(strength)` | A slow push for a shot that would otherwise sit still. |
| **unused** · `<ParallaxLayers layers travel>` | Multi-plane depth for flat UI art. |

## Effects — `src/effects/Surfaces.tsx`

| Component | Notes |
| --- | --- |
| `<GradientField tone drift>` | The background. Two tones; the light source drifts across a scene. |
| `<Vignette strength>` | Deliberately low. 0.42 on dark, 0.16 on light. |
| `<Grain opacity seed>` | **Static** SVG turbulence. Animated grain costs a full-frame repaint every frame and encodes badly at these bitrates. |
| `<Spotlight x y radius intensity>` | A focal point on a flat composition. |
| `<NetworkField count seed buildFrames>` | The market-network motif: seeded nodes and nearest-neighbour links that draw themselves in. The one piece of generative art in the studio, and it is deterministic. |

## Product interface — `src/components/`

| Component | Notes |
| --- | --- |
| `<UIShot capture from to window anchor>` | **The most important component.** A framed view onto a capture that moves *inside* the screenshot. `anchor="auto"` picks left/top/centre from the region's shape. |
| `<BrowserFrame width height url scale elevation>` | Minimal application window. Not a photoreal browser — a product film wants the product. |
| `<Cursor path size appearAt leaveAt>` | Cursor choreography. Legs are quadratic arcs with a perpendicular control point, which is what stops reconstructed cursor motion reading as a robot. Click feedback is one expanding ring. |
| `<PhoneFrame screenWidth screenHeight>` | A generic handset: a slab, a thin bezel, a pill cut-out. Deliberately not a replica of any manufacturer's design. |
| `<ChatThread beats …>` | A messaging thread drawn natively from a transcript. Bottom-anchored, `flex-shrink: 0` children, masked top edge, animated `maxHeight` so arriving bubbles push the stack up. |
| `<LogoLockup size markOnly build>` | The product's own SVG mark plus a wiping wordmark. |
| `<StatRail stats direction>` | Verified numbers as a measured rail. Values count up via `parseStat`; the final string reserves the width so nothing shifts as digits arrive. |
| `<Chip>` | Standing labels, including the sample-data disclosure. |

## Transitions — `src/transitions/presentations.tsx`

`dip`, `maskWipe` and `push` are used by shipped films. `zoomThrough` is
implemented and registered but **no storyboard currently selects it** — it was
replaced by a bright `dip` when a reveal-to-walkthrough zoom read as a smear
between two similar dashboards. Each is a `TransitionPresentation`
for `@remotion/transitions`. See `STYLE_GUIDE.md` for which carries what.

`dip` drives its veil past 1 at the midpoint (`×1.45`) so the field is briefly
solid. A veil that only reaches ~0.9 leaves both scenes showing through and
reads as a smear rather than a cut.

## Pixel stability — `src/utils/pixels.ts`

| Export | Notes |
| --- | --- |
| `snap(value)` | Rounds an animated offset to a whole pixel. |
| `settle(frame, from, to)` | Returns exactly `1` past the window, so a transform built from it lands on a clean value rather than a hair off. |
| `arriveTransform(frame, settleFrame, build)` | A transform that becomes `none` once the element has arrived. |

Used by every entrance in the studio. See `STYLE_GUIDE.md` for the rule.

## Determinism helpers — `src/utils/seed.ts`

`rand(seed)`, `randRange(seed, min, max)`, `randSeries(seed, n)`. Anything that
wants a random value uses these. A test asserts stability and range.
