import { defineStoryboard, type Storyboard, type StoryboardInput } from "../types/storyboard";
import { marketviewProduct as product } from "../products/marketview";

/**
 * MarketView — "Built for your expansion goals" (campaign film 2 of 3).
 *
 * POV: a CEO planning growth. The argument is evidence — you can enter a market
 * you have never traded in, and show the board why that one.
 *
 * ## Timing
 *
 * 30fps, 60.000s = 1800 frames.
 *
 *   scenes       150 + 372 + 348 + 342 + 372 + 276 = 1860 frames
 *   overlap      5 transitions × 0.4s × 30fps       =   60 frames
 *   film         1860 − 60                          = 1800 frames = 60.000s
 *
 * ## A note on the API beat
 *
 * The brief asks for "a quick visual of data flowing into a partner system
 * through feeds and APIs". This uses the `apiBeat` scene against the real
 * `/prices` endpoint capture rather than an animated diagram of arrows moving
 * between boxes. The studio has a capture of the actual request and response;
 * an abstract motion graphic of "data flowing" would be the one shot in the
 * campaign that shows something the product does not literally do.
 */
const expansion: StoryboardInput = {
  id: "marketview-expansion-vertical",
  title: "MarketView — Built for your expansion goals (vertical)",
  template: "statisticLed",
  productId: "marketview",
  brandId: "marketview",
  format: "vertical",
  motion: "minimalPremium",
  audio: {
    music: "assets/audio/music-launch-vertical.wav",
    musicGain: 0.34,
    cues: true,
    narration: "assets/audio/narration-marketview-expansion-vertical.wav",
    narrationGain: 1,
  },
  scenes: [
    {
      id: "hook",
      kind: "statement",
      purpose: "The POV card. No voice.",
      seconds: 5.0,
      eyebrow: "POV",
      lines: ["You want to grow", "into new markets.", "You don't know", "where to start."],
      emphasise: ["where to start."],
      field: "deep",
      network: true,
      align: "left",
      transitionOut: { kind: "dip", seconds: 0.4, through: "#F3F6FA" },
    },
    {
      id: "map",
      kind: "uiWalkthrough",
      purpose:
        "Where your commodity trades beyond the markets you already know: the whole footprint, then one country.",
      seconds: 12.4,
      capture: "markets-network",
      thenCapture: "markets-kenya",
      thenAt: 7.4,
      from: {},
      to: { region: "map", pad: 0.08 },
      move: [0.6, 6.4],
      caption: "513 STRUCTURED MARKETS MAPPED",
      captionAt: 0.4,
      url: "marketview.africa/markets",
      cursor: [
        { at: 4.4, x: 0.6, y: 0.44 },
        { at: 6.8, x: 0.545, y: 0.52, click: true },
      ],
      callouts: [
        { at: 8.6, text: "Nine Nigerian states · two Kenyan counties", x: 0.5, y: 0.88, tone: "neutral" },
      ],
      field: "light",
      voiceover: [
        {
          text: "MarketView shows you where your commodity is traded beyond the markets you already know.",
        },
        {
          text: "Over 320 markets covered, and 513 mapped for expansion.",
        },
      ],
      transitionOut: { kind: "push", seconds: 0.4, direction: "left" },
    },
    {
      id: "profile",
      kind: "uiWalkthrough",
      purpose: "How big a market is, who trades there, and how active it is.",
      seconds: 11.6,
      capture: "markets-kenya",
      from: { region: "map", pad: 0.1 },
      to: { region: "directoryList", pad: 0.2 },
      move: [0.6, 6.2],
      caption: "MARKET PROFILE",
      captionAt: 0.35,
      url: "marketview.africa/markets",
      cursor: [{ at: 3.0, x: 0.28, y: 0.46 }],
      callouts: [],
      field: "light",
      voiceover: [
        { text: "See how big each market is, who trades there, and how active it is." },
      ],
      transitionOut: { kind: "push", seconds: 0.4, direction: "left" },
    },
    {
      id: "trends",
      kind: "uiWalkthrough",
      purpose:
        "Movement over time, and the corridors between markets — the part that tells you where to go next.",
      seconds: 11.4,
      capture: "trade-pricing",
      from: { region: "corridors", pad: 0.9 },
      to: { region: "corridors", pad: 0.14 },
      move: [0.6, 6.0],
      caption: "CORRIDORS & TRENDS",
      captionAt: 0.3,
      url: "marketview.africa/trade",
      cursor: [],
      callouts: [],
      field: "light",
      voiceover: [
        { text: "Spot growing markets and new sourcing routes before your competitors do." },
      ],
      transitionOut: { kind: "dip", seconds: 0.4, through: "#060A20" },
    },
    {
      id: "api",
      kind: "apiBeat",
      purpose:
        "Evidence has to reach the systems that act on it. The real endpoint, not a diagram of one.",
      seconds: 12.4,
      eyebrow: "ON OUR DASHBOARDS, OR IN YOUR STACK",
      title: "Markets, prices and actors,\nstraight into your own systems.",
      request: { method: "GET", path: "/v1/prices" },
      capture: "api-prices-endpoint",
      region: "endpoint",
      responseAt: 4.2,
      voiceover: [
        { text: "Make expansion decisions with real market evidence behind them." },
        { text: "Use it on our dashboards, or plug it into your own systems." },
      ],
      transitionOut: { kind: "dip", seconds: 0.4, through: "#060A20" },
    },
    {
      id: "close",
      kind: "closing",
      purpose: "The campaign end card, identical across all three films.",
      seconds: 9.2,
      statement: "MarketView.\nExpansion, with evidence behind it.",
      stats: [
        { value: "513", label: "structured markets mapped" },
        { value: "~498k", label: "market actors in the mapped footprint" },
      ],
      cta: product.campaign.cta,
      website: product.campaign.website,
      partners: [...product.campaign.partners],
      partnersLabel: "Working with",
      loopSafe: false,
      voiceover: [{ text: "MarketView. Join the NABG cohort, or book a sprint." }],
    },
  ],
};

export const marketviewExpansion: Storyboard = defineStoryboard(expansion);
