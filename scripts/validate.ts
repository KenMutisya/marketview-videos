/**
 * Pre-flight validation.
 *
 * Runs before any render in an export, because the failures it catches —
 * a capture renamed, a region removed, an audio file never generated — surface
 * during a render as a blank frame or a silent track rather than an error.
 */
import { existsSync } from "node:fs";
import path from "node:path";
import { FILMS, filmFrames } from "../src/rendering/films";
import { captureManifest, getCapture, getRegion } from "../src/utils/captures";
import type { Scene } from "../src/types/storyboard";

export type Finding = { level: "error" | "warn"; message: string };

const publicFile = (p: string) => path.resolve(process.cwd(), "public", p);

const checkScene = (filmId: string, scene: Scene, findings: Finding[]) => {
  const where = `${filmId}/${scene.id}`;
  const capture = (id: string, region?: string) => {
    try {
      getCapture(id);
      if (region) getRegion(id, region);
    } catch (e) {
      findings.push({ level: "error", message: `${where}: ${(e as Error).message}` });
    }
  };

  switch (scene.kind) {
    case "statement":
      if (scene.backdrop) {
        capture(scene.backdrop);
        const derived = publicFile(`assets/derived/${scene.backdrop}-backdrop.jpg`);
        if (!existsSync(derived)) {
          findings.push({
            level: "error",
            message: `${where}: missing derived backdrop ${path.relative(process.cwd(), derived)} — run \`npm run assets\`.`,
          });
        }
      }
      break;
    case "brandReveal":
      capture(scene.capture);
      if (scene.uiAt >= scene.seconds) {
        findings.push({
          level: "error",
          message: `${where}: uiAt (${scene.uiAt}s) is at or past the scene end (${scene.seconds}s).`,
        });
      }
      break;
    case "uiWalkthrough":
      capture(scene.capture, scene.to?.region ?? scene.from?.region);
      if (scene.thenCapture) capture(scene.thenCapture, scene.to?.region);
      for (const c of scene.cursor) {
        if (c.at > scene.seconds) {
          findings.push({
            level: "warn",
            message: `${where}: cursor stop at ${c.at}s is past the scene end (${scene.seconds}s).`,
          });
        }
      }
      for (const c of scene.callouts) {
        if (c.at > scene.seconds) {
          findings.push({
            level: "warn",
            message: `${where}: callout "${c.text}" at ${c.at}s is past the scene end.`,
          });
        }
        if (c.x < 0.04 || c.x > 0.96 || c.y < 0.04 || c.y > 0.96) {
          findings.push({
            level: "warn",
            message: `${where}: callout "${c.text}" sits outside the window's safe area.`,
          });
        }
      }
      break;
    case "featureMontage":
      for (const f of scene.features) capture(f.capture, f.region);
      break;
    case "apiBeat":
      capture(scene.capture, scene.region);
      break;
    case "closing":
      break;
  }

  // A scene shorter than its own entrance never finishes landing.
  if (scene.seconds < 1.2) {
    findings.push({
      level: "warn",
      message: `${where}: ${scene.seconds}s is shorter than a full entrance; it will be cut mid-reveal.`,
    });
  }
};

export const validate = (): Finding[] => {
  const findings: Finding[] = [];

  if (!captureManifest.privacy.clean) {
    findings.push({
      level: "error",
      message: `Capture manifest reports ${captureManifest.privacy.findings.length} privacy finding(s). Re-run \`npm run capture\`.`,
    });
  }

  for (const film of FILMS) {
    const sb = film.storyboard;
    for (const scene of sb.scenes) checkScene(film.id, scene, findings);

    if (!sb.audio.silent && sb.audio.music && !existsSync(publicFile(sb.audio.music))) {
      findings.push({
        level: "error",
        message: `${film.id}: music track ${sb.audio.music} is missing — run \`npm run audio\`.`,
      });
    }
    if (sb.audio.narration && !existsSync(publicFile(sb.audio.narration))) {
      findings.push({
        level: "error",
        message: `${film.id}: narration ${sb.audio.narration} is missing.`,
      });
    }
    if (sb.audio.cues && !sb.audio.silent) {
      for (const cue of ["cue-whoosh.wav", "cue-tick.wav", "cue-confirm.wav", "cue-riser.wav"]) {
        if (!existsSync(publicFile(`assets/audio/${cue}`))) {
          findings.push({
            level: "error",
            message: `${film.id}: sound cue ${cue} is missing — run \`npm run audio\`.`,
          });
        }
      }
    }
    if (filmFrames(film) < 30) {
      findings.push({ level: "error", message: `${film.id}: fewer than 30 frames.` });
    }
  }

  return findings;
};
