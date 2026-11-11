import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import type { Scene } from "../types/storyboard";
import { SceneFrame } from "./SceneFrame";
import { PhoneFrame } from "../components/PhoneFrame";
import { ChatThread } from "../components/ChatThread";
import { Chip } from "../components/Brand";
import { Eyebrow, KineticHeadline } from "../typography/Text";
import { NetworkField } from "../effects/Surfaces";
import { reveal } from "../motion/timing";
import { snap } from "../utils/pixels";
import { fitSize } from "../typography/fit";
import { buildChatTimeline, getTranscript } from "../utils/transcripts";
import { useBrand, useFormat, useMotion, useSafeBox } from "../utils/studio";

type Props = Extract<Scene, { kind: "chatDemo" }>;

/** Aspect ratio of the drawn handset's screen. */
const PHONE_ASPECT = 9 / 19.5;

/**
 * Outer device height as a multiple of screen height. `PhoneFrame` pads the
 * screen by `screenWidth * 0.028` on every side, so sizing the handset by its
 * screen alone makes it taller than intended — enough that at 4:3 it reads as
 * cramped against the top and bottom of the frame.
 */
const PHONE_OUTER = 1 + 2 * 0.028 * PHONE_ASPECT;

/** Share of the canvas height the whole device may occupy in a landscape cut. */
const PHONE_HEIGHT_SHARE = 0.84;

/**
 * The conversation scene.
 *
 * A phone holds the thread; the film's own typography sits around it. The
 * phone is given a very slow push and a few degrees of tilt so it reads as an
 * object in a space rather than a rectangle pasted on a background — but the
 * screen stays square to camera, because the point of the shot is that the
 * words are legible.
 *
 * Two compositions, because a 9:16 object in a 16:9 frame is not the same
 * problem as a 9:16 object in a 9:16 frame:
 *
 * - **Portrait** stacks the headline above the phone and lets the handset fill
 *   most of the height.
 * - **Landscape** puts type and phone side by side. Stacking here would leave
 *   a narrow handset marooned in a very wide frame with nothing either side of
 *   it, which is the "shrink it to fit" failure a recomposition exists to
 *   avoid.
 */
