import type { FormatId } from "../types/format";
import { defineStoryboard, type Storyboard, type StoryboardInput } from "../types/storyboard";
import { marketviewProduct as product } from "../products/marketview";

/**
 * MarketView — 30-second launch film.
 *
 * Template: Problem → Solution → Demonstration → Benefits → CTA.
 *
 * Timing is authored in seconds, chosen so every duration lands on a whole
 * frame at 30fps.
 *
 * **Pacing is per format, not shared.** The first cut of this film gave every
 * scene 4.8–6.0 seconds — a standard deviation of 0.46s, which is a grid
 * rather than a rhythm. The edit now runs 4.0s to 7.5s: the brand reveal is
 * short because the audience already knows what a logo is, the network map is
 * the longest shot in the film because it is the only one that proves the
 * thesis without a sentence, and the move from the map to the price card is a
 * **hard cut** — two light product scenes with no transition between them, which
 * is both punchier than a dissolve and avoids the doubled image a light-to-light
 * crossfade produces.
 *
 * The vertical edition is a different edit, not the same one letterboxed: 25
 * seconds instead of 30, every scene tightened, because a feed gives a film
 * about a second to earn the next one.
 *
 * Each format has its own music bed, cut to its own boundaries. Change a
 * duration here and update the matching entry in `scripts/make-audio.ts`,
 * then re-run `npm run audio`.
 */
/**
 * Scene lengths and transition lengths per format, in seconds. Every value is
 * a multiple of 1/30 so each lands on a whole frame.
 *
 * wide/standard: 150+120+225+129+192+141 = 957 frames, less 57 of overlap = 900 (30.000s)
 * vertical:      108+102+180+114+162+132 = 798 frames, less 48 of overlap = 750 (25.000s)
 */
const PACE = {
  wide: {
    hook: 5.0,
    reveal: 4.0,
    network: 7.5,
    pricing: 4.3,
    capabilities: 6.4,
    close: 4.7,
    dip: 0.5,
    push: 0.4,
  },
  vertical: {
    hook: 3.6,
    reveal: 3.4,
    network: 6.0,
    pricing: 3.8,
    capabilities: 5.4,
    close: 4.4,
    dip: 0.4,
    push: 0.4,
  },
} as const;

