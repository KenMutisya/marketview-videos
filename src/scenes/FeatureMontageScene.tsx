import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import type { Scene } from "../types/storyboard";
import { SceneFrame } from "./SceneFrame";
import { UIShot } from "../components/UIShot";
import { Eyebrow } from "../typography/Text";
import { EASE_OUT, reveal } from "../motion/timing";
import { useBrand, useFormat, useMotion, useSafeBox } from "../utils/studio";

type Props = Extract<Scene, { kind: "featureMontage" }>;

/**
 * Capabilities, each anchored to a real piece of the interface.
 *
 * Laid out as full-width rows rather than a card grid. The product's surfaces
 * are wide strips — alert rows, route summaries, price tables — and a narrow
 * card crops them to an illegible middle. A row gives each excerpt its natural
 * proportions, anchored left so the label and headline survive the crop, and
 * lets the excerpt bleed off the frame edge so the interface reads as larger
 * than the shot.
 */
export const FeatureMontageScene: React.FC<{ scene: Props }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const format = useFormat();
  const brand = useBrand();
  const motion = useMotion();
  const safe = useSafeBox();

  const onLight = scene.field === "light";
  const column = format.uiPresentation === "column";
  const n = scene.features.length;

  const headerH = scene.eyebrow ? format.type.meta * 3.6 : 0;
  // Four rows of white cards on a white field merge into one strip at the
  // three-row spacing, so the gap opens up as the row count goes past three.
  const gap = format.type.body * (column ? 0.8 : n >= 4 ? 1.05 : 0.7);
  const rowH = (safe.height - headerH - gap * (n - 1)) / n;

  // Text column on the left, interface excerpt on the right, bleeding out.
  const textW = column ? safe.width : safe.width * 0.34;
  const mediaW = column ? safe.width : safe.width - textW - format.type.body * 1.2;
  const mediaBleed = column ? format.safe.right * 0.6 : format.safe.right * 0.8;

  return (
    <SceneFrame field={scene.field} vignette={onLight ? 0.12 : undefined}>
      {scene.eyebrow ? (
        <Eyebrow
          delay={2}
          tone={onLight ? "onLight" : "onDark"}
          color={onLight ? brand.colors.primary : undefined}
        >
          {scene.eyebrow}
        </Eyebrow>
      ) : null}

      <AbsoluteFill style={{ top: headerH }}>
        {scene.features.map((f, i) => {
          const delay = 4 + i * (motion.stagger * 5.5);
          const p = reveal({ frame, fps, delay, motion });
          // Each row keeps drifting after it lands, so the frame never freezes.
          const drift = interpolate(frame, [delay, durationInFrames], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: EASE_OUT,
          });
          const accent = i % 2 === 0 ? brand.colors.logoGreen : brand.colors.accent;
          const mediaH = column ? rowH * 0.52 : rowH;

          return (
            <div
              key={f.title}
              style={{
                position: "absolute",
                top: i * (rowH + gap),
                left: 0,
                width: safe.width + mediaBleed,
                height: rowH,
                opacity: p,
                transform: `translate3d(${((1 - p) * -44).toFixed(1)}px, 0, 0)`,
                display: "flex",
                flexDirection: column ? "column" : "row",
                alignItems: column ? "stretch" : "center",
                gap: format.type.body * 0.9,
                willChange: "transform, opacity",
              }}
            >
              {/* Interface excerpt */}
              <div
                style={{
                  order: column ? 0 : 1,
                  width: mediaW + mediaBleed,
                  height: mediaH,
                  borderRadius: brand.radius.lg,
                  overflow: "hidden",
                  position: "relative",
                  background: onLight ? "#FFFFFF" : "rgba(255,255,255,0.05)",
                  border: `1px solid ${onLight ? brand.colors.border : "rgba(255,255,255,0.12)"}`,
                  boxShadow: onLight
                    ? "0 16px 40px rgba(13,20,55,0.12), 0 2px 5px rgba(13,20,55,0.07)"
                    : "0 24px 56px rgba(0,0,0,0.34)",
                }}
              >
                <div
                  style={{
                    // Slow travel across the excerpt: more of the real surface
                    // is seen than a single framing could show.
                    transform: `translate3d(${(-drift * mediaW * 0.05).toFixed(1)}px, 0, 0) scale(${(1 + drift * 0.05).toFixed(4)})`,
                    transformOrigin: "left center",
                    willChange: "transform",
                  }}
                >
                  <UIShot
                    capture={f.capture}
                    width={mediaW + mediaBleed}
                    height={mediaH}
                    from={{ region: f.region, pad: 0.015 }}
                    anchor="topLeft"
                  />
                </div>
                {/* Fades on both cut edges, so an excerpt reads as continuing
                    rather than as a row sliced in half. The right fade carries
                    it off the frame; the bottom one matters most in the shorter
                    rows a 4:3 frame produces. */}
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: `linear-gradient(90deg, rgba(0,0,0,0) 62%, ${
                      onLight ? "rgba(243,246,250,0.95)" : "rgba(11,17,51,0.95)"
                    } 100%)`,
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: `linear-gradient(180deg, rgba(0,0,0,0) 72%, ${
                      onLight ? "rgba(255,255,255,0.92)" : "rgba(11,17,51,0.92)"
                    } 100%)`,
                  }}
                />
              </div>

              {/* Claim */}
              <div
                style={{
                  order: column ? 1 : 0,
                  width: textW,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  borderLeft: column ? "none" : `3px solid ${accent}`,
                  paddingLeft: column ? 0 : format.type.body * 0.8,
                }}
              >
                <div
                  style={{
                    fontFamily: brand.fontFamily,
                    fontSize: format.type.head,
                    fontWeight: 780,
                    letterSpacing: -format.type.head * 0.026,
                    lineHeight: 1.12,
                    color: onLight ? brand.colors.logoNavy : "#FFFFFF",
                    marginBottom: format.type.body * 0.34,
                  }}
                >
                  {f.title}
                </div>
                <div
                  style={{
                    fontFamily: brand.fontFamily,
                    fontSize: format.type.body * 0.9,
                    lineHeight: 1.4,
                    fontWeight: 450,
                    color: onLight ? brand.colors.inkSoft : "rgba(255,255,255,0.70)",
                  }}
                >
                  {f.line}
                </div>
              </div>
            </div>
          );
        })}
      </AbsoluteFill>
    </SceneFrame>
  );
};
