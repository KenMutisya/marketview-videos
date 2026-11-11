/**
 * Narration timing.
 *
 * A film's voiceover is synthesised ahead of the render by
 * `scripts/make-narration.ts`, which writes two artefacts per film: a WAV laid
 * out against the film's own timeline, and a **timing sidecar** recording where
 * every line actually landed.
 *
 * The sidecar is the part that matters here. Captions could be timed by
 * estimating how long a line takes to say — words times a constant — but an
 * estimate and a synthesiser disagree by a few hundred milliseconds on almost
 * every line, and a caption that trails its own voiceover is more distracting
 * than no caption at all. So the build measures each synthesised clip and
 * records the frame it was placed on, and the caption layer reads those frames
 * rather than re-deriving them. Audio and text cannot drift apart because
 * neither is computing anything.
 *
 * A film with no sidecar simply renders no captions, which is what every film
 * predating the campaign editions does.
 */
import procurement from "../../public/assets/audio/narration-marketview-procurement-vertical.json";
import expansion from "../../public/assets/audio/narration-marketview-expansion-vertical.json";
import rep from "../../public/assets/audio/narration-marketview-rep-agri-vertical.json";

/** One line, placed on the film's timeline. */
export type NarrationCue = {
  sceneId: string;
  /** Index of the line within its scene. */
  index: number;
  text: string;
  /** Absolute frame in the film at which the line begins. */
  startFrame: number;
  /** Absolute frame at which it ends, from the measured clip length. */
  endFrame: number;
};

export type NarrationTiming = {
  filmId: string;
  storyboardId: string;
  fps: number;
  /** The voice the lines were synthesised with, for the record. */
  voice: string;
  generatedAt: string;
  cues: NarrationCue[];
};

const TIMINGS: Record<string, NarrationTiming> = {
  "marketview-procurement-vertical": procurement as NarrationTiming,
  "marketview-expansion-vertical": expansion as NarrationTiming,
  "marketview-rep-agri-vertical": rep as NarrationTiming,
};

/** Timing for a storyboard, or null when the film has no narration. */
export const getNarrationTiming = (storyboardId: string): NarrationTiming | null =>
  TIMINGS[storyboardId] ?? null;

/**
 * The cue that should be on screen at a given frame.
 *
 * Captions hold until the next line starts rather than disappearing the instant
 * the audio stops, so a short line does not flash. A gap longer than
 * `maxHold` — the end of a thought, a scene with nothing said over it — clears
 * the caption instead of leaving a stale line hanging over the next shot.
 */
export const cueAt = (
  timing: NarrationTiming | null,
  frame: number,
  maxHold: number,
): NarrationCue | null => {
  if (!timing) return null;
  let current: NarrationCue | null = null;
  for (const cue of timing.cues) {
    if (cue.startFrame > frame) break;
    current = cue;
  }
  if (!current) return null;
  if (frame <= current.endFrame) return current;
  return frame - current.endFrame <= maxHold ? current : null;
};
