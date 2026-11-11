import React from "react";
import { Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { EASE_OUT, reveal } from "../motion/timing";
import { useBrand, useFormat, useMotion } from "../utils/studio";
import { AnimatedCounter } from "../typography/Text";
import { snap } from "../utils/pixels";

export type LogoLockupProps = {
  /** Height of the mark in px; the wordmark is sized from it. */
  size?: number;
  delay?: number;
  tone?: "onLight" | "onDark";
  /** Hide the wordmark and show only the mark. */
  markOnly?: boolean;
  /** Wordmark builds letter-group by letter-group rather than fading. */
  build?: boolean;
  style?: React.CSSProperties;
};

/**
 * The brand lockup: the product's own SVG mark beside its wordmark.
 *
 * The mark is the asset shipped with the product, not a redraw, so the film
 * cannot drift from the real identity.
 */
export const LogoLockup: React.FC<LogoLockupProps> = ({
  size = 96,
  delay = 0,
  tone = "onLight",
  markOnly = false,
  build = true,
  style,
}) => {
  const brand = useBrand();
  const motion = useMotion();
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const markP = reveal({ frame, fps, delay, motion, accent: true });
  const wordP = interpolate(frame, [delay + 6, delay + 6 + motion.revealFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE_OUT,
  });

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: size * 0.3,
        ...style,
      }}
    >
      <div
        style={{
          width: size,
          height: size,
          opacity: markP,
          transform: `scale(${(0.82 + 0.18 * markP).toFixed(4)}) rotate(${((1 - markP) * -5).toFixed(2)}deg)`,
          transformOrigin: "center",
          willChange: "transform, opacity",
        }}
      >
        <Img src={staticFile(brand.logo.mark)} style={{ width: "100%", height: "100%" }} />
      </div>
      {markOnly ? null : (
        <div
          style={{
            overflow: "hidden",
            clipPath: build ? `inset(0 ${((1 - wordP) * 100).toFixed(2)}% 0 0)` : undefined,
            opacity: build ? 1 : wordP,
          }}
        >
          <span
            style={{
              fontFamily: brand.fontFamily,
              fontSize: size * 0.74,
              fontWeight: 800,
              letterSpacing: -size * 0.022,
              whiteSpace: "nowrap",
              color: tone === "onDark" ? "#FFFFFF" : brand.colors.logoNavy,
            }}
          >
            {brand.name}
          </span>
        </div>
      )}
    </div>
  );
};

/**
 * Splits a stat like "5,000+" into something countable.
 *
 * Parsing the authored string means a storyboard does not have to carry a
 * parallel numeric field that can drift out of step with the label, and every
 * stat in every film animates without a single scene being edited. Anything
 * that is not a plain number is returned unparsed and rendered as written.
 */
export const parseStat = (
  value: string,
): { to: number; prefix: string; suffix: string } | null => {
  const trimmed = value.trim();
  // A value containing more than one number is a range or a span ("80–90%",
  // "8 to 12"). Counting the first one while the second sits there static
  // reads as nonsense mid-animation, so those are rendered as written.
  // Commas are thousands separators, not boundaries: strip them before
  // counting, or "5,000+" looks like two numbers.
  if ((trimmed.replace(/,/g, "").match(/\d+/g) ?? []).length !== 1) return null;
  const m = /^([^\d-]*)(-?[\d,.]+)(.*)$/.exec(trimmed);
  if (!m) return null;
  const n = Number(m[2].replace(/,/g, ""));
  if (!Number.isFinite(n)) return null;
  return { to: n, prefix: m[1], suffix: m[3] };
};

/**
 * A stat value that counts up to its figure.
 *
 * The final string is rendered underneath with `visibility: hidden` to reserve
 * the width. Without it the box grows as digits are added and every element
 * beside it shifts on each frame — the same class of defect as animating a
 * layout property, and just as visible on a large screen.
 */
