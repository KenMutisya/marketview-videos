import type { FormatId } from "../types/format";
import { defineStoryboard, type Storyboard, type StoryboardInput } from "../types/storyboard";

/**
 * MarketView — "Visible. Connected. Responsive." (60s partner film)
 *
 * Source: the 2026 partner deck, not the public website. The deck tells a
 * different story — MarketView as *infrastructure*, whose stated key
 * differentiator is the Activation Layer: "You don't just see markets; you can
 * act in them."
 *
 * The film is built around that pivot. The first half is **see**, using the
 * product captures. The second half is **act**, using the WhatsApp conversation
 * recorded from the live Rep — which is the deck's differentiator, filmed.
 *
 * Every line traces to `docs/PRODUCT_BRIEF.md § Second source`. Two things in
 * the deck are deliberately absent, by decision on 2026-10-27:
 *
 * - **"100M+ Businesses, Farmers & Traders"** — that is market size, not this
 *   product's reach. Beside the logo it would read as MarketView's network.
 * - **The 8–12 week implementation approach.**
 *
 * Timing: scenes sum to 1929 frames, ten transitions overlap 129, so the film
 * is exactly 1800 frames / 60.000s. Both editions share one edit and therefore
 * one music bed, `music-partner.wav`; only the layout differs.
 */
