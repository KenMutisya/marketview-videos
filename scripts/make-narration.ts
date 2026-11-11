/**
 * Narration build.
 *
 * Synthesises every voiced line in a storyboard, lays the clips out against the
 * film's own timeline, and writes two artefacts per film:
 *
 *   public/assets/audio/narration-<storyboard>.wav   the track the film plays
 *   public/assets/audio/narration-<storyboard>.json  where each line landed
 *
 * The JSON is what keeps the burned-in captions honest. Nothing downstream
 * estimates how long a line takes to say: this script measures the synthesised
 * clip and records the frame, and `src/components/Captions.tsx` reads that
 * record. Audio and text therefore cannot drift, because only one of them is
 * ever computed.
 *
 * ## Provider
 *
 * Google Cloud Text-to-Speech, reached with a service account. The studio
 * deliberately holds no credentials of its own (see docs/RESEARCH.md), so the
 * key comes from the environment:
 *
 *   GOOGLE_APPLICATION_CREDENTIALS=/path/to/sa.json npm run narrate
 *
 * The rendered WAVs are committed, so a clean checkout can render every film
 * without a key. Re-running this is only necessary when a line changes.
 *
 * ## Determinism
 *
 * A synthesiser is not deterministic across versions, and this script is not
 * run during a render. It is a build step whose output is committed and
 * reviewed, which is the same contract the captures and the music bed have.
 */
import { execFile } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import { FILMS } from "../src/rendering/films";
import { FORMATS } from "../src/types/format";
import { sceneFrames, transitionFrames, type Storyboard } from "../src/types/storyboard";

const run = promisify(execFile);

const PUBLIC = path.resolve(process.cwd(), "public");
const AUDIO = path.join(PUBLIC, "assets", "audio");
const WORK = path.join(process.cwd(), ".narration-cache");

/**
 * The voice.
 *
 * A single British English neural voice across all three films: the campaign
 * films run back to back in the same feed, and three different narrators would
 * read as three different products. Chosen over a US voice because the
 * product's own written register — "verified actors", "corridors", "sprint" —
 * is the one these films speak in.
 */
const VOICE = {
  languageCode: "en-GB",
  name: "en-GB-Neural2-B",
};

/**
 * Speaking rate and pitch.
 *
 * Slightly under default. A 60-second vertical ad carries about 110 words, and
 * the default rate delivers them with no air around the cut points; the music
 * bed then has to fight the voice for the same beat.
 */
const AUDIO_CONFIG = {
  audioEncoding: "LINEAR16",
  sampleRateHertz: 48000,
  speakingRate: 0.96,
  pitch: -1.0,
};

/** Gap left after a line before the next one starts, when `at` is not given. */
const LINE_GAP_SECONDS = 0.28;
/** Lead-in before the first line of a scene. */
const SCENE_LEAD_SECONDS = 0.32;

const accessToken = async (): Promise<string> => {
  const credentials = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (!credentials || !existsSync(credentials)) {
    throw new Error(
      [
        "No Google credentials for text-to-speech.",
        "",
        "  GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json npm run narrate",
        "",
        "The synthesised WAVs are committed, so this is only needed when a",
        "voiceover line changes. See docs/CREATING_NEW_VIDEOS.md.",
      ].join("\n"),
    );
  }
  const { stdout } = await run(
    "gcloud",
    ["auth", "application-default", "print-access-token"],
    { env: { ...process.env, GOOGLE_APPLICATION_CREDENTIALS: credentials } },
  );
  const token = stdout.trim();
  if (!token || token.includes(" ")) {
    throw new Error(`Could not mint an access token from ${credentials}.`);
  }
  return token;
};

const synthesise = async (token: string, text: string, file: string): Promise<void> => {
  const res = await fetch("https://texttospeech.googleapis.com/v1/text:synthesize", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ input: { text }, voice: VOICE, audioConfig: AUDIO_CONFIG }),
  });
  if (!res.ok) {
    throw new Error(`Text-to-speech failed (${res.status}): ${(await res.text()).slice(0, 400)}`);
  }
  const { audioContent } = (await res.json()) as { audioContent: string };
  await writeFile(file, Buffer.from(audioContent, "base64"));
};

/** Clip length in seconds, measured rather than estimated. */
const durationOf = async (file: string): Promise<number> => {
  const { stdout } = await run("ffprobe", [
    "-v",
    "error",
    "-show_entries",
    "format=duration",
    "-of",
    "default=noprint_wrappers=1:nokey=1",
    file,
  ]);
  const seconds = Number.parseFloat(stdout.trim());
  if (!Number.isFinite(seconds)) throw new Error(`Could not measure ${file}.`);
  return seconds;
};

