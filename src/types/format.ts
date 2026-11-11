import { z } from "zod";

/**
 * Output formats are first-class. A scene asks the format what size things
 * should be and where the safe area is, instead of hard-coding 1920×1080
 * numbers and getting cropped in portrait.
 */
export const formatIdSchema = z.enum(["wide", "standard", "vertical", "conference"]);
export type FormatId = z.infer<typeof formatIdSchema>;

export type TypeScale = {
  /** The one big number or hero word. */
  display: number;
  /** Scene headline. */
  title: number;
  /** Sub-headline / card title. */
  head: number;
  /** Supporting sentence. */
  body: number;
  /** Labels, eyebrows, source lines. */
  meta: number;
};

export type SafeArea = { top: number; right: number; bottom: number; left: number };

export type FormatSpec = {
  id: FormatId;
  label: string;
  width: number;
  height: number;
  fps: number;
  safe: SafeArea;
  type: TypeScale;
  /** Text block width as a fraction of the frame. Portrait needs more. */
  measure: number;
  /**
   * How a product screenshot should be presented. "panorama" shows the whole
   * desktop frame; "column" crops to a tall slice that reads on a phone;
   * "billboard" oversizes a single region for distance viewing.
   */
  uiPresentation: "panorama" | "column" | "billboard";
  /**
   * Share of the canvas height an application window may occupy, including its
   * chrome. A narrower frame needs a smaller share: at 4:3 a window sized to
   * 80% of the height is wider than the frame itself.
   */
  uiHeightShare: number;
};

/**
 * Widescreen launch film. The reference format; everything else is a
 * recomposition, not a crop.
 */
export const WIDE: FormatSpec = {
  id: "wide",
  label: "Widescreen film (1920×1080)",
  width: 1920,
  height: 1080,
  fps: 30,
  safe: { top: 72, right: 110, bottom: 84, left: 110 },
  type: { display: 128, title: 78, head: 44, body: 30, meta: 20 },
  measure: 0.62,
  uiPresentation: "panorama",
  uiHeightShare: 0.8,
};

/**
 * 4:3 standard. Narrower than widescreen, so type steps down a little and the
 * application window is held to a smaller share of the height — at 0.8 the
 * window would be wider than the frame. Used for 4:3 booth panels and for feed
 * placements where a taller frame earns more of the screen than 16:9 does.
 */
export const STANDARD: FormatSpec = {
  id: "standard",
  label: "Standard 4:3 (1440×1080)",
  width: 1440,
  height: 1080,
  fps: 30,
  safe: { top: 68, right: 92, bottom: 80, left: 92 },
  type: { display: 110, title: 68, head: 40, body: 27, meta: 19 },
  measure: 0.74,
  uiPresentation: "panorama",
  uiHeightShare: 0.72,
};

/** Vertical social. Typography grows, UI is shown as a tall column. */
export const VERTICAL: FormatSpec = {
  id: "vertical",
  label: "Vertical social (1080×1920)",
  width: 1080,
  height: 1920,
  fps: 30,
  safe: { top: 260, right: 72, bottom: 300, left: 72 },
  type: { display: 108, title: 72, head: 46, body: 34, meta: 24 },
  measure: 0.92,
  uiPresentation: "column",
  uiHeightShare: 0.58,
};

/**
 * Conference booth loop. Read from four metres away on a 75" panel: larger
 * type, fewer words, no reliance on small UI chrome, no narration.
 */
export const CONFERENCE: FormatSpec = {
  id: "conference",
  label: "Conference loop (1920×1080, silent)",
  width: 1920,
  height: 1080,
  fps: 30,
  safe: { top: 96, right: 140, bottom: 110, left: 140 },
  type: { display: 150, title: 96, head: 58, body: 40, meta: 26 },
  measure: 0.72,
  uiPresentation: "billboard",
  uiHeightShare: 0.78,
};

export const FORMATS: Record<FormatId, FormatSpec> = {
  wide: WIDE,
  standard: STANDARD,
  vertical: VERTICAL,
  conference: CONFERENCE,
};
