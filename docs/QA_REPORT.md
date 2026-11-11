# QA report

Generated 2026-11-02T21:10:12.772Z by `npm run pds -- qa`.

**Automated checks: pass.** Every rendered file matches the resolution, frame rate, frame count, duration, codec and audio expectation declared by its storyboard.

## Project validation

No findings. All captures, named regions, derived assets and audio files referenced by a storyboard exist.

## Privacy

Capture-time scan: **clean**. Every screenshot is scanned for email addresses, phone numbers and API tokens before it is written, and personal identifiers found in the product's fixture data are replaced in the DOM before the pixel is taken. The two published product contact addresses are allow-listed.

Capture page errors during the last run: 0.

## Technical validation

### LaunchFilm

`output/marketview-launch-1920x1080.mp4`

| Check | Result | Detail |
| --- | --- | --- |
| file exists | pass | 12.49 MB |
| video codec is h264 | pass | h264 |
| pixel format is yuv420p | pass | yuv420p (required for broad browser and social playback) |
| resolution | pass | 1920×1080, expected 1920×1080 |
| frame rate | pass | 30 fps, expected 30 |
| frame count | pass | 900, expected 900 |
| duration | pass | 30.016s, expected ~30.000s |
| audio present | pass | aac · 2ch |
| text stability | pass | quietest held frame differs from the next by 0.002 (threshold 0.35), sampled in `hook` |
| integrated loudness | pass | -19.6 LUFS (target −20…−11 for web playback) |

Contact sheet: `output/qa/LaunchFilm-contact-sheet.png` — 16 sampled frames.

### LaunchFilmStandard

`output/marketview-launch-1440x1080.mp4`

| Check | Result | Detail |
| --- | --- | --- |
| file exists | pass | 11.09 MB |
| video codec is h264 | pass | h264 |
| pixel format is yuv420p | pass | yuv420p (required for broad browser and social playback) |
| resolution | pass | 1440×1080, expected 1440×1080 |
| frame rate | pass | 30 fps, expected 30 |
| frame count | pass | 900, expected 900 |
| duration | pass | 30.016s, expected ~30.000s |
| audio present | pass | aac · 2ch |
| text stability | pass | quietest held frame differs from the next by 0.001 (threshold 0.35), sampled in `hook` |
| integrated loudness | pass | -19.6 LUFS (target −20…−11 for web playback) |

Contact sheet: `output/qa/LaunchFilmStandard-contact-sheet.png` — 16 sampled frames.

### LaunchFilmVertical

`output/marketview-launch-1080x1920.mp4`

| Check | Result | Detail |
| --- | --- | --- |
| file exists | pass | 8.90 MB |
| video codec is h264 | pass | h264 |
| pixel format is yuv420p | pass | yuv420p (required for broad browser and social playback) |
| resolution | pass | 1080×1920, expected 1080×1920 |
| frame rate | pass | 30 fps, expected 30 |
| frame count | pass | 750, expected 750 |
| duration | pass | 25.003s, expected ~25.000s |
| audio present | pass | aac · 2ch |
| text stability | pass | quietest held frame differs from the next by 0.015 (threshold 0.35), sampled in `network` |
| integrated loudness | pass | -19.9 LUFS (target −20…−11 for web playback) |

Contact sheet: `output/qa/LaunchFilmVertical-contact-sheet.png` — 16 sampled frames.

### PartnerFilm

`output/marketview-partner-1920x1080.mp4`

| Check | Result | Detail |
| --- | --- | --- |
| file exists | pass | 19.31 MB |
| video codec is h264 | pass | h264 |
| pixel format is yuv420p | pass | yuv420p (required for broad browser and social playback) |
| resolution | pass | 1920×1080, expected 1920×1080 |
| frame rate | pass | 30 fps, expected 30 |
| frame count | pass | 1800, expected 1800 |
| duration | pass | 60.011s, expected ~60.000s |
| audio present | pass | aac · 2ch |
| text stability | pass | quietest held frame differs from the next by 0.001 (threshold 0.35), sampled in `audiences` |
| integrated loudness | pass | -19.1 LUFS (target −20…−11 for web playback) |

