/**
 * Text stability.
 *
 * Text that sits inside something changing by a fraction of a pixel every
 * frame is re-rasterised every frame, and on a large screen it visibly dances.
 * The defect is close to invisible on a laptop and obvious on a television,
 * which makes it exactly the kind of thing to measure rather than eyeball.
 *
 * The probe takes pairs of consecutive frames at points where a scene should
 * be holding still — past its entrance, before its transition — and reports
 * the mean difference between them. A held frame that differs from its
 * neighbour is a held frame that is moving.
 *
 * Scenes with motion by design register too, so this reports the quietest
 * sampled pair per film: if even the stillest moment in a film is noisy,
 * something is shimmering that should not be.
 */
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import type { Storyboard } from "../../src/types/storyboard";
import { sceneFrames, transitionFrames } from "../../src/types/storyboard";

export type Stability = {
  /** Mean 0–255 difference between the quietest pair of consecutive frames. */
  quietest: number;
  /** Where that pair was sampled. */
  scene: string;
  samples: number;
  threshold: number;
  ok: boolean;
};

const grayFrame = (video: string, atSeconds: number, dir: string, name: string): Buffer => {
  const out = path.join(dir, `${name}.gray`);
  execFileSync("ffmpeg", [
    "-loglevel", "error", "-y",
    "-ss", String(Math.max(0, atSeconds)),
    "-i", video,
    "-frames:v", "1",
    "-vf", "scale=320:-1",
    "-pix_fmt", "gray",
    "-f", "rawvideo",
    out,
  ]);
  return execFileSync("cat", [out]);
};

export const measureStability = (
  storyboard: Storyboard,
  video: string,
  fps: number,
  threshold = 0.35,
): Stability => {
  const dir = mkdtempSync(path.join(tmpdir(), "pds-stab-"));
  try {
    let cursor = 0;
    let quietest = Infinity;
    let scene = "";
    let samples = 0;

    storyboard.scenes.forEach((s, i) => {
      const len = sceneFrames(s, fps);
      // 80% through the scene: past every entrance, before the transition.
      const hold = cursor + Math.round(len * 0.8);
      const a = grayFrame(video, hold / fps, dir, `a${i}`);
      const b = grayFrame(video, (hold + 1) / fps, dir, `b${i}`);
      const n = Math.min(a.length, b.length);
      if (n > 0) {
        let sum = 0;
        for (let k = 0; k < n; k += 1) sum += Math.abs(a[k] - b[k]);
        const mean = sum / n;
        samples += 1;
        if (mean < quietest) {
          quietest = mean;
          scene = s.id;
        }
      }
      cursor += len;
      if (i < storyboard.scenes.length - 1) cursor -= transitionFrames(s.transitionOut, fps);
    });

    return {
      quietest: quietest === Infinity ? 0 : quietest,
      scene,
      samples,
      threshold,
      ok: quietest === Infinity ? true : quietest <= threshold,
    };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
};
