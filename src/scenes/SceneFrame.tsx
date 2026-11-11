import React from "react";
import { AbsoluteFill } from "remotion";
import { GradientField, Grain, Spotlight, Vignette } from "../effects/Surfaces";
import { useFormat, useSafeBox } from "../utils/studio";

/**
 * Every scene sits inside this. It owns the background field, the grain and
 * vignette, and the safe area, so the film's base treatment is identical from
 * shot to shot and no scene can quietly drift off-brand.
 */
export const SceneFrame: React.FC<{
  field?: "deep" | "light" | "accent";
  spotlight?: { x: number; y: number; radius?: number; intensity?: number };
  grain?: number;
  vignette?: number;
  /** Render children without the safe-area padding wrapper. */
  bleed?: boolean;
  background?: React.ReactNode;
  foreground?: React.ReactNode;
  children?: React.ReactNode;
}> = ({
  field = "deep",
  spotlight,
  grain,
  vignette,
  bleed = false,
  background,
  foreground,
  children,
}) => {
  const safe = useSafeBox();
  const format = useFormat();
  const onDark = field !== "light";

  return (
    <AbsoluteFill style={{ overflow: "hidden", backgroundColor: onDark ? "#0B1133" : "#F3F6FA" }}>
      <GradientField tone={field} />
      {background}
      {spotlight ? <Spotlight {...spotlight} /> : null}
      {bleed ? (
        children
      ) : (
        <AbsoluteFill
          style={{
            left: safe.left,
            top: safe.top,
            width: safe.width,
            height: safe.height,
          }}
        >
          {children}
        </AbsoluteFill>
      )}
      {foreground}
      <Vignette strength={vignette ?? (onDark ? 0.42 : 0.16)} />
      <Grain opacity={grain ?? (onDark ? 0.055 : 0.03)} seed={`f${format.width}`} />
    </AbsoluteFill>
  );
};
