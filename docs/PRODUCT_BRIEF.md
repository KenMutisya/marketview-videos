# Product brief — MarketView

Source of truth for anything the films assert. Every claim below is traced to
where it came from. If a line is not here, it does not go on screen.

## What it is

**MarketView**, by **CoAmana**. Live agricultural market intelligence for Kenya
and Nigeria. One Laravel + Inertia + Vue backend serves a paying-client
dashboard, an internal admin console and a field-team PWA.

- Website: **marketview.africa** (product), marketview.coamana.com (app)
- Codebase inspected: `../marketview` (sibling checkout)

## Audience

Procurement and trading teams, R&D and development programmes, FMCG
distributors, lenders and networks operating across Kenyan and Nigerian
agricultural markets.

Named on the product's own landing page: agribusinesses; research and
development organisations; large corporates and FMCG; networks and finance.

## The core problem

Verbatim from the product's landing page, "What MarketView is":

> Informal markets run on relationships, observation, and word of mouth. They
> don't show up on dashboards. They don't appear in price indices. They don't
> answer surveys.

This is the hook of the launch film, used verbatim with editorial line breaks.

## Positioning

> The intelligence layer for the markets the rest of the world can't see into.

Used verbatim as the closing statement.

## Tagline

> Africa's trade hubs made visible.

Used verbatim in the brand reveal.

## Value proposition

> Live prices, verified actors, and a direct line into the informal markets that
> move 90% of Africa's food.

**Note on the 90% figure.** This is the product's own published claim on its own
landing page; the studio did not generate it. The films use a shortened form —
"Live prices, verified actors, and a direct line into the informal markets" —
which carries the proposition without restating a statistic the studio cannot
verify. The full line is recorded here so the decision is visible rather than
silent.

## Verified numbers

These are the only numbers the films put on screen.

### Two populations, deliberately kept apart

The campaign fact sheet (Q4 2026) gives a **mapped footprint** of ~498,000
market actors. The product team separately confirmed **5,000+ verified actors
in the live network** on 2026-10-27, correcting the landing page's "200,000+".

Both are true and they are not interchangeable. *Mapped* is the enumerated
universe MarketView has surveyed. *Verified* is the subset it has confirmed and
can put a buyer in front of. A film that said "500,000 verified actors" would
overstate the product by two orders of magnitude, so each figure keeps its own
wording and neither borrows the other's adjective. The word **verified** appears
on screen only beside 5,000+.

> **History worth not losing.** An earlier pass of this document recorded the
> 200,000+ → 5,000+ correction and concluded that the films should carry the
> lower figure. That conclusion still stands *for the verified count*. The
> fact-sheet figure below is a different measurement, cleared for the campaign
> films on 2026-11-02, not a reversal of that correction.

| Figure | Label | Source | Used by |
| --- | --- | --- | --- |
| **320+** | markets covered across Nigeria and Kenya | MarketView fact sheet, Q4 2026 | campaign films |
| **513** | structured markets mapped for expansion | MarketView fact sheet, Q4 2026 | campaign films |
| **~498k** | market actors in the **mapped footprint** | MarketView fact sheet, Q4 2026 | campaign films |
| **19** | data sources validating every market | MarketView fact sheet, Q4 2026 | campaign films |
| Nine states, two counties | Nigerian states and Kenyan counties | MarketView fact sheet, Q4 2026 | campaign films |
| **5,000+** | **verified** actors in the live network | product team, 2026-10-27 | launch, partner, Rep films |
| 160+ | markets across Kenya and Nigeria | landing hero stat strip | launch, partner films |
| 11 | cross-validating sources per market | landing stats band | launch, partner films |
| 2 | countries · deep, not wide | landing stats band | launch, partner films |
| 8 to 12 | week calibration sprint | landing stats band | partner film |

**The two coverage numbers are not reconciled.** The landing page says 160+
markets; the fact sheet says 320+ covered and 513 mapped. The campaign films use
the fact-sheet figures and the earlier films keep the landing-page figure they
were cleared against, which means the studio currently ships films carrying both.
That is a reporting question for the product team, not something a film should
paper over by picking a number. The Rep's own market table held **473 markets**
(302 Kenyan, 171 Nigerian) when the campaign transcripts were captured on
2026-11-02, which is consistent with 513 mapped but not with 320 covered being
the larger figure.

