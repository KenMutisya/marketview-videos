# Rendering

## Commands

```bash
npm run pds -- render              # every edition
npm run pds -- render LaunchFilm   # one
npm run pds -- export              # assets → audio → render → stills → sheets → QA
```

Rendering is programmatic (`src/rendering/render.ts`) rather than shelling out
to `remotion render`, so the bundle is built **once** and reused across every
edition in a run. On this machine that turns a five-film export from five cold
bundles into one.

Validation runs first and a render is refused if it fails. The failures it
catches — a renamed capture, a missing derived asset, an audio file that was
never generated — otherwise show up as a blank frame or a silent track.

## Settings and why

| Setting | Value | Reason |
| --- | --- | --- |
| Codec | h264 | Plays everywhere without a re-encode. |
| Pixel format | `yuv420p` | Required for broad browser and social playback. Checked in QA. |
| CRF | 18–20 | 18 for the reference and conference editions, 19–20 where the file is going to a social platform that will re-encode anyway. |
| Frame image format | JPEG **quality 98** | At Remotion's default of 80 the navy gradient field shows visible blocking. 98 is visually indistinguishable from PNG here and roughly three times faster to encode. |
| Concurrency | 4 | 10 cores / 16 GB. 6 was unstable with 2× retina screenshots in frame. |
| Frame timeout | 120 s | Default is 30 s, which the opening scene exceeded before its blur was baked. |
| Audio | AAC, or **none** | A silent edition renders with `muted: true` so there is no audio stream, rather than a silent one. |

`remotion.config.ts` carries the same values for the CLI and Studio. **The Node
APIs do not read it**, so `render.ts` passes them explicitly.

## Measured performance

From `output/render-metrics.json`, written by every render run.

| Film | Frames | Render | Per frame |
| --- | --- | --- | --- |
| PartnerFilm (1920×1080) | 1800 | ~87 s | ~48 ms |
| PartnerFilmStandard (1440×1080) | 1800 | ~68 s | ~38 ms |
| LaunchFilm (1920×1080) | 900 | ~53 s | ~59 ms |
| LaunchFilmStandard (1440×1080) | 900 | ~42 s | ~46 ms |
| LaunchFilmVertical (1080×1920) | 750 | ~40 s | ~53 ms |
| ConferenceLoop (1920×1080) | 2046 | ~107 s | ~52 ms |
| RepWhatsApp (1080×1920) | 834 | ~34 s | ~41 ms |
| RepWhatsAppWide (1920×1080) | 834 | ~34 s | ~41 ms |
| RepWhatsAppStandard (1440×1080) | 834 | ~28 s | ~33 ms |
| Teaser (1080×1920) | 438 | ~21 s | ~49 ms |

The chat films roughly **halved** (81 → 41 ms/frame) when the text-stability
work landed. Pinning the handset to an identity transform once it has arrived,
and dropping the animated `maxHeight` from bubbles that have finished landing,
removed a compositing pass and a layout pass from every frame. Holding text
still is cheaper than moving it.

The chat film is the most expensive per frame: it lays out a full message
thread with animated `maxHeight` on every bubble, which forces a layout pass
per frame.

## The expensive things, and what was done about them

1. **A full-frame CSS blur was the single biggest cost.** The opening scene
   blurred a 3024 px screenshot at render time; frames exceeded the 30 s timeout
   and the browser target closed under memory pressure. Baking the treatment
   once with ffmpeg (`npm run assets`) removed the failure entirely.
   **Rule: a static effect belongs in an asset, not in a frame.**
2. **Animated grain.** Rejected. A full-frame repaint every frame, and it
   encodes badly at these bitrates. The grain is a static SVG turbulence
   pattern.
3. **3D.** Rejected. CSS 3D transforms give the depth these films need without
   a WebGL context to fail in a headless renderer. See `RESEARCH.md`.
4. **Continuously transforming anything that contains text.** Expensive *and*
   ugly: see the stability note above.

## Export presets

| Edition | Resolution | Length | Audio | For |
| --- | --- | --- | --- | --- |
| `PartnerFilm` | 1920×1080 | 60.00 s | yes | Partner and investor conversations; built from the 2026 deck |
| `PartnerFilmStandard` | 1440×1080 | 60.00 s | yes | 4:3 cut of the same |
| `LaunchFilm` | 1920×1080 | 30.00 s | yes | Website, YouTube, X, presentations |
| `LaunchFilmStandard` | 1440×1080 | 30.00 s | yes | 4:3 booth panels, feed placements |
| `LaunchFilmVertical` | 1080×1920 | 25.00 s | yes | Reels, Shorts, TikTok — its own edit, not the 30s one cropped |
| `ConferenceLoop` | 1920×1080 | 68.20 s | **none** | 75" booth screen, loop-safe |
| `RepWhatsApp` | 1080×1920 | 27.80 s | yes | The WhatsApp Rep commercial |
| `RepWhatsAppWide` | 1920×1080 | 27.80 s | yes | Widescreen cut of the same, for the website and YouTube |
| `RepWhatsAppStandard` | 1440×1080 | 27.80 s | yes | 4:3 cut of the same |
| `Teaser` | 1080×1920 | 14.60 s | yes | Short-form teaser |

A 3840×2160 conference master is a one-line change (`width`/`height` in
`CONFERENCE`), but it was not rendered here: at ~55 ms/frame for 1080p, 4K is
roughly four times the cost for a screen that is almost always fed 1080p.

## Stills

```bash
npm run pds -- stills            # poster, thumbnail, one frame per scene
npm run pds -- scene LaunchFilm network   # six frames across one scene
```

Poster frames are taken from the brand-reveal settle point — reliably the frame
where the product is on screen and the identity is legible.

## Remote rendering

Not provisioned, and nothing here requires it. If it is wanted later,
`renderFilm` is already a pure function of a bundle plus input props, which is
the shape Remotion Lambda expects. The conference loop at ~112 s locally is the
only edition where distribution would pay for itself.

## Troubleshooting

| Symptom | Cause |
| --- | --- |
| `Version mismatch: zod` | `npm i zod@4.5.4 --save-exact`. Remotion pins it. |
| Frame timeout / target closed | An expensive per-frame filter. Bake it into an asset. |
| Black tail on a film | Duration not derived from `storyboardFrames()`. |
| Blank map in a capture | Leaflet tile opacity stranded by the animation freeze. |
| Silent film that should have audio | `npm run audio` was never run; validation catches this. |
| `Unknown capture` / `has no region` | The manifest is stale. Re-run the capture. |
