# Product Demo Studio

Cinematic product films, built as a software project rather than edited by hand.
Playwright drives the real product and records what it finds; Remotion draws the
film from that recording plus a storyboard; ffmpeg measures the result.

Built around **MarketView** by CoAmana — live agricultural market intelligence
for Kenya and Nigeria — and designed so another product is a configuration
change, not a rewrite.

```
product  →  capture (Playwright)  →  storyboard (data)  →  film (Remotion)  →  QA (measured)
```

## The films

All thirteen render from one component fed different data.

| Edition | Output | Length | Audio |
| --- | --- | --- | --- |
| **Procurement film** (campaign) | `output/marketview-procurement-1080x1920.mp4` | 60.00 s | narrated |
| **Expansion film** (campaign) | `output/marketview-expansion-1080x1920.mp4` | 60.00 s | narrated |
| **Rep film** (campaign) | `output/marketview-rep-agri-1080x1920.mp4` | 60.00 s | narrated |
| **Partner film** | `output/marketview-partner-1920x1080.mp4` | 60.00 s | yes |
| Partner film, 4:3 | `output/marketview-partner-1440x1080.mp4` | 60.00 s | yes |
| Widescreen launch film | `output/marketview-launch-1920x1080.mp4` | 30.00 s | yes |
| Launch film, 4:3 | `output/marketview-launch-1440x1080.mp4` | 30.00 s | yes |
| Vertical launch film | `output/marketview-launch-1080x1920.mp4` | 25.00 s | yes |
| Conference booth loop | `output/marketview-conference-loop-1920x1080.mp4` | 68.20 s | **none** |
| WhatsApp Rep commercial (vertical) | `output/marketview-rep-whatsapp-1080x1920.mp4` | 27.80 s | yes |
| WhatsApp Rep commercial (widescreen) | `output/marketview-rep-whatsapp-1920x1080.mp4` | 27.80 s | yes |
| WhatsApp Rep commercial (4:3) | `output/marketview-rep-whatsapp-1440x1080.mp4` | 27.80 s | yes |
| Short teaser | `output/marketview-teaser-1080x1920.mp4` | 14.60 s | yes |

Plus poster frames, thumbnails, a frame per scene (`output/stills/`) and a
labelled contact sheet per film (`output/qa/`).

## Install

```bash
npm install
npx playwright install chromium
```

Requires Node ≥ 20 and `ffmpeg` / `ffprobe` on the PATH (`brew install ffmpeg`).

> **zod must stay pinned at 4.5.4.** Remotion 4.0.539 refuses to render on a
> mismatch, with an error that does not mention the render.

Everything needed to render is committed — captures, transcript, fonts, logo.
A clean checkout can go straight to:

```bash
npm run assets     # bake derived image treatments
npm run audio      # synthesise the score and cues
npm run pds -- export
```

## Commands

```bash
npm run studio                   # Remotion preview: scrub, inspect, edit props
npm run capture                  # re-drive the product and refresh screenshots
npm run capture:rep              # record a live Rep conversation (needs the service)
npm run assets                   # bake pre-blurred backdrops
npm run audio                    # regenerate the original score and UI cues
npm run narrate                  # re-synthesise voiceover (needs a Google TTS key)
npm test                         # 30 tests: timing, assets, parsing, determinism, campaign
npm run lint                     # eslint + tsc

npm run pds -- list              # every film this project produces
npm run pds -- timeline <film>   # a film's scenes, timings and stated purpose
npm run pds -- validate          # captures, regions, assets, timings
npm run pds -- render [film…]    # one film, or all
npm run pds -- scene <film> <id> # six frames across a single scene
npm run pds -- stills [film…]    # poster, thumbnail, one frame per scene
npm run pds -- sheet [film…]     # contact sheet from a rendered file
npm run pds -- qa                # technical checks + sheets + docs/QA_REPORT.md
npm run pds -- export            # all of the above, in order
```

## How it works

**Capture is a contract, not a screenshot folder.** Every flow records the
bounding box of named elements alongside the pixels. A scene says
`to: { region: "buy" }`; it never says `{ x: 0.17, y: 0.44 }`. Rename that
element in the product and the next render fails with the region name instead of
quietly framing the wrong thing.

**A storyboard is data.** Scenes are a closed set of kinds — `statement`,
`brandReveal`, `uiWalkthrough`, `featureMontage`, `apiBeat`, `chatDemo`,
`closing` — validated by Zod. The teaser is the proof: a complete separate film
containing no React and no new components.

**Formats recompose, they do not crop.** A `FormatSpec` carries a safe area, a
type scale, a text measure and a UI presentation mode. The vertical edition
gives the interface a *portrait* window framed on the region that matters; the
4:3 edition steps type down and holds the application window to a smaller share
of the height, because at 16:9 proportions that window would be wider than the
frame; the conference edition raises every type size, slows every move and
opens already zoomed in.

**Everything is deterministic.** No `Math.random()`, no `Date.now()`, no CSS
animation, fonts bundled rather than fetched. Seeded values only.

**Text holds still.** Animated offsets are rounded to whole pixels and every
element pins to an identity transform once it has arrived. Text that sits
inside something changing by a fraction of a pixel per frame is re-rasterised
every frame — barely visible on a laptop, and obvious as dancing text on a
television. QA measures it: the quietest held frame in each film now differs
from its neighbour by 0.001–0.015 out of 255.

