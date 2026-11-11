# Reference analysis

## No reference material was supplied

`references/` is empty. No reference film, storyboard, brand sheet or motion
study was provided for this build, so **this document contains no analysis of
any reference film.** Inventing one would be worse than useless: a motion
grammar described but not measured is a guess dressed as a specification.

What follows is (1) the method to use when a reference *is* supplied, and
(2) what the film's visual language was actually derived from instead.

## The method, when a reference exists

The approach worth copying is the one `sub-level/marketing-videos` documents:
derive a motion grammar by **measuring** a reference, not by impression. Extract
every frame of a section and read the numbers off them.

1. **Extract frames** at the film's own frame rate (`references/README.md` has
   the commands). Impressions of easing are unreliable; frame indices are not.
2. **Composition** — measure the type's cap height as a fraction of frame
   height, the left margin as a fraction of frame width, and where the optical
   centre sits. Record them as ratios, not pixels, so they port across formats.
3. **Typography** — for a word-by-word reveal, note the frame each word's
   opacity first becomes non-zero. The difference is the stagger, in frames.
   Note the travel distance as a fraction of the font size.
4. **Motion** — sample an element's position every frame across a move and plot
   it. A linear plot is a `linearTiming`; an S-curve is a bezier; an overshoot
   that settles is a spring, and the overshoot magnitude gives the damping.
5. **Camera** — measure the scale of a fixed feature at the first and last
   frame of a push. That is the zoom amount; the frame count is the duration.
6. **Editing** — list shot-boundary timestamps and look at the gaps. Cut rhythm
   is usually the single biggest difference between a film that feels directed
   and one that does not.
7. **Narrative** — write down what each shot is *for* in one sentence. If a
   shot has no sentence, it is decoration.

Record the measurements here, then encode them in a motion personality in
`src/types/brand.ts` so the whole film inherits them.

## What this film's language was derived from instead

With no reference supplied, the film is measured against the **product**.

### Colour

Every colour is read from MarketView's own `:root` custom properties, and the
logo colours from the shipped SVG mark, which differs from the UI navy:

| Role | Value | Source |
| --- | --- | --- |
| Brand navy (UI) | `#1A237E` | product `--navy` |
| Logo navy | `#17235B` | `marketview-mark.svg` |
| Logo green | `#6AA946` | `marketview-mark.svg` |
| Accent teal | `#4E917C` | product `--teal` |
| Ink | `#1E293B` | product `--ink` |
| Surface / sunken | `#FFFFFF` / `#F8FAFC` | product `--sur` / `--bg` |

The film adds exactly one thing the product does not have: a **deep navy field**
(`#1A237E → #0E1442 → #080C2B`) for statement scenes. The product is a light
application; its film alternates between a dark voice and a light product, and
every cut between those two fields is therefore a deliberate signal.

### Typography

Inter, the product's typeface, self-hosted. The product documents a five-step
scale and the film mirrors its *structure* (meta / body / head / title /
display) while scaling the values for viewing distance per format
(`src/types/format.ts`). Tracking is negative on display sizes
(`-0.022em`), which matches the product's own `--fs-display` treatment.

### Motion

Derived from the product's character rather than a film: MarketView is an
intelligence product for people making procurement decisions, so the default
personality is `enterprise` — heavily damped springs (damping 200), a 28-frame
reveal, a 5% camera push. Nothing overshoots. The one exception is the
`highEnergyTech` personality used by the teaser, where a 15-second cut needs the
motion to carry the pacing.

### What would change with a real reference

If a reference film is supplied, the measured values go into a new entry in
`MOTION_PERSONALITIES` and every film inherits them without a scene being
touched. That is the whole reason motion personality is a separate axis from
brand.

## Attribution

Techniques were studied from four open-source projects, listed with licences in
`RESEARCH.md`. No code, asset or design was copied from any of them.
