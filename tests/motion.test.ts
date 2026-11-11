import assert from "node:assert/strict";
import { test } from "node:test";
import { rand, randRange, randSeries } from "../src/utils/seed";
import { fitSize } from "../src/typography/fit";
import { samplePoints } from "../scripts/qa/frames";
import { FILMS } from "../src/rendering/films";
import { FORMATS } from "../src/types/format";
import { buildChatTimeline, getTranscript, parseRepCards } from "../src/utils/transcripts";

test("seeded randomness is stable across calls", () => {
  assert.equal(rand("a"), rand("a"));
  assert.notEqual(rand("a"), rand("b"));
  assert.deepEqual(randSeries("x", 5), randSeries("x", 5));
});

test("seeded randomness stays in range", () => {
  for (let i = 0; i < 500; i += 1) {
    const v = rand(`seed-${i}`);
    assert.ok(v >= 0 && v < 1, `rand out of range: ${v}`);
    const r = randRange(`seed-${i}`, -3, 7);
    assert.ok(r >= -3 && r < 7, `randRange out of range: ${r}`);
  }
});

test("headline sizing shrinks long lines and never exceeds the cap", () => {
  const cap = 128;
  const short = fitSize(["Short"], 1200, cap);
  const long = fitSize(["A considerably longer headline than that one"], 1200, cap);
  assert.equal(short, cap);
  assert.ok(long < short);
  assert.ok(long >= cap * 0.42);
});

test("headline sizing uses the longest line, not the first", () => {
  const a = fitSize(["Hi", "A considerably longer line goes here"], 1200, 128);
  const b = fitSize(["A considerably longer line goes here"], 1200, 128);
  assert.equal(a, b);
});

test("frame sampling covers every scene and stays in range", () => {
  for (const film of FILMS) {
    const fps = FORMATS[film.storyboard.format].fps;
    const points = samplePoints(film.storyboard, fps);
    const labels = points.map((p) => p.label).join(" ");
    for (const scene of film.storyboard.scenes) {
      assert.ok(labels.includes(scene.id), `${film.id}: no sample covers scene ${scene.id}`);
    }
    assert.equal(points[0].frame, 0);
    const frames = points.map((p) => p.frame);
    assert.deepEqual(frames, [...frames].sort((a, b) => a - b), "samples are not ordered");
    assert.equal(new Set(frames).size, frames.length, "duplicate sample frames");
  }
});

test("the Rep's sourcing reply parses into cards with prices", () => {
  const turn = getTranscript("rep-whatsapp").turns.find((t) => t.cards.length > 0);
  assert.ok(turn, "no turn in the captured transcript carries listing cards");
  assert.ok(turn.cards.length >= 1);
  for (const card of turn.cards) {
    assert.match(card.price ?? "", /^(KES|NGN|USD)\s/, "a listing card has no price");
    assert.ok(card.detail.length >= 2, "a listing card has no detail lines");
  }
  // Chat-UI plumbing must not leak into the film.
  const joined = JSON.stringify(turn.cards);
  assert.doesNotMatch(joined, /full number shared/);
  assert.doesNotMatch(joined, /On the tool:/);
});

test("parseRepCards leaves an ordinary reply alone", () => {
  const plain = "Prices per bag vary by product and vendor.";
  const { cards, lead } = parseRepCards(plain);
  assert.equal(cards.length, 0);
  assert.equal(lead, plain);
});

test("the chat timeline is ordered and gives the Rep thinking time", () => {
  const turns = getTranscript("rep-whatsapp").turns.slice(0, 8);
  const { beats, totalFrames } = buildChatTimeline(turns, 30);
  assert.equal(beats.length, turns.length);
  assert.ok(totalFrames > 0);
  for (let i = 1; i < beats.length; i += 1) {
    assert.ok(beats[i].at >= beats[i - 1].at, "beats are out of order");
  }
  for (const beat of beats) {
    if (beat.turn.role === "rep") {
      assert.ok(beat.typingAt !== null && beat.typingAt < beat.at, "no typing beat before a reply");
    } else {
      assert.equal(beat.typingAt, null);
    }
  }
});