const launch = (format: FormatId): StoryboardInput => {
  const p = format === "vertical" ? PACE.vertical : PACE.wide;
  const vertical = format === "vertical";
  return ({
  id: `marketview-launch-${format}`,
  title: `MarketView — Africa's trade hubs made visible (${format})`,
  template: "problemSolution",
  productId: "marketview",
  brandId: "marketview",
  format,
  audio: {
    music: vertical ? "assets/audio/music-launch-vertical.wav" : "assets/audio/music-launch.wav",
    musicGain: 0.65,
    cues: true,
    silent: false,
    narrationGain: 1,
  },
  scenes: [
    {
      id: "hook",
      kind: "statement",
      purpose:
        "State the problem in the product's own words, over a real market. No product yet.",
      seconds: p.hook,
      eyebrow: "INFORMAL MARKETS · KENYA & NIGERIA",
      // Verbatim from the product's own landing copy; see products/marketview.ts
      // (`problem.sting`) for the source. Line breaks are editorial.
      lines: ["They don't show up", "on dashboards."],
      sting: ["They don't appear", "in price indices."],
      emphasise: ["dashboards.", "indices."],
      backdrop: "landing-hero",
      field: "deep",
      align: "left",
      transitionOut: { kind: "dip", seconds: p.dip, through: "#060A20" },
    },
    {
      id: "reveal",
      kind: "brandReveal",
      purpose: "Identity lands, then the real dashboard rises into frame.",
      seconds: p.reveal,
      tagline: product.tagline,
      lede: "Live prices, verified actors, and a direct line into the informal markets.",
      capture: "dashboard-home",
      uiAt: vertical ? 1.5 : 1.7,
      disclosure: product.dataDisclosure,
      // Dark statement to light product: a bright dip reads as the lights
      // coming up on the interface. A zoom-through between two similar-looking
      // dashboards just smears.
      transitionOut: { kind: "dip", seconds: p.dip, through: "#F3F6FA" },
    },
    {
      id: "network",
      kind: "uiWalkthrough",
      purpose:
        "Show the live network: Africa view, then a real dive into Kenya driven by a click.",
      seconds: p.network,
      capture: "markets-network",
      thenCapture: "markets-kenya",
      thenAt: vertical ? 3.2 : 4.0,
      from: {},
      to: { region: "map", pad: 0.06 },
      move: [0.55, vertical ? 2.8 : 3.6],
      caption: "THE LIVE NETWORK · 160+ MARKETS",
      captionAt: 0.3,
      url: "marketview.africa/markets",
      cursor: vertical
        ? [
            { at: 0.8, x: 0.78, y: 0.26 },
            { at: 2.4, x: 0.545, y: 0.52 },
            { at: 2.9, x: 0.545, y: 0.52, click: true },
            { at: 4.6, x: 0.42, y: 0.63 },
          ]
        : [
            { at: 1.0, x: 0.78, y: 0.26 },
            { at: 3.1, x: 0.545, y: 0.52 },
            { at: 3.7, x: 0.545, y: 0.52, click: true },
            { at: 6.1, x: 0.42, y: 0.63 },
          ],
      callouts: [
        {
          at: vertical ? 1.3 : 1.6,
          until: vertical ? 2.6 : 3.3,
          text: "11 cross-validating sources per market",
          x: 0.3,
          y: 0.85,
          tone: "neutral",
        },
        {
          at: vertical ? 3.9 : 4.8,
          text: "Kenya · 15 markets live",
          x: 0.7,
          y: 0.17,
          tone: "good",
        },
      ],
      field: "light",
      // A hard cut. Two light product scenes, no transition: the sharpest
      // moment in the film and the one place a dissolve would soften it.
      transitionOut: { kind: "cut", seconds: 0 },
    },
    {
      id: "pricing",
      kind: "uiWalkthrough",
      purpose: "The payoff: what to pay, where, with confidence attached.",
      seconds: p.pricing,
      capture: "trade-pricing",
      // Opens on a wide view of the card rather than the whole dashboard: a
      // dense desktop surface at full frame is noise, not a demonstration.
      from: { region: "buy", pad: 1.5 },
      to: { region: "buy", pad: 0.14 },
      move: [0.45, vertical ? 2.6 : 3.3],
      caption: "TRADE & PRICING · VERIFIED BENCHMARKS",
      captionAt: 0.25,
      url: "marketview.africa/trade",
      cursor: [],
      callouts: [
        {
          at: vertical ? 2.4 : 2.8,
          text: "Confidence level on every signal",
          x: 0.5,
          y: 0.88,
          tone: "good",
        },
      ],
      field: "light",
      // Light scene to light scene: a crossfade here just doubles the image.
      // A push keeps both frames moving together and reads as advancing.
      transitionOut: { kind: "push", seconds: p.push, direction: "left" },
    },
    {
      id: "capabilities",
      kind: "featureMontage",
      purpose: "Three capabilities, each anchored to a real region of the product.",
      seconds: p.capabilities,
      eyebrow: "ONE INTELLIGENCE LAYER",
      field: "light",
      features: [
        {
          title: "Verified prices",
          line: "Cross-referenced across multiple live sources, with confidence levels on every signal.",
          capture: "trade-pricing",
          region: "cheapest",
        },
        {
          title: "Supply intelligence",
          line: "What's moving, where it's tight, and what disruptions are forming, before they become price events.",
          capture: "alerts",
          region: "stack",
        },
        {
          title: "Route conditions",
          line: "Live conditions on corridors between markets: weather, access, disruption.",
          capture: "routes",
          region: "summary",
        },
      ],
      transitionOut: { kind: "dip", seconds: p.dip, through: "#060A20" },
    },
    {
      id: "close",
      kind: "closing",
      purpose: "Identity, the positioning line, verified numbers, and where to go.",
      seconds: p.close,
      statement: "The intelligence layer for the markets\nthe rest of the world can't see into.",
      stats: [
        { value: "5,000+", label: "verified actors in the live network" },
        { value: "160+", label: "markets across Kenya and Nigeria" },
        { value: "11", label: "cross-validating sources per market" },
      ],
      cta: product.cta ?? "Request access",
      website: product.website,
      loopSafe: false,
    },
  ],
});
};

export const marketviewLaunchWide: Storyboard = defineStoryboard(launch("wide"));
export const marketviewLaunchStandard: Storyboard = defineStoryboard(launch("standard"));
export const marketviewLaunchVertical: Storyboard = defineStoryboard(launch("vertical"));