Contact sheet: `output/qa/PartnerFilm-contact-sheet.png` — 31 sampled frames.

### PartnerFilmStandard

`output/marketview-partner-1440x1080.mp4`

| Check | Result | Detail |
| --- | --- | --- |
| file exists | pass | 16.75 MB |
| video codec is h264 | pass | h264 |
| pixel format is yuv420p | pass | yuv420p (required for broad browser and social playback) |
| resolution | pass | 1440×1080, expected 1440×1080 |
| frame rate | pass | 30 fps, expected 30 |
| frame count | pass | 1800, expected 1800 |
| duration | pass | 60.011s, expected ~60.000s |
| audio present | pass | aac · 2ch |
| text stability | pass | quietest held frame differs from the next by 0.001 (threshold 0.35), sampled in `audiences` |
| integrated loudness | pass | -19.1 LUFS (target −20…−11 for web playback) |

Contact sheet: `output/qa/PartnerFilmStandard-contact-sheet.png` — 31 sampled frames.

### ConferenceLoop

`output/marketview-conference-loop-1920x1080.mp4`

| Check | Result | Detail |
| --- | --- | --- |
| file exists | pass | 22.27 MB |
| video codec is h264 | pass | h264 |
| pixel format is yuv420p | pass | yuv420p (required for broad browser and social playback) |
| resolution | pass | 1920×1080, expected 1920×1080 |
| frame rate | pass | 30 fps, expected 30 |
| frame count | pass | 2046, expected 2046 |
| duration | pass | 68.200s, expected ~68.200s |
| no audio stream | pass | none |
| text stability | pass | quietest held frame differs from the next by 0.001 (threshold 0.35), sampled in `network` |
| loop seam | pass | last frame differs from first by 0.00% (threshold 6%) |

Contact sheet: `output/qa/ConferenceLoop-contact-sheet.png` — 24 sampled frames.

### RepWhatsAppWide

`output/marketview-rep-whatsapp-1920x1080.mp4`

| Check | Result | Detail |
| --- | --- | --- |
| file exists | pass | 6.99 MB |
| video codec is h264 | pass | h264 |
| pixel format is yuv420p | pass | yuv420p (required for broad browser and social playback) |
| resolution | pass | 1920×1080, expected 1920×1080 |
| frame rate | pass | 30 fps, expected 30 |
| frame count | pass | 834, expected 834 |
| duration | pass | 27.819s, expected ~27.800s |
| audio present | pass | aac · 2ch |
| text stability | pass | quietest held frame differs from the next by 0.004 (threshold 0.35), sampled in `onboarding` |
| integrated loudness | pass | -18.5 LUFS (target −20…−11 for web playback) |

Contact sheet: `output/qa/RepWhatsAppWide-contact-sheet.png` — 12 sampled frames.

### RepWhatsAppStandard

`output/marketview-rep-whatsapp-1440x1080.mp4`

| Check | Result | Detail |
| --- | --- | --- |
| file exists | pass | 5.73 MB |
| video codec is h264 | pass | h264 |
| pixel format is yuv420p | pass | yuv420p (required for broad browser and social playback) |
| resolution | pass | 1440×1080, expected 1440×1080 |
| frame rate | pass | 30 fps, expected 30 |
| frame count | pass | 834, expected 834 |
| duration | pass | 27.819s, expected ~27.800s |
| audio present | pass | aac · 2ch |
| text stability | pass | quietest held frame differs from the next by 0.001 (threshold 0.35), sampled in `onboarding` |
| integrated loudness | pass | -18.5 LUFS (target −20…−11 for web playback) |

Contact sheet: `output/qa/RepWhatsAppStandard-contact-sheet.png` — 12 sampled frames.

### RepWhatsApp

