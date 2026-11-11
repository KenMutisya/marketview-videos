/**
 * Driver for the MarketView Rep WhatsApp preview console.
 *
 * The console (`services/rep-chatbot/public/wa-preview.html`) runs the *real*
 * WhatsApp turn against reserved test numbers that are never sent to Meta. With
 * the service started against Vertex AI, the replies captured here are genuine
 * live model output, not fixtures.
 *
 * The conversation is recorded as a transcript rather than as screenshots. A
 * live model answers differently every run, so replaying a captured transcript
 * is the only way to get a film that renders identically twice — and it lets
 * the chat be drawn at any resolution instead of being an upscaled screenshot.
 */
import type { Page } from "playwright";

/**
 * A seller or price card inside a Rep reply.
 *
 * The Rep answers a sourcing question with structured HTML, not a sentence:
 * a listing card per offer, with variety, quantity, market, seller, rating and
 * price. Parsing it here means the film can draw a real card instead of a wall
 * of text, and keeps the numbers traceable to the reply they came from.
 */
export type ChatCard = {
  tag: string | null;
  heading: string | null;
  detail: string[];
  price: string | null;
  notes: string[];
};

export type ChatTurn = {
  role: "user" | "rep";
  /** Plain text of the bubble, with the timestamp removed. */
  text: string;
  /** Structured cards parsed out of the reply, if any. */
  cards: ChatCard[];
  /** A leading advisory the Rep shows above cards. */
  warning: string | null;
  /** Quick-reply buttons the Rep offered with this message. */
  buttons: string[];
  /** Clock shown on the bubble in the console. */
  time: string;
};

/**
 * Reads a bubble's text without its timestamp. `.bubble > div` is not reliable:
 * a rich reply puts its first text inside a nested advisory box, so the first
 * child can be empty or partial.
 */
const BUBBLE_TEXT = `(row) => {
  const bubble = row.querySelector('.bubble');
  if (!bubble) return '';
  const clone = bubble.cloneNode(true);
  clone.querySelectorAll('.meta').forEach((m) => m.remove());
  // The clone is detached, so innerText collapses <br> and block boundaries.
  // Replace them with real newlines before reading, or every reply comes back
  // as one run-on line.
  clone.querySelectorAll('br').forEach((br) => br.replaceWith('\\n'));
  clone.querySelectorAll('div,p,li').forEach((el) => el.append('\\n'));
  return (clone.textContent || '')
    .replace(/\\n{3,}/g, '\\n\\n')
    .split('\\n')
    .map((l) => l.trim())
    .filter((l, i, a) => l.length > 0 || (i > 0 && a[i - 1].length > 0))
    .join('\\n')
    .trim();
}`;

export type RepTranscript = {
  capturedAt: string;
  /** What the Rep service reported as its engine, e.g. "Vertex AI · …". */
  engine: string;
  /** Reserved simulator number; never a real subscriber. */
  testNumber: string;
  country: string;
  turns: ChatTurn[];
};

const REPLY_TIMEOUT_MS = 45_000;

export class RepConsole {
  constructor(
    private readonly page: Page,
    private readonly adminToken: string,
  ) {}

  /**
   * Authenticates the console.
   *
   * The console reports a failure by un-hiding a notice and hiding the whole
   * app, which a flow cannot see: every later step then operates on a dead
   * page and the run still exits 0 with an empty transcript. The two ways this
   * actually happens are a wrong `ADMIN_API_TOKEN` (401) and a service started
   * without `WHATSAPP_SIMULATOR=true` (404, the simulator routes are simply not
   * mounted), so the notice text is re-raised here as an error.
   */
  async connect(): Promise<void> {
    await this.page.fill("#tok", this.adminToken);
    await this.page.click('button:has-text("Connect")');
    await this.page.waitForTimeout(1000);

    const notice = await this.page.evaluate(() => {
      const el = document.getElementById("notice");
      if (!el || (el as HTMLElement).hidden) return null;
      return (el.textContent ?? "").trim();
    });
    if (notice) {
      throw new Error(
        `The Rep preview console refused the connection: ${notice}\n` +
          "Set REP_ADMIN_TOKEN to the service's ADMIN_API_TOKEN, and start the Rep with " +
          "WHATSAPP_SIMULATOR=true. See docs/CAPTURE_WORKFLOW.md.",
      );
    }
  }

  async setCountry(country: string): Promise<void> {
    await this.page.selectOption("#country", { label: country });
  }

