/**
 * Capture runner.
 *
 * Executes every registered flow, writes PNGs into public/assets/screenshots/
 * and a manifest the Remotion side reads at build time. Fails loudly if a
 * privacy scan finds anything that should not leave the machine.
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { Browser } from "playwright";
import { assertSourcesAvailable, captureConfig } from "../configs/capture.config";
import { marketviewClient } from "./flows/marketview-client";
import { marketviewRepWhatsapp } from "./flows/marketview-rep-whatsapp";
import { marketviewRepAgribusiness } from "./flows/marketview-rep-agribusiness";
import { launchBrowser, newCapturePage, preparePage, settlePage } from "./helpers/page";
import { redactDom, scanPage, type PrivacyFinding } from "./helpers/privacy";
import type {
  CaptureRecord,
  Flow,
  FlowContext,
  NormalisedRect,
  ShotOptions,
} from "./helpers/types";

/**
 * Registered flows. `--only <id>` runs one: the Rep flow needs a running
 * service and spends live model calls, so it is not something to re-run
 * casually alongside the product captures.
 */
const ALL_FLOWS: Flow[] = [marketviewClient, marketviewRepWhatsapp, marketviewRepAgribusiness];

const runFlow = async (browser: Browser, flow: Flow) => {
  const { context, page } = await newCapturePage(browser, flow.viewport, {
    freezeClock: flow.freezeClock,
  });
  const records: CaptureRecord[] = [];
  const findings: PrivacyFinding[] = [];
  let route = flow.url;
  let interaction: string | null = null;

  const pageErrors: string[] = [];
  page.on("pageerror", (e) => pageErrors.push(e.message));

  await page.goto(flow.url, { waitUntil: "networkidle", timeout: 90_000 });
  await preparePage(page);

  const ctx: FlowContext = {
    page,
    flowId: flow.id,
    setRoute: (r) => {
      route = r;
    },
    setInteraction: (i) => {
      interaction = i;
    },
    settle: (ms) => settlePage(page, ms),
    shot: async (id: string, options: ShotOptions = {}) => {
      // Redaction happens immediately before every shot, because panels render
      // lazily and new fixture text can appear at any point in the flow.
      await redactDom(page);
      findings.push(...(await scanPage(page)));

      const file = path.join(captureConfig.outputDir, `${id}.png`);
      let clip = options.clip;
      if (options.selector) {
        const box = await page.locator(options.selector).first().boundingBox();
        if (!box) throw new Error(`Selector not visible for shot "${id}": ${options.selector}`);
        const pad = options.padding ?? 0;
        clip = {
          x: Math.max(0, box.x - pad),
          y: Math.max(0, box.y - pad),
          width: box.width + pad * 2,
          height: box.height + pad * 2,
        };
      }
      await page.screenshot({
        path: file,
        clip,
        fullPage: options.fullPage ?? false,
        animations: "disabled",
        scale: "device",
      });

      const scale = flow.viewport.deviceScaleFactor;
      const cssW = clip?.width ?? flow.viewport.width;
      const cssH = clip?.height ?? flow.viewport.height;
      const originX = clip?.x ?? 0;
      const originY = clip?.y ?? 0;

      const regions: Record<string, NormalisedRect> = {};
      for (const [name, selector] of Object.entries(options.regions ?? {})) {
        const box = await page.locator(selector).first().boundingBox();
        if (!box) {
          throw new Error(`Region "${name}" not visible in shot "${id}" (${selector})`);
        }
        regions[name] = {
          x: (box.x - originX) / cssW,
          y: (box.y - originY) / cssH,
          width: box.width / cssW,
          height: box.height / cssH,
        };
      }

      const record: CaptureRecord = {
        id,
        flow: flow.id,
        file: path.relative(process.cwd(), file),
        staticPath: `assets/screenshots/${id}.png`,
        width: Math.round(cssW * scale),
        height: Math.round(cssH * scale),
        viewport: flow.viewport,
        route,
        interaction,
        note: options.note ?? null,
        regions,
        capturedAt: new Date().toISOString(),
      };
      records.push(record);
      interaction = null;
      process.stdout.write(`  ✓ ${id} (${record.width}×${record.height})\n`);
      return record;
    },
  };

  await flow.run(ctx);
  await context.close();
  return { records, findings, pageErrors };
};

const main = async () => {
  const only = process.argv.includes("--only")
    ? process.argv[process.argv.indexOf("--only") + 1]
    : null;
  const FLOWS = only ? ALL_FLOWS.filter((f) => f.id === only) : [marketviewClient];
  if (FLOWS.length === 0) {
    throw new Error(
      `Unknown flow "${only}". Available: ${ALL_FLOWS.map((f) => f.id).join(", ")}.`,
    );
  }
  if (!only) assertSourcesAvailable();
  await mkdir(captureConfig.outputDir, { recursive: true });

  const browser = await launchBrowser();
  const allRecords: CaptureRecord[] = [];
  const allFindings: PrivacyFinding[] = [];
  const allErrors: string[] = [];

  try {
    for (const flow of FLOWS) {
      process.stdout.write(`\n▶ ${flow.id} — ${flow.description}\n`);
      const { records, findings, pageErrors } = await runFlow(browser, flow);
      allRecords.push(...records);
      allFindings.push(...findings);
      allErrors.push(...pageErrors.map((e) => `${flow.id}: ${e}`));
    }
  } finally {
    await browser.close();
  }

  // A partial run must not drop the captures it did not take: merge by id so
  // `--only` can refresh one flow without destroying the manifest.
  let existing: CaptureRecord[] = [];
  try {
    const prior = JSON.parse(await readFile(captureConfig.manifestPath, "utf8")) as {
      captures: CaptureRecord[];
    };
    existing = prior.captures ?? [];
  } catch {
    existing = [];
  }
  const merged = new Map(existing.map((c) => [c.id, c]));
  for (const record of allRecords) merged.set(record.id, record);

  const unique = new Map(allFindings.map((f) => [`${f.kind}:${f.value}`, f]));
  const manifest = {
    generatedAt: new Date().toISOString(),
    captures: Array.from(merged.values()),
    privacy: {
      clean: unique.size === 0,
      findings: Array.from(unique.values()),
    },
    pageErrors: allErrors,
  };
  await writeFile(captureConfig.manifestPath, JSON.stringify(manifest, null, 2) + "\n");

  process.stdout.write(`\n${allRecords.length} captures → ${captureConfig.outputDir}\n`);
  if (allErrors.length) {
    process.stdout.write(`⚠ ${allErrors.length} page error(s) during capture:\n`);
    allErrors.slice(0, 5).forEach((e) => process.stdout.write(`   ${e}\n`));
  }
  if (unique.size > 0) {
    process.stderr.write(`\n✗ Privacy scan found ${unique.size} item(s) still visible:\n`);
    for (const f of unique.values()) process.stderr.write(`   ${f.kind}: ${f.value}\n`);
    process.exitCode = 1;
    return;
  }
  process.stdout.write("✓ Privacy scan clean.\n");
};

main().catch((err) => {
  process.stderr.write(`${err instanceof Error ? err.stack : String(err)}\n`);
  process.exit(1);
});