`output/marketview-rep-whatsapp-1080x1920.mp4`

| Check | Result | Detail |
| --- | --- | --- |
| file exists | pass | 5.97 MB |
| video codec is h264 | pass | h264 |
| pixel format is yuv420p | pass | yuv420p (required for broad browser and social playback) |
| resolution | pass | 1080×1920, expected 1080×1920 |
| frame rate | pass | 30 fps, expected 30 |
| frame count | pass | 834, expected 834 |
| duration | pass | 27.819s, expected ~27.800s |
| audio present | pass | aac · 2ch |
| text stability | pass | quietest held frame differs from the next by 0.007 (threshold 0.35), sampled in `answer` |
| integrated loudness | pass | -18.5 LUFS (target −20…−11 for web playback) |

Contact sheet: `output/qa/RepWhatsApp-contact-sheet.png` — 12 sampled frames.

### ProcurementFilm

`output/marketview-procurement-1080x1920.mp4`

| Check | Result | Detail |
| --- | --- | --- |
| file exists | pass | 18.15 MB |
| video codec is h264 | pass | h264 |
| pixel format is yuv420p | pass | yuv420p (required for broad browser and social playback) |
| resolution | pass | 1080×1920, expected 1080×1920 |
| frame rate | pass | 30 fps, expected 30 |
| frame count | pass | 1800, expected 1800 |
| duration | pass | 60.011s, expected ~60.000s |
| audio present | pass | aac · 2ch |
| text stability | pass | quietest held frame differs from the next by 0.009 (threshold 0.35), sampled in `pricing` |
| integrated loudness | pass | -19.0 LUFS (target −20…−11 for web playback) |

Contact sheet: `output/qa/ProcurementFilm-contact-sheet.png` — 18 sampled frames.

### ExpansionFilm

`output/marketview-expansion-1080x1920.mp4`

| Check | Result | Detail |
| --- | --- | --- |
| file exists | pass | 17.11 MB |
| video codec is h264 | pass | h264 |
| pixel format is yuv420p | pass | yuv420p (required for broad browser and social playback) |
| resolution | pass | 1080×1920, expected 1080×1920 |
| frame rate | pass | 30 fps, expected 30 |
| frame count | pass | 1800, expected 1800 |
| duration | pass | 60.011s, expected ~60.000s |
| audio present | pass | aac · 2ch |
| text stability | pass | quietest held frame differs from the next by 0.002 (threshold 0.35), sampled in `map` |
| integrated loudness | pass | -19.1 LUFS (target −20…−11 for web playback) |

Contact sheet: `output/qa/ExpansionFilm-contact-sheet.png` — 18 sampled frames.

### RepAgriFilm

`output/marketview-rep-agri-1080x1920.mp4`

| Check | Result | Detail |
| --- | --- | --- |
| file exists | pass | 10.71 MB |
| video codec is h264 | pass | h264 |
| pixel format is yuv420p | pass | yuv420p (required for broad browser and social playback) |
| resolution | pass | 1080×1920, expected 1080×1920 |
| frame rate | pass | 30 fps, expected 30 |
| frame count | pass | 1800, expected 1800 |
| duration | pass | 60.011s, expected ~60.000s |
| audio present | pass | aac · 2ch |
| text stability | pass | quietest held frame differs from the next by 0.001 (threshold 0.35), sampled in `answer` |
| integrated loudness | pass | -18.9 LUFS (target −20…−11 for web playback) |

Contact sheet: `output/qa/RepAgriFilm-contact-sheet.png` — 15 sampled frames.

### Teaser

`output/marketview-teaser-1080x1920.mp4`