export const StatValue: React.FC<{
  value: string;
  delay: number;
  durationInFrames: number;
  style?: React.CSSProperties;
}> = ({ value, delay, durationInFrames, style }) => {
  const parsed = parseStat(value);
  if (!parsed) return <span style={style}>{value}</span>;
  return (
    <span style={{ position: "relative", display: "inline-block", ...style }}>
      <span style={{ visibility: "hidden" }}>{value}</span>
      <span style={{ position: "absolute", left: 0, top: 0, whiteSpace: "nowrap" }}>
        <AnimatedCounter
          to={parsed.to}
          delay={delay}
          durationInFrames={durationInFrames}
          prefix={parsed.prefix}
          suffix={parsed.suffix}
        />
      </span>
    </span>
  );
};

export type StatRailProps = {
  stats: { value: string; label: string }[];
  delay?: number;
  tone?: "onLight" | "onDark";
  /** Lay out as a row (wide) or a column (portrait). */
  direction?: "row" | "column";
  style?: React.CSSProperties;
};

/** Verified product numbers, presented as a measured rail rather than a brag. */
export const StatRail: React.FC<StatRailProps> = ({
  stats,
  delay = 0,
  tone = "onDark",
  direction = "row",
  style,
}) => {
  const brand = useBrand();
  const format = useFormat();
  const motion = useMotion();
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const onDark = tone === "onDark";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: direction,
        gap: direction === "row" ? format.type.body * 1.9 : format.type.body * 0.9,
        alignItems: direction === "row" ? "flex-start" : "flex-start",
        ...style,
      }}
    >
      {stats.map((s, i) => {
        const p = reveal({ frame, fps, delay: delay + i * motion.stagger * 1.6, motion });
        return (
          <div
            key={s.label}
            style={{
              opacity: p,
              transform: p >= 0.999 ? "none" : `translate3d(0, ${snap((1 - p) * 18)}px, 0)`,
              display: direction === "row" ? "block" : "flex",
              alignItems: "baseline",
              gap: format.type.body * 0.6,
              borderLeft: direction === "row" ? `2px solid ${onDark ? "rgba(255,255,255,0.22)" : brand.colors.border}` : "none",
              paddingLeft: direction === "row" ? format.type.body * 0.8 : 0,
              minWidth: direction === "row" ? format.type.head * 4.4 : undefined,
            }}
          >
            <div
              style={{
                fontFamily: brand.fontFamily,
                fontSize: format.type.head,
                fontWeight: 800,
                letterSpacing: -format.type.head * 0.03,
                color: onDark ? "#FFFFFF" : brand.colors.logoNavy,
                lineHeight: 1.1,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              <StatValue
                value={s.value}
                delay={delay + i * motion.stagger * 1.6}
                durationInFrames={Math.round(fps * 1.1)}
              />
            </div>
            <div
              style={{
                fontFamily: brand.fontFamily,
                fontSize: format.type.meta,
                fontWeight: 500,
                lineHeight: 1.35,
                marginTop: direction === "row" ? format.type.meta * 0.34 : 0,
                color: onDark ? "rgba(255,255,255,0.60)" : brand.colors.inkSoft,
                maxWidth: format.type.meta * 11,
              }}
            >
              {s.label}
            </div>
          </div>
        );
      })}
    </div>
  );
};

/** Pill used for the sample-data disclosure and other standing labels. */
export const Chip: React.FC<{
  children: React.ReactNode;
  tone?: "onLight" | "onDark";
  delay?: number;
  style?: React.CSSProperties;
}> = ({ children, tone = "onDark", delay = 0, style }) => {
  const brand = useBrand();
  const format = useFormat();
  const motion = useMotion();
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = reveal({ frame, fps, delay, motion });
  const onDark = tone === "onDark";
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: format.type.meta * 0.5,
        fontFamily: brand.fontFamily,
        fontSize: format.type.meta * 0.92,
        fontWeight: 600,
        letterSpacing: format.type.meta * 0.03,
        padding: `${format.type.meta * 0.44}px ${format.type.meta * 0.86}px`,
        borderRadius: 999,
        color: onDark ? "rgba(255,255,255,0.72)" : brand.colors.inkSoft,
        background: onDark ? "rgba(255,255,255,0.10)" : "rgba(15,23,42,0.05)",
        border: `1px solid ${onDark ? "rgba(255,255,255,0.16)" : brand.colors.border}`,
        opacity: p,
        ...style,
      }}
    >
      {children}
    </div>
  );
};
