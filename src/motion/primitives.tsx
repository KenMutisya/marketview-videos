import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { snap } from "../utils/pixels";
import { useMotion } from "../utils/studio";
import { EASE_OUT, reveal, revealWindow, staggerDelay } from "./timing";

type Direction = "up" | "down" | "left" | "right" | "none";

// Offsets are rounded so an arriving element never lands between pixels; a
// glyph rasterised at a fractional offset shimmers on a large screen.
const offsetFor = (direction: Direction, distance: number, progress: number) => {
  const d = snap((1 - progress) * distance);
  switch (direction) {
    case "up":
      return `translate3d(0, ${d}px, 0)`;
    case "down":
      return `translate3d(0, ${-d}px, 0)`;
    case "left":
      return `translate3d(${d}px, 0, 0)`;
    case "right":
      return `translate3d(${-d}px, 0, 0)`;
    default:
      return "translate3d(0, 0, 0)";
  }
};

export type RevealProps = {
  children: React.ReactNode;
  /** Frames after the sequence start at which this element enters. */
  delay?: number;
  /** Frame at which the element starts leaving. Omit to stay for the scene. */
  exitAt?: number;
  direction?: Direction;
  /** Travel distance in px for the entrance. */
  distance?: number;
  /** Scale the element grows from. 1 disables the scale component. */
  from?: number;
  accent?: boolean;
  style?: React.CSSProperties;
  className?: string;
};

/**
 * The workhorse entrance. Opacity + offset + optional scale, all driven by the
 * active motion personality so an entire film's feel can be changed in one
 * place.
 */
export const Reveal: React.FC<RevealProps> = ({
  children,
  delay = 0,
  exitAt,
  direction = "up",
  distance = 28,
  from = 1,
  accent,
  style,
  className,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const motion = useMotion();
  const p =
    exitAt === undefined
      ? reveal({ frame, fps, delay, motion, accent })
      : revealWindow({ frame, fps, delay, motion, accent, out: exitAt });
  const scale = from === 1 ? 1 : from + (1 - from) * p;

  return (
    <div
      className={className}
      style={{
        opacity: Math.max(0, Math.min(1, p)),
        transform:
          p >= 0.999 && from === 1
            ? "none"
            : `${offsetFor(direction, distance, p)} scale(${scale})`,
        willChange: p >= 0.999 ? "auto" : "transform, opacity",
        ...style,
      }}
    >
      {children}
    </div>
  );
};

export type StaggerProps = {
  children: React.ReactNode[];
  delay?: number;
  /** Extra frames between items, on top of the personality's stagger. */
  step?: number;
  direction?: Direction;
  distance?: number;
  from?: number;
  exitAt?: number;
  accent?: boolean;
  style?: React.CSSProperties;
  itemStyle?: React.CSSProperties;
};

/** Reveals children in sequence. Index 0 lands on `delay`. */
export const Stagger: React.FC<StaggerProps> = ({
  children,
  delay = 0,
  step = 0,
  direction = "up",
  distance = 24,
  from = 1,
  exitAt,
  accent,
  style,
  itemStyle,
}) => {
  const motion = useMotion();
  return (
    <div style={style}>
      {children.map((child, i) => (
        <Reveal
          // Index is the identity here: these are positional slots in a layout.
          key={i}
          delay={staggerDelay(i, motion, delay) + i * step}
          direction={direction}
          distance={distance}
          from={from}
          exitAt={exitAt}
          accent={accent}
          style={itemStyle}
        >
          {child}
        </Reveal>
      ))}
    </div>
  );
};

export type MaskRevealProps = {
  children: React.ReactNode;
  delay?: number;
  durationInFrames?: number;
  direction?: "left" | "right" | "up" | "down";
  style?: React.CSSProperties;
};

/**
 * Wipes content in behind a hard edge. Used for typographic reveals where a
 * fade would feel soft and a slide would feel like a slide deck.
 */
export const MaskReveal: React.FC<MaskRevealProps> = ({
  children,
  delay = 0,
  durationInFrames,
  direction = "left",
  style,
}) => {
  const frame = useCurrentFrame();
  const motion = useMotion();
  const dur = durationInFrames ?? motion.revealFrames;
  const p = Math.max(0, Math.min(1, EASE_OUT(Math.max(0, (frame - delay) / dur))));
  const pct = (1 - p) * 100;
  const inset =
    direction === "left"
      ? `0 ${pct}% 0 0`
      : direction === "right"
        ? `0 0 0 ${pct}%`
        : direction === "up"
          ? `${pct}% 0 0 0`
          : `0 0 ${pct}% 0`;
  return (
    <div style={{ clipPath: `inset(${inset})`, willChange: "clip-path", ...style }}>
      {children}
    </div>
  );
};

export type BlurInProps = {
  children: React.ReactNode;
  delay?: number;
  /** Starting blur in px. */
  amount?: number;
  style?: React.CSSProperties;
};

/** Rack-focus style entrance: sharpens and settles rather than sliding. */
export const BlurIn: React.FC<BlurInProps> = ({
  children,
  delay = 0,
  amount = 14,
  style,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const motion = useMotion();
  const p = reveal({ frame, fps, delay, motion });
  return (
    <div
      style={{
        opacity: p,
        filter: `blur(${((1 - p) * amount).toFixed(2)}px)`,
        transform: `scale(${(1.02 - 0.02 * p).toFixed(4)})`,
        willChange: "filter, opacity, transform",
        ...style,
      }}
    >
      {children}
    </div>
  );
};
