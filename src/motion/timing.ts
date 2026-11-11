import { Easing, interpolate, spring } from "remotion";
import type { MotionPersonality } from "../types/brand";

/**
 * Easing used wherever a spring would overshoot into something it shouldn't,
 * e.g. a camera push or an opacity ramp. Standard "expressive deceleration".
 */
export const EASE_OUT = Easing.bezier(0.16, 1, 0.3, 1);
export const EASE_IN_OUT = Easing.bezier(0.65, 0, 0.35, 1);
export const EASE_IN = Easing.bezier(0.5, 0, 0.9, 0.3);

export type RevealArgs = {
  frame: number;
  fps: number;
  /** Frame at which this element starts. */
  delay?: number;
  motion: MotionPersonality;
  /** Use the snappier spring. */
  accent?: boolean;
};

/** 0 → 1 spring progress, clamped, driven by the active motion personality. */
export const reveal = ({ frame, fps, delay = 0, motion, accent }: RevealArgs): number =>
  spring({
    frame: frame - delay,
    fps,
    config: accent ? motion.accent : motion.entrance,
    durationInFrames: accent
      ? Math.round(motion.revealFrames * 0.8)
      : motion.revealFrames,
    durationRestThreshold: 0.001,
  });

/**
 * A reveal that also closes out again, for elements that live only for part of
 * a scene. `out` is the frame at which the exit begins.
 */
export const revealWindow = (
  args: RevealArgs & { out: number; outFrames?: number },
): number => {
  const inProgress = reveal(args);
  const outFrames = args.outFrames ?? Math.round(args.motion.revealFrames * 0.7);
  const outProgress = interpolate(args.frame, [args.out, args.out + outFrames], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE_IN,
  });
  return Math.min(inProgress, outProgress);
};

/** Delay for the nth item in a staggered group. */
export const staggerDelay = (index: number, motion: MotionPersonality, base = 0): number =>
  base + index * motion.stagger;

/** Linear 0→1 across a window, with clamping. Used for camera moves. */
export const ramp = (
  frame: number,
  from: number,
  to: number,
  easing = EASE_OUT,
): number =>
  interpolate(frame, [from, to], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing,
  });
