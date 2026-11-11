import { FORMATS } from "../types/format";
import { storyboardFrames, type Storyboard } from "../types/storyboard";
import {
  marketviewLaunchStandard,
  marketviewLaunchVertical,
  marketviewLaunchWide,
} from "../storyboards/marketview-launch";
import { marketviewConferenceLoop } from "../storyboards/marketview-conference";
import { marketviewTeaser } from "../storyboards/marketview-teaser";
import {
  marketviewPartnerStandard,
  marketviewPartnerWide,
} from "../storyboards/marketview-partner";
import {
  marketviewRepStandard,
  marketviewRepVertical,
  marketviewRepWide,
} from "../storyboards/marketview-rep";
import { marketviewProcurement } from "../storyboards/marketview-procurement";
import { marketviewExpansion } from "../storyboards/marketview-expansion";
import { marketviewRepAgri } from "../storyboards/marketview-rep-agri";

export type ExportPreset = {
  /** Constant rate factor. Lower is better quality and a larger file. */
  crf: number;
  /** Frames rendered in parallel. Tuned down for large canvases. */
  concurrency: number;
};

export type Film = {
  /** Remotion composition id, and the name used on the CLI. */
  id: string;
  storyboard: Storyboard;
  /** Output filename inside output/. */
  file: string;
  /** What this edition is for. */
  intent: string;
  preset: ExportPreset;
};

/**
 * The studio's output set.
 *
 * Single source of truth: Root.tsx registers compositions from here and the
 * CLI renders from here, so a film cannot exist in the Studio but not in the
 * render pipeline.
 */
export const FILMS: Film[] = [
  {
    id: "LaunchFilm",
    storyboard: marketviewLaunchWide,
    file: "marketview-launch-1920x1080.mp4",
    intent: "Website, YouTube, X, presentations. The reference edition.",
    preset: { crf: 18, concurrency: 4 },
  },
  {
    id: "LaunchFilmStandard",
    storyboard: marketviewLaunchStandard,
    file: "marketview-launch-1440x1080.mp4",
    intent: "4:3 standard. Booth panels and feed placements where a taller frame wins.",
    preset: { crf: 18, concurrency: 4 },
  },
  {
    id: "LaunchFilmVertical",
    storyboard: marketviewLaunchVertical,
    file: "marketview-launch-1080x1920.mp4",
    intent: "Reels, Shorts, TikTok, X. Recomposed, not cropped.",
    preset: { crf: 19, concurrency: 4 },
  },
  {
    id: "PartnerFilm",
    storyboard: marketviewPartnerWide,
    file: "marketview-partner-1920x1080.mp4",
    intent:
      "60s partner and investor film, built from the 2026 deck. See, then act.",
    preset: { crf: 18, concurrency: 4 },
  },
  {
    id: "PartnerFilmStandard",
    storyboard: marketviewPartnerStandard,
    file: "marketview-partner-1440x1080.mp4",
    intent: "4:3 cut of the partner film, for booth panels and shared screens.",
    preset: { crf: 18, concurrency: 4 },
  },
  {
    id: "ConferenceLoop",
    storyboard: marketviewConferenceLoop,
    file: "marketview-conference-loop-1920x1080.mp4",
    intent: "75\" booth screen. Silent, large type, loop-safe ending.",
    preset: { crf: 18, concurrency: 4 },
  },
  {
    id: "RepWhatsAppWide",
    storyboard: marketviewRepWide,
    file: "marketview-rep-whatsapp-1920x1080.mp4",
    intent:
      "Widescreen cut of the WhatsApp Rep film. Phone and type side by side, for the website and YouTube.",
    preset: { crf: 18, concurrency: 4 },
  },
  {
    id: "RepWhatsAppStandard",
    storyboard: marketviewRepStandard,
    file: "marketview-rep-whatsapp-1440x1080.mp4",
    intent: "4:3 cut of the WhatsApp Rep film.",
    preset: { crf: 18, concurrency: 4 },
  },
  {
    id: "RepWhatsApp",
    storyboard: marketviewRepVertical,
    file: "marketview-rep-whatsapp-1080x1920.mp4",
    intent:
      "Phone commercial for the WhatsApp Rep. Replays a real conversation captured from the live AI.",
    preset: { crf: 19, concurrency: 4 },
  },
  /**
   * The campaign set: three 60.000s vertical films for the NABG cohort and
   * sprint campaign. Narrated and captioned, unlike everything above them, and
   * cut to exactly 60s because WhatsApp status truncates anything longer.
   */
  {
    id: "ProcurementFilm",
    storyboard: marketviewProcurement,
    file: "marketview-procurement-1080x1920.mp4",
    intent:
      "Campaign film 1 of 3. POV a procurement manager: reach, and what it costs to source without it.",
    preset: { crf: 19, concurrency: 4 },
  },
  {
    id: "ExpansionFilm",
    storyboard: marketviewExpansion,
    file: "marketview-expansion-1080x1920.mp4",
    intent:
      "Campaign film 2 of 3. POV a CEO planning growth: where to expand, with evidence behind it.",
    preset: { crf: 19, concurrency: 4 },
  },
  {
    id: "RepAgriFilm",
    storyboard: marketviewRepAgri,
    file: "marketview-rep-agri-1080x1920.mp4",
    intent:
      "Campaign film 3 of 3. POV an agribusiness owner: Rep answering a real price question on WhatsApp.",
    preset: { crf: 19, concurrency: 4 },
  },
  {
    id: "Teaser",
    storyboard: marketviewTeaser,
    file: "marketview-teaser-1080x1920.mp4",
    intent: "15s high-impact teaser. Proves the studio is configuration-driven.",
    preset: { crf: 20, concurrency: 4 },
  },
];

export const getFilm = (id: string): Film => {
  const f = FILMS.find((x) => x.id.toLowerCase() === id.toLowerCase());
  if (!f) {
    throw new Error(`Unknown film "${id}". Available: ${FILMS.map((x) => x.id).join(", ")}.`);
  }
  return f;
};

/** Frame count a film must render to, derived from its storyboard. */
export const filmFrames = (film: Film): number =>
  storyboardFrames(film.storyboard, FORMATS[film.storyboard.format].fps);
