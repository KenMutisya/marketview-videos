/**
 * Programmatic rendering.
 *
 * The CLI uses these rather than shelling out to `remotion render`, so the
 * bundle is built once and reused across every edition in an export run. On
 * this machine that turns a four-film export from four cold bundles into one.
 */
import { mkdirSync } from "node:fs";
import path from "node:path";
import { bundle } from "@remotion/bundler";
import { renderMedia, renderStill, selectComposition } from "@remotion/renderer";
import { FORMATS } from "../types/format";
import { filmFrames, type Film } from "./films";

export const OUTPUT_DIR = path.resolve(process.cwd(), "output");

export type RenderResult = {
  film: string;
  file: string;
  frames: number;
  seconds: number;
  renderSeconds: number;
  msPerFrame: number;
};

let cachedBundle: string | null = null;

/** Bundles the project once per process. */
export const getBundle = async (onProgress?: (p: number) => void): Promise<string> => {
  if (cachedBundle) return cachedBundle;
  cachedBundle = await bundle({
    entryPoint: path.resolve(process.cwd(), "src", "index.ts"),
    onProgress: onProgress ? (p) => onProgress(p) : undefined,
  });
  return cachedBundle;
};

export const renderFilm = async (
  film: Film,
  options: { onProgress?: (rendered: number, total: number) => void } = {},
): Promise<RenderResult> => {
  mkdirSync(OUTPUT_DIR, { recursive: true });
  const serveUrl = await getBundle();
  const format = FORMATS[film.storyboard.format];
  const inputProps = { storyboard: film.storyboard };

  const composition = await selectComposition({
    serveUrl,
    id: film.id,
    inputProps,
  });

  const total = filmFrames(film);
  const outputLocation = path.join(OUTPUT_DIR, film.file);
  const started = Date.now();

  await renderMedia({
    serveUrl,
    composition,
    codec: "h264",
    outputLocation,
    inputProps,
    crf: film.preset.crf,
    concurrency: film.preset.concurrency,
    imageFormat: "jpeg",
    jpegQuality: 98,
    // yuv420p is what browsers and every social platform will actually play.
    pixelFormat: "yuv420p",
    // Silent editions must carry no audio stream, not a muted one.
    muted: film.storyboard.audio.silent,
    enforceAudioTrack: !film.storyboard.audio.silent,
    timeoutInMilliseconds: 120_000,
    onProgress: options.onProgress
      ? ({ renderedFrames }) => options.onProgress?.(renderedFrames, total)
      : undefined,
  });

  const renderSeconds = (Date.now() - started) / 1000;
  return {
    film: film.id,
    file: outputLocation,
    frames: total,
    seconds: total / format.fps,
    renderSeconds,
    msPerFrame: (renderSeconds * 1000) / total,
  };
};

/** Exports a single frame as a PNG; used for poster frames and thumbnails. */
export const renderFilmStill = async (
  film: Film,
  frame: number,
  outputLocation: string,
  scale = 1,
): Promise<string> => {
  mkdirSync(path.dirname(outputLocation), { recursive: true });
  const serveUrl = await getBundle();
  const inputProps = { storyboard: film.storyboard };
  const composition = await selectComposition({ serveUrl, id: film.id, inputProps });
  await renderStill({
    serveUrl,
    composition,
    output: outputLocation,
    frame,
    inputProps,
    imageFormat: "png",
    scale,
    timeoutInMilliseconds: 120_000,
  });
  return outputLocation;
};
