/**
 * Browser preparation. Everything here exists to make a capture reproducible:
 * the same flow run twice should produce byte-similar PNGs.
 */
import type { Browser, BrowserContext, Page } from "playwright";
import { chromium } from "playwright";
import type { Viewport } from "./types";

/**
 * Frozen wall clock for captures. Date-derived UI (freshness badges, "today"
 * labels) would otherwise drift between runs and break frame diffing.
 */
export const FIXED_TIME = new Date("2026-03-17T09:20:00+03:00");

/** CSS that removes every source of non-determinism we can reach from the page. */
const DETERMINISM_CSS = `
  *, *::before, *::after {
    animation-duration: 0s !important;
    animation-delay: 0s !important;
    transition-duration: 0s !important;
    transition-delay: 0s !important;
    caret-color: transparent !important;
  }
  /* Dev-only affordances must never appear in a product film. */
  #skip-bar { display: none !important; }
  /* Onboarding/account-state banners belong to the demo shell, not the product.
     The film carries its own, more prominent sample-data disclosure instead. */
  #overage-banner-sms, #data-source-banner, #view-banner { display: none !important; }
  ::-webkit-scrollbar { width: 0 !important; height: 0 !important; }
  /* Leaflet fades tiles in via an opacity transition. Freezing transitions
     above would otherwise strand them at opacity 0 and render a blank map. */
  .leaflet-tile, .leaflet-fade-anim .leaflet-tile { opacity: 1 !important; }
`;

export const launchBrowser = (): Promise<Browser> =>
  chromium.launch({
    args: ["--font-render-hinting=none", "--disable-lcd-text", "--force-color-profile=srgb"],
  });

export const newCapturePage = async (
  browser: Browser,
  viewport: Viewport,
  options: { freezeClock?: boolean } = {},
): Promise<{ context: BrowserContext; page: Page }> => {
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    deviceScaleFactor: viewport.deviceScaleFactor,
    colorScheme: "light",
    locale: "en-GB",
    timezoneId: "Africa/Nairobi",
    reducedMotion: "reduce",
  });

  // Runs before any page script, so first-run gates are already satisfied.
  await context.addInitScript(() => {
    // tsx/esbuild compiles `evaluate` callbacks with a `__name` helper that only
    // exists in the Node bundle. Shim it so injected functions run in the page.
    (globalThis as unknown as { __name: unknown }).__name =
      (fn: unknown) => fn;
    try {
      // MarketView's onboarding tour is a first-visit overlay.
      localStorage.setItem("mv_tour_seen_v1", "1");
    } catch {
      /* storage unavailable; the tour is dismissed defensively below too */
    }
    // Chart.js reads this global at construction time.
    (window as unknown as { __mvNoAnim?: boolean }).__mvNoAnim = true;
  });

  const page = await context.newPage();
  if (options.freezeClock !== false) {
    await page.clock.setFixedTime(FIXED_TIME);
  }
  return { context, page };
};

/**
 * Applied after load: CSS freeze, chart animation kill, and dismissal of any
 * demo-state banner that is an artefact of the reference build rather than
 * part of the product.
 */
export const preparePage = async (page: Page): Promise<void> => {
  await page.addStyleTag({ content: DETERMINISM_CSS });
  await page.evaluate(() => {
    const w = window as unknown as {
      Chart?: { defaults: { animation: unknown; animations?: unknown } };
      _tourClose?: () => void;
    };
    if (w.Chart) {
      w.Chart.defaults.animation = false;
      w.Chart.defaults.animations = {};
    }
    if (typeof w._tourClose === "function") w._tourClose();
    // Close any banner the reference build opens on first paint.
    document
      .querySelectorAll<HTMLElement>("#overage-banner-sms, #data-source-banner, #view-banner")
      .forEach((el) => {
        el.style.display = "none";
      });
  });
};

/**
 * Waits until every Leaflet tile in view has decoded. Map panels are the one
 * place where "networkidle" is not enough: tiles are requested only after the
 * panel becomes visible.
 */
export const settleMap = async (page: Page, timeout = 20_000): Promise<void> => {
  await page.evaluate(() => window.dispatchEvent(new Event("resize")));
  await page.waitForFunction(
    () => {
      const tiles = document.querySelectorAll("img.leaflet-tile");
      if (tiles.length === 0) return false;
      return Array.from(tiles).every((t) => t.classList.contains("leaflet-tile-loaded"));
    },
    undefined,
    { timeout },
  );
  await page.waitForTimeout(500);
};

/** Waits for fonts + images, then a fixed paint budget. No arbitrary sleeps elsewhere. */
export const settlePage = async (page: Page, ms = 400): Promise<void> => {
  await page.evaluate(async () => {
    await document.fonts.ready;
    const images = Array.from(document.images).filter((i) => !i.complete);
    await Promise.all(
      images.map(
        (i) =>
          new Promise<void>((resolve) => {
            i.addEventListener("load", () => resolve(), { once: true });
            i.addEventListener("error", () => resolve(), { once: true });
          }),
      ),
    );
  });
  await page.waitForTimeout(ms);
};
