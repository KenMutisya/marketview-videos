/**
 * MarketView Rep — agribusiness buyer, Nigeria.
 *
 * A second live conversation, captured for the "Rep, your AI market assistant"
 * campaign film. Where `marketview-rep-whatsapp` records a Kenyan trader being
 * onboarded and sourcing onions, this one records the questions an
 * **agribusiness buyer** asks, and records them twice: once in English and once
 * in Hausa.
 *
 * Output: `public/assets/transcripts/rep-agribusiness.json`
 *         `public/assets/transcripts/rep-agribusiness-hausa.json`
 *
 * ## Why two sessions
 *
 * The Rep holds one language per conversation, chosen at onboarding. Asking a
 * Hausa question inside an English session gets an English answer back — which
 * proves nothing about language support. A separate session onboarded in Hausa
 * is the only way to capture the Rep actually working in Hausa, so the film can
 * show it rather than assert it.
 *
 * ## What the data supports
 *
 * Dawanau is the grains hub the campaign brief names, and the Rep is placed
 * there. It has no maize price in this environment, and the Rep says so rather
 * than inventing one — then names the markets where it does hold maize prices.
 * The flow follows that offer instead of working around it: a buyer being told
 * "not here, but here" is a truthful beat and a better one than a fabricated
 * number. The second question then lands in markets that carry real
 * observations.
 *
 * ## Safety
 *
 * The console only ever uses reserved simulator numbers, and the capture runs
 * against a service started with `WHATSAPP_PROVIDER=fake`.
 *
 * **Every question below is read-only.** The Rep can be asked to introduce a
 * buyer to a seller, and that path sends an SMS through whatever `SMS_PROVIDER`
 * is configured — which on a developer's stack is frequently a live provider,
 * not `fake`. Nothing here taps "connect me", "confirm 1", or any affirmative
 * on an introduction prompt, and nothing should: a capture must never put a
 * message in a real person's hand.
 */
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import type { Flow, FlowContext } from "../helpers/types";
import { RepConsole, type RepTranscript } from "../helpers/rep-console";
import { captureConfig } from "../../configs/capture.config";

/** Where the buyer is placed. Dawanau is the grains hub the brief names. */
const PLACE = { county: "Kano", market: "Dawanau Market" };

/**
 * What an agribusiness buyer asks, in order.
 *
 * 1. A price lookup on a named commodity and market — the brief's headline use.
 * 2. Whatever the Rep offers next, followed rather than overridden.
 *
 * The brief also asks a separate "which market has the most supply" question.
 * It is deliberately not asked: the Rep reads a bare "around Kano" as a request
 * to move the session to another market, and answers about wherever it lands
 * rather than comparing. The cross-market answer the brief actually wants is
 * what the Rep volunteers here anyway — a cheapest-first table across five
 * markets with report counts and freshness — so the flow follows its offer
 * instead of asking a question that reads worse.
 */
export const AGRIBUSINESS_QUESTIONS = ["What is the price of maize in Dawanau this week?"];

/** The same class of question, asked by someone who works in Hausa. */
export const HAUSA_QUESTIONS = ["Nawa ne farashin masara a Dawanau wannan mako?"];

const writeTranscript = async (name: string, transcript: RepTranscript) => {
  const dir = path.resolve(process.cwd(), "public", "assets", "transcripts");
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, `${name}.json`), JSON.stringify(transcript, null, 2) + "\n");
};

/**
 * Clears the last onboarding prompt the Rep asks after it has placed you.
 *
 * `reachBusiness` stops as soon as the session has a market, which is the right
 * test for "the Rep knows where I am" but one turn short of "the Rep is ready
 * for my question": it still wants to know whether you are buying or selling.
 * Asking a price before answering that gets the product menu back instead of a
 * price, which is what the first attempt at this capture recorded.
 */
const ROLE_PROMPT = /buying or selling|saya ko sayarwa|unanunua au unauza/i;
const BUY = /^(buying|buy|saya|sayan|kana saya|ina saya|nunua)/i;

const clearRolePrompt = async (console_: RepConsole) => {
  const text = await console_.lastText();
  if (!ROLE_PROMPT.test(text)) return;
  const buttons = await console_.lastButtons();
  if (buttons.some((b) => b.trim().startsWith("☰"))) {
    await console_.chooseFromList([BUY]);
    return;
  }
  const usable = buttons.filter((b) => BUY.test(b));
  if (usable.length > 0) {
    await console_.tap(usable[0]);
    return;
  }
  await console_.send("Buying");
};

