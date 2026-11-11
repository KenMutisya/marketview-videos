import React from "react";
import { Audio, Sequence, interpolate, staticFile, useVideoConfig } from "remotion";
import type { Scene, Storyboard } from "../types/storyboard";
import { sceneFrames, transitionFrames } from "../types/storyboard";

/** Absolute start frame of every scene, accounting for transition overlap. */
export const sceneStarts = (storyboard: Storyboard, fps: number): number[] => {
  const starts: number[] = [];
  let cursor = 0;
  storyboard.scenes.forEach((scene, i) => {
    starts.push(cursor);
    cursor += sceneFrames(scene, fps);
    if (i < storyboard.scenes.length - 1) {
      cursor -= transitionFrames(scene.transitionOut, fps);
    }
  });
  return starts;
};

type Cue = { at: number; file: string; gain: number };

/**
 * Derives the sound cues from the storyboard rather than listing them by hand,
 * so re-timing a scene re-times its sound with it.
 */
const collectCues = (storyboard: Storyboard, fps: number): Cue[] => {
  const starts = sceneStarts(storyboard, fps);
  const cues: Cue[] = [];

  storyboard.scenes.forEach((scene: Scene, i) => {
    const start = starts[i];

    // A short sweep carries every non-cut boundary.
    if (i > 0) {
      const prev = storyboard.scenes[i - 1].transitionOut;
      if (prev && prev.kind !== "cut") {
        cues.push({ at: Math.max(0, start - Math.round(fps * 0.18)), file: "cue-whoosh.wav", gain: 0.3 });
      }
    }

    if (scene.kind === "brandReveal") {
      cues.push({ at: start, file: "cue-riser.wav", gain: 0.42 });
      cues.push({
        at: start + Math.round(scene.uiAt * fps),
        file: "cue-confirm.wav",
        gain: 0.3,
      });
    }

    if (scene.kind === "uiWalkthrough") {
      for (const stop of scene.cursor) {
        if (!stop.click) continue;
        cues.push({ at: start + Math.round(stop.at * fps), file: "cue-tick.wav", gain: 0.38 });
      }
      for (const callout of scene.callouts) {
        cues.push({ at: start + Math.round(callout.at * fps), file: "cue-tick.wav", gain: 0.22 });
      }
    }

    if (scene.kind === "apiBeat") {
      cues.push({
        at: start + Math.round(scene.responseAt * fps),
        file: "cue-confirm.wav",
        gain: 0.34,
      });
    }

    if (scene.kind === "closing") {
      cues.push({ at: start + Math.round(fps * 0.1), file: "cue-confirm.wav", gain: 0.36 });
    }
  });

  return cues;
};

/**
 * The film's sound.
 *
 * Music sits under everything with a fade at both ends; cues are placed against
 * picture events. A silent edition (conference loop) renders nothing at all
 * rather than muting, so the output genuinely carries no audio stream.
 */
export const FilmAudio: React.FC<{ storyboard: Storyboard }> = ({ storyboard }) => {
  const { fps, durationInFrames } = useVideoConfig();
  const audio = storyboard.audio;
  if (audio.silent) return null;

  const fadeIn = Math.round(fps * 0.8);
  const fadeOut = Math.round(fps * 1.6);
  const cues = audio.cues ? collectCues(storyboard, fps) : [];

  return (
    <>
      {audio.music ? (
        <Audio
          src={staticFile(audio.music)}
          trimBefore={Math.round(audio.musicFrom * fps)}
          volume={(f) =>
            audio.musicGain *
            interpolate(
              f,
              [0, fadeIn, durationInFrames - fadeOut, durationInFrames],
              [0, 1, 1, 0],
              { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
            ) *
            // Duck under narration when there is any.
            (audio.narration ? 0.45 : 1)
          }
        />
      ) : null}

      {audio.narration ? (
        <Audio src={staticFile(audio.narration)} volume={audio.narrationGain} />
      ) : null}

      {cues.map((cue, i) => (
        <Sequence key={`${cue.file}-${i}`} from={cue.at} layout="none">
          <Audio src={staticFile(`assets/audio/${cue.file}`)} volume={cue.gain} />
        </Sequence>
      ))}
    </>
  );
};