  /**
   * Moves to a number the Rep has never seen, so onboarding runs from the top.
   * Retries until the thread is genuinely empty: sessions survive between runs,
   * and starting a scripted capture on a half-finished thread is how a flow
   * ends up tapping a button that is no longer on screen.
   */
  async newStranger(attempts = 4): Promise<void> {
    for (let i = 0; i < attempts; i += 1) {
      await this.page.click('button:has-text("New stranger")');
      await this.page.waitForTimeout(1200);
      if ((await this.rowCount()) === 0) return;
    }
    throw new Error("Could not reach an empty thread; clear the Rep's session store.");
  }

  /** Restarts the thread on the same number, as after the 24-hour window lapses. */
  async newConversation(): Promise<void> {
    await this.page.click('button:has-text("New conversation")');
    await this.page.waitForTimeout(1500);
  }

  private async rowCount(): Promise<number> {
    return this.page.evaluate(() => document.querySelectorAll(".thread .row").length);
  }

  /**
   * Waits for the Rep to answer. A live model takes an unpredictable amount of
   * time, so this polls for a new outbound row rather than sleeping a guessed
   * duration — the same discipline the product captures use.
   *
   * **The typing indicator is also a `.row.out`.** The console renders it as
   * `<div class="row out"><div class="bubble typing">` the moment the turn is
   * in flight, so a check for "the last row is outbound" is satisfied by the
   * three bouncing dots and returns before the Rep has said anything. The
   * driver then races ahead and the console drops every following send, because
   * its own `send()` returns early while `sending` is true. That failure is
   * silent: the flow completes, writes a transcript, and the transcript is
   * empty. Excluding the typing bubble is what makes the wait mean what it says.
   */
  private async waitForReply(previousRows: number): Promise<void> {
    await this.page.waitForFunction(
      (n: number) => {
        const rows = document.querySelectorAll(".thread .row");
        if (rows.length <= n) return false;
        const last = rows[rows.length - 1];
        if (!last.classList.contains("out")) return false;
        return !last.querySelector(".bubble.typing");
      },
      previousRows,
      { timeout: REPLY_TIMEOUT_MS },
    );
    // Let any follow-up bubble in the same turn land before reading.
    await this.page.waitForTimeout(900);
  }

  async send(text: string): Promise<void> {
    const before = await this.rowCount();
    await this.page.fill("#draft", text);
    await this.page.press("#draft", "Enter");
    await this.waitForReply(before + 1);
  }

  /**
   * The console disables quick replies while a turn is in flight and leaves
   * answered ones disabled for good, so a tap has to wait for the button to
   * become enabled rather than merely visible.
   */
  private async clickWhenEnabled(
    locator: ReturnType<Page["locator"]>,
    timeout = 20_000,
  ): Promise<void> {
    const deadline = Date.now() + timeout;
    for (;;) {
      if (await locator.isEnabled().catch(() => false)) {
        await locator.click({ timeout: 5_000 });
        return;
      }
      if (Date.now() > deadline) {
        throw new Error("Quick reply never became enabled; the Rep may not have replied.");
      }
      await this.page.waitForTimeout(250);
    }
  }

  /** Taps a quick-reply button by its visible label. */
  async tap(label: string): Promise<void> {
    const before = await this.rowCount();
    const button = this.page
      .locator(".thread .row")
      .last()
      .locator(".buttons button", { hasText: label })
      .first();
    await this.clickWhenEnabled(button);
    await this.waitForReply(before + 1);
  }

  /** Taps whichever quick reply is offered first; used to walk onboarding. */
  async tapFirst(): Promise<string> {
    const before = await this.rowCount();
    const button = this.page.locator(".thread .row").last().locator(".buttons button").first();
    const label = (await button.textContent())?.trim() ?? "";
    await this.clickWhenEnabled(button);
    await this.waitForReply(before + 1);
    return label;
  }