/**
 * A reply that is not an answer.
 *
 * The Rep is a live agent, and the same question does not always route the same
 * way: asked for a maize price it usually answers, but it sometimes returns a
 * clarifier instead. Re-asking once, and recording the whole exchange, is
 * honest — the transcript still contains only words the model produced, and the
 * retry is visible in it. What would not be honest is running the capture
 * repeatedly and keeping the prettiest result, so the flow retries in-session
 * rather than the operator retrying the flow.
 */
const CLARIFIER = /tell me a bit more|what can you do|what would you like|i did not understand/i;

const runSession = async (
  ctx: FlowContext,
  options: {
    label: string;
    languageCode: string;
    language: RegExp;
    questions: string[];
    shotId: string;
    shotNote: string;
    transcriptName: string;
    engine: string;
  },
) => {
  const console_ = new RepConsole(ctx.page, captureConfig.repAdminToken);

  await console_.setCountry("Nigeria +234");
  await console_.newStranger();

  ctx.setRoute(`/wa-preview · ${options.label} onboarding`);
  await console_.send("Hi");
  const inLanguage = await console_.ensureLanguage(options.languageCode, options.language);
  if (!inLanguage) {
    throw new Error(
      `Could not put the session into "${options.languageCode}"; the Rep stayed in another language.`,
    );
  }
  await console_.reachBusiness({ ...PLACE, language: options.language });
  await clearRolePrompt(console_);

  ctx.setRoute(`/wa-preview · ${options.label} questions`);
  for (const question of options.questions) {
    ctx.setInteraction(`ask: ${question}`);
    await console_.send(question);

    if (CLARIFIER.test(await console_.lastText())) {
      ctx.setInteraction(`re-ask: ${question}`);
      await console_.send(question);
    }

    // Follow whatever the Rep offers next rather than talking over it. When it
    // answers a price gap with "I do have prices in …", the useful next beat is
    // its own suggestion, not a scripted question that ignores it.
    const buttons = await console_.lastButtons();
    const follow = buttons.find((b) =>
      /nearby market|check nearby|other market|kasuwanni|kusa/i.test(b),
    );
    if (follow) {
      ctx.setInteraction(`tap: ${follow}`);
      await console_.tap(follow);
    }
  }

  await ctx.settle(500);
  await ctx.shot(options.shotId, {
    selector: ".thread",
    note: options.shotNote,
  });

  const turns = await console_.transcript();
  const facts = await console_.sessionFacts();

  await writeTranscript(options.transcriptName, {
    capturedAt: new Date().toISOString(),
    engine: options.engine,
    testNumber: "reserved simulator number (never sent to Meta)",
    country: "Nigeria",
    turns,
  });

  process.stdout.write(
    `  ✓ ${options.transcriptName}: ${turns.length} turns · language ${facts.Language ?? "?"} · market ${facts.Market ?? "?"}\n`,
  );
};

export const marketviewRepAgribusiness: Flow = {
  id: "marketview-rep-agribusiness",
  description:
    "Live WhatsApp conversations with the MarketView Rep, from an agribusiness buyer in Kano — English and Hausa.",
  viewport: { width: 1280, height: 980, deviceScaleFactor: 2 },
  url: captureConfig.sources.repConsole,
  freezeClock: false,

  run: async (ctx) => {
    const console_ = new RepConsole(ctx.page, captureConfig.repAdminToken);

    const health = await ctx.page.evaluate(async () => {
      const res = await fetch("/api/health");
      return (await res.json()) as { engine: string };
    });

    await console_.connect();

    await runSession(ctx, {
      label: "agribusiness (EN)",
      languageCode: "en",
      language: /english/i,
      questions: AGRIBUSINESS_QUESTIONS,
      shotId: "rep-agri-answers",
      shotNote: "Console state after the English agribusiness question sequence.",
      transcriptName: "rep-agribusiness",
      engine: health.engine,
    });

    await runSession(ctx, {
      label: "agribusiness (HA)",
      languageCode: "ha",
      language: /hausa/i,
      questions: HAUSA_QUESTIONS,
      shotId: "rep-agri-hausa",
      shotNote: "Console state after the Hausa question; provenance for the language beat.",
      transcriptName: "rep-agribusiness-hausa",
      engine: health.engine,
    });
  },
};
