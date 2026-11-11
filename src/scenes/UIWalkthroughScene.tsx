import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import type { Scene } from "../types/storyboard";
import { SceneFrame } from "./SceneFrame";
import { BrowserFrame } from "../components/BrowserFrame";
import { UIShot } from "../components/UIShot";
import { Cursor } from "../components/Cursor";
import type { CursorKeyframe } from "../components/Cursor";
import { Eyebrow } from "../typography/Text";
import { EASE_IN_OUT, reveal, revealWindow } from "../motion/timing";
import { snap } from "../utils/pixels";
import { uiFrameSize } from "../utils/captures";
import { useBrand, useFormat, useMotion, useSafeBox } from "../utils/studio";

type Props = Extract<Scene, { kind: "uiWalkthrough" }>;

const toneColor = (tone: string, brand: ReturnType<typeof useBrand>) => {
  switch (tone) {
    case "good":
      return brand.colors.good;
    case "warn":
      return brand.colors.warn;
    case "bad":
      return brand.colors.bad;
    default:
      return brand.colors.primary;
  }
};

/**
 * A guided move through the real product.
 *
 * The camera does not fly around the screenshot; it reframes *inside* it. The
 * scene declares where it starts looking and where it ends up, the cursor is
 * choreographed against the same coordinate space, and callouts are pinned to
 * the frame rather than floating in the composition.
 */
export const UIWalkthroughScene: React.FC<{ scene: Props }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const format = useFormat();
  const brand = useBrand();
  const motion = useMotion();
  const safe = useSafeBox();

  const size = uiFrameSize(format);
  const chrome = Math.round(46 * (format.width / 1920));
  // A full desktop dashboard at portrait width is unreadable on a phone, so the
  // vertical edition opens on a wider view of the *target* region rather than
  // on the whole window, and pushes in from there.
  const column = format.uiPresentation === "column";
  const tightFraming = column || format.uiPresentation === "billboard";
  const openFraming =
    tightFraming && scene.to
      ? { ...scene.to, pad: (scene.to.pad ?? 0) + (column ? 0.6 : 0.85) }
      : scene.from;

  const enter = reveal({ frame, fps, delay: 0, motion });
  /**
   * The window arrives and then holds still.
   *
   * It used to carry a slow `scale()` for the whole shot. Callouts are rendered
   * inside the window so they travel with it, which meant their text sat in a
   * fractional transform on every frame and shimmered on a large screen. The
   * shot still breathes — the push now happens inside `<UIShot>`, on the
   * screenshot itself, which has no glyphs to re-rasterise.
   */
  const windowSettled = enter >= 0.999;
  const imageDrift = motion.cameraZoom * 0.5;

  const moveWindow: [number, number] = scene.move
    ? [Math.round(scene.move[0] * fps), Math.round(scene.move[1] * fps)]
    : [0, durationInFrames];

  const swapAt = scene.thenAt === undefined ? null : Math.round(scene.thenAt * fps);
  const swapP =
    swapAt === null
      ? 0
      : interpolate(frame, [swapAt, swapAt + Math.round(fps * 0.33)], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: EASE_IN_OUT,
        });

  const cursorPath: CursorKeyframe[] = scene.cursor.map((c) => ({
    frame: Math.round(c.at * fps),
    x: c.x * size.width,
    y: c.y * size.height + chrome,
    click: c.click,
  }));

  return (
    <SceneFrame
      field={scene.field}
      spotlight={
        scene.field === "light"
          ? undefined
          : { x: 0.5, y: 0.42, radius: 0.9, intensity: 0.2 }
      }
      bleed
    >
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <div
          style={{
            opacity: enter,
            transform: windowSettled
              ? "none"
              : `translate3d(0, ${snap((1 - enter) * 40)}px, 0)`,
            willChange: windowSettled ? "auto" : "transform, opacity",
          }}
        >
          <BrowserFrame
            width={size.width}
            height={size.height}
            url={scene.url}
            scale={format.width / 1920}
            elevation={scene.field === "light" ? 0.9 : 1.2}
          >
            <UIShot
              capture={scene.capture}
              width={size.width}
              height={size.height}
              from={openFraming}
              to={scene.to}
              window={moveWindow}
              drift={imageDrift}
            />
            {scene.thenCapture && swapP > 0 ? (
              <div style={{ position: "absolute", inset: 0, opacity: swapP }}>
                <UIShot
                  capture={scene.thenCapture}
                  width={size.width}
                  height={size.height}
                  from={scene.to ?? openFraming}
                />
              </div>
            ) : null}

            {/* Callouts live inside the window so they travel with it. */}
            {scene.callouts.map((c, i) => {
              const at = Math.round(c.at * fps);
              const until = c.until === undefined ? undefined : Math.round(c.until * fps);
              const p =
                until === undefined
                  ? reveal({ frame, fps, delay: at, motion, accent: true })
                  : revealWindow({ frame, fps, delay: at, motion, accent: true, out: until });
              if (p <= 0.001) return null;
              const color = toneColor(c.tone, brand);
              return (
                <div
                  key={i}
                  style={{
                    position: "absolute",
                    left: c.x * size.width,
                    top: c.y * size.height + chrome,
                    transform: `translate3d(-50%, -50%, 0) scale(${(0.9 + 0.1 * p).toFixed(3)})`,
                    opacity: p,
                    background: "#FFFFFF",
                    color: brand.colors.ink,
                    fontFamily: brand.fontFamily,
                    fontSize: format.type.meta * 1.08,
                    fontWeight: 650,
                    padding: `${format.type.meta * 0.52}px ${format.type.meta * 0.9}px`,
                    borderRadius: brand.radius.md,
                    borderLeft: `4px solid ${color}`,
                    boxShadow: "0 10px 30px rgba(13,20,55,0.18), 0 2px 6px rgba(13,20,55,0.10)",
                    whiteSpace: "nowrap",
                  }}
                >
                  {c.text}
                </div>
              );
            })}

            {cursorPath.length > 0 ? (
              <Cursor
                path={cursorPath}
                size={format.width / 1920 * 34}
                appearAt={cursorPath[0].frame - 8}
                leaveAt={cursorPath[cursorPath.length - 1].frame + Math.round(fps * 0.9)}
              />
            ) : null}
          </BrowserFrame>
        </div>
      </AbsoluteFill>

      {scene.caption ? (
        <AbsoluteFill
          style={{
            left: safe.left,
            top: safe.top,
            width: safe.width,
            height: safe.height,
            alignItems: "flex-start",
            justifyContent: "flex-start",
          }}
        >
          <Eyebrow
            delay={Math.round(scene.captionAt * fps)}
            tone={scene.field === "light" ? "onLight" : "onDark"}
            color={scene.field === "light" ? brand.colors.primary : undefined}
            style={
              column
                ? { fontSize: format.type.head * 0.62, letterSpacing: format.type.head * 0.05 }
                : undefined
            }
          >
            {scene.caption}
          </Eyebrow>
        </AbsoluteFill>
      ) : null}
    </SceneFrame>
  );
};
