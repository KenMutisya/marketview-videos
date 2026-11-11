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
import { KineticHeadline, Eyebrow } from "../typography/Text";
import { NetworkField } from "../effects/Surfaces";
import { SceneFrame } from "./SceneFrame";
import { useBrand, useFormat, useMotion } from "../utils/studio";
import { EASE_IN_OUT, EASE_OUT } from "../motion/timing";
import { fitSize } from "../typography/fit";

type Props = Extract<Scene, { kind: "statement" }>;

/**
 * The film's voice.
 *
 * A statement scene is type on a field: no interface, no decoration beyond the
 * network motif. It carries the hook and the thesis, and it is the only place
 * the film is allowed to simply assert something.
 */
export const StatementScene: React.FC<{ scene: Props }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const format = useFormat();
  const brand = useBrand();
  const motion = useMotion();
  const onDark = scene.field !== "light";

  const stingDelay = Math.round(durationInFrames * 0.58);
  // Two statements, one position. The first lifts away as the second arrives,
  // so the frame never carries four lines of display type at once.
  const exitFrames = Math.round(motion.revealFrames * 0.8);
  const firstOut = scene.sting
    ? interpolate(frame, [stingDelay - exitFrames, stingDelay], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: EASE_IN_OUT,
      })
    : 0;

  const backdropZoom = interpolate(frame, [0, durationInFrames], [1.14, 1.26], {
    extrapolateRight: "clamp",
    easing: EASE_OUT,
  });

  const background = (
    <>
      {scene.backdrop ? (
        <AbsoluteFill style={{ overflow: "hidden" }}>
          {/* Pre-blurred by scripts/make-derived-assets.ts. The source page
              carries its own headline, and two competing headlines is no
              headline at all; the treatment is baked so the blur is not
              recomputed on every frame. */}
          <Img
            src={staticFile(`assets/derived/${scene.backdrop}-backdrop.jpg`)}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              transform: `scale(${backdropZoom.toFixed(4)})`,
              opacity: 0.62,
            }}
          />
          <AbsoluteFill
            style={{
              background: `linear-gradient(100deg, ${brand.colors.primaryDeep}EE 0%, ${brand.colors.primaryDeep}AA 52%, rgba(8,12,43,0.72) 100%)`,
            }}
          />
        </AbsoluteFill>
      ) : null}
      {scene.network ? <NetworkField opacity={0.4} buildFrames={durationInFrames * 0.8} /> : null}
    </>
  );

  const measure = format.width * format.measure;
  const headlineSize = fitSize(
    [...scene.lines, ...(scene.sting ?? [])],
    measure,
    format.type.display,
  );

  return (
    <SceneFrame
      field={scene.field}
      background={background}
      spotlight={onDark ? { x: 0.26, y: 0.34, radius: 0.72, intensity: 0.22 } : undefined}
    >
      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: scene.align === "center" ? "center" : "flex-start",
          textAlign: scene.align,
        }}
      >
        {scene.eyebrow ? (
          <Eyebrow
            tone={onDark ? "onDark" : "onLight"}
            delay={0}
            color={onDark ? "rgba(255,255,255,0.52)" : undefined}
            style={{ marginBottom: format.type.body * 1.1 }}
          >
            {scene.eyebrow}
          </Eyebrow>
        ) : null}

        {/* Both statements share one slot: a fixed-height stage keeps them out
            of each other's way and out of the eyebrow's. */}
        <div
          style={{
            position: "relative",
            width: measure,
            height: headlineSize * 1.06 * Math.max(
              scene.lines.length,
              scene.sting?.length ?? 0,
            ),
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              opacity: 1 - firstOut,
              transform: `translate3d(0, ${(-firstOut * headlineSize * 0.5).toFixed(1)}px, 0)`,
            }}
          >
            <KineticHeadline
              lines={scene.lines}
              delay={8}
              tone={onDark ? "onDark" : "onLight"}
              emphasise={scene.emphasise}
              size={headlineSize}
              align={scene.align}
              lineHeight={1.06}
            />
          </div>

          {scene.sting ? (
            <div style={{ position: "absolute", inset: 0, opacity: firstOut }}>
              <KineticHeadline
                lines={scene.sting}
                delay={stingDelay}
                tone={onDark ? "onDark" : "onLight"}
                emphasise={scene.emphasise}
                size={headlineSize}
                align={scene.align}
                lineHeight={1.06}
                accentColor={brand.colors.logoGreen}
              />
            </div>
          ) : null}
        </div>
      </AbsoluteFill>
      {/* A hairline that grows across the scene; the only moving decoration. */}
      <AbsoluteFill style={{ justifyContent: "flex-end" }}>
        <div
          style={{
            height: 2,
            width: `${interpolate(frame, [10, durationInFrames], [0, 100], {
              extrapolateRight: "clamp",
              easing: EASE_OUT,
            }).toFixed(2)}%`,
            background: `linear-gradient(90deg, ${brand.colors.logoGreen}, ${brand.colors.accent}00)`,
            opacity: 0.8,
          }}
        />
      </AbsoluteFill>
    </SceneFrame>
  );
};