| Check | Result | Detail |
| --- | --- | --- |
| file exists | pass | 3.66 MB |
| video codec is h264 | pass | h264 |
| pixel format is yuv420p | pass | yuv420p (required for broad browser and social playback) |
| resolution | pass | 1080×1920, expected 1080×1920 |
| frame rate | pass | 30 fps, expected 30 |
| frame count | pass | 438, expected 438 |
| duration | pass | 14.613s, expected ~14.600s |
| audio present | pass | aac · 2ch |
| text stability | pass | quietest held frame differs from the next by 0.014 (threshold 0.35), sampled in `network` |
| integrated loudness | pass | -17.4 LUFS (target −20…−11 for web playback) |

Contact sheet: `output/qa/Teaser-contact-sheet.png` — 9 sampled frames.

## Render performance

| Film | Render time | Per frame |
| --- | --- | --- |
| ProcurementFilm | 91.6s | 51 ms |

## Frames selected for visual inspection

Automated checks cannot tell whether a frame *looks* right. These are the frames the sampler selects — scene midpoints and both sides of every transition — and they are the ones laid out in each contact sheet above. Reviewing them is a human step; this report does not claim it has happened.

- **LaunchFilm** — 16 frames: 0 (open), 75 (hook · mid), 143 (hook → reveal · dip), 152 (reveal · in), 195 (reveal · mid), 248 (reveal → network · dip), …
- **LaunchFilmStandard** — 16 frames: 0 (open), 75 (hook · mid), 143 (hook → reveal · dip), 152 (reveal · in), 195 (reveal · mid), 248 (reveal → network · dip), …
- **LaunchFilmVertical** — 16 frames: 0 (open), 54 (hook · mid), 102 (hook → reveal · dip), 110 (reveal · in), 147 (reveal · mid), 192 (reveal → network · dip), …
- **PartnerFilm** — 31 frames: 0 (open), 83 (problem · mid), 158 (problem → scale · dip), 167 (scale · in), 240 (scale · mid), 323 (scale → thesis · dip), …
- **PartnerFilmStandard** — 31 frames: 0 (open), 83 (problem · mid), 158 (problem → scale · dip), 167 (scale · in), 240 (scale · mid), 323 (scale → thesis · dip), …
- **ConferenceLoop** — 24 frames: 0 (open), 105 (hook · mid), 201 (hook → reveal · dip), 212 (reveal · in), 305 (reveal · mid), 408 (reveal → network · dip), …
- **RepWhatsAppWide** — 12 frames: 0 (open), 54 (hook · mid), 102 (hook → onboarding · dip), 110 (onboarding · in), 246 (onboarding · mid), 390 (onboarding → answer · fade), …
- **RepWhatsAppStandard** — 12 frames: 0 (open), 54 (hook · mid), 102 (hook → onboarding · dip), 110 (onboarding · in), 246 (onboarding · mid), 390 (onboarding → answer · fade), …
- **RepWhatsApp** — 12 frames: 0 (open), 54 (hook · mid), 102 (hook → onboarding · dip), 110 (onboarding · in), 246 (onboarding · mid), 390 (onboarding → answer · fade), …
- **ProcurementFilm** — 18 frames: 0 (open), 75 (hook · mid), 144 (hook → coverage · dip), 152 (coverage · in), 333 (coverage · mid), 522 (coverage → actors · push), …
- **ExpansionFilm** — 18 frames: 0 (open), 75 (hook · mid), 144 (hook → map · dip), 152 (map · in), 324 (map · mid), 504 (map → profile · push), …
- **RepAgriFilm** — 15 frames: 0 (open), 75 (hook · mid), 144 (hook → ask · fade), 152 (ask · in), 378 (ask · mid), 612 (ask → answer · fade), …
- **Teaser** — 9 frames: 0 (open), 51 (hook · mid), 96 (hook → network · dip), 104 (network · in), 186 (network · mid), 276 (network → close · dip), …

## Captured conversations

**`rep-whatsapp`** — 14 turns, 2 listing card(s).