  /**
   * Opens a WhatsApp list picker and taps one of its rows.
   *
   * A `list` message renders as a single "☰ <label>" button that opens a sheet;
   * the real options live inside it. A driver that only ever reads the buttons
   * on a row therefore sees one meaningless label — "☰ Choose" — and never the
   * choice being offered, whether that is a language, a state or a product.
   *
   * Returns the label of the row that was tapped.
   */
  async chooseFromList(prefer: RegExp[] = []): Promise<string> {
    const before = await this.rowCount();
    const opener = this.page
      .locator(".thread .row")
      .last()
      .locator('.buttons button:text-matches("^☰")')
      .first();
    await this.clickWhenEnabled(opener);
    await this.page.waitForSelector("#sheet:not([hidden]) .sheet-row", { timeout: 10_000 });

    const labels = await this.page.evaluate(() =>
      Array.from(document.querySelectorAll("#sheet .sheet-row")).map((b) =>
        (b.textContent ?? "").trim(),
      ),
    );
    const choice =
      prefer.map((re) => labels.find((l) => re.test(l))).find((l): l is string => Boolean(l)) ??
      labels[0];
    if (!choice) throw new Error("The list picker opened with no rows.");

    await this.page.locator("#sheet .sheet-row", { hasText: choice }).first().click();
    await this.waitForReply(before + 1);
    return choice;
  }

  /** Rows the latest list picker offers, without tapping anything. */
  async listRows(): Promise<string[]> {
    const hasList = await this.page.evaluate(() => {
      const rows = document.querySelectorAll(".thread .row");
      const last = rows[rows.length - 1];
      if (!last) return false;
      return Array.from(last.querySelectorAll(".buttons button")).some((b) =>
        (b.textContent ?? "").trim().startsWith("☰"),
      );
    });
    if (!hasList) return [];
    const opener = this.page
      .locator(".thread .row")
      .last()
      .locator('.buttons button:text-matches("^☰")')
      .first();
    await this.clickWhenEnabled(opener);
    await this.page.waitForSelector("#sheet:not([hidden]) .sheet-row", { timeout: 10_000 });
    const labels = await this.page.evaluate(() =>
      Array.from(document.querySelectorAll("#sheet .sheet-row")).map((b) =>
        (b.textContent ?? "").trim(),
      ),
    );
    await this.page.evaluate(() => {
      const sheet = document.getElementById("sheet");
      if (sheet) (sheet as HTMLElement).hidden = true;
    });
    return labels;
  }

  /**
   * The session facts the console shows beside the thread: stage, language,
   * country, market, role, name.
   *
   * This is the Rep's own view of who it thinks it is talking to, which is a
   * far better stopping condition for onboarding than guessing from a button
   * label. Onboarding is finished when the Rep has placed the user in a market.
   */
  async sessionFacts(): Promise<Record<string, string>> {
    return this.page.evaluate(() => {
      const facts: Record<string, string> = {};
      const dl = document.getElementById("facts");
      if (!dl) return facts;
      const terms = Array.from(dl.querySelectorAll("dt"));
      for (const dt of terms) {
        const dd = dt.nextElementSibling;
        if (dd && dd.tagName === "DD") {
          facts[(dt.textContent ?? "").trim()] = (dd.textContent ?? "").trim();
        }
      }
      return facts;
    });
  }

