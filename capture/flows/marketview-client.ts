/**
 * MarketView client-dashboard capture flow.
 *
 * Source surface: the MarketView reference build, a single-file interactive
 * copy of the client dashboard that ships inside the product repository. It
 * runs entirely client-side on fixture data, which is why it is safe to drive:
 * no credentials, no production API, no customer records. See
 * docs/CAPTURE_WORKFLOW.md for the provenance note.
 */
import type { Flow } from "../helpers/types";
import { captureConfig } from "../../configs/capture.config";
import { settleMap } from "../helpers/page";

const DESKTOP = { width: 1512, height: 945, deviceScaleFactor: 2 };

/** Puts the SPA on a dashboard panel without touching the auth screen. */
const gotoPanel = async (
  page: Flow extends never ? never : import("playwright").Page,
  panel: string,
) => {
  await page.evaluate((p: string) => {
    (window as unknown as { skipToPanel: (p: string) => void }).skipToPanel(p);
  }, panel);
};

export const marketviewClient: Flow = {
  id: "marketview-client",
  description:
    "Client dashboard: landing hero, live market map, directory search, trade & pricing, alerts, routes, API access.",
  viewport: DESKTOP,
  url: captureConfig.sources.marketviewClient,

  run: async (ctx) => {
    const { page } = ctx;

    // --- Landing hero -------------------------------------------------
    ctx.setRoute("/");
    ctx.setInteraction(null);
    await ctx.settle();
    await ctx.shot("landing-hero", {
      note: "Public landing hero, above the fold.",
      regions: { headline: ".lp-hero-copy, .lp-hero h1" },
    });

    // --- Dashboard home -----------------------------------------------
    ctx.setRoute("/dashboard/home");
    await gotoPanel(page, "home");
    await page.waitForSelector("#panel-home.on");
    await ctx.settle(700);
    await ctx.shot("dashboard-home", {
      note: "Dashboard landing panel, sprint state + feed.",
      regions: {
        hero: "#home-hero",
        stats: "#home-changed",
        sidebar: ".sidebar",
      },
    });

    // --- Markets: the live network map --------------------------------
    ctx.setRoute("/dashboard/markets");
    await gotoPanel(page, "markets");
    await page.waitForSelector("#panel-markets.on");
    await settleMap(page);
    await ctx.settle(400);
    await ctx.shot("markets-network", {
      note: "Africa-wide market network map with live pins.",
      regions: {
        map: "#atlas-map",
        directory: "#atlas-dir",
        // The list itself, without the panel header and search box: a wide
        // strip anchored to the top of `directory` shows only the chrome.
        directoryList: "#atlas-dir-list",
        topbar: ".topbar",
      },
    });

    // --- Markets: drill into Kenya ------------------------------------
    ctx.setInteraction("map:dive -> Kenya");
    await page.evaluate(() => {
      const w = window as unknown as {
        diveTo: (l: string, c?: string) => void;
        closeMarketDrawer?: () => void;
      };
      w.diveTo("country", "Kenya");
      // The dive opens an aggregate drawer over the map; the film wants the map.
      w.closeMarketDrawer?.();
    });
    await settleMap(page);
    await ctx.settle(400);
    await ctx.shot("markets-kenya", {
      note: "Country-level dive: Kenya counties with per-market pins.",
      regions: {
        map: "#atlas-map",
        directory: "#atlas-dir",
        directoryList: "#atlas-dir-list",
      },
    });
    await page.evaluate(() => {
      (window as unknown as { diveTo: (l: string) => void }).diveTo("africa");
    });
    await settleMap(page);

    // --- Markets: directory search ------------------------------------
    ctx.setInteraction("type:#atlas-search=Nairobi");
    await page.fill("#atlas-search", "");
    await page.type("#atlas-search", "Nairobi", { delay: 0 });
    await ctx.settle(600);
    await ctx.shot("markets-search-nairobi", {
      selector: "#panel-markets",
      note: "Directory filtered to Nairobi, result list state.",
      // Named so a scene can frame the filtered results rather than the whole
      // panel. The campaign procurement film pushes in on `directoryList` to
      // show a market narrowed to its suppliers; without a region it would have
      // to frame by pixel coordinates, which is the thing this pipeline exists
      // to prevent.
      regions: {
        directory: "#atlas-dir",
        directoryList: "#atlas-dir-list",
        search: "#atlas-search",
      },
    });

    await page.fill("#atlas-search", "");
    await ctx.settle(400);

    // --- Trade & pricing ----------------------------------------------
    ctx.setRoute("/dashboard/trade");
    ctx.setInteraction("nav:Trade & pricing");
    await gotoPanel(page, "trade");
    await page.waitForSelector("#panel-trade.on");
    await ctx.settle(1200);
    await ctx.shot("trade-pricing", {
      note: "Price series and commodity benchmarks.",
      regions: {
        buy: ".tp-card-buy",
        cheapest: ".tp-card-cheap",
        corridors: ".tp-card-corr",
      },
    });

    // --- Alerts --------------------------------------------------------
    ctx.setRoute("/dashboard/alerts");
    ctx.setInteraction("nav:Alerts");
    await gotoPanel(page, "alerts");
    await page.waitForSelector("#panel-alerts.on");
    await ctx.settle(900);
    await ctx.shot("alerts", {
      note: "Supply and price risk alert cards.",
      regions: {
        price: "#al-card-al_001",
        foodSafety: "#al-card-al_003",
        weather: "#al-card-al_004",
        stack: "#al-hero-feed",
      },
    });

    // --- Market routes -------------------------------------------------
    ctx.setRoute("/dashboard/routes");
    ctx.setInteraction("nav:Market routes");
    await gotoPanel(page, "routes");
    await page.waitForSelector("#panel-routes.on");
    await settleMap(page).catch(() => undefined);
    await ctx.settle(600);
    await ctx.shot("routes", {
      note: "Corridor conditions between markets.",
      regions: { summary: "#mr-summary" },
    });

    // --- Weather & climate ---------------------------------------------
    ctx.setRoute("/dashboard/weather");
    ctx.setInteraction("nav:Weather & climate");
    await gotoPanel(page, "weather");
    await page.waitForSelector("#panel-weather.on");
    await ctx.settle(1200);
    await ctx.shot("weather", { note: "Environmental context layer." });

    // --- Core actors ----------------------------------------------------
    ctx.setRoute("/dashboard/actors");
    ctx.setInteraction("nav:Core actors");
    await gotoPanel(page, "actors");
    await page.waitForSelector("#panel-actors.on");
    await ctx.settle(900);
    await ctx.shot("actors", { note: "Verified actor network roster (fixture names)." });

    // --- API access ------------------------------------------------------
    ctx.setRoute("/dashboard/api");
    ctx.setInteraction("nav:API access");
    await gotoPanel(page, "api");
    await page.waitForSelector("#panel-api.on");
    await ctx.settle(900);
    await ctx.shot("api-access", {
      note: "Developer surface: base URL and key management.",
      regions: { keys: ".api-card-group" },
    });

    // Scroll to the request/response reference for the developer beat.
    ctx.setInteraction("scroll:#panel-api -> GET /prices");
    await page.evaluate(() => {
      document
        .querySelectorAll(".api-endpoint")[1]
        ?.scrollIntoView({ block: "center", behavior: "instant" as ScrollBehavior });
    });
    await ctx.settle(500);
    await ctx.shot("api-prices-endpoint", {
      note: "GET /prices request and 200 response shape.",
      regions: { endpoint: ".api-endpoint >> nth=1" },
    });
  },
};