- Engine: `Vertex AI · groundwork-500011 · us-central1 · gemini-2.5-flash`
- Captured: 2026-10-26T23:07:40.722Z
- Number: reserved simulator number (never sent to Meta)
- Empty replies: **1** (turn 13)

  > **Product finding, not a film defect.** The Rep returned an empty reply to the final question in the captured run. The films exclude that turn, but it is worth a look: an empty outbound message would reach a real WhatsApp user as nothing at all.

**`rep-agribusiness`** — 14 turns, 0 listing card(s).

- Engine: `Vertex AI · groundwork-500011 · us-central1 · gemini-2.5-flash`
- Captured: 2026-11-02T13:43:48.473Z
- Number: reserved simulator number (never sent to Meta)
- Empty replies: **0**

**`rep-agribusiness-hausa`** — 14 turns, 0 listing card(s).

- Engine: `Vertex AI · groundwork-500011 · us-central1 · gemini-2.5-flash`
- Captured: 2026-11-02T13:44:10.134Z
- Number: reserved simulator number (never sent to Meta)
- Empty replies: **0**

## Campaign brief: what shipped, and what did not

The three campaign films were made to a written brief. Where the brief and the product disagreed, the product won. Each departure is listed here so it is a decision on the record rather than something a reviewer has to notice.

| Brief asked for | What shipped | Why |
| --- | --- | --- |
| "Price of maize in Dawanau this week" | The Rep's real answer: *"I have not heard a price for maize in Dawanau Market yet. I have noted the gap"*, then the markets where it does hold maize prices | Dawanau carries no maize observations in this environment. The follow-up returns a genuine cheapest-first table across five markets, with report counts and freshness. A buyer told "not here, but here" has been told something true. |
| "Which market around Kano has the most supply this week?" | Not asked | The Rep reads a bare "around Kano" as a request to move the session to another market and answers about wherever it lands. The cross-market comparison the brief wants is what it volunteers anyway. |
| A chat "in Pidgin, Swahili or Hausa" | Hausa onboarding, captured live in a separate session | Onboarding is genuinely localised — consent, state, market, buy-or-sell and the product menu all return in Hausa. **The price answer comes back in English.** The templated path is translated; the data-answer path is not. The film shows what works and claims nothing more. |
| "Type it or say it" — a voice note | Not shown | Nothing in the capture demonstrates voice input. Pending confirmation that the Rep accepts voice notes, this is an unsupported claim. |
| "A quick answer arriving late in the evening" | Not shown | A timestamp on a bubble records when the capture ran, not a product capability. Showing one as evidence of 24-hour availability would be staging. |
| "Market actor profiles and supplier listings" | The market directory | The actor roster is a list of named individuals. A close-up is ruled out on privacy grounds even with fixture names, and an advertisement is the worst place to make an exception. |
| A partner logo strip | Partner **names**, currently not rendered | Permission is flagged outstanding in the brief itself. The names are carried in the storyboards and gated behind `partnersCleared` in `src/products/marketview.ts`; the end card picks them up the moment it flips. Logos are a separate ask — they need written permission and current assets. |
| "~498k market actors" | *"a mapped footprint of nearly 500,000 market actors"* | The fact-sheet figure counts a **mapped** population. The **verified** network is 5,000+. A test fails if any campaign film puts the word "verified" beside the larger number. |

**Still outstanding from the brief's own list:** confirmation that the Q4 2026 fact-sheet figures are cleared for public use, permission for partner names and logos, whether the Rep accepts voice notes, and a target date for first drafts.

## What is not checked automatically

- **Typographic overflow.** Headlines are auto-sized from their longest line (`src/typography/fit.ts`), which prevents wrapping but is a heuristic, not a text measurement.
- **Perceived motion quality.** Easing, overshoot and rhythm are judged by watching the film. The stability probe above catches text that is moving when it should be still, but not motion that is merely ugly.
- **Product accuracy of the on-screen claims.** Every line of copy is traced to a source in `src/products/marketview.ts`; a person has to confirm the source still says it.
- **Colour accuracy on a specific panel.** The conference edition is graded for a bright booth screen, not measured on one.