  /**
   * Puts the conversation into a language and confirms it took.
   *
   * The Rep does not always open with "What language would you like to talk
   * in?" — whether it asks depends on the value-opening flag and on what it can
   * infer, so a flow that only answers the question when it appears gets an
   * English session on the runs where it does not. Every consent message also
   * carries a "🌐 Change language" button, which is the reliable way in.
   *
   * `code` is the session language the console reports ("en", "ha", "sw").
   */
  async ensureLanguage(code: string, label: RegExp): Promise<boolean> {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const facts = await this.sessionFacts();
      if ((facts.Language ?? "").toLowerCase() === code) return true;

      const buttons = await this.lastButtons();
      const changer = buttons.find((b) => /change language|🌐/i.test(b));
      if (changer) {
        await this.tap(changer);
        continue;
      }
      if (buttons.some((b) => b.trim().startsWith("☰"))) {
        const rows = await this.listRows();
        if (rows.some((r) => label.test(r))) {
          await this.chooseFromList([label]);
          continue;
        }
      }
      const text = await this.lastText();
      if (/language|harshe/i.test(text)) {
        await this.send(label.source.replace(/[^a-z]/gi, ""));
        continue;
      }
      return false;
    }
    const facts = await this.sessionFacts();
    return (facts.Language ?? "").toLowerCase() === code;
  }

  /** Labels of the quick replies the latest message still offers. */
  async lastButtons(): Promise<string[]> {
    return this.page.evaluate(() => {
      const rows = document.querySelectorAll(".thread .row");
      const last = rows[rows.length - 1];
      if (!last) return [];
      return Array.from(last.querySelectorAll(".buttons button"))
        .filter((b) => !(b as HTMLButtonElement).disabled)
        .map((b) => (b.textContent ?? "").trim());
    });
  }

  async lastText(): Promise<string> {
    return this.page.evaluate((src: string) => {
      const read = new Function(`return ${src}`)() as (row: Element) => string;
      const rows = document.querySelectorAll(".thread .row");
      const last = rows[rows.length - 1];
      return last ? read(last) : "";
    }, BUBBLE_TEXT);
  }

  /**
   * Walks whatever onboarding the Rep presents until it is ready to answer
   * questions.
   *
   * Written as a loop over the *current* state rather than as a fixed script:
   * the Rep is a live agent whose stages differ by country, by whether it has
   * seen the number before, and by what the model decides to ask. A script that
   * assumes "the second message has an English button" breaks the first time
   * any of that changes.
   */
  async reachBusiness(
    answers: { county: string; market: string; language?: RegExp },
    maxSteps = 16,
  ): Promise<void> {
    const language = answers.language ?? /english/i;
    const preferred = [language, /yes,? proceed/i, /check prices/i];
    const isListOpener = (label: string) => label.trim().startsWith("☰");

    /**
     * Onboarding is over when the Rep has placed the user in a market. Reading
     * that from the console's own session panel is the only honest test: the
     * Rep is a live agent whose stages differ by country, by whether it has
     * seen the number, and by what the model decides to ask next, so any
     * stopping rule written against a specific button label is a rule about
     * one recording rather than about the product.
     */
    const placed = async () => {
      const facts = await this.sessionFacts();
      const market = facts.Market ?? "—";
      return market !== "—" && market !== "" && market.toLowerCase() !== "null";
    };

    for (let step = 0; step < maxSteps; step += 1) {
      if (await placed()) return;

      const buttons = await this.lastButtons();

      // A list picker hides the real options behind one "☰ …" button. Open it
      // and choose from inside, rather than treating the opener as an answer.
      if (buttons.length > 0 && buttons.every(isListOpener)) {
        const rows = await this.listRows();
        if (rows.length === 0) return;
        const prefer = [
          ...preferred,
          new RegExp(answers.market.split(" ")[0], "i"),
          new RegExp(answers.county, "i"),
        ];
        await this.chooseFromList(prefer);
        continue;
      }

      if (buttons.length > 0) {
        const usable = buttons.filter((b) => !isListOpener(b));
        if (usable.length > 0) {
          const match = preferred
            .map((re) => usable.find((b) => re.test(b)))
            .find((b): b is string => Boolean(b));
          await this.tap(match ?? usable[0]);
          continue;
        }
      }

      const text = await this.lastText();
      if (/language/i.test(text) && !/which market/i.test(text)) {
        await this.send("English");
        continue;
      }
      if (/state or county|county are you|which state/i.test(text)) {
        await this.send(answers.county);
        continue;
      }
      if (/which market|market are you|nearest market|nearest town/i.test(text)) {
        await this.send(answers.market);
        continue;
      }
      if (/buying or selling/i.test(text)) {
        await this.send("Buying");
        continue;
      }
      // No buttons and no question we recognise: the Rep is waiting on us.
      return;
    }
    throw new Error("Onboarding did not settle; the Rep kept presenting new stages.");
  }

  async transcript(): Promise<ChatTurn[]> {
    return this.page.evaluate((src: string) => {
      const read = new Function(`return ${src}`)() as (row: Element) => string;
      const txt = (el: Element | null) => (el as HTMLElement | null)?.innerText?.trim() ?? null;
      return Array.from(document.querySelectorAll(".thread .row")).map((row) => {
        const cards = Array.from(row.querySelectorAll(".listing-card")).map((card) => ({
          tag: txt(card.querySelector(".tag")),
          heading: txt(card.querySelector(".lc-product")),
          detail: (txt(card.querySelector(".lc-detail")) ?? "")
            .split("\n")
            .map((l) => l.trim())
            .filter(Boolean),
          price: txt(card.querySelector(".lc-price")),
          notes: Array.from(card.querySelectorAll(".lc-note"))
            .map((n) => txt(n) ?? "")
            .filter(Boolean),
        }));
        return {
          role: row.classList.contains("out") ? ("rep" as const) : ("user" as const),
          text: read(row),
          cards,
          warning: txt(row.querySelector(".warn-box")),
          buttons: Array.from(row.querySelectorAll(".buttons button")).map((b) =>
            (b.textContent ?? "").trim(),
          ),
          time: (row.querySelector(".meta")?.textContent ?? "").trim(),
        };
      });
    }, BUBBLE_TEXT);
  }
}
