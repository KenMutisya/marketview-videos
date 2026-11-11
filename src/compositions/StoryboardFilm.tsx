import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import type { TransitionPresentation } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import type { Storyboard, TransitionSpec } from "../types/storyboard";
import { sceneFrames, transitionFrames } from "../types/storyboard";
import { renderScene } from "../scenes";
import { dip, maskWipe, push, zoomThrough } from "../transitions/presentations";
import { getBrand } from "../brands";
import { StudioProvider } from "../utils/studio";
import { ensureFonts } from "../utils/fonts";
import { FilmAudio } from "../audio/FilmAudio";
import { Captions } from "../components/Captions";

/**
 * Each presentation carries its own props type; the registry hands back a
 * heterogeneous union, which `TransitionSeries.Transition` cannot infer. The
 * props are already bound by the factory, so erasing them here is safe.
 */
type BoundPresentation = TransitionPresentation<Record<string, never>>;

const presentationFor = (t: TransitionSpec, accent: string): BoundPresentation => {
  const presentation = (() => {
    switch (t.kind) {
      case "dip":
        return dip({ through: t.through ?? "#070C27" });
      case "push":
        return push({ direction: t.direction ?? "left" });
      case "maskWipe":
        return maskWipe({ direction: t.direction ?? "left", edge: accent });
      case "zoomThrough":
        return zoomThrough(0.2);
      case "fade":
      default:
        return fade();
    }
  })();
  return presentation as unknown as BoundPresentation;
};

/**
 * Renders a storyboard.
 *
 * This component is the whole "engine": it knows how to turn scene data into a
 * timeline, how transitions overlap, and nothing else. Every film in the studio
 * — widescreen, vertical, conference loop, teaser — is this component with
 * different data.
 */
export const StoryboardFilm: React.FC<{ storyboard: Storyboard }> = ({ storyboard }) => {
  ensureFonts();
  const { fps, durationInFrames } = useVideoConfig();
  const frame = useCurrentFrame();
  const brand = getBrand(storyboard.brandId);

  /**
   * A loop-safe film fades from and to black over the same short window. The
   * closing scene dimming its own content is not enough: the background field
   * drifts across a scene, so the last frame and the first frame still differ
   * by several percent. Matching both ends to black makes the restart
   * measurably seamless, which `npm run pds -- qa` then verifies.
   */
  const loopSafe = storyboard.scenes.some((s) => s.kind === "closing" && s.loopSafe);
  const seamFrames = Math.round(fps * 0.5);
  const seam = loopSafe
    ? 1 -
      interpolate(
        frame,
        [0, seamFrames, durationInFrames - seamFrames, durationInFrames - 1],
        [1, 0, 0, 1],
        { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.ease) },
      )
    : 1;

  const children: React.ReactNode[] = [];
  storyboard.scenes.forEach((scene, i) => {
    children.push(
      <TransitionSeries.Sequence key={scene.id} durationInFrames={sceneFrames(scene, fps)}>
        {renderScene(scene)}
      </TransitionSeries.Sequence>,
    );
    const t = scene.transitionOut;
    const isLast = i === storyboard.scenes.length - 1;
    if (!isLast && t && t.kind !== "cut") {
      children.push(
        <TransitionSeries.Transition
          key={`${scene.id}-t`}
          presentation={presentationFor(t, brand.colors.logoGreen)}
          timing={linearTiming({
            durationInFrames: transitionFrames(t, fps),
            easing: Easing.bezier(0.45, 0, 0.3, 1),
          })}
        />,
      );
    }
  });

  return (
    <StudioProvider brand={brand} format={storyboard.format} motion={storyboard.motion}>
      <AbsoluteFill
        style={{
          backgroundColor: "#0B1133",
          fontFamily: brand.fontFamily,
          // Screenshots and gradients both benefit; avoids banding on the field.
          WebkitFontSmoothing: "antialiased",
        }}
      >
        <TransitionSeries>{children}</TransitionSeries>
        {/*
          Above the scenes and their transitions, so a caption is not dipped to
          black or pushed off screen while the line it carries is still being
          spoken. Renders nothing for a film with no narration timing.
        */}
        <Captions storyboard={storyboard} />
        {loopSafe ? (
          <AbsoluteFill style={{ background: "#000000", opacity: 1 - seam, pointerEvents: "none" }} />
        ) : null}
        <FilmAudio storyboard={storyboard} />
      </AbsoluteFill>
    </StudioProvider>
  );
};
