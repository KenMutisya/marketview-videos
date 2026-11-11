#!/usr/bin/env tsx
/**
 * Product Demo Studio CLI.
 *
 * Every documented command is implemented here; there are no manual steps
 * between a clean checkout and the finished films beyond what `help` prints.
 */
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { FILMS, filmFrames, getFilm, type Film } from "../src/rendering/films";
import { OUTPUT_DIR, renderFilm, renderFilmStill } from "../src/rendering/render";
import { FORMATS } from "../src/types/format";
import { sceneFrames, transitionFrames } from "../src/types/storyboard";
import { validate } from "./validate";
import { contactSheetFor } from "./qa/sheet";
import { qaReport } from "./qa/report";

const QA_DIR = path.join(OUTPUT_DIR, "qa");
const STILLS_DIR = path.join(OUTPUT_DIR, "stills");

const log = (s = "") => process.stdout.write(`${s}\n`);
const bar = (done: number, total: number, width = 28) => {
  const n = Math.round((done / total) * width);
  return `[${"█".repeat(n)}${"░".repeat(width - n)}] ${String(Math.round((done / total) * 100)).padStart(3)}%`;
};

const run = (cmd: string, args: string[]) =>
  execFileSync(cmd, args, { stdio: "inherit", cwd: process.cwd() });

/** Absolute start frame of each scene, accounting for transition overlap. */
const sceneTimeline = (film: Film) => {
  const fps = FORMATS[film.storyboard.format].fps;
  const rows: { scene: (typeof film.storyboard.scenes)[number]; from: number; to: number }[] = [];
  let cursor = 0;
  film.storyboard.scenes.forEach((scene, i) => {
    const len = sceneFrames(scene, fps);
    rows.push({ scene, from: cursor, to: cursor + len });
    cursor += len;
    if (i < film.storyboard.scenes.length - 1) {
      cursor -= transitionFrames(scene.transitionOut, fps);
    }
  });
  return { fps, rows };
};

const cmdValidate = () => {
  const findings = validate();
  const errors = findings.filter((f) => f.level === "error");
  for (const f of findings) {
    log(`${f.level === "error" ? "✗" : "⚠"} ${f.message}`);
  }
  if (findings.length === 0) log("✓ Project valid: captures, regions, audio and timings all resolve.");
  if (errors.length > 0) process.exitCode = 1;
  return errors.length === 0;
};

const cmdList = () => {
  log("Films");
  for (const film of FILMS) {
    const fmt = FORMATS[film.storyboard.format];
    const frames = filmFrames(film);
    log(
      `  ${film.id.padEnd(20)} ${`${fmt.width}×${fmt.height}`.padEnd(11)} ${(frames / fmt.fps)
        .toFixed(2)
        .padStart(6)}s  ${film.storyboard.audio.silent ? "silent " : "audio  "} ${film.intent}`,
    );
  }
};

const cmdTimeline = (id: string) => {
  const film = getFilm(id);
  const { fps, rows } = sceneTimeline(film);
  log(`${film.storyboard.title}`);
  log(`  ${"start".padStart(7)} ${"end".padStart(7)}  ${"scene".padEnd(14)} kind`);
  for (const r of rows) {
    log(
      `  ${(r.from / fps).toFixed(2).padStart(7)} ${(r.to / fps).toFixed(2).padStart(7)}  ${r.scene.id.padEnd(14)} ${r.scene.kind}`,
    );
    log(`          ${r.scene.purpose}`);
  }
  log(`  total ${filmFrames(film)} frames = ${(filmFrames(film) / fps).toFixed(3)}s`);
};

const cmdRender = async (ids: string[]) => {
  if (!cmdValidate()) {
    log("\nRefusing to render with validation errors.");
    return;
  }
  const films = ids.length ? ids.map(getFilm) : FILMS;
  mkdirSync(OUTPUT_DIR, { recursive: true });
  const results = [];
  for (const film of films) {
    log(`\n▶ ${film.id} — ${film.intent}`);
    // Only draw a live bar on a terminal. Piped into a log or a CI job the
    // carriage returns become thousands of lines of noise.
    const interactive = process.stdout.isTTY === true;
    let last = -1;
    const result = await renderFilm(film, {
      onProgress: (done, total) => {
        const pct = Math.floor((done / total) * 100);
        if (pct === last) return;
        last = pct;
        if (interactive) {
          process.stdout.write(`\r  ${bar(done, total)} ${done}/${total}`);
        } else if (pct % 25 === 0) {
          process.stdout.write(`  ${pct}% (${done}/${total})\n`);
        }
      },
    });
    if (interactive) process.stdout.write("\r" + " ".repeat(60) + "\r");
    log(
      `  ✓ ${path.relative(process.cwd(), result.file)} — ${result.frames} frames in ${result.renderSeconds.toFixed(1)}s (${result.msPerFrame.toFixed(0)} ms/frame)`,
    );
    results.push(result);
  }
  writeFileSync(
    path.join(OUTPUT_DIR, "render-metrics.json"),
    JSON.stringify({ generatedAt: new Date().toISOString(), results }, null, 2) + "\n",
  );
  return results;
};

