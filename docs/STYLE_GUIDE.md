# Style guide

The rules the films hold to. Where a rule has a cost, the cost is stated.

## Fields

Two, and only two.

| Field | Value | Used for |
| --- | --- | --- |
| **deep** | radial `#1A237E → #0E1442 → #080C2B` | Statement, brand reveal, API beat, chat, close |
| **light** | radial `#FFFFFF → #F8FAFC → #EBF0F6` | Anything showing the product interface |

Keeping it to two makes every cut between them mean something: the film speaks
on dark and demonstrates on light. A third field would dilute that to nothing.
`accent` exists in the type union and is currently unused — it is there for a
product whose identity is not navy.

## Colour

Lifted from the product; see `REFERENCE_ANALYSIS.md` for the table.

- **Green `#6AA946` is the emphasis colour.** It comes from the logo and it is
  reserved for the one word in a headline that carries the point, the CTA, and
  the leading edge of a wipe.
- **Status colours are status only.** `good` `#2E7D32`, `warn` `#B26A00`,
  `bad` `#C62828`, `info` `#1565C0`. A callout uses them to mean something;
  nothing uses them for decoration. This is the product's own rule, copied.
- **Never use brand navy or teal to mean status.**

## Typography

Inter, self-hosted, weights 100–900 variable.

| Step | Wide | Vertical | Conference | Role |
| --- | --- | --- | --- | --- |
| display | 128 | 108 | 150 | The hero line, the one big number |
| title | 78 | 72 | 96 | Scene headline |
| head | 44 | 46 | 58 | Card title, stat value |
| body | 30 | 34 | 40 | Supporting sentence |
| meta | 20 | 24 | 26 | Eyebrow, caption, source line |

Rules:

- **Headlines are auto-sized from their longest line** (`src/typography/fit.ts`)
  so the same sentence fits at three aspect ratios without wrapping. This is a
  heuristic over mean glyph advance, not a text measurement — it is conservative
  and clamped, and it is listed in the QA report as not automatically verified.
- **Author explicit line breaks.** `lines: ["They don't show up", "on dashboards."]`,
  never one long string. A wrapped line breaks the masked reveal.
- **Display type tracks tight**: `-0.022em`. Eyebrows track wide: `+0.14em`,
  uppercase, 700.
- **Word stagger is 2 frames** for display type. The layout stagger (4 frames
  at `enterprise`) makes a six-word headline take two seconds to arrive, which
  is most of a hook.

## Motion

- **Every animation is a pure function of the frame.** No CSS animations, no
  transitions, no `Date.now()`, no `Math.random()`. Seeded values only.
- **Entrances come from the motion personality**, not from a scene. Changing
  `enterprise` to `highEnergyTech` re-times an entire film.
- **Nothing overshoots** at `enterprise` (damping 200). Overshoot is reserved
  for `highEnergyTech`, where it reads as energy rather than as a wobble.
- **Every shot moves — but never the text.** A held frame reads as a
  screenshot, so walkthrough shots carry a slow push for their whole duration.
  That push is applied to the *screenshot*, inside `<UIShot drift>`, never to a
  container that also holds callouts or captions.
- **Text pins when it arrives.** Animated offsets round to whole pixels
  (`src/utils/pixels.ts`) and elements set `transform: none` once settled. Text
  inside something changing by a fraction of a pixel per frame is re-rasterised
  every frame; it looks soft on a laptop and visibly dances on a television.
- **Never animate a layout property under text.** An animated `maxHeight` or
  `width` reflows everything around it on every frame. Where one is needed —
  chat bubbles unfurling — round it and remove the constraint the moment the
  element has landed.
- **Camera moves go through `<Camera>` or `<UIShot>`.** No scene invents its own
  transform stack.

## Transitions

Five, each with a job. A transition that is only decoration is a cut that got
expensive.

| Transition | Carries | Used |
| --- | --- | --- |
| `dip` through `#060A20` | A change of subject | Statement → anything, montage → close |
| `dip` through `#F3F6FA` | Dark voice → light product | Reveal → walkthrough |
| `maskWipe` | A change of topic inside one idea | Network → pricing |
| `push` | Advancing through a sequence | Pricing → capabilities |
| `fade` | Two shots of the same thing | Within the chat film |
| `cut` | Nothing — the sharpest join available | Network → pricing in the launch film |
| `zoomThrough` | Continuing into the subject | Available, currently unused |

**A crossfade between two light interface scenes produces a doubled image.** It
was used between pricing and capabilities in an early cut and read as a smear.
Use `push`, a bright `dip`, or — best — a hard `cut`.

**Pacing is a rhythm, not a grid.** The first cut of the launch film gave every
scene 4.8–6.0s (σ = 0.46s). It now runs 4.0–7.5s (σ = 1.24s): the shot that
proves the thesis is the longest, the one the audience already understands is
the shortest, and one join is a hard cut.

## Product interface

- **Show real captures.** No redrawn UI, no invented screens.
- **Frame to a named region**, never to pixel coordinates.
- **A window must fit the canvas.** `uiFrameSize` is height-constrained; a
  window that overflows loses its chrome and stops reading as a window.
- **A cut edge fades, it does not slice.** An interface excerpt cropped by a
  card edge gets a gradient on both cut sides, so a half-visible row reads as a
  list continuing rather than as a rendering fault. This matters most in 4:3,
  where shorter rows cut more often.
- **Crops anchor by shape.** A strip much wider than its container keeps its
  left edge; a panel much taller keeps its top. Centring either crops away the
  part that carries the meaning.
- **Disclose sample data** on screen whenever fixture data is visible.
- **A phone in a 16:9 frame needs its UI scaled up.** At true scale a handset
  occupying ~22% of the frame width renders text far smaller on screen than it
  would in the hand. The landscape chat composition scales the UI by about a
  fifth and shows fewer messages.

## Sound

- Music sits at `musicGain` 0.58–0.72 and fades at both ends.
- Cues are derived from the storyboard, not placed by hand.
- A silent edition renders **no audio stream**, not a muted one.
- Target integrated loudness −20 to −11 LUFS; the QA report measures it.

## What the films must never do

- Claim a number that is not in `docs/PRODUCT_BRIEF.md`.
- Show a person's name, email, phone number or API token.
- Use a third-party brand's wordmark, iconography or industrial design. The
  phone in the Rep film is drawn generically for exactly this reason, and the
  chat styling follows messaging conventions without copying one product's
  identity.
- Animate for its own sake.
