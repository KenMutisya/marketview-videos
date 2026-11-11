import repWhatsapp from "../../public/assets/transcripts/rep-whatsapp.json";
import repAgribusiness from "../../public/assets/transcripts/rep-agribusiness.json";
import repAgribusinessHausa from "../../public/assets/transcripts/rep-agribusiness-hausa.json";

/** A seller/price card the Rep returned inside a reply. */
export type ChatCard = {
  tag: string | null;
  heading: string | null;
  detail: string[];
  price: string | null;
  notes: string[];
};

export type ChatTurn = {
  role: "user" | "rep";
  text: string;
  cards: ChatCard[];
  warning: string | null;
  buttons: string[];
  time: string;
};

export type Transcript = {
  capturedAt: string;
  engine: string;
  testNumber: string;
  country: string;
  turns: ChatTurn[];
};

/**
 * Parses the Rep's sourcing reply into cards.
 *
 * The Rep answers a sourcing question with structured HTML, but the preview
 * console flattens it to text before it reaches the DOM, so the structure has
 * to be recovered here. Doing it at load time rather than in the scene keeps
 * the parsing testable and means a change in the Rep's reply format fails in
 * `npm test` rather than in a frame.
 *
 * Lines that exist for the chat UI rather than the viewer — profile-completion
 * meta, "full number shared once you both agree" — are dropped.
 */
const OFFER = /^Offer\s+\d+\s*·/;
const PRICE = /^(KES|NGN|USD)\s/;
const NOISE = /^(On the tool:|full number shared|📞|ℹ️|Chatbot user|Call centre|Survey)/i;

export const parseRepCards = (text: string): { lead: string; cards: ChatCard[]; tail: string } => {
  const lines = text.split("\n").map((l) => l.trim());
  const firstOffer = lines.findIndex((l) => OFFER.test(l));
  if (firstOffer === -1) return { lead: text, cards: [], tail: "" };

  const lead = lines
    .slice(0, firstOffer)
    .filter((l) => l && !NOISE.test(l))
    .join("\n");

  const cards: ChatCard[] = [];
  let current: ChatCard | null = null;
  const tail: string[] = [];
  let seenAllOffers = false;

  for (const line of lines.slice(firstOffer)) {
    if (OFFER.test(line)) {
      if (current) cards.push(current);
      current = { tag: null, heading: line, detail: [], price: null, notes: [] };
      continue;
    }
    if (!current) continue;
    if (PRICE.test(line)) {
      current.price = line;
      // Everything after the last offer's price that is not another offer is
      // the Rep's closing sentence, not part of a card.
      seenAllOffers = true;
      continue;
    }
    if (!line || NOISE.test(line)) continue;
    if (seenAllOffers && current.price) {
      tail.push(line);
      continue;
    }
    current.detail.push(line);
  }
  if (current) cards.push(current);

  // Join the variety/quantity fragments the console split across lines.
  for (const card of cards) {
    const merged: string[] = [];
    for (const d of card.detail) {
      if (d.startsWith("·") && merged.length) merged[merged.length - 1] += ` ${d}`;
      else if (d.startsWith("(") && merged.length) merged[merged.length - 1] += ` ${d}`;
      else merged.push(d);
    }
    card.detail = merged;
  }

  return { lead, cards, tail: tail.join("\n") };
};

/** Attaches parsed cards to any Rep turn that contains listings. */
const withParsedCards = (t: Transcript): Transcript => ({
  ...t,
  turns: t.turns.map((turn) => {
    if (turn.role !== "rep" || turn.cards.length > 0) return turn;
    const { lead, cards } = parseRepCards(turn.text);
    return cards.length > 0 ? { ...turn, text: lead, cards } : turn;
  }),
});

const TRANSCRIPTS: Record<string, Transcript> = {
  "rep-whatsapp": withParsedCards(repWhatsapp as Transcript),
  /**
   * An agribusiness buyer placed at Dawanau, asking a maize price in English.
   * The Rep has no price for Dawanau and says so, then names the markets where
   * it does — and the follow-up returns a real cheapest-first table.
   */
  "rep-agribusiness": withParsedCards(repAgribusiness as Transcript),
  /**
   * The same conversation, onboarded in Hausa.
   *
   * Worth knowing before writing a scene against it: the Rep's **onboarding is
   * genuinely Hausa** — consent, state, market, buy-or-sell and the product
   * menu all come back in Hausa — but the **price answer returns in English**.
   * The templated path is localised; the data-answer path is not. A film may
   * show the Hausa onboarding as evidence of language support. It may not
   * claim a Hausa price answer, because there isn't one.
   */
  "rep-agribusiness-hausa": withParsedCards(repAgribusinessHausa as Transcript),
};

export const getTranscript = (id: string): Transcript => {
  const t = TRANSCRIPTS[id];
  if (!t) {
    throw new Error(
      `Unknown transcript "${id}". Available: ${Object.keys(TRANSCRIPTS).join(", ")}. ` +
        "Run `npm run capture:rep` to record one.",
    );
  }
  return t;
};

/**
 * Turns a transcript slice into a timeline.
 *
 * Pacing is derived from the content rather than set per scene: a long reply
 * needs longer on screen than "Buying", and the Rep's thinking time before a
 * long answer is what makes the exchange read as a real conversation instead
 * of a slideshow of bubbles.
 */
export type ChatBeat = {
  turn: ChatTurn;
  index: number;
  /** Frame the bubble lands on. */
  at: number;
  /** Frame the typing indicator appears, for Rep turns. */
  typingAt: number | null;
};

export const buildChatTimeline = (
  turns: ChatTurn[],
  fps: number,
  options: { pace?: number; startFrame?: number } = {},
): { beats: ChatBeat[]; totalFrames: number } => {
  const pace = options.pace ?? 1;
  let cursor = options.startFrame ?? 0;
  const beats: ChatBeat[] = [];

  turns.forEach((turn, index) => {
    const words = turn.text.split(/\s+/).filter(Boolean).length + turn.cards.length * 22;
    // Reading time, bounded so neither a one-word reply nor a seller card
    // throws the pacing out.
    const dwell = Math.min(3.6, Math.max(0.85, words * 0.085)) * pace;

    if (turn.role === "rep") {
      const typingAt = cursor;
      // The Rep "thinks" for longer before a longer answer.
      cursor += Math.round(Math.min(0.9, 0.3 + words * 0.012) * fps * pace);
      beats.push({ turn, index, at: cursor, typingAt });
    } else {
      beats.push({ turn, index, at: cursor, typingAt: null });
    }
    cursor += Math.round(dwell * fps);
  });

  return { beats, totalFrames: cursor };
};
