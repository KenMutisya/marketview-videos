# Creating a new video

## The shortest path: a new edition of an existing film

`src/storyboards/marketview-launch.ts` is a function of `FormatId`. A second
edition is one line:

```ts
export const marketviewLaunchVertical = defineStoryboard(launch("vertical"));
```

Register it in `src/rendering/films.ts` and it appears in the Studio, the CLI
and the QA report. That is the whole change — no React, no new components.

## A new film from the existing scene kinds

`src/storyboards/marketview-teaser.ts` is the worked example and the proof the
system is configuration-driven: a complete 15-second film, a different
narrative template and a different motion personality, containing **no React,
no animation code and no new components**.

1. **Write the storyboard.**

   ```ts
   import { defineStoryboard } from "../types/storyboard";

   export const myFilm = defineStoryboard({
     id: "my-film",
     title: "My film",
     template: "statisticLed",
     productId: "marketview",
     brandId: "marketview",
     format: "wide",
     motion: "highEnergyTech",        // optional personality override
     audio: { music: "assets/audio/music-launch.wav", musicGain: 0.65, cues: true },
     scenes: [ /* … */ ],
   });
   ```

2. **Register it** in `FILMS` with an output filename, an intent and a preset.

3. **Check the timing.**

   ```bash
   npm run pds -- timeline MyFilm
   npm run pds -- validate
   ```

4. **Look at it** in the Studio (`npm run studio`), or render six frames of a
   single scene: `npm run pds -- scene MyFilm hook`.

5. **Render and QA.**

   ```bash
   npm run pds -- render MyFilm
   npm run pds -- qa
   ```

6. **Re-time the music** if the cut points moved: update `CUTS` in
   `scripts/make-audio.ts` and run `npm run audio`.

## A narrated film with burned-in captions

Voiceover is a property of a scene, not a track you align by hand:

```ts
{
  id: "coverage",
  kind: "uiWalkthrough",
  seconds: 13.0,
  voiceover: [
    { text: "MarketView puts over 320 markets across Nigeria and Kenya in one place." },
    { text: "Each one validated through 19 data sources." },
  ],
  // …
}
```

Then declare the track the storyboard will play and build it:

```ts
audio: {
  narration: "assets/audio/narration-<storyboard-id>.wav",
  musicGain: 0.34,   // music ducks under a voice; 0.65 fights it
}
```

```bash
GOOGLE_APPLICATION_CREDENTIALS=/path/to/sa.json npm run narrate -- MyFilm
```

That writes two files: the WAV, and a **timing sidecar** recording the frame
each line actually landed on, measured from the synthesised clip. Register the
sidecar in `src/utils/narration.ts` and the captions draw themselves — the
caption layer reads those frames rather than re-deriving them, which is why the
words on screen cannot drift out of step with the voice.

Three things worth knowing:

- **Re-run `npm run narrate` after editing a line.** A test compares the cue
  text against the storyboard and fails if they have diverged, so a forgotten
  rebuild cannot ship as a caption that contradicts the voiceover.
- **The build refuses a line that overruns its scene**, rather than letting the
  voice talk across the cut. Shorten the line or lengthen the scene; the error
  tells you by how much.
- **The WAVs are committed.** A clean checkout renders every film without a
  TTS key. The key is only needed to change what is said.

## A new product

1. **Brand** — `src/brands/<product>.ts`, registered in `src/brands/index.ts`.
   Take the colours from the product's own tokens and the logo from its own
   asset. Do not redraw the mark.
2. **Product profile** — `src/products/<product>.ts`. Every claim needs a
   `source`. If a line has no source it does not go on screen.
3. **Capture flow** — `capture/flows/<product>.ts`, registered in
   `capture/run.ts`. Declare named regions for anything a scene will frame.
4. **Storyboard** — as above.

Nothing in `src/motion/`, `src/camera/`, `src/typography/`, `src/effects/` or
`src/transitions/` should need to change. If it does, that is a gap in the
primitives, not a reason to special-case a product in a scene.

## A new scene kind

Only when an existing kind genuinely cannot express the beat.

1. Add a variant to the discriminated union in `src/types/storyboard.ts`.
2. Write `src/scenes/MyScene.tsx`, taking `{ scene }`.
3. Register it in `SCENES` and `renderScene` in `src/scenes/index.tsx`.
4. Teach `scripts/validate.ts` what assets it depends on, so a missing one
   fails before a render rather than during it.

TypeScript will tell you about step 3 if you forget it: `renderScene` is an
exhaustive switch.

## Rules worth not relearning

- **Author explicit line breaks** in headlines. A wrapped line breaks the
  masked reveal.
- **Frame to named regions**, never pixels.
- **Durations must land on whole frames.** A test enforces it.
- **Re-run `npm run audio`** after changing scene durations, or the music will
  swell in the wrong places.
- **Never use a light-to-light crossfade.** It doubles the image.
- **Look at the contact sheet.** A render that exits 0 proves nothing about
  what is on the screen.
