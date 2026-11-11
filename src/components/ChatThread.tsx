import React from "react";
import { Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import type { ChatBeat, ChatCard } from "../utils/transcripts";
import { EASE_OUT, reveal } from "../motion/timing";
import { snap } from "../utils/pixels";
import { useBrand, useMotion } from "../utils/studio";

/**
 * A messaging thread, drawn natively.
 *
 * The conversation is replayed from a captured transcript rather than shown as
 * a screen recording. The words are the real ones the Rep produced; drawing
 * them means the film can be rendered at any resolution, the bubbles can
 * arrive with real motion, and a reply the model happened to give on one run
 * is reproduced identically on every render.
 *
 * Styling follows the conventions of consumer messaging — pale thread, white
 * inbound bubbles, tinted outbound ones — without copying any one product's
 * iconography or wordmark.
 */

const THREAD_BG = "#EDE4DB";
const INBOUND = "#FFFFFF";
const OUTBOUND = "#D6F2C7";

type Scale = {
  /** Base font size for message text. */
  text: number;
  pad: number;
  radius: number;
  gap: number;
};

const Bubble: React.FC<{
  side: "in" | "out";
  s: Scale;
  progress: number;
  children: React.ReactNode;
  time?: string;
}> = ({ side, s, progress, children, time }) => {
  const brand = useBrand();
  /**
   * maxHeight is animated rather than opacity alone: it makes the stack above
   * push up as the bubble unfurls, which is what a real thread does. The value
   * clamps at the bubble's natural height, so the number only needs to be
   * larger than any bubble.
   *
   * Two details keep the thread from shimmering. The height is rounded to a
   * whole pixel, and once the bubble has landed the constraint is removed
   * altogether — a bottom-anchored column whose children are still being
   * measured against a fractional maxHeight re-lays-out every line of text on
   * every frame.
   */
  const landed = progress >= 0.999;
  const grow = snap(interpolate(progress, [0, 1], [0, 1600], { extrapolateRight: "clamp" }));
  return (
    <div
      style={{
        overflow: landed ? "visible" : "hidden",
        maxHeight: landed ? undefined : grow,
        display: "flex",
        flexShrink: 0,
        justifyContent: side === "out" ? "flex-end" : "flex-start",
        paddingBottom: s.gap,
      }}
    >
      <div
        style={{
          maxWidth: "84%",
          background: side === "out" ? OUTBOUND : INBOUND,
          borderRadius: s.radius,
          [side === "out" ? "borderBottomRightRadius" : "borderBottomLeftRadius"]: s.radius * 0.28,
          padding: `${s.pad * 0.78}px ${s.pad}px ${s.pad * 0.52}px`,
          boxShadow: "0 1px 1px rgba(11,20,26,0.13)",
          fontFamily: brand.fontFamily,
          fontSize: s.text,
          lineHeight: 1.42,
          color: "#111B21",
          opacity: Math.min(1, progress * 1.6),
          transform: landed ? "none" : `translate3d(0, ${snap((1 - progress) * 10)}px, 0)`,
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
        }}
      >
        {children}
        {time ? (
          <div
            style={{
              fontSize: s.text * 0.62,
              color: "#667781",
              textAlign: "right",
              marginTop: s.pad * 0.22,
            }}
          >
            {time}
          </div>
        ) : null}
      </div>
    </div>
  );
};

/** A seller listing the Rep returned, drawn as a card instead of a wall of text. */
const ListingCard: React.FC<{ card: ChatCard; s: Scale }> = ({ card, s }) => {
  const brand = useBrand();
  return (
    <div
      style={{
        marginTop: s.pad * 0.5,
        borderRadius: s.radius * 0.5,
        border: `1px solid ${brand.colors.border}`,
        background: "#F7FAF8",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: s.pad * 0.4,
          padding: `${s.pad * 0.42}px ${s.pad * 0.6}px`,
          background: "#EAF4EE",
          borderBottom: `1px solid ${brand.colors.border}`,
        }}
      >
        {card.heading ? (
          <span style={{ fontSize: s.text * 0.78, fontWeight: 700, color: brand.colors.accentDeep }}>
            {card.heading}
          </span>
        ) : null}
      </div>
      <div style={{ padding: `${s.pad * 0.55}px ${s.pad * 0.6}px` }}>
        {card.detail.slice(0, 3).map((line, i) => (
          <div
            key={i}
            style={{
              fontSize: s.text * 0.84,
              color: i === 0 ? "#111B21" : "#49636F",
              fontWeight: i === 0 ? 650 : 450,
              lineHeight: 1.4,
            }}
          >
            {line}
          </div>
        ))}
        {card.price ? (
          <div
            style={{
              marginTop: s.pad * 0.4,
              fontSize: s.text * 1.04,
              fontWeight: 800,
              color: brand.colors.logoNavy,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {card.price}
          </div>
        ) : null}
      </div>
    </div>
  );
};

/** Three dots, the universal "the other side is answering". */
const Typing: React.FC<{ s: Scale; progress: number }> = ({ s, progress }) => {
  const frame = useCurrentFrame();
  return (
    <div
      style={{
        overflow: "hidden",
        maxHeight: snap(interpolate(progress, [0, 1], [0, 200], { extrapolateRight: "clamp" })),
        display: "flex",
        flexShrink: 0,
        paddingBottom: s.gap,
      }}
    >
      <div
        style={{
          background: INBOUND,
          borderRadius: s.radius,
          borderBottomLeftRadius: s.radius * 0.28,
          padding: `${s.pad * 0.72}px ${s.pad * 0.9}px`,
          display: "flex",
          gap: s.pad * 0.28,
          alignItems: "center",
          boxShadow: "0 1px 1px rgba(11,20,26,0.13)",
          opacity: progress,
        }}
      >
        {[0, 1, 2].map((i) => {
          // Deterministic: the bounce is a function of the frame, not a CSS
          // animation, so every render produces the same dots.
          const t = ((frame - i * 4) % 30) / 30;
          const lift = Math.sin(Math.max(0, Math.min(1, t * 2)) * Math.PI);
          return (
            <span
              key={i}
              style={{
                width: s.text * 0.42,
                height: s.text * 0.42,
                borderRadius: "50%",
                background: "#8FA0A8",
                transform: `translateY(${(-lift * s.text * 0.22).toFixed(2)}px)`,
                opacity: 0.55 + lift * 0.45,
              }}
            />
          );
        })}
      </div>
    </div>
  );
};

/** Quick replies the Rep offered with a message. */
const QuickReplies: React.FC<{ labels: string[]; s: Scale; progress: number }> = ({
  labels,
  s,
  progress,
}) => {
  const brand = useBrand();
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        flexShrink: 0,
        gap: s.pad * 0.36,
        paddingBottom: s.gap,
        opacity: progress,
        maxHeight:
          progress >= 0.999
            ? undefined
            : snap(interpolate(progress, [0, 1], [0, 400], { extrapolateRight: "clamp" })),
        overflow: progress >= 0.999 ? "visible" : "hidden",
      }}
    >
      {labels.map((label) => (
        <span
          key={label}
          style={{
            fontFamily: brand.fontFamily,
            fontSize: s.text * 0.84,
            fontWeight: 600,
            color: "#1B8755",
            background: INBOUND,
            border: `1px solid rgba(27,135,85,0.22)`,
            borderRadius: 999,
            padding: `${s.pad * 0.36}px ${s.pad * 0.7}px`,
            boxShadow: "0 1px 1px rgba(11,20,26,0.10)",
          }}
        >
          {label}
        </span>
      ))}
    </div>
  );
};

