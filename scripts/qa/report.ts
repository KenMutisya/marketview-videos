/**
 * The QA report.
 *
 * Produces docs/QA_REPORT.md from measurements, not from assertions: every
 * number in it comes from ffprobe, the render metrics file, or the storyboard
 * itself. Anything a machine cannot check — whether a frame actually looks
 * right — is listed as a frame to inspect, with the contact sheet to inspect
 * it in, and is marked as a human step rather than claimed as passed.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { FILMS, filmFrames } from "../../src/rendering/films";
import { OUTPUT_DIR } from "../../src/rendering/render";
import { FORMATS } from "../../src/types/format";
import { captureManifest } from "../../src/utils/captures";
import { checkMedia, loudness, probe, type Check } from "./probe";
import { samplePoints } from "./frames";
import { measureLoopSeam, type LoopSeam } from "./loop";
import { measureStability, type Stability } from "./stability";
import { contactSheetFor } from "./sheet";
import { validate } from "../validate";
import { getTranscript } from "../../src/utils/transcripts";
import type { Scene } from "../../src/types/storyboard";

const DOCS = path.resolve(process.cwd(), "docs");
const QA_DIR = path.join(OUTPUT_DIR, "qa");

type FilmReport = {
  id: string;
  file: string;
  checks: Check[];
  loudnessLufs: number | null;
  sheet: string | null;
  sampled: number;
  loopSeam: LoopSeam | null;
  stability: Stability | null;
};

export const qaReport = async (): Promise<{ pass: boolean; summary: string }> => {
  mkdirSync(DOCS, { recursive: true });
  mkdirSync(QA_DIR, { recursive: true });

  const projectFindings = validate();
  const reports: FilmReport[] = [];

  for (const film of FILMS) {
    const format = FORMATS[film.storyboard.format];
    const file = path.join(OUTPUT_DIR, film.file);
    const info = probe(file);
    const checks = checkMedia(info, {
      width: format.width,
      height: format.height,
      fps: format.fps,
      frameCount: filmFrames(film),
      silent: film.storyboard.audio.silent,
    });

    let sheet: string | null = null;
    let sampled = 0;
    if (info.exists) {
      const out = path.join(QA_DIR, `${film.id}-contact-sheet.png`);
      sampled = await contactSheetFor(film.storyboard, file, out);
      sheet = path.relative(process.cwd(), out);
    }

    const loopSafe = film.storyboard.scenes.some(
      (s) => s.kind === "closing" && s.loopSafe,
    );

    reports.push({
      id: film.id,
      file: path.relative(process.cwd(), file),
      checks,
      loudnessLufs:
        info.exists && !film.storyboard.audio.silent ? loudness(file) : null,
      sheet,
      sampled,
      loopSeam:
        info.exists && loopSafe
          ? measureLoopSeam(file, info.durationSeconds, format.fps)
          : null,
      stability: info.exists
        ? measureStability(film.storyboard, file, format.fps)
        : null,
    });
  }

  const metricsPath = path.join(OUTPUT_DIR, "render-metrics.json");
  const metrics = existsSync(metricsPath)
    ? (JSON.parse(readFileSync(metricsPath, "utf8")) as {
        results: { film: string; renderSeconds: number; msPerFrame: number }[];
      })
    : null;

  const failed = reports.flatMap((r) => [
    ...r.checks.filter((c) => !c.ok),
    ...(r.stability && !r.stability.ok
      ? [
          {
            name: `${r.id}: text stability`,
            ok: false,
            detail: `quietest held frame still differs by ${r.stability.quietest.toFixed(3)} — something is animating under the text`,
          },
        ]
      : []),
    ...(r.loopSeam && !r.loopSeam.ok
      ? [
          {
            name: `${r.id}: loop seam`,
            ok: false,
            detail: `${r.loopSeam.differencePercent.toFixed(2)}% difference between the first and last frame`,
          },
        ]
      : []),
  ]);
  const errors = projectFindings.filter((f) => f.level === "error");
  const pass = failed.length === 0 && errors.length === 0;

  const lines: string[] = [];
  lines.push("# QA report");
  lines.push("");
  lines.push(`Generated ${new Date().toISOString()} by \`npm run pds -- qa\`.`);
  lines.push("");
  lines.push(
    pass
      ? "**Automated checks: pass.** Every rendered file matches the resolution, frame rate, frame count, duration, codec and audio expectation declared by its storyboard."
      : `**Automated checks: ${failed.length + errors.length} failing.** Details below.`,
  );
  lines.push("");

  lines.push("## Project validation");
  lines.push("");
  if (projectFindings.length === 0) {
    lines.push("No findings. All captures, named regions, derived assets and audio files referenced by a storyboard exist.");
  } else {
    for (const f of projectFindings) {
      lines.push(`- ${f.level === "error" ? "**error**" : "warning"}: ${f.message}`);
    }
  }
  lines.push("");

  lines.push("## Privacy");
  lines.push("");
  lines.push(
    `Capture-time scan: **${captureManifest.privacy.clean ? "clean" : "FINDINGS PRESENT"}**. ` +
      "Every screenshot is scanned for email addresses, phone numbers and API tokens before it is written, " +
      "and personal identifiers found in the product's fixture data are replaced in the DOM before the pixel is taken. " +
      "The two published product contact addresses are allow-listed.",
  );
  lines.push("");
  lines.push(
    `Capture page errors during the last run: ${captureManifest.pageErrors.length}.`,
  );
  lines.push("");

  lines.push("## Technical validation");
  lines.push("");
  for (const r of reports) {
    lines.push(`### ${r.id}`);
    lines.push("");
    lines.push(`\`${r.file}\``);
    lines.push("");
    lines.push("| Check | Result | Detail |");
    lines.push("| --- | --- | --- |");
    for (const c of r.checks) {
      lines.push(`| ${c.name} | ${c.ok ? "pass" : "**FAIL**"} | ${c.detail} |`);
    }
    if (r.stability) {
      lines.push(
        `| text stability | ${r.stability.ok ? "pass" : "**review**"} | quietest held frame differs from the next by ${r.stability.quietest.toFixed(3)} (threshold ${r.stability.threshold}), sampled in \`${r.stability.scene}\` |`,
      );
    }
    if (r.loopSeam) {
      lines.push(
        `| loop seam | ${r.loopSeam.ok ? "pass" : "**review**"} | last frame differs from first by ${r.loopSeam.differencePercent.toFixed(2)}% (threshold ${r.loopSeam.threshold}%) |`,
      );
    }
    if (r.loudnessLufs !== null) {
      const ok = r.loudnessLufs > -20 && r.loudnessLufs < -11;
      lines.push(
        `| integrated loudness | ${ok ? "pass" : "**review**"} | ${r.loudnessLufs.toFixed(1)} LUFS (target −20…−11 for web playback) |`,
      );
    }
    lines.push("");
    if (r.sheet) {
      lines.push(`Contact sheet: \`${r.sheet}\` — ${r.sampled} sampled frames.`);
      lines.push("");
    }
  }

  if (metrics) {
    lines.push("## Render performance");
    lines.push("");
    lines.push("| Film | Render time | Per frame |");
    lines.push("| --- | --- | --- |");
    for (const m of metrics.results) {
      lines.push(`| ${m.film} | ${m.renderSeconds.toFixed(1)}s | ${m.msPerFrame.toFixed(0)} ms |`);
    }
    lines.push("");
  }

  lines.push("## Frames selected for visual inspection");
  lines.push("");
  lines.push(
    "Automated checks cannot tell whether a frame *looks* right. These are the frames the sampler " +
      "selects — scene midpoints and both sides of every transition — and they are the ones laid out " +
      "in each contact sheet above. Reviewing them is a human step; this report does not claim it has happened.",
  );
  lines.push("");
  for (const film of FILMS) {
    const fps = FORMATS[film.storyboard.format].fps;
    const points = samplePoints(film.storyboard, fps);
    lines.push(
      `- **${film.id}** — ${points.length} frames: ${points
        .slice(0, 6)
        .map((p) => `${p.frame} (${p.label})`)
        .join(", ")}${points.length > 6 ? ", …" : ""}`,
    );
  }
  lines.push("");

  // --- Captured-conversation checks ---------------------------------
  const transcriptIds = new Set<string>();
  for (const film of FILMS) {
    for (const scene of film.storyboard.scenes as Scene[]) {
      if (scene.kind === "chatDemo") transcriptIds.add(scene.transcript);
    }
  }
  if (transcriptIds.size > 0) {
    lines.push("## Captured conversations");
    lines.push("");
    for (const id of transcriptIds) {
      const t = getTranscript(id);
      const empty = t.turns
        .map((turn, i) => ({ turn, i }))
        .filter(({ turn }) => turn.role === "rep" && turn.text.trim().length === 0);
      const cards = t.turns.reduce((n, turn) => n + turn.cards.length, 0);
      lines.push(`**\`${id}\`** — ${t.turns.length} turns, ${cards} listing card(s).`);
      lines.push("");
      lines.push(`- Engine: \`${t.engine}\``);
      lines.push(`- Captured: ${t.capturedAt}`);
      lines.push(`- Number: ${t.testNumber}`);
      lines.push(
        `- Empty replies: **${empty.length}**${
          empty.length ? ` (turn${empty.length > 1 ? "s" : ""} ${empty.map((e) => e.i).join(", ")})` : ""
        }`,
      );
      if (empty.length > 0) {
        lines.push("");
        lines.push(
          "  > **Product finding, not a film defect.** The Rep returned an empty reply to the " +
            "final question in the captured run. The films exclude that turn, but it is worth " +
            "a look: an empty outbound message would reach a real WhatsApp user as nothing at all.",
        );
      }
      lines.push("");
    }
  }

  lines.push("## Campaign brief: what shipped, and what did not");
  lines.push("");
  lines.push(
    "The three campaign films were made to a written brief. Where the brief and the product " +
      "disagreed, the product won. Each departure is listed here so it is a decision on the " +
      "record rather than something a reviewer has to notice.",
  );
  lines.push("");
  lines.push(
    [
      "| Brief asked for | What shipped | Why |",
      "| --- | --- | --- |",
      '| "Price of maize in Dawanau this week" | The Rep\'s real answer: *"I have not heard a price for maize in Dawanau Market yet. I have noted the gap"*, then the markets where it does hold maize prices | Dawanau carries no maize observations in this environment. The follow-up returns a genuine cheapest-first table across five markets, with report counts and freshness. A buyer told "not here, but here" has been told something true. |',
      '| "Which market around Kano has the most supply this week?" | Not asked | The Rep reads a bare "around Kano" as a request to move the session to another market and answers about wherever it lands. The cross-market comparison the brief wants is what it volunteers anyway. |',
      '| A chat "in Pidgin, Swahili or Hausa" | Hausa onboarding, captured live in a separate session | Onboarding is genuinely localised — consent, state, market, buy-or-sell and the product menu all return in Hausa. **The price answer comes back in English.** The templated path is translated; the data-answer path is not. The film shows what works and claims nothing more. |',
      '| "Type it or say it" — a voice note | Not shown | Nothing in the capture demonstrates voice input. Pending confirmation that the Rep accepts voice notes, this is an unsupported claim. |',
      '| "A quick answer arriving late in the evening" | Not shown | A timestamp on a bubble records when the capture ran, not a product capability. Showing one as evidence of 24-hour availability would be staging. |',
      '| "Market actor profiles and supplier listings" | The market directory | The actor roster is a list of named individuals. A close-up is ruled out on privacy grounds even with fixture names, and an advertisement is the worst place to make an exception. |',
      "| A partner logo strip | Partner **names**, currently not rendered | Permission is flagged outstanding in the brief itself. The names are carried in the storyboards and gated behind `partnersCleared` in `src/products/marketview.ts`; the end card picks them up the moment it flips. Logos are a separate ask — they need written permission and current assets. |",
      '| "~498k market actors" | *"a mapped footprint of nearly 500,000 market actors"* | The fact-sheet figure counts a **mapped** population. The **verified** network is 5,000+. A test fails if any campaign film puts the word "verified" beside the larger number. |',
    ].join("\n"),
  );
  lines.push("");
  lines.push(
    "**Still outstanding from the brief's own list:** confirmation that the Q4 2026 fact-sheet " +
      "figures are cleared for public use, permission for partner names and logos, whether the " +
      "Rep accepts voice notes, and a target date for first drafts.",
  );
  lines.push("");

  lines.push("## What is not checked automatically");
  lines.push("");
  lines.push(
    [
      "- **Typographic overflow.** Headlines are auto-sized from their longest line (`src/typography/fit.ts`), which prevents wrapping but is a heuristic, not a text measurement.",
      "- **Perceived motion quality.** Easing, overshoot and rhythm are judged by watching the film. The stability probe above catches text that is moving when it should be still, but not motion that is merely ugly.",
      "- **Product accuracy of the on-screen claims.** Every line of copy is traced to a source in `src/products/marketview.ts`; a person has to confirm the source still says it.",
      "- **Colour accuracy on a specific panel.** The conference edition is graded for a bright booth screen, not measured on one.",
    ].join("\n"),
  );
  lines.push("");

  const out = path.join(DOCS, "QA_REPORT.md");
  writeFileSync(out, lines.join("\n") + "\n");

  const summary = [
    "",
    pass ? "✓ QA passed." : `✗ QA found ${failed.length + errors.length} problem(s).`,
    ...failed.map((c) => `   FAIL ${c.name}: ${c.detail}`),
    ...errors.map((e) => `   ERROR ${e.message}`),
    `  Report: ${path.relative(process.cwd(), out)}`,
    ...reports.filter((r) => r.sheet).map((r) => `  Sheet:  ${r.sheet}`),
  ].join("\n");

  return { pass, summary };
};
