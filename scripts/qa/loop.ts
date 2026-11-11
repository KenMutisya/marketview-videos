/**
 * Loop-seam measurement.
 *
 * A conference loop is only seamless if its last frame and its first frame are
 * close enough that the restart is not a visible cut. This measures that
 * directly rather than taking the storyboard's word for it: both frames are
 * extracted, downscaled, and compared as a mean absolute difference per
 * channel, reported as a percentage of full scale.
 */
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

export type LoopSeam = {
  /** Mean absolute pixel difference, 0 (identical) to 100 (inverted). */
  differencePercent: number;
  /** Below this the join reads as continuous at normal playback speed. */
  threshold: number;
  ok: boolean;
};

/** Reads a tiny raw RGB frame so the comparison needs no image library. */
const rawFrame = (video: string, atSeconds: number, dir: string, name: string): Buffer => {
  const out = path.join(dir, `${name}.rgb`);
  execFileSync("ffmpeg", [
    "-loglevel",
    "error",
    "-y",
    "-ss",
    String(Math.max(0, atSeconds)),
    "-i",
    video,
    "-frames:v",
    "1",
    "-vf",
    "scale=64:36",
    "-pix_fmt",
    "rgb24",
    "-f",
    "rawvideo",
    out,
  ]);
  return readFileSync(out);
};

export const measureLoopSeam = (
  video: string,
  durationSeconds: number,
  fps: number,
  threshold = 6,
): LoopSeam => {
  const dir = mkdtempSync(path.join(tmpdir(), "pds-loop-"));
  try {
    const first = rawFrame(video, 0, dir, "first");
    const last = rawFrame(video, durationSeconds - 1.5 / fps, dir, "last");
    const n = Math.min(first.length, last.length);
    let sum = 0;
    for (let i = 0; i < n; i += 1) sum += Math.abs(first[i] - last[i]);
    const differencePercent = (sum / n / 255) * 100;
    return {
      differencePercent,
      threshold,
      ok: differencePercent <= threshold,
    };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
};