/** Absolute start frame of every scene, accounting for transition overlap. */
const sceneStarts = (storyboard: Storyboard, fps: number): number[] => {
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

type Placed = {
  sceneId: string;
  index: number;
  text: string;
  file: string;
  startFrame: number;
  endFrame: number;
};

const buildFilm = async (token: string, storyboard: Storyboard, filmId: string) => {
  const fps = FORMATS[storyboard.format].fps;
  const starts = sceneStarts(storyboard, fps);
  const voiced = storyboard.scenes.some((s) => s.voiceover.length > 0);
  if (!voiced) return null;

  const cacheDir = path.join(WORK, storyboard.id);
  await mkdir(cacheDir, { recursive: true });

  const placed: Placed[] = [];
  const warnings: string[] = [];

  for (const [sceneIndex, scene] of storyboard.scenes.entries()) {
    if (scene.voiceover.length === 0) continue;
    const sceneStart = starts[sceneIndex];
    const sceneLength = sceneFrames(scene, fps);
    let cursor = sceneStart + Math.round(SCENE_LEAD_SECONDS * fps);

    for (const [index, line] of scene.voiceover.entries()) {
      const file = path.join(cacheDir, `${scene.id}-${index}.wav`);
      await synthesise(token, line.text, file);
      const seconds = await durationOf(file);
      const lengthFrames = Math.round(seconds * fps);

      const startFrame =
        line.at === undefined ? cursor : sceneStart + Math.round(line.at * fps);
      const endFrame = startFrame + lengthFrames;

      // A line that runs past its own scene is a timing bug in the storyboard,
      // not something to silently truncate: the caption would sit over the next
      // shot and the voice would talk across the cut.
      if (endFrame > sceneStart + sceneLength) {
        const over = (endFrame - (sceneStart + sceneLength)) / fps;
        warnings.push(
          `${storyboard.id} · ${scene.id}[${index}] overruns its scene by ${over.toFixed(2)}s: ` +
            `"${line.text.slice(0, 60)}…"`,
        );
      }

      placed.push({ sceneId: scene.id, index, text: line.text, file, startFrame, endFrame });
      cursor = endFrame + Math.round(LINE_GAP_SECONDS * fps);
    }
  }

  if (placed.length === 0) return null;

  // Lay every clip onto one silent bed of the film's length. `adelay` places
  // each at its frame; `amix` sums them. The bed guarantees the track is
  // exactly as long as the film, so a render cannot run out of audio early.
  const totalFrames =
    starts[starts.length - 1] + sceneFrames(storyboard.scenes[storyboard.scenes.length - 1], fps);
  const totalSeconds = totalFrames / fps;

  const inputs = placed.flatMap((p) => ["-i", p.file]);
  const delays = placed
    .map((p, i) => {
      const ms = Math.round((p.startFrame / fps) * 1000);
      return `[${i + 1}:a]adelay=${ms}|${ms},apad[d${i}]`;
    })
    .join(";");
  const mix =
    placed.map((_, i) => `[d${i}]`).join("") +
    `[0:a]amix=inputs=${placed.length + 1}:duration=first:normalize=0[out]`;

  const out = path.join(AUDIO, `narration-${storyboard.id}.wav`);
  await run("ffmpeg", [
    "-y",
    "-f",
    "lavfi",
    "-t",
    totalSeconds.toFixed(3),
    "-i",
    `anullsrc=channel_layout=mono:sample_rate=48000`,
    ...inputs,
    "-filter_complex",
    `${delays};${mix}`,
    "-map",
    "[out]",
    "-t",
    totalSeconds.toFixed(3),
    "-c:a",
    "pcm_s16le",
    "-ar",
    "48000",
    "-ac",
    "1",
    out,
  ]);

  const timing = {
    filmId,
    storyboardId: storyboard.id,
    fps,
    voice: VOICE.name,
    generatedAt: new Date().toISOString(),
    cues: placed.map(({ sceneId, index, text, startFrame, endFrame }) => ({
      sceneId,
      index,
      text,
      startFrame,
      endFrame,
    })),
  };
  await writeFile(
    path.join(AUDIO, `narration-${storyboard.id}.json`),
    JSON.stringify(timing, null, 2) + "\n",
  );

  const spoken = placed.reduce((n, p) => n + (p.endFrame - p.startFrame), 0) / fps;
  process.stdout.write(
    `  ✓ ${storyboard.id}: ${placed.length} lines · ${spoken.toFixed(1)}s spoken over ` +
      `${totalSeconds.toFixed(1)}s\n`,
  );
  for (const w of warnings) process.stdout.write(`    ⚠ ${w}\n`);
  return warnings;
};

const main = async () => {
  const only = process.argv.slice(2).filter((a) => !a.startsWith("-"));
  const films = only.length
    ? FILMS.filter((f) => only.some((o) => o.toLowerCase() === f.id.toLowerCase()))
    : FILMS;
  if (films.length === 0) throw new Error(`No film matched ${only.join(", ")}.`);

  await mkdir(AUDIO, { recursive: true });
  const token = await accessToken();

  const allWarnings: string[] = [];
  for (const film of films) {
    const warnings = await buildFilm(token, film.storyboard, film.id);
    if (warnings) allWarnings.push(...warnings);
  }

  // The cache only exists so a failed run does not re-spend the API on lines
  // that already synthesised; it is not an artefact.
  await rm(WORK, { recursive: true, force: true });

  if (allWarnings.length > 0) {
    process.stderr.write(`\n⚠ ${allWarnings.length} line(s) overrun their scene.\n`);
    process.exitCode = 1;
  }
};

main().catch((err) => {
  process.stderr.write(`${err instanceof Error ? err.stack : String(err)}\n`);
  process.exit(1);
});
