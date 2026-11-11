/** Builds a contact sheet for one rendered film. Used by the CLI and by QA. */
import path from "node:path";
import { rmSync } from "node:fs";
import { buildContactSheet, extractFrames, samplePoints } from "./frames";
import { FORMATS } from "../../src/types/format";
import type { Storyboard } from "../../src/types/storyboard";

export const contactSheetFor = async (
  storyboard: Storyboard,
  video: string,
  outFile: string,
): Promise<number> => {
  const fps = FORMATS[storyboard.format].fps;
  const points = samplePoints(storyboard, fps);
  const tmp = path.join(path.dirname(outFile), `.frames-${storyboard.id}`);
  const files = extractFrames(video, points.map((p) => p.frame), fps, tmp);
  await buildContactSheet(
    storyboard.title,
    files.map((file, i) => ({ file, point: points[i] })),
    fps,
    outFile,
    storyboard.format === "vertical" ? 6 : 4,
  );
  rmSync(tmp, { recursive: true, force: true });
  return points.length;
};
