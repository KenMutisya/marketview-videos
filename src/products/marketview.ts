/**
 * MarketView product profile.
 *
 * Every string here is either lifted verbatim from the product's own published
 * copy or derived from its shipped fixture data. Nothing is invented. The
 * `source` field on each claim records where it came from so QA can re-verify
 * it; see docs/PRODUCT_BRIEF.md.
 */

export type VerifiedClaim = {
  text: string;
  source: string;
};

export type ProductFeature = {
  id: string;
  name: string;
  /** What the customer problem actually is. */
  problem: string;
  /** One short line for on-screen use. */
  line: string;
  /** Which capture shows it, and which named region to frame. */
  capture: string;
  region?: string;
  /** How well it reads in under three seconds. 1 (poor) – 5 (excellent). */
  demoScore: number;
};

export const marketviewProduct = {
  id: "marketview",
  name: "MarketView",
  parent: "CoAmana",
  tagline: "Africa's trade hubs made visible.",
  website: "marketview.africa",
  cta: "Request access",
  audience:
    "Procurement and trading teams, R&D and development programmes, FMCG distributors, lenders and networks operating across Kenyan and Nigerian agricultural markets.",

  /** The hook. Verbatim product copy, which is why it can carry the film. */
  problem: {
    lines: [
      "Informal markets run on relationships,",
      "observation, and word of mouth.",
    ],
    sting: ["They don't show up on dashboards.", "They don't appear in price indices."],
    source: "MarketView landing page, “What MarketView is” section",
  },

  valueProposition: {
    text: "Live prices, verified actors, and a direct line into the informal markets that move 90% of Africa's food.",
    source: "MarketView landing page hero",
  } satisfies VerifiedClaim,

  positioning: {
    text: "The intelligence layer for the markets the rest of the world can't see into.",
    source: "MarketView landing page, section heading",
  } satisfies VerifiedClaim,

  /**
   * Numbers the films are allowed to show.
   *
   * ## Two different populations, deliberately kept apart
   *
   * The campaign fact sheet (Q4 2026) gives a **mapped footprint** of ~498,000
   * market actors. The product team separately confirmed **5,000+ verified
   * actors in the live network** on 2026-10-27, correcting the landing page's
   * "200,000+".
   *
   * These do not contradict each other and they are not interchangeable.
   * "Mapped" is the enumerated universe MarketView has surveyed; "verified" is
   * the subset it has confirmed and can put a buyer in front of. A film that
   * said "500,000 verified actors" would be overstating the product by two
   * orders of magnitude, so each figure carries its own wording and neither
   * borrows the other's adjective.
   *
   * The campaign films use the fact-sheet coverage numbers; the word
   * "verified" belongs only to the 5,000+ row.
   */
  stats: [
    {
      value: "320+",
      label: "markets covered across Nigeria and Kenya",
      source: "MarketView fact sheet, Q4 2026",
    },
    {
      value: "513",
      label: "structured markets mapped for expansion",
      source: "MarketView fact sheet, Q4 2026",
    },
    {
      value: "~498k",
      label: "market actors in the mapped footprint",
      source: "MarketView fact sheet, Q4 2026 (mapped, not verified — see below)",
    },
    {
      value: "19",
      label: "data sources validating every market",
      source: "MarketView fact sheet, Q4 2026",
    },
    {
      value: "5,000+",
      label: "verified actors in the live network",
      source: "product team, 2026-10-27 (supersedes the landing-page figure of 200,000+)",
    },
    { value: "11", label: "cross-validating sources per market", source: "landing stats band" },
    { value: "160+", label: "markets across Kenya and Nigeria", source: "landing hero stat strip" },
    { value: "2", label: "countries · deep, not wide", source: "landing stats band" },
  ],

  /**
   * Where the expansion footprint sits, from the fact sheet. Used by the
   * expansion film, which has to say more than "two countries".
   */
  footprint: {
    text: "Nine Nigerian states and two Kenyan counties",
    source: "MarketView fact sheet, Q4 2026",
  } satisfies VerifiedClaim,

  /**
   * The campaign's call to action. The launch and partner films send viewers
   * to the product site; the campaign films send them to the cohort or a
   * sprint, and to the demo address.
   */
  campaign: {
    cta: "Join the NABG cohort or book a sprint",
    website: "demo.marketview.africa",
    /**
     * Named on the end card as programmes MarketView works with.
     *
     * **Not cleared for use at the time of writing.** The campaign brief flags
     * permission for names and logos as outstanding, so the storyboards carry
     * this list but the end card renders no partner strip until someone
     * confirms it. Flipping `partnersCleared` to true is the whole change.
     */
    partners: ["Mercy Corps AgriFin", "Bayer", "NABG", "GIZ", "GSMA"],
    partnersCleared: false,
    source: "MarketView product video brief, campaign team",
  },

  features: [
    {
      id: "verified-prices",
      name: "Verified prices",
      problem: "Buyers commit before they know what a market actually charges.",
      line: "Cross-referenced across multiple live sources, with confidence on every signal.",
      capture: "trade-pricing",
      region: "buy",
      demoScore: 5,
    },
    {
      id: "live-network",
      name: "The live network",
      problem: "Informal markets are invisible to conventional reporting.",
      line: "160+ markets on the map, from an Africa view down to a single trading floor.",
      capture: "markets-network",
      region: "map",
      demoScore: 5,
    },
    {
      id: "supply-intelligence",
      name: "Supply intelligence",
      problem: "Disruptions are discovered after they have already moved prices.",
      line: "What's moving, where it's tight, and what disruptions are forming.",
      capture: "alerts",
      region: "stack",
      demoScore: 4,
    },
    {
      id: "route-conditions",
      name: "Route conditions",
      problem: "Corridor conditions are reported late and informally.",
      line: "Live conditions on corridors between markets: weather, access, disruption.",
      capture: "routes",
      region: "summary",
      demoScore: 4,
    },
    {
      id: "api",
      name: "API access",
      problem: "Intelligence that cannot reach your systems does not get used.",
      line: "Markets, prices, actors and weather, straight into your own stack.",
      capture: "api-prices-endpoint",
      region: "endpoint",
      demoScore: 4,
    },
    {
      id: "actor-network",
      name: "Active actors",
      problem: "There is no reliable way to find a counterparty before you travel.",
      line: "Verified, consented actors operating in your markets.",
      capture: "actors",
      demoScore: 3,
    },
  ] satisfies ProductFeature[],

  /**
   * Captures are driven from the product's reference build, which runs on
   * bundled fixture data. The film discloses this on screen.
   */
  dataDisclosure: "Interface shown with sample data.",
} as const;
