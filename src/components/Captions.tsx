import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import type { Storyboard } from "../types/storyboard";
import { cueAt, getNarrationTiming } from "../utils/narration";
import { useBrand, useFormat } from "../utils/studio";
import { snap } from "../utils/pixels";

/**
 * Burned-in captions.
 *
 * The campaign films are made for WhatsApp status and a LinkedIn feed, where
 * sound is off by default and a viewer decides in about a second whether to
 * keep watching. A film whose argument lives only in its voiceover is a silent
 * film to most of the people who see it, so the voiceover is burned in rather
 * than offered as a sidecar track that no feed player would load anyway.
 *
 * ## Why this sits above every scene
 *
 * Captions are a property of the film, not of a scene. Rendering them inside
 * each scene would put them under the next scene's transition — a caption would
 * dip to black with the picture mid-sentence, and a push would slide the words
 * off the screen while they were still being spoken. Drawn here, over the
 * whole `TransitionSeries`, the caption stays put while the picture changes
 * underneath it, which is what a viewer expects and what every player does.
 *
 * ## The band
 *
 * The caption sits in its own soft slab rather than directly on the picture.
 * White text on an unknown frame is a gamble — these films cut between a near
 * black statement field and a white product screenshot, and text that is
 * legible on one is invisible on the other. The slab makes legibility a
 * property of the caption instead of a property of whatever is behind it.
 *
 * It is placed above the bottom safe area, not against the bottom edge, because
 * both target surfaces draw their own chrome there: WhatsApp status puts a
 * reply affordance across the bottom of the frame and LinkedIn overlays its
 * own controls.
 */
export const Captions: React.FC<{ storyboard: Storyboard }> = ({ storyboard }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const format = useFormat();
  const brand = useBrand();

  const timing = getNarrationTiming(storyboard.id);
  // Hold a finished line for up to a beat so short lines do not flash, but
  // never long enough to sit over the following scene in silence.
  const cue = cueAt(timing, frame, Math.round(fps * 0.45));
  if (!cue) return null;

  const since = frame - cue.startFrame;
  const until = cue.endFrame - frame;
  // A short fade at both ends. Captions do not animate beyond this: words that
  // slide or scale while being read cost legibility and buy nothing.
  const fadeFrames = Math.max(1, Math.round(fps * 0.12));
  const opacity = Math.max(
    0,
    Math.min(1, Math.min(since / fadeFrames, (until + fadeFrames) / fadeFrames)),
  );

  const size = format.type.body * 0.96;

  return (
    <AbsoluteFill
      style={{
        justifyContent: "flex-end",
        alignItems: "center",
        paddingLeft: format.safe.left,
        paddingRight: format.safe.right,
        paddingBottom: format.safe.bottom * 0.52,
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          maxWidth: format.width * 0.88,
          background: "rgba(8, 12, 34, 0.80)",
          borderRadius: brand.radius.md,
          padding: `${snap(size * 0.52)}px ${snap(size * 0.82)}px`,
          opacity,
          // No transform: a caption that moves by a fraction of a pixel per
          // frame is re-rasterised every frame and reads as shimmering text on
          // a large screen. See the note on held text in the README.
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontFamily: brand.fontFamily,
            fontSize: size,
            fontWeight: 600,
            lineHeight: 1.32,
            letterSpacing: 0.1,
            color: "#FFFFFF",
            textWrap: "balance",
          }}
        >
          {cue.text}
        </div>
      </div>
    </AbsoluteFill>
  );
};
