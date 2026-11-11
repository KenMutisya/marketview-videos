import { defineStoryboard, type Storyboard } from "../types/storyboard";

/**
 * MarketView — conference booth loop.
 *
 * Template: Silent Conference Loop → Feature Showcase → Brand → Seamless
 * restart. Designed for a 75" panel read from several metres away: the
 * `conference` format raises every type size, the `conferenceDisplay` motion
 * personality slows every move, walkthrough scenes open already framed on the
 * region that matters, and the film carries no audio stream at all.
 *
 * The close is `loopSafe`, which fades the last 0.6s to the same field the
 * opening frame starts on, so the restart is not a visible cut.
 */
export const marketviewConferenceLoop: Storyboard = defineStoryboard({
  id: "marketview-conference-loop",
  title: "MarketView — conference loop (silent, 1920×1080)",
  template: "conferenceLoop",
  productId: "marketview",
  brandId: "marketview",
  format: "conference",
  motion: "conferenceDisplay",
  audio: { silent: true, cues: false, musicGain: 0, narrationGain: 0 },
  scenes: [
    {
      id: "hook",
      kind: "statement",
      purpose: "Open on the problem, in type large enough to read across a hall.",
      seconds: 7.0,
      eyebrow: "INFORMAL MARKETS · KENYA & NIGERIA",
      lines: ["They don't show up", "on dashboards."],
      sting: ["They don't appear", "in price indices."],
      emphasise: ["dashboards.", "indices."],
      backdrop: "landing-hero",
      field: "deep",
      transitionOut: { kind: "dip", seconds: 0.6, through: "#060A20" },
    },
    {
      id: "reveal",
      kind: "brandReveal",
      purpose: "Brand and product, held long enough to land on a passer-by.",
      seconds: 7.5,
      tagline: "Africa's trade hubs made visible.",
      lede: "Live prices, verified actors, and a direct line into the informal markets.",
      capture: "dashboard-home",
      uiAt: 2.6,
      disclosure: "Interface shown with sample data.",
      transitionOut: { kind: "dip", seconds: 0.6, through: "#F3F6FA" },
    },
    {
      id: "network",
      kind: "uiWalkthrough",
      purpose: "The live network, framed tight so pins and labels read at distance.",
      seconds: 10.0,
      capture: "markets-network",
      thenCapture: "markets-kenya",
      thenAt: 6.0,
      to: { region: "map", pad: 0.04 },
      move: [1.0, 5.4],
      caption: "THE LIVE NETWORK · 160+ MARKETS",
      url: "marketview.africa/markets",
      cursor: [
        { at: 2.0, x: 0.8, y: 0.25 },
        { at: 4.8, x: 0.55, y: 0.5 },
        { at: 5.6, x: 0.55, y: 0.5, click: true },
      ],
      callouts: [
        { at: 2.6, until: 5.2, text: "11 cross-validating sources per market", x: 0.3, y: 0.86, tone: "neutral" },
        { at: 7.0, text: "Kenya · 15 markets live", x: 0.7, y: 0.16, tone: "good" },
      ],
      field: "light",
      transitionOut: { kind: "maskWipe", seconds: 0.5, direction: "left" },
    },
    {
      id: "pricing",
      kind: "uiWalkthrough",
      purpose: "What to pay, where, with the confidence attached.",
      seconds: 9.0,
      capture: "trade-pricing",
      to: { region: "buy", pad: 0.14 },
      move: [0.8, 5.0],
      caption: "TRADE & PRICING · VERIFIED BENCHMARKS",
      url: "marketview.africa/trade",
      callouts: [{ at: 4.6, text: "Confidence level on every signal", x: 0.5, y: 0.88, tone: "good" }],
      field: "light",
      transitionOut: { kind: "push", seconds: 0.5, direction: "left" },
    },
    {
      id: "risk",
      kind: "uiWalkthrough",
      purpose: "Risk and supply disruption, the part a buyer cannot get elsewhere.",
      seconds: 9.0,
      capture: "alerts",
      to: { region: "stack", pad: 0.06 },
      move: [0.8, 5.0],
      caption: "ALERTS · SUPPLY, PRICE AND FOOD SAFETY",
      url: "marketview.africa/alerts",
      callouts: [{ at: 5.0, text: "Severity and confidence on every alert", x: 0.5, y: 0.9, tone: "warn" }],
      field: "light",
      transitionOut: { kind: "dip", seconds: 0.5, through: "#060A20" },
    },
    {
      id: "developer",
      kind: "apiBeat",
      purpose: "The same intelligence, reachable from the customer's own systems.",
      seconds: 9.0,
      eyebrow: "FOR DEVELOPERS",
      title: "Straight into your own stack.",
      request: { method: "GET", path: "/v1/prices?commodity=red-onion&market=wakulima" },
      capture: "api-prices-endpoint",
      region: "endpoint",
      responseAt: 3.4,
      transitionOut: { kind: "dip", seconds: 0.5, through: "#F3F6FA" },
    },
    {
      id: "capabilities",
      kind: "featureMontage",
      purpose: "Three capabilities, each anchored to a real region of the product.",
      seconds: 11.0,
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
          line: "What's moving, where it's tight, and what disruptions are forming.",
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
      transitionOut: { kind: "dip", seconds: 0.6, through: "#060A20" },
    },
    {
      id: "close",
      kind: "closing",
      purpose: "Brand, positioning and CTA, then a clean hand-off back to frame one.",
      seconds: 9.5,
      statement: "The intelligence layer for the markets\nthe rest of the world can't see into.",
      stats: [
        { value: "5,000+", label: "verified actors in the live network" },
        { value: "160+", label: "markets across Kenya and Nigeria" },
        { value: "11", label: "cross-validating sources per market" },
      ],
      cta: "Request access",
      website: "marketview.africa",
      loopSafe: true,
    },
  ],
});
