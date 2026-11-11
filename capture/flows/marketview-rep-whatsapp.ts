/**
 * MarketView Rep — live WhatsApp conversation capture.
 *
 * Drives the Rep's WhatsApp preview console through onboarding, then asks the
 * questions a trader actually asks. Every reply is produced by the running Rep
 * service; with Vertex AI enabled those replies come from the live model.
 *
 * Safety: the console only ever uses reserved simulator numbers, which the
 * service never forwards to Meta. The flow deliberately avoids any action that
 * sends a real message — no "connect me to this buyer", no introductions — so
 * nothing leaves the machine but a Vertex API call.
 *
 * Output: `public/assets/transcripts/rep-whatsapp.json`.
 */
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import type { Flow } from "../helpers/types";
import { RepConsole, type RepTranscript } from "../helpers/rep-console";
import { captureConfig } from "../../configs/capture.config";

/**
 * What a trader asks. Chosen to exercise a different capability each time:
 * a price lookup, a cross-market comparison, a condition the Rep has to reason
 * about, and an open question that is not a menu item.
 */
/**
 * What the trader says, in order.
 *
 * "Buying" and "Onions" are what a WhatsApp list reply actually sends when the
 * user taps those options, which is how the Rep's grounded sourcing path is
 * entered. The preview console does not implement Meta's native list picker,
 * so the flow sends the same payload as text. The free-text follow-up then
 * shows the Rep handling a question that is not a menu item.
 */
export const REP_QUESTIONS = [
  "Buying",
  "Onions",
  "What are they asking per bag?",
];

export const marketviewRepWhatsapp: Flow = {
  id: "marketview-rep-whatsapp",
  description:
    "Live WhatsApp conversation with the MarketView Rep, captured as a transcript for deterministic replay.",
  viewport: { width: 1280, height: 980, deviceScaleFactor: 2 },
  url: captureConfig.sources.repConsole,
  // The console re-enables its quick replies on a timer; a frozen clock leaves
  // them disabled for ever. Bubble timestamps come from the transcript, so
  // nothing here needs a pinned clock.
  freezeClock: false,

  run: async (ctx) => {
    const { page } = ctx;
    const console_ = new RepConsole(page, captureConfig.repAdminToken);

    const health = await page.evaluate(async () => {
      const res = await fetch("/api/health");
      return (await res.json()) as { engine: string };
    });

    await console_.connect();
    await console_.setCountry("Kenya +254");
    await console_.newStranger();

    // --- Onboarding, as a first-time trader ---------------------------
    ctx.setRoute("/wa-preview · onboarding");
    await console_.send("Hi");
    await console_.reachBusiness({ county: "1", market: "Kangemi Market" });

    ctx.setInteraction("onboarding complete");
    await ctx.settle(400);
    await ctx.shot("rep-console-onboarding", {
      selector: ".thread",
      note: "Console state after onboarding; provenance for the transcript.",
    });

    const onboarding = await console_.transcript();

    // --- The real questions --------------------------------------------
    ctx.setRoute("/wa-preview · questions");
    for (const question of REP_QUESTIONS) {
      ctx.setInteraction(`ask: ${question}`);
      await console_.send(question);
    }

    await ctx.settle(500);
    await ctx.shot("rep-console-answers", {
      selector: ".thread",
      note: "Console state after the question sequence.",
    });

    const turns = await console_.transcript();

    const transcript: RepTranscript = {
      capturedAt: new Date().toISOString(),
      engine: health.engine,
      testNumber: "reserved simulator number (never sent to Meta)",
      country: "Kenya",
      turns,
    };

    const dir = path.resolve(process.cwd(), "public", "assets", "transcripts");
    await mkdir(dir, { recursive: true });
    await writeFile(
      path.join(dir, "rep-whatsapp.json"),
      JSON.stringify(transcript, null, 2) + "\n",
    );
    process.stdout.write(
      `  ✓ transcript: ${turns.length} turns (${onboarding.length} from onboarding) · engine: ${health.engine}\n`,
    );
  },
};
