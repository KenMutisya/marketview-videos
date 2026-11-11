import { defineStoryboard, type Storyboard, type StoryboardInput } from "../types/storyboard";
import { marketviewProduct as product } from "../products/marketview";

/**
 * MarketView — "Procurement made easier" (campaign film 1 of 3).
 *
 * POV: a procurement manager. The argument is reach — sourcing from open
 * markets gets easier because you can see more markets, and more of the people
 * in them, than you could reach on your own.
 *
 * ## Format
 *
 * Vertical only, and deliberately so. The campaign runs on WhatsApp status and
 * in the LinkedIn feed, and **WhatsApp status cuts a video at 60 seconds**, so
 * this film is cut to land at exactly 60.000s rather than merely "under a
 * minute". There is no widescreen edition: a 9:16 film is the deliverable, and
 * a 16:9 cut nobody asked for is a second thing to keep in step.
 *
 * ## Timing
 *
 * At 30fps, 60.000s is 1800 frames. Transitions overlap their neighbours, so
 * the scenes must sum to 1800 plus the overlap:
 *
 *   scenes       150 + 390 + 360 + 372 + 330 + 258 = 1860 frames
 *   overlap      5 transitions × 0.4s × 30fps       =   60 frames
 *   film         1860 − 60                          = 1800 frames = 60.000s
 *
 * Change a duration here and the arithmetic above has to change with it, or
 * the film runs past the cut that WhatsApp makes for you.
 *
 * ## Claims
 *
 * Coverage and footprint figures are the Q4 2026 fact sheet; see
 * docs/PRODUCT_BRIEF.md. Note that the ~498k figure is the **mapped** footprint
 * and is never described on screen as verified — that word belongs to a much
 * smaller number, and the distinction is the whole reason the brief records
 * both.
 */