**QA measures; it does not assert.** `ffprobe` checks codec, pixel format,
resolution, frame count and duration against what the storyboard declares;
`ebur128` measures loudness; the loop seam is measured by comparing the first
and last frame (currently 0.00%). Frames that need a human eye are sampled —
scene midpoints and both sides of every transition — and laid out as a sheet.

## The partner film

`PartnerFilm` is built from the 2026 partner deck rather than the website, and
it tells a different story: MarketView as **infrastructure**, whose stated key
differentiator is the Activation Layer — *"You don't just see markets; you can
act in them."*

The film is built around that pivot. The first half is **see**, using the
product captures. The second half is **act**, using the WhatsApp conversation
recorded from the live Rep. It is the only edition that connects the two halves
of what this studio captured.

Two things in the deck are deliberately absent, by decision:

- **"100M+ Businesses, Farmers & Traders"** — market size, not this product's
  reach. Beside the logo it would read as MarketView's network, against a
  confirmed 5,000+ verified actors.
- **The 8–12 week implementation approach.**

Provenance for every line is in [PRODUCT_BRIEF.md](docs/PRODUCT_BRIEF.md).

## The campaign films

Three 60-second vertical films made for a specific campaign — the NABG cohort
and paid sprints — and built to a brief rather than to the product's own
narrative. They differ from everything else here in three ways.

**They are narrated, and the narration is burned in.** `scripts/make-narration.ts`
synthesises each line, *measures* the resulting clip, and records the frame it
landed on in a timing sidecar next to the WAV. `src/components/Captions.tsx`
reads those frames. Nothing downstream estimates how long a line takes to say,
so the caption and the voice cannot drift apart — and a test fails if a line is
edited without re-running the build. Captions are burned in because both target
surfaces play muted by default.

**They are cut to exactly 60.000 seconds.** WhatsApp status truncates anything
longer, which would cost the film its end card. A test asserts it.

**They answer to a brief that the product sometimes contradicts.** Where the two
disagreed, the product won: the brief's "price of maize in Dawanau" gets the
Rep's honest *"I have not heard a price for maize in Dawanau Market yet"*,
because that is what the live Rep says and the markets it names instead are
real. See [PRODUCT_BRIEF.md](docs/PRODUCT_BRIEF.md) for the figures and
[QA_REPORT.md](docs/QA_REPORT.md) for what was left out.

## The WhatsApp Rep commercial

The Rep film replays a **real conversation**. The capture flow drives the Rep's
own WhatsApp preview console with the service running on Vertex AI
(`gemini-2.5-flash`) and its Postgres data layer loaded, and records the
transcript. Every word the Rep says in the film is a word the live model
produced; the chat is then *drawn* natively so it renders crisply at any size
and identically on every render.

The console only ever uses reserved simulator numbers that are never forwarded
to Meta, and the flow avoids any action that would send a real message.

It ships in both aspect ratios. The widescreen cut is a genuine recomposition,
not a letterboxed portrait film: type and phone sit side by side, and the chat
UI is scaled up because a handset given 22% of a 16:9 frame renders text much
smaller on screen than it would in the hand.

## Honesty

- Every line of on-screen copy traces to a source in `docs/PRODUCT_BRIEF.md`.
- Captures come from the product's reference build and the Rep's demo data, so
  **the numbers and names on screen are fixtures**. The films disclose this on
  screen ("Interface shown with sample data", "Live AI · sample market data").
- The capture pipeline redacts personal identifiers *before* the pixel is taken
  and fails the run if a scan still finds any.
- No production API was called and no credentials live in this repository.

## Documentation

| | |
| --- | --- |
| [ARCHITECTURE.md](docs/ARCHITECTURE.md) | How the three pipelines fit together |
| [RESEARCH.md](docs/RESEARCH.md) | Ecosystem survey, what was adopted and rejected, performance findings |
| [PRODUCT_BRIEF.md](docs/PRODUCT_BRIEF.md) | Source of truth for every claim on screen |
| [STYLE_GUIDE.md](docs/STYLE_GUIDE.md) | Colour, type, motion, transitions, and what the films must never do |
| [REFERENCE_ANALYSIS.md](docs/REFERENCE_ANALYSIS.md) | Method for analysing a reference film; what this one was derived from |
| [STORYBOARD.md](docs/STORYBOARD.md) | Scene anatomy, timing maths, the shipped storyboards |
| [MOTION_LIBRARY.md](docs/MOTION_LIBRARY.md) | Every primitive, and which film uses it |
| [CAPTURE_WORKFLOW.md](docs/CAPTURE_WORKFLOW.md) | Running a capture, determinism, privacy |
| [RENDERING.md](docs/RENDERING.md) | Settings, measured performance, troubleshooting |
| [CREATING_NEW_VIDEOS.md](docs/CREATING_NEW_VIDEOS.md) | New edition, new film, new product, new scene kind |
| [QA_REPORT.md](docs/QA_REPORT.md) | Generated by `npm run pds -- qa` |

## Licence

Code in this repository is the project's own. The score and sound cues are
synthesised by `scripts/synth.ts` and are original output, with no third-party
licensing. Inter is bundled under the SIL Open Font License. MarketView's logo,
interface and copy belong to CoAmana.
