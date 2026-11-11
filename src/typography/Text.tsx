import React from "react";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { useBrand, useFormat, useMotion } from "../utils/studio";
import { snap } from "../utils/pixels";
import { EASE_OUT, reveal } from "../motion/timing";

export type TextTone = "onLight" | "onDark";

const toneColor = (tone: TextTone, brand: ReturnType<typeof useBrand>) =>
  tone === "onDark" ? "#FFFFFF" : brand.colors.ink;

/** Small all-caps label that sets context before a headline lands. */
export const Eyebrow: React.FC<{
  children: React.ReactNode;
  delay?: number;
  tone?: TextTone;
  color?: string;
  style?: React.CSSProperties;
}> = ({ children, delay = 0, tone = "onLight", color, style }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const motion = useMotion();
  const format = useFormat();
  const brand = useBrand();
  const p = reveal({ frame, fps, delay, motion });
  return (
    <div
      style={{
        fontFamily: brand.fontFamily,
        fontSize: format.type.meta,
        fontWeight: 700,
        letterSpacing: format.type.meta * 0.14,
        textTransform: "uppercase",
        color: color ?? (tone === "onDark" ? "rgba(255,255,255,0.62)" : brand.colors.inkFaint),
        opacity: p,
        transform: p >= 0.999 ? "none" : `translate3d(0, ${snap((1 - p) * 10)}px, 0)`,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

export type KineticHeadlineProps = {
  /** One array entry per line. Lines reveal in sequence. */
  lines: string[];
  delay?: number;
  tone?: TextTone;
  /** Words matching these strings take the accent colour. */
  emphasise?: string[];
  size?: number;
  weight?: number;
  color?: string;
  accentColor?: string;
  align?: "left" | "center";
  lineHeight?: number;
  style?: React.CSSProperties;
  /** Reveal granularity. Word-by-word reads as "written"; line is calmer. */
  granularity?: "line" | "word";
  /**
   * Frames between words. Display type needs a tighter stagger than a layout
   * does: at the layout's spacing a six-word headline takes two seconds to
   * finish arriving, which is most of a hook.
   */
  wordStagger?: number;
};

/**
 * The film's primary typographic device: lines of a statement that build with
 * a masked rise, optionally with keywords carried in the brand accent.
 */
export const KineticHeadline: React.FC<KineticHeadlineProps> = ({
  lines,
  delay = 0,
  tone = "onLight",
  emphasise = [],
  size,
  weight = 760,
  color,
  accentColor,
  align = "left",
  lineHeight = 1.08,
  style,
  granularity = "word",
  wordStagger = 2,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const motion = useMotion();
  const format = useFormat();
  const brand = useBrand();
  const fontSize = size ?? format.type.title;
  const base = color ?? toneColor(tone, brand);
  const accent = accentColor ?? brand.colors.accent;
  const normalised = emphasise.map((e) => e.toLowerCase().replace(/[^a-z0-9]/g, ""));

  let wordIndex = 0;

  return (
    <div
      style={{
        fontFamily: brand.fontFamily,
        fontSize,
        fontWeight: weight,
        lineHeight,
        letterSpacing: -fontSize * 0.022,
        color: base,
        textAlign: align,
        ...style,
      }}
    >
      {lines.map((line, li) => {
        const words = line.split(" ");
        return (
          <div
            // Lines are positional slots in a fixed statement.
            key={li}
            style={{
              display: "block",
              overflow: "hidden",
              paddingBottom: fontSize * 0.06,
              marginBottom: -fontSize * 0.06,
            }}
          >
            {words.map((word, wi) => {
              const idx = granularity === "word" ? wordIndex++ : li;
              const d = delay + idx * wordStagger;
              const p = reveal({ frame, fps, delay: d, motion });
              const key = word.toLowerCase().replace(/[^a-z0-9]/g, "");
              const isAccent = normalised.includes(key);
              return (
                <span
                  key={`${li}-${wi}`}
                  style={{
                    display: "inline-block",
                    // Whole pixels only: a headline word that settles on a
                    // fractional offset shimmers against its neighbours.
                    transform:
                      p >= 0.999
                        ? "none"
                        : `translate3d(0, ${snap((1 - p) * fontSize * 0.9)}px, 0)`,
                    opacity: p,
                    color: isAccent ? accent : undefined,
                    marginRight: "0.26em",
                    willChange: "transform, opacity",
                  }}
                >
                  {word}
                </span>
              );
            })}
          </div>
        );
      })}
    </div>
  );
};

export type AnimatedCounterProps = {
  to: number;
  delay?: number;
  durationInFrames?: number;
  prefix?: string;
  suffix?: string;
  /** Thousands separators. */
  grouped?: boolean;
  decimals?: number;
  style?: React.CSSProperties;
};

/** Counts up with a decelerating ramp. Lands exactly on `to`. */
export const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  to,
  delay = 0,
  durationInFrames = 40,
  prefix = "",
  suffix = "",
  grouped = true,
  decimals = 0,
  style,
}) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [delay, delay + durationInFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE_OUT,
  });
  const value = to * p;
  const text = grouped
    ? value.toLocaleString("en-GB", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })
    : value.toFixed(decimals);
  return (
    <span style={{ fontVariantNumeric: "tabular-nums", ...style }}>
      {prefix}
      {text}
      {suffix}
    </span>
  );
};

/** A word that gets a wiping brand-colour underline as it is spoken. */
export const TextHighlight: React.FC<{
  children: React.ReactNode;
  delay?: number;
  color?: string;
  thickness?: number;
  durationInFrames?: number;
}> = ({ children, delay = 0, color, thickness = 0.1, durationInFrames = 16 }) => {
  const frame = useCurrentFrame();
  const brand = useBrand();
  const p = interpolate(frame, [delay, delay + durationInFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE_OUT,
  });
  return (
    <span style={{ position: "relative", display: "inline-block" }}>
      <span
        style={{
          position: "absolute",
          left: "-0.06em",
          right: "-0.06em",
          bottom: "0.02em",
          height: `${thickness}em`,
          background: color ?? brand.colors.accent,
          opacity: 0.32,
          transformOrigin: "left center",
          transform: `scaleX(${p})`,
        }}
      />
      <span style={{ position: "relative" }}>{children}</span>
    </span>
  );
};

/** Body copy under a headline, measured to the format's text column. */
export const Lede: React.FC<{
  children: React.ReactNode;
  delay?: number;
  tone?: TextTone;
  style?: React.CSSProperties;
}> = ({ children, delay = 0, tone = "onLight", style }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const motion = useMotion();
  const format = useFormat();
  const brand = useBrand();
  const p = reveal({ frame, fps, delay, motion });
  return (
    <p
      style={{
        fontFamily: brand.fontFamily,
        fontSize: format.type.body,
        lineHeight: 1.5,
        fontWeight: 450,
        margin: 0,
        color: tone === "onDark" ? "rgba(255,255,255,0.78)" : brand.colors.inkSoft,
        opacity: p,
        transform: p >= 0.999 ? "none" : `translate3d(0, ${snap((1 - p) * 16)}px, 0)`,
        ...style,
      }}
    >
      {children}
    </p>
  );
};
