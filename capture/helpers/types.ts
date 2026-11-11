/**
 * Shared types for the Playwright capture pipeline.
 *
 * A "flow" is a scripted, deterministic browser session against a product
 * surface. Every flow emits one or more captures plus structured metadata so
 * the Remotion side can build scenes without re-opening a browser.
 */
import type { Page } from "playwright";

export type Viewport = {
  width: number;
  height: number;
  deviceScaleFactor: number;
};

export type Clip = { x: number; y: number; width: number; height: number };

export type ShotOptions = {
  /** Crop rectangle in CSS pixels. Mutually exclusive with `selector`. */
  clip?: Clip;
  /** Capture the bounding box of this element instead of the viewport. */
  selector?: string;
  /** Pad a selector capture by this many CSS pixels on every side. */
  padding?: number;
  /** Capture the whole scrollable page rather than the viewport. */
  fullPage?: boolean;
  /** Free-form note stored in the manifest; used by scene authors. */
  note?: string;
  /**
   * Named selectors whose bounding boxes are stored with the capture as
   * normalised rects. Scenes crop to these instead of hard-coding pixels, so a
   * layout change in the product invalidates the number rather than silently
   * shifting the shot.
   */
  regions?: Record<string, string>;
};

/** Rect in 0..1 coordinates relative to the capture image. */
export type NormalisedRect = { x: number; y: number; width: number; height: number };

export type CaptureRecord = {
  id: string;
  flow: string;
  file: string;
  /** Path relative to `public/`, i.e. what `staticFile()` expects. */
  staticPath: string;
  width: number;
  height: number;
  viewport: Viewport;
  route: string;
  interaction: string | null;
  note: string | null;
  regions: Record<string, NormalisedRect>;
  capturedAt: string;
};

export type FlowContext = {
  page: Page;
  flowId: string;
  /** Records the route/panel the flow is currently on, for metadata. */
  setRoute: (route: string) => void;
  /** Records the interaction that produced the next shot. */
  setInteraction: (interaction: string | null) => void;
  shot: (id: string, options?: ShotOptions) => Promise<CaptureRecord>;
  /** Deterministic settle: waits for fonts, images, and a fixed paint budget. */
  settle: (ms?: number) => Promise<void>;
};

export type Flow = {
  id: string;
  description: string;
  viewport: Viewport;
  /** Initial URL. Flows may navigate further. */
  url: string;
  /**
   * Pin `Date.now()` so date-derived UI does not drift between capture runs.
   * Defaults to true. Turn it off for a surface whose own JavaScript depends on
   * a moving clock — a live chat console re-enables its controls on a timer,
   * and a frozen clock leaves them disabled for ever.
   */
  freezeClock?: boolean;
  run: (ctx: FlowContext) => Promise<void>;
};
