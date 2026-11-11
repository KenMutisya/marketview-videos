/**
 * Technical validation of a rendered file, via ffprobe.
 */
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, statSync } from "node:fs";

export type MediaInfo = {
  file: string;
  exists: boolean;
  bytes: number;
  durationSeconds: number;
  videoCodec: string | null;
  pixelFormat: string | null;
  width: number | null;
  height: number | null;
  fps: number | null;
  frameCount: number | null;
  audioCodec: string | null;
  audioChannels: number | null;
  bitRate: number | null;
};

export type Expectation = {
  width: number;
  height: number;
  fps: number;
  frameCount: number;
  /** Conference editions must carry no audio stream at all. */
  silent: boolean;
};

export type Check = { name: string; ok: boolean; detail: string };

const parseRate = (s: string | undefined): number | null => {
  if (!s) return null;
  const [a, b] = s.split("/").map(Number);
  return b ? a / b : a;
};

export const probe = (file: string): MediaInfo => {
  if (!existsSync(file)) {
    return {
      file,
      exists: false,
      bytes: 0,
      durationSeconds: 0,
      videoCodec: null,
      pixelFormat: null,
      width: null,
      height: null,
      fps: null,
      frameCount: null,
      audioCodec: null,
      audioChannels: null,
      bitRate: null,
    };
  }
  const raw = execFileSync("ffprobe", [
    "-v",
    "error",
    "-print_format",
    "json",
    "-show_format",
    "-show_streams",
    file,
  ]).toString();
  const json = JSON.parse(raw) as {
    format: { duration?: string; bit_rate?: string };
    streams: Record<string, string | number>[];
  };
  const v = json.streams.find((s) => s.codec_type === "video");
  const a = json.streams.find((s) => s.codec_type === "audio");
  return {
    file,
    exists: true,
    bytes: statSync(file).size,
    durationSeconds: Number(json.format.duration ?? 0),
    videoCodec: (v?.codec_name as string) ?? null,
    pixelFormat: (v?.pix_fmt as string) ?? null,
    width: v ? Number(v.width) : null,
    height: v ? Number(v.height) : null,
    fps: parseRate(v?.r_frame_rate as string),
    frameCount: v?.nb_frames ? Number(v.nb_frames) : null,
    audioCodec: (a?.codec_name as string) ?? null,
    audioChannels: a ? Number(a.channels) : null,
    bitRate: json.format.bit_rate ? Number(json.format.bit_rate) : null,
  };
};

export const checkMedia = (info: MediaInfo, expect: Expectation): Check[] => {
  const checks: Check[] = [];
  const add = (name: string, ok: boolean, detail: string) => checks.push({ name, ok, detail });

  add("file exists", info.exists, info.exists ? `${(info.bytes / 1e6).toFixed(2)} MB` : "missing");
  if (!info.exists) return checks;

  add("video codec is h264", info.videoCodec === "h264", String(info.videoCodec));
  add(
    "pixel format is yuv420p",
    info.pixelFormat === "yuv420p",
    `${info.pixelFormat} (required for broad browser and social playback)`,
  );
  add(
    "resolution",
    info.width === expect.width && info.height === expect.height,
    `${info.width}×${info.height}, expected ${expect.width}×${expect.height}`,
  );
  add("frame rate", info.fps === expect.fps, `${info.fps} fps, expected ${expect.fps}`);
  add(
    "frame count",
    info.frameCount === expect.frameCount,
    `${info.frameCount}, expected ${expect.frameCount}`,
  );
  const expectedDuration = expect.frameCount / expect.fps;
  add(
    "duration",
    Math.abs(info.durationSeconds - expectedDuration) < 0.1,
    `${info.durationSeconds.toFixed(3)}s, expected ~${expectedDuration.toFixed(3)}s`,
  );
  if (expect.silent) {
    add("no audio stream", info.audioCodec === null, info.audioCodec ?? "none");
  } else {
    add("audio present", info.audioCodec !== null, `${info.audioCodec} · ${info.audioChannels}ch`);
  }
  return checks;
};

/**
 * Integrated loudness in LUFS, or null for a file with no audio.
 *
 * ffmpeg writes its filter summary to stderr and exits non-zero on some
 * builds when the null muxer is used, so this reads stderr directly rather
 * than relying on the exit code.
 */
export const loudness = (file: string): number | null => {
  const result = spawnSync(
    "ffmpeg",
    ["-nostats", "-i", file, "-af", "ebur128=peak=true", "-f", "null", "-"],
    { encoding: "utf8" },
  );
  const out = `${result.stderr ?? ""}${result.stdout ?? ""}`;
  const m = /Integrated loudness:\s*\n?\s*I:\s*(-?[\d.]+)\s*LUFS/.exec(out);
  return m ? Number(m[1]) : null;
};
