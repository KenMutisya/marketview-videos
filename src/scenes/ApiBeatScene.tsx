import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import type { Scene } from "../types/storyboard";
import { SceneFrame } from "./SceneFrame";
import { UIShot } from "../components/UIShot";
import { Eyebrow, KineticHeadline } from "../typography/Text";
import { NetworkField } from "../effects/Surfaces";
import { EASE_OUT, reveal } from "../motion/timing";
import { useBrand, useFormat, useMotion, useSafeBox } from "../utils/studio";

type Props = Extract<Scene, { kind: "apiBeat" }>;

/**
 * Developer beat: a request is typed, it goes out, a real response shape comes
 * back. The response panel is a crop of the product's own API reference, not a
 * mock-up written for the film.
 */
export const ApiBeatScene: React.FC<{ scene: Props }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const format = useFormat();
  const brand = useBrand();
  const motion = useMotion();
  const safe = useSafeBox();

  const typeStart = Math.round(fps * 0.4);
  const typeFrames = Math.round(fps * 0.9);
  const full = scene.request.path;
  const typed = full.slice(
    0,
    Math.round(
      interpolate(frame, [typeStart, typeStart + typeFrames], [0, full.length], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      }),
    ),
  );
  const caret = frame % 16 < 9 && frame < typeStart + typeFrames + fps * 0.5;

  const responseAt = Math.round(scene.responseAt * fps);
  const resP = reveal({ frame, fps, delay: responseAt, motion });
  // Inflight indicator between send and response.
  const inflight = interpolate(
    frame,
    [typeStart + typeFrames, typeStart + typeFrames + 4, responseAt - 4, responseAt],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  const panelW = safe.width;
  const requestH = format.type.head * 2.3;
  const responseH = safe.height - requestH - format.type.head * 3.6;

  return (
    <SceneFrame
      field="deep"
      background={<NetworkField opacity={0.2} seed="api" buildFrames={60} />}
      spotlight={{ x: 0.5, y: 0.5, radius: 0.9, intensity: 0.18 }}
    >
      {scene.eyebrow ? (
        <Eyebrow delay={2} tone="onDark">
          {scene.eyebrow}
        </Eyebrow>
      ) : null}
      <div style={{ marginTop: format.type.meta * 1.1, marginBottom: format.type.body }}>
        <KineticHeadline
          lines={[scene.title]}
          delay={6}
          tone="onDark"
          size={format.type.title * 0.86}
        />
      </div>

      {/* Request line */}
      <div
        style={{
          width: panelW,
          height: requestH,
          display: "flex",
          alignItems: "center",
          gap: format.type.body * 0.7,
          padding: `0 ${format.type.body}px`,
          borderRadius: brand.radius.md,
          background: "rgba(255,255,255,0.07)",
          border: "1px solid rgba(255,255,255,0.16)",
          fontFamily: brand.monoFamily,
          fontSize: format.type.body * 0.92,
          color: "rgba(255,255,255,0.92)",
        }}
      >
        <span
          style={{
            fontFamily: brand.fontFamily,
            fontWeight: 800,
            fontSize: format.type.meta,
            letterSpacing: 1,
            padding: `${format.type.meta * 0.3}px ${format.type.meta * 0.6}px`,
            borderRadius: brand.radius.sm,
            background: brand.colors.logoGreen,
            color: "#07210B",
          }}
        >
          {scene.request.method}
        </span>
        <span style={{ whiteSpace: "nowrap", overflow: "hidden" }}>
          {typed}
          {caret ? <span style={{ opacity: 0.8 }}>▌</span> : null}
        </span>
        <span style={{ flex: 1 }} />
        <span
          style={{
            width: format.type.body * 0.6,
            height: format.type.body * 0.6,
            borderRadius: "50%",
            border: `2px solid rgba(255,255,255,0.35)`,
            borderTopColor: brand.colors.logoGreen,
            opacity: inflight,
            transform: `rotate(${(frame * 14) % 360}deg)`,
          }}
        />
      </div>

      {/* Response */}
      <div
        style={{
          marginTop: format.type.body * 0.9,
          width: panelW,
          height: responseH,
          borderRadius: brand.radius.lg,
          overflow: "hidden",
          border: "1px solid rgba(255,255,255,0.14)",
          boxShadow: "0 30px 70px rgba(0,0,0,0.42)",
          opacity: resP,
          transform: `translate3d(0, ${((1 - resP) * 34).toFixed(1)}px, 0)`,
          willChange: "transform, opacity",
        }}
      >
        <UIShot
          capture={scene.capture}
          width={panelW}
          height={responseH}
          from={{ region: scene.region, pad: 0.01 }}
        />
      </div>

      {/* 200 badge lands with the response */}
      <AbsoluteFill style={{ alignItems: "flex-end", justifyContent: "flex-end" }}>
        <div
          style={{
            opacity: interpolate(frame, [responseAt + 6, responseAt + 16], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: EASE_OUT,
            }),
            fontFamily: brand.fontFamily,
            fontWeight: 800,
            fontSize: format.type.meta,
            letterSpacing: 1.2,
            color: brand.colors.logoGreen,
          }}
        >
          200 OK
        </div>
      </AbsoluteFill>
    </SceneFrame>
  );
};
