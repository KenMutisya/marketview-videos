import React from "react";
import { AbsoluteFill } from "remotion";
import type {
  TransitionPresentation,
  TransitionPresentationComponentProps,
} from "@remotion/transitions";

/**
 * Transition presentations.
 *
 * Each one exists because a scene boundary needs it, not because it looks
 * clever: a dip carries a change of subject, a zoom-through carries a change of
 * scale on the same subject, a wipe carries a change of topic inside one idea.
 */

type DipProps = { through: string };

const DipPresentation: React.FC<TransitionPresentationComponentProps<DipProps>> = ({
  children,
  presentationProgress: p,
  presentationDirection,
  passedProps,
}) => {
  if (presentationDirection === "exiting") {
    return <AbsoluteFill>{children}</AbsoluteFill>;
  }
  // The dip colour sits above the outgoing scene and below the incoming one.
  // Driven past 1 at the midpoint so the field is briefly solid: a veil that
  // only reaches ~0.9 leaves both scenes showing through and reads as a smear
  // rather than a cut.
  const veil = Math.min(1, (1 - Math.abs(p * 2 - 1)) * 1.45);
  const content = Math.max(0, p * 2.2 - 1.2);
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ background: passedProps.through, opacity: veil }} />
      <AbsoluteFill style={{ opacity: content }}>{children}</AbsoluteFill>
    </AbsoluteFill>
  );
};

/** Fades out through a colour and back in. Signals a change of subject. */
export const dip = (props: DipProps): TransitionPresentation<DipProps> => ({
  component: DipPresentation,
  props,
});

const ZoomThroughPresentation: React.FC<
  TransitionPresentationComponentProps<{ amount: number }>
> = ({ children, presentationProgress: p, presentationDirection, passedProps }) => {
  const a = passedProps.amount;
  if (presentationDirection === "exiting") {
    return (
      <AbsoluteFill
        style={{
          transform: `scale(${(1 + a * p).toFixed(4)})`,
          opacity: 1 - p,
          willChange: "transform, opacity",
        }}
      >
        {children}
      </AbsoluteFill>
    );
  }
  return (
    <AbsoluteFill
      style={{
        transform: `scale(${(1 - a * 0.6 * (1 - p)).toFixed(4)})`,
        opacity: p,
        willChange: "transform, opacity",
      }}
    >
      {children}
    </AbsoluteFill>
  );
};

/** Pushes through the outgoing frame. Reads as continuing into the subject. */
export const zoomThrough = (
  amount = 0.18,
): TransitionPresentation<{ amount: number }> => ({
  component: ZoomThroughPresentation,
  props: { amount },
});

type WipeProps = { direction: "left" | "right" | "up" | "down"; edge: string };

const MaskWipePresentation: React.FC<TransitionPresentationComponentProps<WipeProps>> = ({
  children,
  presentationProgress: p,
  presentationDirection,
  passedProps,
}) => {
  if (presentationDirection === "exiting") {
    return <AbsoluteFill>{children}</AbsoluteFill>;
  }
  const pct = (1 - p) * 100;
  const { direction } = passedProps;
  const inset =
    direction === "left"
      ? `0 ${pct}% 0 0`
      : direction === "right"
        ? `0 0 0 ${pct}%`
        : direction === "up"
          ? `${pct}% 0 0 0`
          : `0 0 ${pct}% 0`;
  const horizontal = direction === "left" || direction === "right";
  const edgePos = direction === "left" ? `${100 - pct}%` : direction === "right" ? `${pct}%` : undefined;
  const edgePosV = direction === "up" ? `${100 - pct}%` : direction === "down" ? `${pct}%` : undefined;

  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ clipPath: `inset(${inset})`, willChange: "clip-path" }}>
        {children}
      </AbsoluteFill>
      {p > 0.02 && p < 0.98 ? (
        <div
          style={{
            position: "absolute",
            background: passedProps.edge,
            opacity: 0.9,
            ...(horizontal
              ? { top: 0, bottom: 0, left: edgePos, width: 3 }
              : { left: 0, right: 0, top: edgePosV, height: 3 }),
          }}
        />
      ) : null}
    </AbsoluteFill>
  );
};

/** Hard-edged wipe with a brand-coloured leading line. */
export const maskWipe = (props: WipeProps): TransitionPresentation<WipeProps> => ({
  component: MaskWipePresentation,
  props,
});

type PushProps = { direction: "left" | "right" | "up" | "down" };

const PushPresentation: React.FC<TransitionPresentationComponentProps<PushProps>> = ({
  children,
  presentationProgress: p,
  presentationDirection,
  passedProps,
}) => {
  const sign =
    passedProps.direction === "left" || passedProps.direction === "up" ? -1 : 1;
  const axis = passedProps.direction === "up" || passedProps.direction === "down" ? "Y" : "X";
  const offset = presentationDirection === "exiting" ? sign * -100 * p : sign * 100 * (1 - p);
  return (
    <AbsoluteFill
      style={{
        transform: `translate${axis}(${offset.toFixed(3)}%)`,
        willChange: "transform",
      }}
    >
      {children}
    </AbsoluteFill>
  );
};

/** Both frames travel together. Keeps spatial continuity across a cut. */
export const push = (props: PushProps): TransitionPresentation<PushProps> => ({
  component: PushPresentation,
  props,
});
