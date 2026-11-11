# Storyboards

A storyboard is data, validated by Zod at module load. A new film is authored by
writing scenes, not React.

## Anatomy of a scene

```ts
{
  id: "network",
  kind: "uiWalkthrough",
  purpose: "Show the live network: Africa view, then a real dive into Kenya.",
  seconds: 6.0,
  capture: "markets-network",
  thenCapture: "markets-kenya",       // a real state change, mid-scene
  thenAt: 3.5,
  to: { region: "map", pad: 0.06 },   // framed by name, never by pixels
  move: [0.55, 3.1],
  caption: "THE LIVE NETWORK · 160+ MARKETS",
  cursor:   [{ at: 3.2, x: 0.545, y: 0.52, click: true }],
  callouts: [{ at: 4.2, text: "Kenya · 15 markets live", x: 0.7, y: 0.17, tone: "good" }],
  transitionOut: { kind: "maskWipe", seconds: 0.4, direction: "left" },
}
```

`purpose` is required and is printed back by `npm run pds -- timeline`. A scene
that cannot say why it exists does not get to exist.

## Timing

Authored in seconds, chosen so every duration lands on a whole frame at 30 fps.
Transitions overlap their neighbours:

```
total = Σ scene frames − Σ transition frames (excluding the last scene's)
```

`storyboardFrames()` is the single implementation, used by the composition
registry, the renderer, the audio cue placement and the QA expectations. A test
asserts the reference edition is exactly 900 frames.

## Narrative templates

The schema records which template a storyboard follows. Those marked **shipped**
have a film in `output/`.

| Template | Shape | Status |
| --- | --- | --- |
| `problemSolution` | Problem → Solution → Demonstration → Benefits → CTA | **shipped** — `LaunchFilm`, `LaunchFilmStandard`, `LaunchFilmVertical` |
| `featureAnnouncement` | Announcement → UI reveal → Interaction → Result | **shipped** — `RepWhatsApp`, `RepWhatsAppWide`, `RepWhatsAppStandard`, `Teaser` |
| `conferenceLoop` | Silent loop → feature showcase → brand → seamless restart | **shipped** — `ConferenceLoop` |
| `developerIntegration` | Developer problem → request → response → integration | scene kind shipped (`apiBeat`, inside `ConferenceLoop`); no standalone film |
| `beforeAfter` | Before → Transformation → After | not authored |
| `statisticLed` | Statistic → Explanation → Capability → CTA | **shipped** — `PartnerFilm`, `PartnerFilmStandard` |
| `showcaseMontage` | Showcase → Feature montage → Brand reveal | not authored |

The last three are values in the schema with no storyboard behind them yet.
They need no new code — `statisticLed`, for instance, is a `statement` scene
with an `AnimatedCounter`, a `featureMontage` and a `closing`.

## The reference edition

`LaunchFilm` — 30.000 s, 900 frames, template `problemSolution`.

| Start | End | Scene | Kind | Purpose |
| --- | --- | --- | --- | --- |
| 0.00 | 5.00 | `hook` | statement | State the problem in the product's own words, over a real market. No product yet. |
| 4.50 | 8.50 | `reveal` | brandReveal | Identity lands, then the real dashboard rises into frame. |
| 8.00 | 15.50 | `network` | uiWalkthrough | Show the live network: Africa view, then a real dive into Kenya driven by a click. |
| 15.50 | 19.80 | `pricing` | uiWalkthrough | The payoff: what to pay, where, with confidence attached. |
| 19.40 | 25.80 | `capabilities` | featureMontage | Three capabilities, each anchored to a real region of the product. |
| 25.30 | 30.00 | `close` | closing | Identity, the positioning line, verified numbers, and where to go. |

Cut points: 4.50, 8.00, 15.50, 19.40, 25.30 s. The music bed swells on each
(`scripts/make-audio.ts`, `BEDS`).

**The join from `network` to `pricing` is a hard cut** — no transition at all.
Two light product scenes, and the sharpest moment in the film.

**Pacing is per format.** `PACE` in the storyboard carries two sets of scene
lengths. The wide edit runs 4.0–7.5s (σ = 1.24s); the first cut of this film
gave every scene 4.8–6.0s (σ = 0.46s), which is a grid rather than a rhythm.
The vertical edit is a **different edit**, not the same one letterboxed: 25.00s
instead of 30.00s, every scene tightened, because a feed gives a film about a
second to earn the next one. Each has its own music bed.

### Why the hook works

It is verbatim product copy. "They don't show up on dashboards. They don't
appear in price indices." is MarketView's own description of the problem, and
it is a better hook than anything the studio could invent — because it is true
and because the product's own writers had already found the sharpest form of it.

The two statements share one slot on screen: the first lifts away as the second
arrives, so the frame never carries four lines of display type.