export const ChatDemoScene: React.FC<{ scene: Props }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const format = useFormat();
  const brand = useBrand();
  const motion = useMotion();
  const safe = useSafeBox();

  const transcript = getTranscript(scene.transcript);
  // Turns before `fromTurn` are drawn already settled, so a second scene on the
  // same conversation continues the thread instead of starting from an empty
  // screen the viewer has already watched fill up.
  const settled = transcript.turns.slice(0, scene.fromTurn);
  const turns = transcript.turns.slice(scene.fromTurn, scene.toTurn);

  const stacked = format.uiPresentation === "column";
  const onDark = scene.field !== "light";
  const tone = onDark ? "onDark" : "onLight";
  const headlineLines = scene.headline ?? [];

  // --- Layout ---------------------------------------------------------
  const gap = format.type.body * 2;
  const textW = stacked ? safe.width : safe.width * 0.44;

  const headlineH = headlineLines.length
    ? format.type.title * 1.16 * headlineLines.length + format.type.body
    : 0;

  const screenH = stacked
    ? Math.min((safe.height - headlineH) * 0.9, format.height * 0.615)
    : // Landscape sizes the device, not the screen, so 16:9 and 4:3 get an
      // identically sized handset with the same breathing room.
      Math.min(safe.height * 0.96, (format.height * PHONE_HEIGHT_SHARE) / PHONE_OUTER);
  const screenW = screenH * PHONE_ASPECT;
  // Portrait renders the chat at roughly true phone scale. Landscape gives the
  // phone only ~22% of the frame width, so at true scale the text reads much
  // smaller on screen than it would in the hand; the UI is scaled up to
  // compensate, showing fewer messages but legible ones.
  const uiScale = screenW / (stacked ? 430 : 352);

  const headlineSize = fitSize(headlineLines, textW, format.type.title);

  // --- Motion ---------------------------------------------------------
  const enter = reveal({ frame, fps, delay: 0, motion });

  /**
   * The handset settles and then stops dead.
   *
   * It used to carry a slow push and a few degrees of 3D rotation for the whole
   * scene. Every chat bubble lives inside that transform, so every glyph was
   * re-rasterised on every frame and the text visibly danced on a television.
   * The scene has all the life it needs from messages arriving; once the phone
   * has landed it is pinned to an identity transform.
   */
  const phoneSettled = enter >= 0.999;

  // The conversation starts once the phone has arrived.
  const chatStart = Math.round(fps * 0.5);
  const { beats } = buildChatTimeline(turns, fps, {
    pace: scene.pace,
    startFrame: chatStart,
  });
  const settledBeats = settled.map((turn, i) => ({
    turn,
    index: i - settled.length,
    at: -9999,
    typingAt: null,
  }));
  const allBeats = [...settledBeats, ...beats];

  const phone = (
    <div
      style={{
        opacity: enter,
        transform: phoneSettled
          ? "none"
          : [
              `translate3d(0, ${snap((1 - enter) * 80)}px, 0)`,
              `scale(${(0.97 + enter * 0.03).toFixed(4)})`,
              `rotateY(${((stacked ? 2.6 : -4.2) * (1 - enter)).toFixed(2)}deg)`,
              `rotateX(${(1.6 * (1 - enter)).toFixed(2)}deg)`,
            ].join(" "),
        transformOrigin: "center center",
        willChange: phoneSettled ? "auto" : "transform, opacity",
      }}
    >
      <PhoneFrame screenWidth={screenW} screenHeight={screenH} elevation={1.25}>
        <ChatThread
          beats={allBeats}
          width={screenW}
          height={screenH}
          contactName={scene.contactName}
          contactSubtitle={scene.contactSubtitle}
          uiScale={uiScale}
        />
      </PhoneFrame>
    </div>
  );

  const copy = (
    <div
      style={{
        width: textW,
        display: "flex",
        flexDirection: "column",
        alignItems: stacked ? "center" : "flex-start",
        textAlign: stacked ? "center" : "left",
        justifyContent: stacked ? "flex-start" : "center",
        height: stacked ? undefined : "100%",
      }}
    >
      {scene.eyebrow ? (
        <Eyebrow delay={2} tone={tone} style={{ marginBottom: format.type.meta * 0.9 }}>
          {scene.eyebrow}
        </Eyebrow>
      ) : null}

      {headlineLines.length ? (
        <KineticHeadline
          lines={headlineLines}
          delay={6}
          tone={tone}
          align={stacked ? "center" : "left"}
          size={headlineSize}
          emphasise={["WhatsApp.", "answers."]}
          accentColor={brand.colors.logoGreen}
        />
      ) : null}

      {scene.caption ? (
        <Eyebrow
          delay={Math.round(fps * 0.6)}
          tone={tone}
          style={{ marginTop: format.type.body }}
        >
          {scene.caption}
        </Eyebrow>
      ) : null}

      {/* In landscape the disclosure belongs with the copy; in portrait it
          sits under the phone, clear of the device. */}
      {scene.disclosure && !stacked ? (
        <Chip delay={Math.round(fps * 1.2)} tone={tone} style={{ marginTop: format.type.body * 1.6 }}>
          {scene.disclosure}
        </Chip>
      ) : null}
    </div>
  );

  return (
    <SceneFrame
      field={scene.field}
      background={onDark ? <NetworkField opacity={0.22} seed="chat" buildFrames={70} /> : null}
      spotlight={onDark ? { x: stacked ? 0.5 : 0.68, y: 0.42, radius: 0.9, intensity: 0.24 } : undefined}
      bleed
    >
      <AbsoluteFill
        style={{
          left: safe.left,
          top: safe.top,
          width: safe.width,
          height: safe.height,
          display: "flex",
          flexDirection: stacked ? "column" : "row",
          alignItems: "center",
          gap: stacked ? 0 : gap,
          perspective: 2600,
        }}
      >
        {copy}
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginTop: stacked ? format.type.body * 0.6 : 0,
          }}
        >
          {phone}
        </div>
      </AbsoluteFill>

      {scene.disclosure && stacked ? (
        <AbsoluteFill
          style={{
            left: safe.left,
            top: safe.top + safe.height - format.type.meta * 3.2,
            width: safe.width,
            alignItems: "center",
          }}
        >
          <Chip delay={Math.round(fps * 1.2)} tone={tone}>
            {scene.disclosure}
          </Chip>
        </AbsoluteFill>
      ) : null}
    </SceneFrame>
  );
};
