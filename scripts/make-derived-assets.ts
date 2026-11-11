/**
 * Bakes expensive, static image treatments into assets.
 *
 * A full-frame `filter: blur(16px)` over a 3024px screenshot is one of the most
 * expensive things a Remotion frame can do, and it produces the same pixels on
 * every frame. Doing it once with ffmpeg turns a render-time cost into a build
 * -time one and removes the main cause of frame timeouts.
 */
import { execFileSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import path from "node:path";

const SHOTS = path.resolve(process.cwd(), "public", "assets", "screenshots");
const OUT = path.resolve(process.cwd(), "public", "assets", "derived");

type Job = {
  from: string;
  to: string;
  filter: string;
  note: string;
};

const JOBS: Job[] = [
  {
    from: "landing-hero.png",
    to: "landing-hero-backdrop.jpg",
    // Scaled down first so the blur radius is cheap, then back up: the result
    // is softer than a same-size blur and a fraction of the cost.
    filter:
      "scale=640:-1,gblur=sigma=14,scale=1920:-1,eq=saturation=0.5:brightness=-0.16:contrast=1.04",
    note: "Abstract backdrop for the opening statement.",
  },
];

const main = () => {
  mkdirSync(OUT, { recursive: true });
  for (const job of JOBS) {
    const out = path.join(OUT, job.to);
    execFileSync(
      "ffmpeg",
      ["-loglevel", "error", "-y", "-i", path.join(SHOTS, job.from), "-vf", job.filter, "-q:v", "4", out],
      { stdio: "inherit" },
    );
    process.stdout.write(`  ✓ ${job.to} — ${job.note}\n`);
  }
};

main();
