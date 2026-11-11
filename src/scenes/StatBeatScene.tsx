import React from "react";
import {
  AbsoluteFill,
  Img,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { Scene } from "../types/storyboard";
import { SceneFrame } from "./SceneFrame";
import { Eyebrow, KineticHeadline } from "../typography/Text";
import { StatValue } from "../components/Brand";
import { NetworkField } from "../effects/Surfaces";
import { EASE_OUT, reveal } from "../motion/timing";
import { fitSize } from "../typography/fit";
import { snap } from "../utils/pixels";
import { useBrand, useFormat, useMotion, useSafeBox } from "../utils/studio";

type Props = Extract<Scene, { kind: "statBeat" }>;

/**
 * A figure given the whole frame.
 *
 * Used where the beat *is* the number. The value counts up, which is the one
 * place in the studio where motion carries information rather than attention:
 * a figure that arrives at its total reads as measured, where a figure that
 * simply appears reads as asserted.
 *
 * `note` exists so a number can carry its own qualification in the same
 * breath. A statistic about a market is not a statistic about this product,
 * and the frame should say which it is.
 */
export const StatBeatScene: React.FC<{ scene: Props }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const format = useFormat();
  const brand = useBrand();
  const motion = useMotion();
  const safe = useSafeBox();

  const onDark = scene.field !== "light";
  const tone = onDark ? "onDark" : "onLight";
  const column = format.uiPresentation === "column";
  const headlineLines = scene.headline ?? [];

  const backdropZoom = interpolate(frame, [0, durationInFrames], [1.1, 1.2], {
    extrapolateRight: "clamp",
    easing: EASE_OUT,
  });

  // The figure gets the display step; everything else stays well below it.
  const valueSize = format.type.display * (scene.stats.length > 2 ? 0.66 : 0.92);

  return (
    <SceneFrame
      field={scene.field}
      background={
        scene.backdrop ? (
          <AbsoluteFill style={{ overflow: "hidden" }}>
            <Img
              src={staticFile(`assets/derived/${scene.backdrop}-backdrop.jpg`)}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                transform: `scale(${backdropZoom.toFixed(4)})`,
                opacity: 0.42,
              }}
            />
            <AbsoluteFill
              style={{
                background: `linear-gradient(100deg, ${brand.colors.primaryDeep}F0 0%, ${brand.colors.primaryDeep}B0 60%, rgba(8,12,43,0.78) 100%)`,
              }}
            />
          </AbsoluteFill>
        ) : (
          <NetworkField opacity={0.2} seed="stats" buildFrames={70} />
        )
      }
      spotlight={onDark ? { x: 0.3, y: 0.4, radius: 0.85, intensity: 0.2 } : undefined}
    >
      <AbsoluteFill style={{ justifyContent: "center" }}>
        {scene.eyebrow ? (
          <Eyebrow delay={0} tone={tone} style={{ marginBottom: format.type.body * 0.8 }}>
            {scene.eyebrow}
          </Eyebrow>
        ) : null}

        {headlineLines.length ? (
          <div style={{ marginBottom: format.type.body * 1.4, maxWidth: safe.width * 0.8 }}>
            <KineticHeadline
              lines={headlineLines}
              delay={4}
              tone={tone}
              size={fitSize(headlineLines, safe.width * 0.8, format.type.title * 0.82)}
            />
          </div>
        ) : null}

        <div
          style={{
            display: "flex",
            flexDirection: column ? "column" : "row",
            gap: column ? format.type.body * 1.6 : format.type.body * 2.6,
            alignItems: column ? "flex-start" : "flex-end",
          }}
        >
          {scene.stats.map((stat, i) => {
            const delay = 10 + i * motion.stagger * 3;
            const p = reveal({ frame, fps, delay, motion });
            return (
              <div
                key={stat.label}
                style={{
                  opacity: p,
                  transform: p >= 0.999 ? "none" : `translate3d(0, ${snap((1 - p) * 26)}px, 0)`,
                  borderLeft: `3px solid ${i % 2 === 0 ? brand.colors.logoGreen : brand.colors.accent}`,
                  paddingLeft: format.type.body,
                  maxWidth: column ? safe.width : safe.width * 0.42,
                }}
              >
                <div
                  style={{
                    fontFamily: brand.fontFamily,
                    fontSize: valueSize,
                    fontWeight: 820,
                    letterSpacing: -valueSize * 0.035,
                    lineHeight: 1.0,
                    color: onDark ? "#FFFFFF" : brand.colors.logoNavy,
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  <StatValue
                    value={stat.value}
                    delay={delay + 2}
                    durationInFrames={Math.round(fps * 1.2)}
                  />
                </div>
                <div
                  style={{
                    fontFamily: brand.fontFamily,
                    fontSize: format.type.body,
                    fontWeight: 600,
                    lineHeight: 1.3,
                    marginTop: format.type.body * 0.44,
                    color: onDark ? "rgba(255,255,255,0.86)" : brand.colors.ink,
                  }}
                >
                  {stat.label}
                </div>
                {stat.note ? (
                  <div
                    style={{
                      fontFamily: brand.fontFamily,
                      fontSize: format.type.meta,
                      fontWeight: 450,
                      lineHeight: 1.35,
                      marginTop: format.type.meta * 0.5,
                      color: onDark ? "rgba(255,255,255,0.55)" : brand.colors.inkSoft,
                    }}
                  >
                    {stat.note}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </AbsoluteFill>

      {scene.attribution ? (
        <AbsoluteFill style={{ justifyContent: "flex-end" }}>
          <Eyebrow
            delay={Math.round(fps * 1.2)}
            tone={tone}
            color={onDark ? "rgba(255,255,255,0.42)" : undefined}
          >
            {scene.attribution}
          </Eyebrow>
        </AbsoluteFill>
      ) : null}
    </SceneFrame>
  );
};