/** Renders one scene in isolation, for iterating on a single shot. */
const cmdScene = async (id: string, sceneId: string) => {
  const film = getFilm(id);
  const { fps, rows } = sceneTimeline(film);
  const row = rows.find((r) => r.scene.id === sceneId);
  if (!row) {
    throw new Error(
      `Film ${film.id} has no scene "${sceneId}". Scenes: ${rows.map((r) => r.scene.id).join(", ")}.`,
    );
  }
  mkdirSync(STILLS_DIR, { recursive: true });
  const n = 6;
  log(`${film.id} / ${sceneId}: frames ${row.from}–${row.to} (${((row.to - row.from) / fps).toFixed(2)}s)`);
  for (let i = 0; i < n; i += 1) {
    const frame = row.from + Math.round(((row.to - row.from - 1) * i) / (n - 1));
    const out = path.join(STILLS_DIR, `${film.id}-${sceneId}-${String(frame).padStart(5, "0")}.png`);
    await renderFilmStill(film, frame, out);
    log(`  ✓ ${path.relative(process.cwd(), out)}`);
  }
};

const cmdStills = async (ids: string[]) => {
  const films = ids.length ? ids.map(getFilm) : FILMS;
  mkdirSync(STILLS_DIR, { recursive: true });
  for (const film of films) {
    const { fps, rows } = sceneTimeline(film);
    // A poster frame wants the product on screen and the brand legible: the
    // reveal scene's settle point is reliably both.
    const reveal = rows.find((r) => r.scene.kind === "brandReveal") ?? rows[1] ?? rows[0];
    const closing = rows.find((r) => r.scene.kind === "closing") ?? rows[rows.length - 1];
    const targets: [string, number][] = [
      ["poster", reveal.to - Math.round(fps * 0.4)],
      ["thumbnail", closing.from + Math.round(fps * 2.2)],
    ];
    for (const [name, frame] of targets) {
      const out = path.join(STILLS_DIR, `${film.id}-${name}.png`);
      await renderFilmStill(film, Math.min(frame, filmFrames(film) - 1), out);
      log(`  ✓ ${path.relative(process.cwd(), out)} (frame ${frame})`);
    }
    // One representative frame per scene.
    for (const r of rows) {
      const out = path.join(STILLS_DIR, `${film.id}-scene-${r.scene.id}.png`);
      await renderFilmStill(film, r.from + Math.round((r.to - r.from) * 0.55), out);
      log(`  ✓ ${path.relative(process.cwd(), out)}`);
    }
  }
};

const cmdSheet = async (ids: string[]) => {
  const films = ids.length ? ids.map(getFilm) : FILMS;
  mkdirSync(QA_DIR, { recursive: true });
  for (const film of films) {
    const video = path.join(OUTPUT_DIR, film.file);
    const out = path.join(QA_DIR, `${film.id}-contact-sheet.png`);
    const n = await contactSheetFor(film.storyboard, video, out);
    log(`  ✓ ${path.relative(process.cwd(), out)} (${n} frames)`);
  }
};

const cmdQa = async () => {
  mkdirSync(QA_DIR, { recursive: true });
  const report = await qaReport();
  log(report.summary);
  if (!report.pass) process.exitCode = 1;
};

const cmdExport = async () => {
  run("npx", ["tsx", "scripts/make-derived-assets.ts"]);
  run("npx", ["tsx", "scripts/make-audio.ts"]);
  await cmdRender([]);
  await cmdStills([]);
  await cmdSheet([]);
  await cmdQa();
};

const cmdClean = () => {
  rmSync(QA_DIR, { recursive: true, force: true });
  rmSync(STILLS_DIR, { recursive: true, force: true });
  log("✓ Removed generated QA artefacts and stills. Rendered films kept.");
};

const HELP = `
Product Demo Studio

  npm run studio                 Open the Remotion preview (scrub, inspect, edit props)
  npm run capture                Drive the product with Playwright and refresh captures
  npm run assets                 Bake derived image treatments (pre-blurred backdrops)
  npm run audio                  Regenerate the original score and UI cues

  npm run pds -- list            List every film this project produces
  npm run pds -- timeline <film> Print a film's scene timeline and intent
  npm run pds -- validate        Check captures, regions, assets and timings
  npm run pds -- render [film…]  Render one film, or all of them
  npm run pds -- scene <film> <scene>
                                 Render six frames across a single scene
  npm run pds -- stills [film…]  Poster frame, thumbnail and one frame per scene
  npm run pds -- sheet [film…]   Contact sheet from a rendered file
  npm run pds -- qa              Technical checks + contact sheets + docs/QA_REPORT.md
  npm run pds -- export          Everything above, in order
  npm run pds -- clean           Remove generated QA artefacts and stills
`;

const main = async () => {
  const [command, ...args] = process.argv.slice(2);
  switch (command) {
    case "list":
      return cmdList();
    case "timeline":
      if (!args[0]) throw new Error("Usage: timeline <film>");
      return cmdTimeline(args[0]);
    case "validate":
      return void cmdValidate();
    case "render":
      return void (await cmdRender(args));
    case "scene":
      if (args.length < 2) throw new Error("Usage: scene <film> <sceneId>");
      return cmdScene(args[0], args[1]);
    case "stills":
      return cmdStills(args);
    case "sheet":
      return cmdSheet(args);
    case "qa":
      return cmdQa();
    case "export":
      return cmdExport();
    case "clean":
      return cmdClean();
    case "help":
    case undefined:
      return log(HELP);
    default:
      log(`Unknown command "${command}".`);
      log(HELP);
      process.exitCode = 1;
  }
};

main().catch((err) => {
  process.stderr.write(`\n✗ ${err instanceof Error ? err.message : String(err)}\n`);
  process.exit(1);
});