const procurement: StoryboardInput = {
  id: "marketview-procurement-vertical",
  title: "MarketView — Procurement made easier (vertical)",
  template: "problemSolution",
  productId: "marketview",
  brandId: "marketview",
  format: "vertical",
  motion: "minimalPremium",
  audio: {
    music: "assets/audio/music-launch-vertical.wav",
    // Under the narration rather than beside it. The bed was mixed for a film
    // with no voice in it; at its original gain it competes with the caption
    // the viewer is also reading.
    musicGain: 0.34,
    cues: true,
    narration: "assets/audio/narration-marketview-procurement-vertical.wav",
    narrationGain: 1,
  },
  scenes: [
    {
      id: "hook",
      kind: "statement",
      purpose:
        "The POV card. No voice: the first second belongs to the line, and a feed gives it about that long.",
      seconds: 5.0,
      eyebrow: "POV",
      lines: ["Sourcing from", "open markets", "just got easier."],
      emphasise: ["just got easier."],
      field: "deep",
      network: true,
      align: "left",
      transitionOut: { kind: "dip", seconds: 0.4, through: "#F3F6FA" },
    },
    {
      id: "coverage",
      kind: "uiWalkthrough",
      purpose:
        "The reach claim, shown rather than stated: start on one market's pins and pull out to the whole footprint.",
      seconds: 13.0,
      capture: "markets-network",
      /**
       * The brief asks to "zoom out to show coverage". In portrait this is a
       * push **in**, and deliberately.
       *
       * `UIWalkthroughScene` ignores `from` in a column format and derives the
       * opening framing from `to`, widened — because a full desktop dashboard
       * at 1080px wide is unreadable, so the vertical cut always opens on a
       * wide view of the target region and moves in. Asking it to end on the
       * whole window instead produces what the first pass of this film
       * produced: a desktop clipped at the right edge for thirteen seconds,
       * with the map half out of frame.
       *
       * So the shot opens wide on the map — which is the coverage view, pins
       * across two countries — and settles into it. The claim is carried by the
       * pins and the caption; the move's job is to make the frame feel alive,
       * not to do the arithmetic.
       */
      to: { region: "map", pad: 0.12 },
      move: [0.6, 7.0],
      caption: "THE LIVE NETWORK",
      captionAt: 0.4,
      url: "marketview.africa/markets",
      cursor: [],
      callouts: [
        {
          at: 7.8,
          text: "19 data sources validating every market",
          x: 0.5,
          y: 0.9,
          tone: "good",
        },
      ],
      field: "light",
      voiceover: [
        { text: "MarketView puts over 320 markets across Nigeria and Kenya in one place." },
        {
          text: "Each one validated through 19 data sources, including government enumerators and market leaders.",
        },
      ],
      transitionOut: { kind: "push", seconds: 0.4, direction: "left" },
    },
    {
      id: "actors",
      kind: "uiWalkthrough",
      purpose:
        "Who is in those markets. Framed on the market directory, not on the actor roster — see the note below.",
      seconds: 12.0,
      capture: "markets-search-nairobi",
      /**
       * The brief asks for "market actor profiles and supplier listings" here.
       * This frames the **market directory** instead.
       *
       * The actor roster is a list of named individuals with contact details.
       * docs/PRODUCT_BRIEF.md rules out a close-up of it on privacy grounds
       * even with fixture names, and an advertisement is the worst possible
       * place to make an exception: a tight shot of a roster in a public ad
       * reads as a company showing off its customers' contact list. The
       * footprint figure is spoken over a surface that carries no personal
       * data, which makes the same point without the exposure.
       */
      from: { pad: 0.3 },
      to: { region: "directoryList", pad: 0.22 },
      move: [0.7, 6.4],
      caption: "MARKET DIRECTORY",
      captionAt: 0.35,
      url: "marketview.africa/markets",
      cursor: [
        { at: 2.2, x: 0.3, y: 0.42 },
        { at: 5.0, x: 0.3, y: 0.58 },
      ],
      callouts: [],
      field: "light",
      voiceover: [
        {
          text: "Reach into a mapped footprint of nearly 500,000 market actors — the traders and aggregators who actually move your commodity.",
        },
      ],
      transitionOut: { kind: "push", seconds: 0.4, direction: "left" },
    },
    {
      id: "pricing",
      kind: "uiWalkthrough",
      purpose:
        "The decision itself: what a commodity costs where, with the confidence attached to each signal.",
      seconds: 12.4,
      capture: "trade-pricing",
      from: { region: "buy", pad: 1.2 },
      to: { region: "cheapest", pad: 0.16 },
      move: [0.6, 6.8],
      caption: "TRADE & PRICING",
      captionAt: 0.3,
      url: "marketview.africa/trade",
      cursor: [],
      callouts: [
        // What this card actually shows is its sources and the spread between
        // cheapest and dearest. "Confidence level on every signal" is real
        // product copy, but it belongs to a different surface — pointing it at
        // this one would be captioning a screenshot with a claim the screenshot
        // does not make.
        { at: 7.6, text: "Every card names its sources", x: 0.5, y: 0.88, tone: "good" },
      ],
      field: "light",
      voiceover: [
        {
          // The brief's line is "see prices and available volumes". This card
          // shows prices across markets, not volumes, so the claim is trimmed
          // to what the viewer can actually see happening.
          text: "See what your commodity costs across markets, then decide where to buy without sending someone to every one.",
        },
      ],
      transitionOut: { kind: "push", seconds: 0.4, direction: "left" },
    },
    {
      id: "suppliers",
      kind: "featureMontage",
      purpose:
        "The three things a buyer actually does, each anchored to a real region of the product.",
      seconds: 11.0,
      eyebrow: "FIND · COMPARE · REACH",
      field: "light",
      features: [
        {
          title: "Find",
          line: "Filter a market down to the suppliers trading your commodity today.",
          capture: "markets-search-nairobi",
        },
        {
          title: "Compare",
          line: "Benchmarked prices across markets, with confidence on every signal.",
          capture: "trade-pricing",
          region: "cheapest",
        },
        {
          title: "Reach",
          line: "Corridor conditions between you and the market you chose.",
          capture: "routes",
          region: "summary",
        },
      ],
      voiceover: [{ text: "Find, compare and reach suppliers faster." }],
      transitionOut: { kind: "dip", seconds: 0.4, through: "#060A20" },
    },
    {
      id: "close",
      kind: "closing",
      purpose: "The campaign end card, identical across all three films.",
      seconds: 8.6,
      statement: "MarketView.\nSourcing, with the market in view.",
      stats: [
        { value: "320+", label: "markets covered" },
        { value: "19", label: "data sources per market" },
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

export const marketviewProcurement: Storyboard = defineStoryboard(procurement);
