import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { EASE_IN_OUT, EASE_OUT } from "../motion/timing";
import { useFormat, useMotion } from "../utils/studio";

export type CameraMove = {
  /** Scale at the start and end of the move. 1 = frame-filling. */
  zoom?: [number, number];
  /** Pan in frame-width fractions. Positive x moves the subject left. */
  pan?: [[number, number], [number, number]];
  /** Degrees of perspective tilt on the X axis at start and end. */
  tilt?: [number, number];
  /** Degrees of perspective rotation on the Y axis at start and end. */
  swing?: [number, number];
  /** Window in frames over which the move runs. Defaults to the whole scene. */
  window?: [number, number];
  easing?: (t: number) => number;
};

export type CameraProps = {
  children: React.ReactNode;
  move?: CameraMove;
  /** Perspective depth in px; lower is more dramatic. */
  perspective?: number;
  origin?: string;
  style?: React.CSSProperties;
};

/**
 * A single digital camera. Everything a scene wants to do spatially goes
 * through here, so motion stays consistent between shots and no scene invents
 * its own transform stack.
 */
export const Camera: React.FC<CameraProps> = ({
  children,
  move = {},
  perspective = 2200,
  origin = "center center",
  style,
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const [from, to] = move.window ?? [0, durationInFrames];
  const easing = move.easing ?? EASE_IN_OUT;
  const p = interpolate(frame, [from, to], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing,
  });

  const format = useFormat();
  const zoom = move.zoom ? move.zoom[0] + (move.zoom[1] - move.zoom[0]) * p : 1;
  const panX = move.pan ? move.pan[0][0] + (move.pan[1][0] - move.pan[0][0]) * p : 0;
  const panY = move.pan ? move.pan[0][1] + (move.pan[1][1] - move.pan[0][1]) * p : 0;
  const tilt = move.tilt ? move.tilt[0] + (move.tilt[1] - move.tilt[0]) * p : 0;
  const swing = move.swing ? move.swing[0] + (move.swing[1] - move.swing[0]) * p : 0;

  const transform = [
    `translate3d(${(panX * format.width).toFixed(2)}px, ${(panY * format.height).toFixed(2)}px, 0)`,
    `scale(${zoom.toFixed(4)})`,
    tilt ? `rotateX(${tilt.toFixed(3)}deg)` : "",
    swing ? `rotateY(${swing.toFixed(3)}deg)` : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <AbsoluteFill style={{ perspective, perspectiveOrigin: origin, ...style }}>
      <AbsoluteFill
        style={{
          transform,
          transformOrigin: origin,
          transformStyle: "preserve-3d",
          willChange: "transform",
        }}
      >
        {children}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/**
 * A slow, unobtrusive push. Used as the default when a shot would otherwise sit
 * still: a held frame reads as a screenshot, a drifting frame reads as a film.
 */
export const useAmbientPush = (strength = 1): CameraMove => {
  const motion = useMotion();
  const { durationInFrames } = useVideoConfig();
  return {
    zoom: [1, 1 + motion.cameraZoom * strength],
    window: [0, durationInFrames],
    easing: EASE_OUT,
  };
};

export type ParallaxLayersProps = {
  /** Back to front. Depth 0 is static; 1 moves with the camera fully. */
  layers: { depth: number; content: React.ReactNode }[];
  /** Travel in frame-width fractions across the scene. */
  travel?: [number, number];
  window?: [number, number];
};

/** Multi-plane parallax. Gives flat UI art a sense of physical depth. */
export const ParallaxLayers: React.FC<ParallaxLayersProps> = ({
  layers,
  travel = [0, -0.04],
  window,
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const format = useFormat();
  const [from, to] = window ?? [0, durationInFrames];
  const p = interpolate(frame, [from, to], [travel[0], travel[1]], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE_IN_OUT,
  });
  return (
    <>
      {layers.map((layer, i) => (
        <AbsoluteFill
          // Layers are a fixed, ordered stack.
          key={i}
          style={{
            transform: `translate3d(${(p * layer.depth * format.width).toFixed(2)}px, 0, 0)`,
            willChange: "transform",
          }}
        >
          {layer.content}
        </AbsoluteFill>
      ))}
    </>
  );
};
