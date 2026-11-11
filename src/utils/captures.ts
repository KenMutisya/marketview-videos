import { staticFile } from "remotion";
import manifest from "../../public/assets/screenshots/manifest.json";
import type { FormatSpec } from "../types/format";

export type NormalisedRect = { x: number; y: number; width: number; height: number };

export type Capture = {
  id: string;
  flow: string;
  file: string;
  staticPath: string;
  width: number;
  height: number;
  route: string;
  interaction: string | null;
  note: string | null;
  regions: Record<string, NormalisedRect>;
};

const byId = new Map<string, Capture>(
  (manifest.captures as unknown as Capture[]).map((c) => [c.id, c]),
);

export const captureIds = Array.from(byId.keys());

export const getCapture = (id: string): Capture => {
  const c = byId.get(id);
  if (!c) {
    throw new Error(
      `Unknown capture "${id}". Available: ${captureIds.join(", ")}. ` +
        "Run `npm run capture` if the manifest is stale.",
    );
  }
  return c;
};

export const captureSrc = (id: string): string => staticFile(getCapture(id).staticPath);

/**
 * A named region, or the full frame when no name is given. Throws rather than
 * silently falling back, so a renamed element in the product surfaces as a
 * build error instead of a wrong shot.
 */
export const getRegion = (id: string, region?: string): NormalisedRect => {
  if (!region) return { x: 0, y: 0, width: 1, height: 1 };
  const c = getCapture(id);
  const r = c.regions[region];
  if (!r) {
    throw new Error(
      `Capture "${id}" has no region "${region}". Known regions: ` +
        `${Object.keys(c.regions).join(", ") || "(none)"}.`,
    );
  }
  return r;
};

/** Grows a rect outwards by a fraction of its own size, clamped to the image. */
export const padRegion = (r: NormalisedRect, pad: number): NormalisedRect => {
  const px = r.width * pad;
  const py = r.height * pad;
  const x = Math.max(0, r.x - px);
  const y = Math.max(0, r.y - py);
  return {
    x,
    y,
    width: Math.min(1 - x, r.width + px * 2),
    height: Math.min(1 - y, r.height + py * 2),
  };
};

/** Aspect ratio of the desktop captures (3024 × 1890). */
export const CAPTURE_ASPECT = 3024 / 1890;

/**
 * The on-screen size a capture should be given in a particular format.
 *
 * Constrained by height as well as width: an application window that overflows
 * the canvas loses its own chrome and stops reading as a window, which is the
 * single most common way a product film looks broken.
 */
export const uiFrameSize = (
  format: FormatSpec,
  aspect = CAPTURE_ASPECT,
): { width: number; height: number } => {
  const usableW = format.width - format.safe.left - format.safe.right;
  const chrome = 46 * (format.width / 1920);

  if (format.uiPresentation === "column") {
    // Portrait gets a portrait window. Fitting a 16:10 desktop capture into a
    // 9:16 frame leaves a small landscape card marooned in empty space — the
    // exact "shrink the desktop" failure a vertical edition exists to avoid.
    // The window is taller than it is wide and the shot inside it crops to the
    // region that matters, so the interface fills the phone.
    const width = usableW * 1.04;
    const height = Math.min(format.height * format.uiHeightShare, width * 1.15) - chrome;
    return { width, height };
  }

  // Share of the canvas height the window (including its chrome) may occupy.
  // Held below the safe area so a scene caption can sit above the window
  // rather than on top of the product's own topbar.
  const heightShare = format.uiHeightShare;
  const maxW = usableW * 1.06;
  const maxH = format.height * heightShare - chrome;
  const width = Math.min(maxW, maxH * aspect);
  return { width, height: width / aspect };
};

export const captureManifest = manifest;