## The WhatsApp Rep commercial

`RepWhatsApp` — 27.800 s, 834 frames, template `featureAnnouncement`.

| Start | End | Scene | Kind | Purpose |
| --- | --- | --- | --- | --- |
| 0.00 | 3.60 | `hook` | statement | Set the premise: the intelligence reaches people where they already are. |
| 3.20 | 13.20 | `onboarding` | chatDemo | A real first contact: the Rep identifies itself as an AI, asks consent, places the trader in a market. |
| 12.80 | 23.20 | `answer` | chatDemo | The payoff: two taps and the Rep returns real sellers, quantities, ratings and prices. |
| 22.80 | 27.80 | `close` | closing | Tie the channel back to the platform and the brand. |

The two `chatDemo` scenes replay one conversation. The second declares
`fromTurn: 8`, and turns before it are drawn already settled, so the thread
**continues** rather than restarting on an empty screen the viewer has already
watched fill up.

The transcript's final turn is excluded: the Rep returned an empty reply to it.
See `QA_REPORT.md`.

`RepWhatsAppWide` is the same storyboard at `format: "wide"`. The `chatDemo`
scene carries two compositions, because a 9:16 object in a 16:9 frame is a
different problem from a 9:16 object in a 9:16 frame:

- **Portrait** stacks the headline above the phone and lets the handset fill
  most of the height.
- **Landscape** puts type and phone side by side, and scales the chat UI up by
  about a fifth. A handset given 22% of a 16:9 frame renders text much smaller
  on screen than it would in the hand; at true scale the seller cards were
  legible at full resolution but not at viewing distance.

The handset is sized by its **outer device height**, not its screen, and held to
84% of the frame. Sizing by the screen alone left it cramped against the top and
bottom at 4:3, where there is less width to absorb the difference. Both
landscape cuts therefore show an identically proportioned phone.

## The partner film

`PartnerFilm` — 60.000 s, 1800 frames, template `statisticLed`. Source: the
2026 partner deck, not the website. Ships at 16:9 and 4:3; both share one edit
and therefore one music bed, and only the layout differs.

| Start | End | Scene | Kind |
| --- | --- | --- | --- |
| 0.00 | 5.50 | `problem` | statement |
| 5.00 | 11.00 | `scale` | statBeat |
| 10.50 | 14.50 | `thesis` | statement |
| 14.00 | 19.00 | `reveal` | brandReveal |
| 18.50 | 25.50 | `see` | uiWalkthrough |
| 25.50 | 32.00 | `layers` | featureMontage |
| 31.60 | 36.60 | `intelligence` | uiWalkthrough |
| 36.10 | 40.10 | `pivot` | statement |
| 39.70 | 49.50 | `act` | chatDemo |
| 49.00 | 55.50 | `audiences` | audienceGrid |
| 55.00 | 60.00 | `close` | closing |

Its structure is a hinge. Everything before `pivot` is **see**; everything
after is **act**. The pivot scene carries the deck's own differentiator
verbatim — "You don't just see markets. / You can act in them." — and the scene
that follows is the real WhatsApp conversation, which is that claim filmed
rather than asserted.

The four **core layers** are each anchored to a real captured region rather
than drawn as a diagram: Network to the market directory, Data to the price
table, Trust to a confidence-badged alert, Risk to a live flood watch. A
diagram would have been easier and would have proved nothing.

## Format recomposition

`LaunchFilm`, `LaunchFilmStandard` and `LaunchFilmVertical` are the same
storyboard with a different `format`. The scenes adapt:

- **Statement** — headline auto-sizes to the portrait measure.
- **Walkthrough** — portrait gets a **portrait window** and opens already framed
  on the target region, because a whole desktop dashboard at phone width is
  unreadable. This is the difference between recomposing and centre-cropping.
- **Montage** — rows stack with the interface excerpt above the claim.
- **Closing** — the stat rail becomes a column in portrait.
- **4:3** — type steps down one notch and the application window is held to 72%
  of the height rather than 80%, because a narrower frame would otherwise be
  narrower than its own window.

## Scene kinds

| Kind | Used by |
| --- | --- |
| `statement` | all ten films |
| `brandReveal` | LaunchFilm, Vertical, ConferenceLoop |
| `uiWalkthrough` | LaunchFilm, Vertical, ConferenceLoop, Teaser |
| `featureMontage` | LaunchFilm, Vertical, ConferenceLoop |
| `apiBeat` | ConferenceLoop |
| `chatDemo` | RepWhatsApp, RepWhatsAppWide, RepWhatsAppStandard, PartnerFilm, PartnerFilmStandard |
| `statBeat` | PartnerFilm, PartnerFilmStandard |
| `audienceGrid` | PartnerFilm, PartnerFilmStandard |
| `closing` | all ten films |