const partner = (format: FormatId): StoryboardInput => ({
  id: `marketview-partner-${format}`,
  title: `MarketView — Visible. Connected. Responsive. (partner film, ${format})`,
  template: "statisticLed",
  productId: "marketview",
  brandId: "marketview",
  format,
  motion: "enterprise",
  audio: {
    music: "assets/audio/music-partner.wav",
    musicGain: 0.74,
    cues: true,
    silent: false,
    narrationGain: 1,
  },
  scenes: [
    {
      id: "problem",
      kind: "statement",
      purpose: "The deck's opening problem, verbatim: intent exists, execution breaks.",
      seconds: 5.5,
      eyebrow: "THE PROBLEM",
      lines: ["Ecosystems support", "businesses and farmers."],
      sting: ["Execution breaks", "in the markets."],
      emphasise: ["breaks"],
      backdrop: "landing-hero",
      field: "deep",
      transitionOut: { kind: "dip", seconds: 0.5, through: "#060A20" },
    },
    {
      id: "scale",
      kind: "statBeat",
      purpose: "Why these markets matter, using the deck's two defensible figures.",
      seconds: 6.0,
      eyebrow: "TRADITIONAL MARKETS, SUB-SAHARAN AFRICA",
      stats: [
        { value: "80–90%", label: "Informal employment" },
        { value: "90%+", label: "Food trade via market hubs" },
      ],
      backdrop: "landing-hero",
      attribution: "MARKETVIEW PARTNER DECK, 2026",
      field: "deep",
      transitionOut: { kind: "dip", seconds: 0.5, through: "#060A20" },
    },
    {
      id: "thesis",
      kind: "statement",
      purpose: "The deck's Core Theory, compressed to its three load-bearing words.",
      seconds: 4.0,
      eyebrow: "CORE THEORY",
      lines: ["Visible.", "Connected.", "Responsive."],
      emphasise: ["Responsive."],
      field: "deep",
      network: true,
      transitionOut: { kind: "dip", seconds: 0.5, through: "#060A20" },
    },
    {
      id: "reveal",
      kind: "brandReveal",
      purpose: "Identity, with the deck's own positioning line rather than the website's.",
      seconds: 5.0,
      tagline: "Infrastructure around markets.",
      lede: "To reach and engage businesses, farmers, and market systems at scale.",
      capture: "dashboard-home",
      uiAt: 1.7,
      disclosure: "Interface shown with sample data.",
      transitionOut: { kind: "dip", seconds: 0.5, through: "#F3F6FA" },
    },
    {
      id: "see",
      kind: "uiWalkthrough",
      purpose: "SEE, part one: the live network, Africa down to a single country.",
      seconds: 7.0,
      capture: "markets-network",
      thenCapture: "markets-kenya",
      thenAt: 3.8,
      from: {},
      to: { region: "map", pad: 0.06 },
      move: [0.55, 3.4],
      caption: "REAL-TIME MAPPING",
      url: "marketview.africa/markets",
      cursor: [
        { at: 1.0, x: 0.78, y: 0.26 },
        { at: 2.9, x: 0.545, y: 0.52 },
        { at: 3.5, x: 0.545, y: 0.52, click: true },
        { at: 5.8, x: 0.42, y: 0.63 },
      ],
      callouts: [
        { at: 1.6, until: 3.1, text: "11 cross-validating sources per market", x: 0.3, y: 0.85, tone: "neutral" },
        { at: 4.5, text: "Kenya · 15 markets live", x: 0.7, y: 0.17, tone: "good" },
      ],
      field: "light",
      transitionOut: { kind: "cut", seconds: 0 },
    },
    {
      id: "layers",
      kind: "featureMontage",
      purpose:
        "The deck's four core layers, each anchored to a real region of the product rather than drawn as a diagram.",
      seconds: 6.5,
      eyebrow: "CORE LAYERS",
      field: "light",
      features: [
        {
          title: "Network",
          line: "Farmers, traders, agents, logistics and associations.",
          capture: "markets-kenya",
          region: "directoryList",
        },
        {
          title: "Data",
          line: "Real-time prices, volumes, supply and demand.",
          capture: "trade-pricing",
          region: "cheapest",
        },
        {
          title: "Trust",
          line: "Verification systems and reliable activity signals.",
          capture: "alerts",
          region: "price",
        },
        {
          title: "Risk",
          line: "Monitoring floods, congestion and security threats.",
          capture: "alerts",
          region: "weather",
        },
      ],
      transitionOut: { kind: "push", seconds: 0.4, direction: "left" },
    },
    {
      id: "intelligence",
      kind: "uiWalkthrough",
      purpose: "SEE, part two: what the intelligence actually resolves to — a price to act on.",
      seconds: 5.0,
      capture: "trade-pricing",
      from: { region: "buy", pad: 1.5 },
      to: { region: "buy", pad: 0.14 },
      move: [0.45, 3.2],
      caption: "WHAT YOU GET · PRICE AND VOLUME SIGNALS",
      url: "marketview.africa/trade",
      cursor: [],
      callouts: [{ at: 2.8, text: "Confidence level on every signal", x: 0.5, y: 0.88, tone: "good" }],
      field: "light",
      transitionOut: { kind: "dip", seconds: 0.5, through: "#060A20" },
    },
    {
      id: "pivot",
      kind: "statement",
      purpose: "The deck's key differentiator, verbatim. The hinge of the film.",
      seconds: 4.0,
      eyebrow: "ACTIVATION LAYER",
      lines: ["You don't just", "see markets."],
      sting: ["You can act", "in them."],
      emphasise: ["act"],
      field: "deep",
      network: true,
      transitionOut: { kind: "fade", seconds: 0.4 },
    },
    {
      id: "act",
      kind: "chatDemo",
      purpose:
        "ACT: the differentiator, filmed. A real conversation with the live Rep, ending in real sellers.",
      seconds: 9.8,
      transcript: "rep-whatsapp",
      fromTurn: 6,
      toTurn: 12,
      pace: 0.92,
      headline: ["Reach them", "where they already are."],
      disclosure: "Live AI · sample market data",
      field: "deep",
      transitionOut: { kind: "dip", seconds: 0.5, through: "#060A20" },
    },
    {
      id: "audiences",
      kind: "audienceGrid",
      purpose: "Who it is for, with the deck's own outcome and impact lines.",
      seconds: 6.5,
      eyebrow: "HOW YOU USE IT",
      field: "light",
      audiences: [
        {
          name: "Agribusiness",
          outcome: "Reliable sourcing and distribution.",
          impact: "Higher, stable incomes for smallholders.",
        },
        {
          name: "Government",
          outcome: "Coordinated food movement and faster response.",
          impact: "Improved food security and resilience.",
        },
        {
          name: "Research",
          outcome: "Evidence on real market behaviour.",
          impact: "Better-designed, scalable interventions.",
        },
        {
          name: "Finance",
          outcome: "Credit based on real activity.",
          impact: "Expanded access for traders and farmers.",
        },
        {
          name: "Cross-cutting",
          outcome: "Actionable signals for decision-making.",
          impact: "Scaled market coverage and visibility.",
        },
      ],
      transitionOut: { kind: "dip", seconds: 0.5, through: "#060A20" },
    },
    {
      id: "close",
      kind: "closing",
      purpose: "The deck's Core Theory as the closing promise, and its own call to action.",
      seconds: 5.0,
      statement: "Infrastructure that strengthens trade\nand improves farmer livelihoods.",
      stats: [
        { value: "5,000+", label: "verified actors in the live network" },
        { value: "160+", label: "markets across Kenya and Nigeria" },
        { value: "11", label: "cross-validating sources per market" },
      ],
      cta: "Request a demo",
      website: "marketview.africa",
      loopSafe: false,
    },
  ],
});

export const marketviewPartnerWide: Storyboard = defineStoryboard(partner("wide"));
export const marketviewPartnerStandard: Storyboard = defineStoryboard(partner("standard"));
