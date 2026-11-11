/**
 * Capture configuration.
 *
 * `sources` points at product surfaces the studio is allowed to drive. Keep
 * these on local or explicitly authorised staging builds. Never point a flow
 * at production.
 */
import { existsSync } from "node:fs";
import path from "node:path";

const MARKETVIEW_REPO =
  process.env.MARKETVIEW_REPO ?? path.resolve(process.cwd(), "..", "marketview");

const referenceBuild = path.join(MARKETVIEW_REPO, "marketview_dashboard.html");

export const captureConfig = {
  sources: {
    /**
     * The MarketView client reference build: a single-file, client-only copy of
     * the product dashboard that runs on bundled fixture data.
     */
    marketviewClient: `file://${referenceBuild}`,

    /**
     * The Rep's WhatsApp preview console, served by the rep-chatbot service.
     * Start it from `services/rep-chatbot` before running this flow; see
     * docs/CAPTURE_WORKFLOW.md for the exact, side-effect-free command.
     */
    repConsole: process.env.REP_CONSOLE_URL ?? "http://localhost:3100/wa-preview.html",
  },

  /** Admin token the preview console asks for. Local dev value only. */
  repAdminToken: process.env.REP_ADMIN_TOKEN ?? "dev",
  outputDir: path.resolve(process.cwd(), "public", "assets", "screenshots"),
  manifestPath: path.resolve(
    process.cwd(),
    "public",
    "assets",
    "screenshots",
    "manifest.json",
  ),
} as const;

export const assertSourcesAvailable = (): void => {
  if (!existsSync(referenceBuild)) {
    throw new Error(
      [
        `Capture source not found: ${referenceBuild}`,
        "",
        "The MarketView flows read the product's reference build from a sibling",
        "checkout. Set MARKETVIEW_REPO to the repository root, e.g.:",
        "  MARKETVIEW_REPO=/path/to/marketview npm run capture",
        "",
        "Captured PNGs are committed under public/assets/screenshots/, so this is",
        "only required when re-capturing.",
      ].join("\n"),
    );
  }
};
