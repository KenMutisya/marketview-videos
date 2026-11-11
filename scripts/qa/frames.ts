/**
 * Frame sampling and contact sheets.
 *
 * A render that exits 0 proves nothing about what is on the screen. Every film
 * the studio produces is sampled at the frames most likely to be wrong — the
 * first and last frame, every scene midpoint, and both sides of every
 * transition — and laid out as a sheet that a human (or a vision model) can
 * actually look at.
 */
import { execFileSync } from "node:child_process";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import type { Storyboard } from "../../src/types/storyboard";
import { sceneFrames, transitionFrames } from "../../src/types/storyboard";

export type SamplePoint = {
  frame: number;
  label: string;
  /** Why this frame is worth looking at. */
  reason: "open" | "close" | "midpoint" | "transition-in" | "transition-out" | "beat";
};

/** The frames worth inspecting for a given storyboard. */
export const samplePoints = (storyboard: Storyboard, fps: number): SamplePoint[] => {
  const points: SamplePoint[] = [];
  const total = storyboard.scenes.reduce(
    (n, s, i) =>
      n +
      sceneFrames(s, fps) -
      (i < storyboard.scenes.length - 1 ? transitionFrames(s.transitionOut, fps) : 0),
    0,
  );

  points.push({ frame: 0, label: "open", reason: "open" });

  let cursor = 0;
  storyboard.scenes.forEach((scene, i) => {
    const len = sceneFrames(scene, fps);
    const mid = cursor + Math.round(len / 2);
    points.push({ frame: mid, label: `${scene.id} · mid`, reason: "midpoint" });

    const t = scene.transitionOut;
    const isLast = i === storyboard.scenes.length - 1;
    if (!isLast && t && t.kind !== "cut") {
      const tFrames = transitionFrames(t, fps);
      const start = cursor + len - tFrames;
      points.push({
        frame: start + Math.round(tFrames / 2),
        label: `${scene.id} → ${storyboard.scenes[i + 1].id} · ${t.kind}`,
        reason: "transition-in",
      });
      points.push({
        frame: Math.min(total - 1, start + tFrames + 2),
        label: `${storyboard.scenes[i + 1].id} · in`,
        reason: "transition-out",
      });
      cursor += len - tFrames;
    } else {
      cursor += len;
    }
  });

  points.push({ frame: total - 1, label: "close", reason: "close" });

  // De-duplicate and keep in order; two sample rules can land on one frame.
  const seen = new Set<number>();
  return points
    .sort((a, b) => a.frame - b.frame)
    .filter((p) => {
      if (p.frame < 0 || p.frame >= total || seen.has(p.frame)) return false;
      seen.add(p.frame);
      return true;
    });
};

/** Extracts single frames from a rendered file by frame index. */
export const extractFrames = (
  video: string,
  frames: number[],
  fps: number,
  outDir: string,
): string[] => {
  mkdirSync(outDir, { recursive: true });
  return frames.map((f) => {
    const out = path.join(outDir, `frame-${String(f).padStart(5, "0")}.png`);
    execFileSync(
      "ffmpeg",
      [
        "-loglevel",
        "error",
        "-y",
        // Seek just before the frame, then select it exactly.
        "-ss",
        String(Math.max(0, (f - 0.5) / fps)),
        "-i",
        video,
        "-frames:v",
        "1",
        out,
      ],
      { stdio: "inherit" },
    );
    return out;
  });
};

/**
 * Lays the sampled frames out as a labelled sheet. Rendered through the same
 * headless Chromium the capture pipeline uses, so the sheet gets real
 * typography instead of ffmpeg's `drawtext`.
 */
export const buildContactSheet = async (
  title: string,
  entries: { file: string; point: SamplePoint }[],
  fps: number,
  outFile: string,
  columns = 4,
): Promise<void> => {
  const { chromium } = await import("playwright");
  const cells = entries
    .map(({ file, point }) => {
      const t = (point.frame / fps).toFixed(2);
      return `<figure>
        <img src="file://${file}" />
        <figcaption><b>${point.frame}</b> · ${t}s<span>${point.label}</span></figcaption>
      </figure>`;
    })
    .join("");

  const html = `<!doctype html><html><head><meta charset="utf-8"><style>
    @font-face{font-family:Inter;src:url('file://${path.resolve("public/assets/fonts/Inter-latin.woff2")}') format('woff2');font-weight:100 900}
    *{box-sizing:border-box}
    body{margin:0;background:#0F172A;color:#E2E8F0;font-family:Inter,system-ui,sans-serif;padding:28px}
    h1{font-size:22px;font-weight:800;letter-spacing:-.4px;margin:0 0 4px}
    p.sub{margin:0 0 22px;color:#94A3B8;font-size:13px}
    .grid{display:grid;grid-template-columns:repeat(${columns},1fr);gap:16px}
    figure{margin:0;background:#1E293B;border:1px solid #334155;border-radius:10px;overflow:hidden}
    img{display:block;width:100%;height:auto}
    figcaption{font-size:12px;padding:8px 10px;display:flex;gap:8px;align-items:baseline;color:#CBD5E1}
    figcaption b{color:#fff;font-variant-numeric:tabular-nums}
    figcaption span{margin-left:auto;color:#7DD3A0;font-weight:600;text-align:right}
  </style></head><body>
    <h1>${title}</h1>
    <p class="sub">${entries.length} sampled frames · scene midpoints and both sides of every transition</p>
    <div class="grid">${cells}</div>
  </body></html>`;

  const tmp = path.join(path.dirname(outFile), ".contact-sheet.html");
  writeFileSync(tmp, html);
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ viewport: { width: 1800, height: 1000 } });
    await page.goto(`file://${tmp}`, { waitUntil: "networkidle" });
    await page.screenshot({ path: outFile, fullPage: true });
  } finally {
    await browser.close();
    rmSync(tmp, { force: true });
  }
};
