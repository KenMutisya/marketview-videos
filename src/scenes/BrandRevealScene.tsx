import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import type { Scene } from "../types/storyboard";
import { SceneFrame } from "./SceneFrame";
import { Chip, LogoLockup } from "../components/Brand";
import { BrowserFrame } from "../components/BrowserFrame";
import { UIShot } from "../components/UIShot";
import { Lede } from "../typography/Text";
import { KineticHeadline } from "../typography/Text";
import { NetworkField } from "../effects/Surfaces";
import { EASE_OUT, reveal } from "../motion/timing";
import { uiFrameSize } from "../utils/captures";
import { useBrand, useFormat, useMotion, useSafeBox } from "../utils/studio";
import { fitSize } from "../typography/fit";

type Props = Extract<Scene, { kind: "brandReveal" }>;

/**
 * The product arrives.
 *
 * Identity lands first and settles upward; the interface then rises from below
 * on a slight perspective tilt, as if the camera had been looking past it the
 * whole time. One move, motivated, no spin.
 */
export const BrandRevealScene: React.FC<{ scene: Props }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const format = useFormat();
  const brand = useBrand();
  const motion = useMotion();
  const safe = useSafeBox();

  const uiStart = Math.round(scene.uiAt * fps);
  const ui = reveal({ frame, fps, delay: uiStart, motion });
  const uiSize = uiFrameSize(format);

  // The lockup lifts and shrinks as the interface takes the frame.
  const lift = interpolate(frame, [uiStart - 4, uiStart + motion.revealFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE_OUT,
  });

  const logoSize = format.type.display * 0.72;
  // The reveal deliberately shows a smaller window than a walkthrough does:
  // the identity block has to clear it completely, and a product that arrives
  // slightly inset reads as arriving rather than as already being there.
  const revealSize = {
    width: Math.min(uiSize.width, (format.height * 0.66 - 46 * (format.width / 1920)) * (3024 / 1890)),
    height: 0,
  };
  revealSize.height = revealSize.width / (3024 / 1890);
  const settle = interpolate(frame, [uiStart, durationInFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE_OUT,
  });

  return (
    <SceneFrame
      field="deep"
      background={<NetworkField opacity={0.26} buildFrames={70} seed="reveal" />}
      spotlight={{ x: 0.5, y: 0.3, radius: 0.85, intensity: 0.26 }}
      bleed
    >
      {/* Identity block */}
      <AbsoluteFill
        style={{
          left: safe.left,
          top: safe.top,
          width: safe.width,
          height: safe.height,
          alignItems: "center",
          // Identity owns the frame first, then yields the lower half to the
          // product. One move, motivated by the interface arriving.
          justifyContent: "center",
          transform: `translate3d(0, ${(-lift * format.height * 0.26).toFixed(1)}px, 0) scale(${(1 - lift * 0.18).toFixed(4)})`,
          transformOrigin: "center center",
        }}
      >
        <LogoLockup size={logoSize} delay={4} tone="onDark" />
        <div style={{ marginTop: format.type.head * 0.9, textAlign: "center" }}>
          <KineticHeadline
            lines={[scene.tagline]}
            delay={14}
            tone="onDark"
            size={fitSize([scene.tagline], format.width * format.measure, format.type.title)}
            align="center"
            emphasise={["visible."]}
            accentColor={brand.colors.logoGreen}
          />
        </div>
        {scene.lede ? (
          <Lede
            delay={26}
            tone="onDark"
            style={{
              marginTop: format.type.body * 0.9,
              textAlign: "center",
              maxWidth: format.width * format.measure,
            }}
          >
            {scene.lede}
          </Lede>
        ) : null}
      </AbsoluteFill>

      {/* The interface rises */}
      <AbsoluteFill
        style={{
          alignItems: "center",
          justifyContent: "flex-end",
          perspective: 2400,
          perspectiveOrigin: "50% 20%",
        }}
      >
        <div
          style={{
            transform: [
              `translate3d(0, ${((1 - ui) * format.height * 0.42 + (1 - settle) * 24).toFixed(1)}px, 0)`,
              `rotateX(${(10 - settle * 7).toFixed(2)}deg)`,
              `scale(${(0.94 + settle * 0.04).toFixed(4)})`,
            ].join(" "),
            transformOrigin: "50% 100%",
            opacity: ui,
            marginBottom: -format.height * 0.08,
            willChange: "transform, opacity",
          }}
        >
          <BrowserFrame
            width={revealSize.width}
            height={revealSize.height}
            url={`${brand.website}/dashboard`}
            scale={format.width / 1920}
            elevation={1.3}
          >
            <UIShot
              capture={scene.capture}
              width={revealSize.width}
              height={revealSize.height}
            />
          </BrowserFrame>
        </div>
      </AbsoluteFill>

      {scene.disclosure ? (
        <AbsoluteFill
          style={{
            left: safe.left,
            top: safe.top,
            width: safe.width,
            height: safe.height,
            alignItems: "flex-end",
            justifyContent: "flex-start",
          }}
        >
          <Chip delay={uiStart + 10}>{scene.disclosure}</Chip>
        </AbsoluteFill>
      ) : null}
    </SceneFrame>
  );
};
