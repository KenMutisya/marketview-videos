import type { FormatId } from "../types/format";
import { defineStoryboard, type Storyboard, type StoryboardInput } from "../types/storyboard";

/**
 * MarketView Rep — "It answers on WhatsApp."
 *
 * A phone commercial built on a real conversation. The transcript in
 * `public/assets/transcripts/rep-whatsapp.json` was captured by driving the
 * Rep's own WhatsApp preview console against the service running on Vertex AI
 * (gemini-2.5-flash) with its Postgres data layer loaded. Every word the Rep
 * says in this film is a word it actually said.
 *
 * Turn slice: 0–12. The transcript's final turn is dropped because the Rep
 * returned an empty reply to it — see docs/QA_REPORT.md.
 */
const rep = (format: FormatId): StoryboardInput => ({
  id: `marketview-rep-${format}`,
  title: `MarketView Rep — it answers on WhatsApp (${format})`,
  template: "featureAnnouncement",
  productId: "marketview",
  brandId: "marketview",
  format,
  motion: "minimalPremium",
  audio: {
    music: "assets/audio/music-launch.wav",
    musicGain: 0.72,
    // Starts past the bed's sparse opening. The figure is tied to the launch
    // bed's section boundaries, so re-cutting that bed means re-checking the
    // loudness this film lands at.
    musicFrom: 4.5,
    cues: true,
    silent: false,
    narrationGain: 1,
  },
  scenes: [
    {
      id: "hook",
      kind: "statement",
      purpose: "Set the premise in one line: the intelligence reaches people where they already are.",
      seconds: 3.6,
      eyebrow: "MARKETVIEW REP",
      lines: ["Most traders", "don't use dashboards."],
      sting: ["They use WhatsApp."],
      emphasise: ["WhatsApp."],
      field: "deep",
      network: true,
      align: format === "vertical" ? "left" : "left",
      transitionOut: { kind: "dip", seconds: 0.4, through: "#060A20" },
    },
    {
      id: "onboarding",
      kind: "chatDemo",
      purpose:
        "A real first contact: the Rep identifies itself as an AI, asks consent, and places the trader in a market.",
      seconds: 10.0,
      transcript: "rep-whatsapp",
      fromTurn: 0,
      toTurn: 8,
      pace: 0.82,
      headline: ["A trader messages in."],
      eyebrow: undefined,
      disclosure: "Live AI · sample market data",
      field: "deep",
      transitionOut: { kind: "fade", seconds: 0.4 },
    },
    {
      id: "answer",
      kind: "chatDemo",
      purpose:
        "The payoff: two taps and the Rep returns real sellers, quantities, ratings and prices.",
      seconds: 10.4,
      transcript: "rep-whatsapp",
      fromTurn: 8,
      toTurn: 12,
      pace: 1.05,
      headline: ["It answers", "with real sellers."],
      disclosure: "Live AI · sample market data",
      field: "deep",
      transitionOut: { kind: "dip", seconds: 0.4, through: "#060A20" },
    },
    {
      id: "close",
      kind: "closing",
      purpose: "Tie the channel back to the platform and the brand.",
      seconds: 5.0,
      statement: "English, Swahili, Hausa, Yoruba, Igbo.\nThe network, in the palm of a trader's hand.",
      stats: [{ value: "5,000+", label: "verified actors in the live network" }],
      cta: "Request access",
      website: "marketview.africa",
      loopSafe: false,
    },
  ],
});

export const marketviewRepVertical: Storyboard = defineStoryboard(rep("vertical"));
export const marketviewRepWide: Storyboard = defineStoryboard(rep("wide"));
export const marketviewRepStandard: Storyboard = defineStoryboard(rep("standard"));
