import React, { useMemo } from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { randRange, randSeries } from "../utils/seed";
import { useBrand, useFormat } from "../utils/studio";
import { EASE_IN_OUT } from "../motion/timing";

export type FieldTone = "deep" | "light" | "accent";

/**
 * The film's background. Two tones only: a deep navy field for statement
 * scenes, and a near-white field for product scenes. Keeping it to two makes
 * cuts between them read as deliberate.
 */
export const GradientField: React.FC<{
  tone?: FieldTone;
  /** Slow drift of the light source, in frames. */
  drift?: boolean;
  children?: React.ReactNode;
}> = ({ tone = "deep", drift = true, children }) => {
  const brand = useBrand();
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const t = drift
    ? interpolate(frame, [0, durationInFrames], [0, 1], {
        extrapolateRight: "clamp",
        easing: EASE_IN_OUT,
      })
    : 0.5;
  const cx = 30 + t * 18;
  const cy = 18 + t * 10;

  const background =
    tone === "deep"
      ? `radial-gradient(120% 90% at ${cx}% ${cy}%, ${brand.colors.primary} 0%, ${brand.colors.primaryDeep} 58%, #080C2B 100%)`
      : tone === "accent"
        ? `radial-gradient(120% 90% at ${cx}% ${cy}%, ${brand.colors.accent} 0%, ${brand.colors.accentDeep} 62%, #24453B 100%)`
        : `radial-gradient(120% 95% at ${cx}% ${cy}%, #FFFFFF 0%, ${brand.colors.surfaceSunken} 55%, #EBF0F6 100%)`;

  return <AbsoluteFill style={{ background }}>{children}</AbsoluteFill>;
};

/** Keeps the eye off the corners. Strength is deliberately low. */
export const Vignette: React.FC<{ strength?: number }> = ({ strength = 0.4 }) => (
  <AbsoluteFill
    style={{
      background: `radial-gradient(118% 100% at 50% 44%, rgba(0,0,0,0) 46%, rgba(0,0,0,${strength}) 100%)`,
      pointerEvents: "none",
    }}
  />
);

/**
 * Static film grain, baked as an SVG turbulence pattern.
 *
 * Deliberately static rather than per-frame: animated grain costs a full-frame
 * repaint every frame and encodes badly at the bitrates these files target.
 */
export const Grain: React.FC<{ opacity?: number; seed?: string }> = ({
  opacity = 0.05,
  seed = "studio",
}) => {
  const baseFreq = useMemo(() => randRange(`${seed}:freq`, 0.7, 0.85).toFixed(3), [seed]);
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='220' height='220'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='${baseFreq}' numOctaves='3' stitchTiles='stitch'/></filter><rect width='220' height='220' filter='url(#n)' opacity='1'/></svg>`;
  return (
    <AbsoluteFill
      style={{
        // Remotion's lint rule guards against background images that are still
        // loading when a frame is captured. This is an inline data URI with no
        // network fetch and no decode dependency, and it must tile — which an
        // <Img> cannot do — so the rule does not apply here.
        // eslint-disable-next-line @remotion/no-background-image
        backgroundImage: `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")`,
        backgroundRepeat: "repeat",
        opacity,
        mixBlendMode: "overlay",
        pointerEvents: "none",
      }}
    />
  );
};

/** A soft directional light that gives a flat composition a focal point. */
export const Spotlight: React.FC<{
  x?: number;
  y?: number;
  radius?: number;
  color?: string;
  intensity?: number;
}> = ({ x = 0.5, y = 0.38, radius = 0.6, color, intensity = 0.35 }) => {
  const brand = useBrand();
  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(${radius * 100}% ${radius * 100}% at ${x * 100}% ${y * 100}%, ${
          color ?? brand.colors.primaryLift
        }${Math.round(intensity * 255)
          .toString(16)
          .padStart(2, "0")} 0%, rgba(0,0,0,0) 70%)`,
        pointerEvents: "none",
      }}
    />
  );
};

/**
 * The market-network motif: a sparse constellation of points on a grid, drawn
 * from a seeded layout so it is identical on every render. Used behind
 * statement scenes to keep the "live network" idea present without a map.
 */
export const NetworkField: React.FC<{
  count?: number;
  seed?: string;
  opacity?: number;
  /** Frames over which nodes light up. */
  buildFrames?: number;
}> = ({ count = 46, seed = "network", opacity = 0.5, buildFrames = 90 }) => {
  const format = useFormat();
  const brand = useBrand();
  const frame = useCurrentFrame();

  const nodes = useMemo(() => {
    const xs = randSeries(`${seed}:x`, count);
    const ys = randSeries(`${seed}:y`, count);
    const rs = randSeries(`${seed}:r`, count);
    const ts = randSeries(`${seed}:t`, count);
    return xs.map((x, i) => ({
      x: x * format.width,
      y: ys[i] * format.height,
      r: 2 + rs[i] * 4.5,
      delay: ts[i] * buildFrames,
      warm: rs[i] > 0.72,
    }));
  }, [count, seed, format.width, format.height, buildFrames]);

  const links = useMemo(() => {
    const out: { a: number; b: number }[] = [];
    for (let i = 0; i < nodes.length; i += 1) {
      let best = -1;
      let bestD = Infinity;
      for (let j = 0; j < nodes.length; j += 1) {
        if (i === j) continue;
        const d = (nodes[i].x - nodes[j].x) ** 2 + (nodes[i].y - nodes[j].y) ** 2;
        if (d < bestD) {
          bestD = d;
          best = j;
        }
      }
      if (best >= 0 && i < best) out.push({ a: i, b: best });
    }
    return out;
  }, [nodes]);

  return (
    <AbsoluteFill style={{ opacity, pointerEvents: "none" }}>
      <svg width={format.width} height={format.height}>
        {links.map((l, i) => {
          const p = interpolate(
            frame,
            [nodes[l.a].delay + 6, nodes[l.a].delay + 30],
            [0, 1],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
          );
          return (
            <line
              key={`l${i}`}
              x1={nodes[l.a].x}
              y1={nodes[l.a].y}
              x2={nodes[l.a].x + (nodes[l.b].x - nodes[l.a].x) * p}
              y2={nodes[l.a].y + (nodes[l.b].y - nodes[l.a].y) * p}
              stroke="rgba(255,255,255,0.20)"
              strokeWidth={1.2}
            />
          );
        })}
        {nodes.map((n, i) => {
          const p = interpolate(frame, [n.delay, n.delay + 18], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          return (
            <circle
              key={`n${i}`}
              cx={n.x}
              cy={n.y}
              r={n.r * p}
              fill={n.warm ? brand.colors.logoGreen : "rgba(255,255,255,0.85)"}
            />
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};
