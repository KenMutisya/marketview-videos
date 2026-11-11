import { defineStoryboard, type Storyboard, type StoryboardInput } from "../types/storyboard";
import { marketviewProduct as product } from "../products/marketview";

/**
 * MarketView — "Rep, your AI market assistant on WhatsApp" (campaign film 3 of 3).
 *
 * POV: a busy agribusiness owner. The argument is availability — the answer is
 * in the thread you already have open.
 *
 * ## The conversation is real, and so is its limit
 *
 * Both transcripts were captured on 2026-11-02 by driving the Rep's own
 * WhatsApp preview console against the service on Vertex AI
 * (`gemini-2.5-flash`) with its Postgres data layer loaded. Every word the Rep
 * says in this film is a word the live model produced.
 *
 * Two things that came out of that capture shape the edit:
 *
 * 1. **Dawanau has no maize price.** The brief's headline question — "what is
 *    the price of maize in Dawanau this week?" — gets an honest "I have not
 *    heard a price for maize in Dawanau Market yet. I have noted the gap",
 *    followed by the markets where the Rep *does* hold maize prices. The film
 *    keeps that answer and follows it to the real cheapest-first table rather
 *    than relocating the buyer to a market with better data and pretending the
 *    first question went differently. A buyer who has been told "not here, but
 *    here, and here is how fresh it is" has been told something true, which is
 *    a better advertisement for an intelligence product than a number that
 *    turns out not to exist.
 *
 * 2. **Hausa is half-localised.** Onboarding runs genuinely in Hausa — consent,
 *    state, market, buying-or-selling and the product menu all come back in
 *    Hausa. The *price answer* comes back in English. So the language beat
 *    shows the Hausa onboarding and the voiceover says the Rep "works in the
 *    language you work in" over footage of exactly that, rather than claiming a
 *    Hausa answer this build does not produce.
 *
 * The brief also asks for a voice-note beat and an "answer arriving late in the
 * evening" beat. Neither is in this cut: nothing in the capture demonstrates
 * voice input, and a timestamp on a bubble is a property of when the capture
 * ran, not a feature. See docs/QA_REPORT.md.
 *
 * ## Timing
 *
 * 30fps, 60.000s = 1800 frames.
 *
 *   scenes       150 + 480 + 540 + 390 + 288 = 1848 frames
 *   overlap      4 transitions × 0.4s × 30fps =   48 frames
 *   film         1848 − 48                    = 1800 frames = 60.000s
 */
const repAgri: StoryboardInput = {
  id: "marketview-rep-agri-vertical",
  title: "MarketView Rep — your market analyst on WhatsApp (vertical)",
  template: "featureAnnouncement",
  productId: "marketview",
  brandId: "marketview",
  format: "vertical",
  motion: "minimalPremium",
  audio: {
    music: "assets/audio/music-launch-vertical.wav",
    musicGain: 0.32,
    cues: true,
    narration: "assets/audio/narration-marketview-rep-agri-vertical.wav",
    narrationGain: 1,
  },
  scenes: [
    {
      id: "hook",
      kind: "statement",
      purpose: "The POV card. No voice.",
      seconds: 5.0,
      eyebrow: "POV",
      lines: ["Your market analyst", "is on WhatsApp."],
      emphasise: ["is on WhatsApp."],
      field: "deep",
      network: true,
      align: "left",
      transitionOut: { kind: "fade", seconds: 0.4 },
    },
    {
      id: "ask",
      kind: "chatDemo",
      purpose:
        "The question a buyer actually asks, and an answer that admits a gap instead of inventing a number.",
      seconds: 16.0,
      transcript: "rep-agribusiness",
      // Turns 0–9 are onboarding. The film joins the thread at the question:
      // a viewer in a feed does not need to watch someone pick their county.
      fromTurn: 10,
      toTurn: 12,
      pace: 0.92,
      headline: ["Ask it like", "you'd ask a person."],
      disclosure: "Live AI · demo environment data",
      field: "deep",
      voiceover: [
        { text: "Ask Rep, MarketView's AI assistant, about prices, right inside WhatsApp." },
        { text: "When a market has no price yet, it says so — and names the markets that do." },
      ],
      transitionOut: { kind: "fade", seconds: 0.4 },
    },
    {
      id: "answer",
      kind: "chatDemo",
      purpose:
        "The payoff: five real markets, compared per kilo, each with how many reports and how old the newest one is.",
      seconds: 18.0,
      transcript: "rep-agribusiness",
      fromTurn: 12,
      toTurn: 14,
      pace: 1.0,
      headline: ["Five markets,", "compared per kilo."],
      disclosure: "Live AI · demo environment data",
      field: "deep",
      voiceover: [
        { text: "Find where supply is, and what it costs, without leaving your chat." },
        { text: "Every figure carries how many reports it rests on, and how fresh they are." },
      ],
      transitionOut: { kind: "dip", seconds: 0.4, through: "#060A20" },
    },
    {
      id: "language",
      kind: "chatDemo",
      purpose:
        "The language beat. Real Hausa onboarding, captured in a separate session — see the note at the top of this file.",
      seconds: 13.0,
      transcript: "rep-agribusiness-hausa",
      fromTurn: 0,
      toTurn: 8,
      pace: 0.78,
      headline: ["In the language", "you work in."],
      disclosure: "Live AI · Hausa session",
      field: "deep",
      voiceover: [{ text: "And it works in the language you work in." }],
      transitionOut: { kind: "dip", seconds: 0.4, through: "#060A20" },
    },
    {
      id: "close",
      kind: "closing",
      purpose: "The campaign end card, identical across all three films.",
      seconds: 9.6,
      statement: "MarketView Rep.\nThe market, in the thread you already have open.",
      stats: [{ value: "320+", label: "markets covered" }],
      cta: product.campaign.cta,
      website: product.campaign.website,
      partners: [...product.campaign.partners],
      partnersLabel: "Working with",
      loopSafe: false,
      voiceover: [
        { text: "Answers any time, no data analyst needed." },
        { text: "MarketView. Join the NABG cohort, or book a sprint." },
      ],
    },
  ],
};

export const marketviewRepAgri: Storyboard = defineStoryboard(repAgri);
