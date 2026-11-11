import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import type { Scene } from "../types/storyboard";
import { SceneFrame } from "./SceneFrame";
import { LogoLockup, StatRail } from "../components/Brand";
import { KineticHeadline } from "../typography/Text";
import { NetworkField } from "../effects/Surfaces";
import { EASE_IN_OUT, EASE_OUT, reveal } from "../motion/timing";
import { useBrand, useFormat, useMotion } from "../utils/studio";
import { fitSize } from "../typography/fit";
import { marketviewProduct } from "../products/marketview";

type Props = Extract<Scene, { kind: "closing" }>;

/**
 * The close.
 *
 * Identity, one sentence, the verified numbers, and where to go. It ends on a
 * slow settle rather than a cut to black; `loopSafe` holds the final field so
 * a looping edition can rejoin its own first frame without a flash.
 */
export const ClosingScene: React.FC<{ scene: Props }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const format = useFormat();
  const brand = useBrand();
  const motion = useMotion();

  const column = format.uiPresentation === "column";
  const statementLines = scene.statement.split("\n");
  const measure = format.width * format.measure;
  const statementSize = fitSize(statementLines, measure, format.type.title * 0.86);
  const ctaDelay = Math.round(fps * 1.5);
  const ctaP = reveal({ frame, fps, delay: ctaDelay, motion });
  const partnersP = reveal({ frame, fps, delay: ctaDelay + Math.round(fps * 0.4), motion });

  /**
   * Partner names render only once someone has confirmed they may be used.
   *
   * The gate lives on the product profile rather than in the storyboard so that
   * it is one edit for every film, and so that a storyboard author writing the
   * end card cannot accidentally ship an unapproved partner list by forgetting
   * a flag. Until it flips, the names are carried, reviewable and invisible.
   */
  const partners = marketviewProduct.campaign.partnersCleared ? scene.partners : [];

  // The network motif condenses toward the mark as the film ends.
  const condense = interpolate(frame, [0, durationInFrames], [1, 0.86], {
    extrapolateRight: "clamp",
    easing: EASE_IN_OUT,
  });

  // Loop-safe editions dim the last few frames to the opening field value so
  // the restart is not a visible jump.
  const loopFade = scene.loopSafe
    ? interpolate(frame, [durationInFrames - Math.round(fps * 0.6), durationInFrames], [1, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: EASE_IN_OUT,
      })
    : 1;

  return (
    <SceneFrame
      field="deep"
      background={
        <AbsoluteFill style={{ transform: `scale(${condense.toFixed(4)})`, opacity: 0.34 }}>
          <NetworkField opacity={1} seed="close" buildFrames={50} count={34} />
        </AbsoluteFill>
      }
      spotlight={{ x: 0.5, y: 0.42, radius: 0.95, intensity: 0.26 }}
    >
      <AbsoluteFill
        style={{
          alignItems: "center",
          justifyContent: "center",
          opacity: loopFade,
        }}
      >
        <LogoLockup size={format.type.display * 0.8} delay={2} tone="onDark" />

        <div
          style={{
            marginTop: format.type.head * 1.1,
            textAlign: "center",
            maxWidth: measure,
          }}
        >
          <KineticHeadline
            lines={statementLines}
            delay={14}
            tone="onDark"
            size={statementSize}
            align="center"
            lineHeight={1.18}
            weight={620}
          />
        </div>

        {scene.stats.length > 0 ? (
          <StatRail
            stats={scene.stats}
            delay={Math.round(fps * 0.95)}
            tone="onDark"
            direction={column ? "column" : "row"}
            style={{
              marginTop: format.type.head * 1.4,
              justifyContent: "center",
            }}
          />
        ) : null}

        {scene.cta || scene.website ? (
          <div
            style={{
              marginTop: format.type.head * 1.5,
              display: "flex",
              alignItems: "center",
              gap: format.type.body,
              opacity: ctaP,
              transform: `translate3d(0, ${((1 - ctaP) * 18).toFixed(1)}px, 0)`,
            }}
          >
            {scene.cta ? (
              <div
                style={{
                  fontFamily: brand.fontFamily,
                  fontSize: format.type.body * 1.02,
                  fontWeight: 700,
                  color: "#07210B",
                  background: brand.colors.logoGreen,
                  padding: `${format.type.body * 0.55}px ${format.type.body * 1.25}px`,
                  borderRadius: 999,
                }}
              >
                {scene.cta}
              </div>
            ) : null}
            {scene.website ? (
              <div
                style={{
                  fontFamily: brand.fontFamily,
                  fontSize: format.type.body * 1.02,
                  fontWeight: 600,
                  color: "rgba(255,255,255,0.80)",
                  letterSpacing: 0.3,
                }}
              >
                {scene.website}
              </div>
            ) : null}
          </div>
        ) : null}
        {partners.length > 0 ? (
          <div
            style={{
              marginTop: format.type.head * 1.1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: format.type.meta * 0.6,
              opacity: partnersP,
              maxWidth: measure,
            }}
          >
            {scene.partnersLabel ? (
              <div
                style={{
                  fontFamily: brand.fontFamily,
                  fontSize: format.type.meta * 0.86,
                  fontWeight: 700,
                  letterSpacing: format.type.meta * 0.14,
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.46)",
                }}
              >
                {scene.partnersLabel}
              </div>
            ) : null}
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                justifyContent: "center",
                gap: `${format.type.meta * 0.4}px ${format.type.meta * 0.9}px`,
              }}
            >
              {partners.map((partner) => (
                <div
                  key={partner}
                  style={{
                    fontFamily: brand.fontFamily,
                    fontSize: format.type.meta * 0.95,
                    fontWeight: 600,
                    color: "rgba(255,255,255,0.72)",
                    whiteSpace: "nowrap",
                  }}
                >
                  {partner}
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </AbsoluteFill>

      {/* Closing hairline mirrors the one that opened the film. */}
      <AbsoluteFill style={{ justifyContent: "flex-end", opacity: loopFade }}>
        <div
          style={{
            height: 2,
            width: `${interpolate(frame, [0, durationInFrames * 0.8], [100, 0], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: EASE_OUT,
            }).toFixed(2)}%`,
            marginLeft: "auto",
            background: `linear-gradient(270deg, ${brand.colors.logoGreen}, ${brand.colors.accent}00)`,
            opacity: 0.8,
          }}
        />
      </AbsoluteFill>
    </SceneFrame>
  );
};
