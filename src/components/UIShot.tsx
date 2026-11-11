import React from "react";
import { Img, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { EASE_IN_OUT } from "../motion/timing";
import { captureSrc, getCapture, getRegion, padRegion } from "../utils/captures";
import type { NormalisedRect } from "../utils/captures";

export type Framing = {
  /** Named region from the capture manifest, or a literal rect. */
  region?: string;
  rect?: NormalisedRect;
  /** Grow the region outwards by this fraction, for breathing room. */
  pad?: number;
};

export type UIShotProps = {
  capture: string;
  width: number;
  height: number;
  /** Opening framing. Defaults to the whole capture. */
  from?: Framing;
  /** Closing framing. Omit to hold `from`. */
  to?: Framing;
  /** Frames over which the framing move runs. */
  window?: [number, number];
  easing?: (t: number) => number;
  /**
   * Where the framed region sits when its aspect does not match the container.
   *
   * "auto" is the right answer almost always: product UI reads left-to-right
   * and top-down, so a strip much wider than its container keeps its left edge
   * (the badge and the headline) and a panel much taller keeps its top (the
   * title). Centring either one crops away the part that carries the meaning.
   */
  anchor?: "auto" | "center" | "left" | "top" | "topLeft";
  /**
   * A slow continuous zoom applied to the *image*, as a fraction of its size
   * across the whole scene. This is how a shot stays alive: scaling the
   * container instead would drag any overlaid text through a fractional
   * transform on every frame and make it shimmer.
   */
  drift?: number;
  style?: React.CSSProperties;
};

const resolve = (capture: string, f?: Framing): NormalisedRect => {
  if (!f) return { x: 0, y: 0, width: 1, height: 1 };
  const base = f.rect ?? getRegion(capture, f.region);
  return f.pad ? padRegion(base, f.pad) : base;
};

/**
 * A framed view onto a product screenshot.
 *
 * This is how the film moves *within* the interface: rather than animating a
 * whole screenshot around, the shot declares which part of the UI it is looking
 * at and the component solves the scale and offset. Because captures are 2×
 * retina, pushing to a third of the frame still resolves cleanly.
 */
export const UIShot: React.FC<UIShotProps> = ({
  capture,
  width,
  height,
  from,
  to,
  window: moveWindow,
  easing = EASE_IN_OUT,
  anchor = "auto",
  drift = 0,
  style,
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const meta = getCapture(capture);
  const a = resolve(capture, from);
  const b = to ? resolve(capture, to) : a;
  const [w0, w1] = moveWindow ?? [0, 1];
  const p =
    to && w1 > w0
      ? interpolate(frame, [w0, w1], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing,
        })
      : 0;

  const rect: NormalisedRect = {
    x: a.x + (b.x - a.x) * p,
    y: a.y + (b.y - a.y) * p,
    width: a.width + (b.width - a.width) * p,
    height: a.height + (b.height - a.height) * p,
  };

  // Cover the container with the chosen rect; never letterbox product UI.
  const cover = Math.max(width / (rect.width * meta.width), height / (rect.height * meta.height));
  const driftScale = drift
    ? 1 +
      drift *
        interpolate(frame, [0, durationInFrames], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        })
    : 1;
  const scale = cover * driftScale;
  const imgW = meta.width * scale;
  const imgH = meta.height * scale;
  // How far the region's shape is from the container's. Past this ratio the
  // crop is large enough that where it is taken from starts to matter.
  const ANCHOR_THRESHOLD = 1.3;
  const regionAspect = (rect.width * meta.width) / (rect.height * meta.height);
  const containerAspect = width / height;
  const resolved =
    anchor !== "auto"
      ? anchor
      : regionAspect / containerAspect > ANCHOR_THRESHOLD
        ? "left"
        : containerAspect / regionAspect > ANCHOR_THRESHOLD
          ? "top"
          : "center";

  const anchorLeft = resolved === "left" || resolved === "topLeft";
  const anchorTop = resolved === "top" || resolved === "topLeft";
  const left = anchorLeft ? -rect.x * imgW : width / 2 - (rect.x + rect.width / 2) * imgW;
  const top = anchorTop ? -rect.y * imgH : height / 2 - (rect.y + rect.height / 2) * imgH;

  return (
    <div style={{ width, height, overflow: "hidden", position: "relative", ...style }}>
      <Img
        src={captureSrc(capture)}
        style={{
          position: "absolute",
          width: imgW,
          height: imgH,
          left,
          top,
          // Screenshots are the one place a non-integer scale must stay crisp.
          imageRendering: "auto",
          willChange: "transform",
        }}
      />
    </div>
  );
};