export type ChatThreadProps = {
  beats: ChatBeat[];
  width: number;
  height: number;
  contactName: string;
  contactSubtitle: string;
  /** Scales every dimension; 1 = designed for a ~430px-wide screen. */
  uiScale?: number;
};

export const ChatThread: React.FC<ChatThreadProps> = ({
  beats,
  width,
  height,
  contactName,
  contactSubtitle,
  uiScale = 1,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const brand = useBrand();
  const motion = useMotion();

  const s: Scale = {
    text: 17 * uiScale,
    pad: 14 * uiScale,
    radius: 15 * uiScale,
    gap: 8 * uiScale,
  };
  const headerH = 74 * uiScale;
  const inputH = 64 * uiScale;
  // Clearance for the camera cut-out the phone frame draws over the screen.
  // Without it the app header sits under the sensor housing, exactly as a real
  // app would if it ignored the safe-area inset.
  const statusH = 58 * uiScale;

  return (
    <div style={{ width, height, position: "relative", background: THREAD_BG, overflow: "hidden" }}>
      {/* Status bar: empty, but it reserves the sensor-housing inset. */}
      <div style={{ height: statusH, background: "#115E4A" }} />

      {/* Header */}
      <div
        style={{
          height: headerH,
          background: "#115E4A",
          display: "flex",
          alignItems: "flex-end",
          gap: s.pad * 0.7,
          padding: `0 ${s.pad}px ${s.pad * 0.6}px`,
          color: "#FFFFFF",
          position: "relative",
          zIndex: 3,
        }}
      >
        <div
          style={{
            width: 40 * uiScale,
            height: 40 * uiScale,
            borderRadius: "50%",
            background: "#FFFFFF",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
            flexShrink: 0,
          }}
        >
          <Img
            src={staticFile(brand.logo.mark)}
            style={{ width: "72%", height: "72%", objectFit: "contain" }}
          />
        </div>
        <div style={{ lineHeight: 1.2 }}>
          <div style={{ fontFamily: brand.fontFamily, fontSize: s.text * 1.02, fontWeight: 650 }}>
            {contactName}
          </div>
          <div
            style={{
              fontFamily: brand.fontFamily,
              fontSize: s.text * 0.72,
              opacity: 0.74,
            }}
          >
            {contactSubtitle}
          </div>
        </div>
      </div>

      {/* Thread. Bottom-anchored: the newest message sits above the composer
          and older ones are pushed off the top, exactly as a real thread does. */}
      <div
        style={{
          position: "absolute",
          top: headerH + statusH,
          bottom: inputH,
          left: 0,
          right: 0,
          padding: `${s.pad}px ${s.pad * 0.85}px 0`,
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          overflow: "hidden",
          // Older messages scroll off the top as the thread fills. A hard clip
          // leaves bubbles sliced in half; a mask lets them dissolve out, which
          // is what the eye expects at the edge of a scrolling surface.
          maskImage: `linear-gradient(to bottom, transparent 0, rgba(0,0,0,0.25) ${s.pad * 1.2}px, #000 ${s.pad * 4}px)`,
          WebkitMaskImage: `linear-gradient(to bottom, transparent 0, rgba(0,0,0,0.25) ${s.pad * 1.2}px, #000 ${s.pad * 4}px)`,
        }}
      >
        {beats.map((beat) => {
          const typingActive =
            beat.typingAt !== null && frame >= beat.typingAt && frame < beat.at;
          const typingP =
            beat.typingAt === null
              ? 0
              : interpolate(frame, [beat.typingAt, beat.typingAt + 5], [0, 1], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                  easing: EASE_OUT,
                });
          const p = reveal({ frame, fps, delay: beat.at, motion, accent: true });
          if (p <= 0.001 && !typingActive) return null;

          if (typingActive) {
            return <Typing key={`t${beat.index}`} s={s} progress={typingP} />;
          }

          const { turn } = beat;
          return (
            <React.Fragment key={beat.index}>
              <Bubble side={turn.role === "user" ? "out" : "in"} s={s} progress={p} time={turn.time}>
                {turn.cards.length > 0 ? (
                  <>
                    <span style={{ fontWeight: 650 }}>{turn.text}</span>
                    {turn.cards.slice(0, 2).map((card, i) => (
                      <ListingCard key={i} card={card} s={s} />
                    ))}
                  </>
                ) : (
                  turn.text
                )}
              </Bubble>
              {turn.buttons.length > 0 ? (
                <QuickReplies labels={turn.buttons} s={s} progress={p} />
              ) : null}
            </React.Fragment>
          );
        })}
      </div>

      {/* Composer */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: inputH,
          background: THREAD_BG,
          display: "flex",
          alignItems: "center",
          gap: s.pad * 0.5,
          padding: `0 ${s.pad * 0.7}px`,
        }}
      >
        <div
          style={{
            flex: 1,
            height: inputH * 0.68,
            borderRadius: 999,
            background: "#FFFFFF",
            display: "flex",
            alignItems: "center",
            paddingLeft: s.pad * 0.9,
            fontFamily: brand.fontFamily,
            fontSize: s.text * 0.94,
            color: "#8696A0",
          }}
        >
          Message
        </div>
        <div
          style={{
            width: inputH * 0.68,
            height: inputH * 0.68,
            borderRadius: "50%",
            background: "#18A860",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#FFFFFF",
            fontSize: s.text,
          }}
        >
          ➤
        </div>
      </div>
    </div>
  );
};
