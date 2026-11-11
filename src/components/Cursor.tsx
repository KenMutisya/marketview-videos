import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { EASE_IN_OUT, EASE_OUT } from "../motion/timing";

export type CursorKeyframe = {
  /** Frame at which the cursor arrives at this point. */
  frame: number;
  /** Position in container coordinates (px). */
  x: number;
  y: number;
  /** Register a click on arrival. */
  click?: boolean;
};

export type CursorProps = {
  path: CursorKeyframe[];
  /** Pixel size of the pointer. */
  size?: number;
  /** Frame at which the cursor fades in. */
  appearAt?: number;
  /** Frame at which it leaves. */
  leaveAt?: number;
  color?: string;
};

/**
 * Cursor choreography.
 *
 * Movement is eased per leg and curved: the pointer arcs between keyframes
 * rather than travelling in straight lines, which is what makes reconstructed
 * cursor motion stop reading as a robot. Click feedback is a single expanding
 * ring, not a cartoon.
 */
export const Cursor: React.FC<CursorProps> = ({
  path,
  size = 30,
  appearAt = 0,
  leaveAt,
  color = "#0F172A",
}) => {
  const frame = useCurrentFrame();
  if (path.length === 0) return null;

  // Locate the active leg.
  let i = 0;
  while (i < path.length - 1 && frame >= path[i + 1].frame) i += 1;
  const a = path[i];
  const b = path[Math.min(i + 1, path.length - 1)];

  let x = a.x;
  let y = a.y;
  if (b !== a && b.frame > a.frame) {
    const t = interpolate(frame, [a.frame, b.frame], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: EASE_IN_OUT,
    });
    // Quadratic arc: the control point is offset perpendicular to the leg so
    // the pointer sweeps rather than slides.
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len = Math.hypot(dx, dy) || 1;
    const bow = Math.min(len * 0.18, 90);
    const cx = (a.x + b.x) / 2 + (-dy / len) * bow;
    const cy = (a.y + b.y) / 2 + (dx / len) * bow;
    const u = 1 - t;
    x = u * u * a.x + 2 * u * t * cx + t * t * b.x;
    y = u * u * a.y + 2 * u * t * cy + t * t * b.y;
  }

  const appear = interpolate(frame, [appearAt, appearAt + 10], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const leave =
    leaveAt === undefined
      ? 1
      : interpolate(frame, [leaveAt, leaveAt + 10], [1, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
  const opacity = Math.min(appear, leave);

  // Click feedback from the most recent click keyframe.
  const click = [...path].reverse().find((k) => k.click && frame >= k.frame);
  const sinceClick = click ? frame - click.frame : Infinity;
  const ringP = interpolate(sinceClick, [0, 16], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE_OUT,
  });
  const press = interpolate(sinceClick, [0, 4, 9], [1, 0.88, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", opacity }}>
      {click && sinceClick < 16 ? (
        <div
          style={{
            position: "absolute",
            left: click.x,
            top: click.y,
            width: size * 2.6,
            height: size * 2.6,
            marginLeft: -size * 1.3,
            marginTop: -size * 1.3,
            borderRadius: "50%",
            border: `${Math.max(2, size * 0.07)}px solid ${color}`,
            opacity: (1 - ringP) * 0.5,
            transform: `scale(${0.3 + ringP * 0.9})`,
          }}
        />
      ) : null}
      <svg
        width={size}
        height={size * 1.32}
        viewBox="0 0 24 32"
        style={{
          position: "absolute",
          left: x,
          top: y,
          transform: `scale(${press})`,
          transformOrigin: "4px 4px",
          filter: "drop-shadow(0 3px 7px rgba(15,23,42,0.38))",
        }}
      >
        <path
          d="M3 2.2 L19.4 16.1 L12.2 16.6 L16.1 25.3 L12.4 27 L8.6 18.4 L3 23.3 Z"
          fill="#FFFFFF"
          stroke={color}
          strokeWidth={1.7}
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
};
