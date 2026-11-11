import { defineStoryboard, type Storyboard } from "../types/storyboard";

/**
 * MarketView — 15-second vertical teaser.
 *
 * This file is the demonstration that the studio is configuration-driven: it
 * is a complete, separate film and contains no React, no animation code and no
 * new components. It picks a different narrative template, a different motion
 * personality and a different subset of the same captures.
 */
export const marketviewTeaser: Storyboard = defineStoryboard({
  id: "marketview-teaser",
  title: "MarketView — 15s vertical teaser",
  template: "featureAnnouncement",
  productId: "marketview",
  brandId: "marketview",
  format: "vertical",
  motion: "highEnergyTech",
  audio: {
    music: "assets/audio/music-launch.wav",
    musicGain: 0.72,
    // The bed opens sparse; a 15-second cut starts where it has some weight.
    musicFrom: 9.5,
    cues: true,
    silent: false,
    narrationGain: 1,
  },
  scenes: [
    {
      id: "hook",
      kind: "statement",
      purpose: "One line, immediately.",
      seconds: 3.4,
      eyebrow: "KENYA · NIGERIA",
      lines: ["160+ markets.", "One live view."],
      emphasise: ["view."],
      field: "deep",
      network: true,
      align: "left",
      transitionOut: { kind: "dip", seconds: 0.4, through: "#F3F6FA" },
    },
    {
      id: "network",
      kind: "uiWalkthrough",
      purpose: "The single strongest visual the product has.",
      seconds: 6.4,
      capture: "markets-network",
      thenCapture: "markets-kenya",
      thenAt: 3.6,
      to: { region: "map", pad: 0.02 },
      move: [0.4, 3.2],
      caption: "THE LIVE NETWORK",
      url: "marketview.africa/markets",
      cursor: [
        { at: 1.2, x: 0.78, y: 0.28 },
        { at: 2.9, x: 0.54, y: 0.52 },
        { at: 3.3, x: 0.54, y: 0.52, click: true },
      ],
      callouts: [{ at: 4.4, text: "Kenya · 15 markets live", x: 0.5, y: 0.14, tone: "good" }],
      field: "light",
      transitionOut: { kind: "dip", seconds: 0.4, through: "#060A20" },
    },
    {
      id: "close",
      kind: "closing",
      purpose: "Brand and where to go. Nothing else.",
      seconds: 5.6,
      statement: "Africa's trade hubs\nmade visible.",
      stats: [{ value: "5,000+", label: "verified actors in the live network" }],
      cta: "Request access",
      website: "marketview.africa",
      loopSafe: false,
    },
  ],
});