## Campaign call to action

The launch and partner films send viewers to `marketview.africa`. The three
campaign films send them to the cohort or a sprint:

> MarketView. Join the NABG cohort or book a sprint.
> demo.marketview.africa

**Partner names are not cleared.** The campaign brief lists Mercy Corps AgriFin,
Bayer supported programmes, NABG, GIZ and GSMA for an end-card strip, and flags
permission as outstanding. The storyboards carry the list; `partnersCleared` in
`src/products/marketview.ts` is `false`, so no strip renders. Set it to `true`
when someone confirms, and the end card picks it up with no other change.

## Capabilities, ranked for demonstration

Ranked by how well each reads on screen in under three seconds.

| Feature | Demo score | Capture | Problem it solves |
| --- | --- | --- | --- |
| **The live network** | 5 | `markets-network`, `markets-kenya` | Informal markets are invisible to conventional reporting |
| **Verified prices** | 5 | `trade-pricing` | Buyers commit before they know what a market actually charges |
| **Supply intelligence** | 4 | `alerts` | Disruptions are found after they have already moved prices |
| **Route conditions** | 4 | `routes` | Corridor conditions are reported late and informally |
| **API access** | 4 | `api-prices-endpoint` | Intelligence that cannot reach your systems does not get used |
| **Active actors** | 3 | `actors` | No reliable way to find a counterparty before you travel |

The live network map is the product's strongest single visual: it is the only
shot that makes the thesis — *these markets are invisible* → *here they are* —
without a sentence of explanation. It carries the longest scene in every film.

**Active actors scores 3 and is deliberately not given a close-up.** The panel
is a roster of individual people. Even with fixture names it is the one surface
where a tight shot would look like exposing a customer's contact list.

## Four live sources

Verbatim, from "Where the intelligence comes from":

1. **Live trader conversations** — the MarketView Rep chatbot, in conversation
   with traders and farmers across the network.
2. **Live transaction signals** — what is actually bought and sold, by whom, at
   what price.
3. **Official price feeds** — Kenyan government feeds as a cross-check. *Nigeria
   has no public government price feed*, so surveys and listings are used there.
4. **Live environmental context** — weather, route disruption, access risk.

## Lines used on screen, and where each comes from

| On screen | Source |
| --- | --- |
| "They don't show up on dashboards." / "They don't appear in price indices." | Landing page, "What MarketView is" — verbatim |
| "Africa's trade hubs made visible." | Landing hero — verbatim |
| "Live prices, verified actors, and a direct line into the informal markets." | Landing hero — shortened, see note above |
| "Cross-referenced across multiple live sources, with confidence levels on every signal." | "Verified prices" capability card — verbatim |
| "What's moving, where it's tight, and what disruptions are forming, before they become price events." | "Supply intelligence" capability card — verbatim |
| "Live conditions on corridors between markets: weather, access, disruption." | "Route conditions" capability card — verbatim |
| "The intelligence layer for the markets the rest of the world can't see into." | Landing section heading — verbatim |
| "11 cross-validating sources per market" | Landing stats band — verbatim |
| "5,000+ verified actors in the live network" | Product team, 2026-10-27 — supersedes the landing page's 200,000+ |
| "Kenya · 15 markets live" | Read from the captured UI (`markets-kenya`, country aggregate: "15 markets") |
| "Confidence level on every signal" | Paraphrase of the "Verified prices" card, same meaning |
| "Severity and confidence on every alert" | Read from the captured alerts UI, which shows both badges on every card |
| "Straight into your own stack." | Studio copy. A framing line, not a product claim. |
| "Request access" | The product's own CTA — verbatim |

## Second source: the 2026 partner deck

`Copy of Market View Deck_2026.pdf` (11 pages, supplied 2026-10-27). It is a
**different and stronger story** than the public website, and it is the source
for the `PartnerFilm` edition.

Where the website positions MarketView as *"the intelligence layer"*, the deck
positions it as **infrastructure**, and names the differentiator explicitly:

| Deck line | Page |
| --- | --- |
| "Infrastructure to Reach and Engage Businesses, Farmers, and Market Systems at Scale" | 1 (title) |
| "Ecosystems support businesses and farmers, but execution breaks in markets." | 2 |
| "Activation Layer (**Key Differentiator**) — You don't just see markets; you can act in them" | 8 |
| "Communication Channels: SMS Alerts · WhatsApp (via AI chat bot API)" | 8 |
| "By making them **Visible, Connected, and Responsive**, MarketView transforms fragmented systems into infrastructure that strengthens trade and improves farmer livelihoods." | 9 (Core Theory) |

### Verified figures from the deck

| Figure | Label | Page |
| --- | --- | --- |
| 80–90% | Informal employment (Sub-Saharan Africa) | 5 |
| 90%+ | Food trade via market hubs | 5 |

### Core layers (page 6)

Network · Data · Trust · Risk. Each is mapped to a real captured region of the
product in the partner film, rather than drawn as an abstract diagram.

### Audiences (page 9)

Agribusiness, Government, Research, Finance, Cross-Cutting — each with an
*Outcome* and an *Impact* line, used verbatim.

### Deliberately excluded

- **"100M+ Businesses, Farmers & Traders" (page 5).** This is the *market size*
  — people operating in these ecosystems — not MarketView's own network. Placed
  on screen beside the logo it would read as MarketView's reach, a ~20,000×
  overstatement against the confirmed 5,000+ verified actors. Excluded from
  every film by decision, 2026-10-27.
- **"Implementation Approach: 8–12 Week Sprints" (page 10).** Excluded by
  decision, 2026-10-27. The 8-to-12-week sprint is still cited on the website
  stat band and may be used elsewhere.

### Conflicts with the website

| Claim | Website | Deck | What ships |
| --- | --- | --- | --- |
| Verified actors | 200,000+ | — | **5,000+** (product team) |
| Food share | "90% of Africa's food" | "90%+ food trade via market hubs" | The deck's wording — it is narrower and defensible |
| CTA | "Request access" | "Request Demo" | **"Request a demo"** in the partner film; "Request access" in the product films |

## Assets available

- Logo mark: the product's own SVG, extracted unmodified to
  `public/assets/logos/marketview-mark.svg` (navy `#17235B`, green `#6AA946`,
  overlap teal `#2E6E6B`).
- Design tokens: the product's `:root` custom properties, transcribed in
  `src/brands/marketview.ts`.
- Typeface: Inter, as used by the product. Self-hosted.
- 12 interface captures at 3024×1890, with named regions.

## Capture surface and its honesty

Captures are driven from the **MarketView reference build** — a single-file,
client-only copy of the client dashboard that ships inside the product
repository and runs on bundled fixture data.

This is stated plainly because it bounds what the films can claim:

- The interface, layout, typography, colour, iconography and copy are the real
  product.
- The **numbers and names in it are fixtures, not live customer data.** The film
  carries an on-screen disclosure, "Interface shown with sample data", during
  the brand reveal, and the product's own `SAMPLE DATA` badge is left visible on
  the map.
- No production API was called. No credentials exist in this repository.
- The two demo-state banners the reference build shows a new client
  ("Sample data shown…", an SMS quota warning) are hidden during capture: they
  are onboarding state, not product chrome. The more prominent on-screen
  disclosure replaces them.

## Creative constraints

- Do not show the Team panel or a close-up of the actor roster.
- Do not invent a statistic, a customer, a testimonial or a security claim.
- Light interface, dark brand field. MarketView is a light product; its films
  are not dark-mode by default.
- Nigeria has no public government price feed. Do not imply parity of sources
  between the two countries.

## Open assumptions

1. **marketview.africa is the public-facing domain to show.** It appears in the
   product's own footer alongside marketview.coamana.com. If the launch domain
   is the latter, change `website` in `src/brands/marketview.ts` and re-render.
2. **The reference build reflects current production UI.** It is dated July 2026
   in the product repository. If the live app has moved on, re-run
   `npm run capture` against a running instance.
3. **"Request access" is the right CTA** for the audiences these films target.
