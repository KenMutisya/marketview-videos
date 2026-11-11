/**
 * The campaign films carry constraints the rest of the studio does not, and
 * every one of them is the kind that fails silently: a film 0.2s too long is
 * still a valid file, a caption whose timing is missing simply does not draw,
 * and a voiceover line that runs past its scene still plays. None of that
 * shows up in a render that exits 0, so it is asserted here instead.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { FILMS, filmFrames } from "../src/rendering/films";
import { FORMATS } from "../src/types/format";
import { sceneFrames, transitionFrames } from "../src/types/storyboard";
import { getNarrationTiming, type NarrationCue } from "../src/utils/narration";
import { marketviewProduct } from "../src/products/marketview";

/** The three films commissioned by the campaign brief. */
const CAMPAIGN = ["ProcurementFilm", "ExpansionFilm", "RepAgriFilm"];

const campaignFilms = () => {
  const films = FILMS.filter((f) => CAMPAIGN.includes(f.id));
  assert.equal(films.length, CAMPAIGN.length, "a campaign film is missing from FILMS");
  return films;
};

test("every campaign film is exactly 60.000s", () => {
  for (const film of campaignFilms()) {
    const fps = FORMATS[film.storyboard.format].fps;
    assert.equal(
      filmFrames(film),
      60 * fps,
      `${film.id} is ${(filmFrames(film) / fps).toFixed(3)}s. WhatsApp status truncates a ` +
        "status video at 60 seconds, so anything longer loses its own end card.",
    );
  }
});

test("every campaign film is vertical", () => {
  for (const film of campaignFilms()) {
    assert.equal(
      film.storyboard.format,
      "vertical",
      `${film.id} is ${film.storyboard.format}; the campaign ships 9:16 only`,
    );
  }
});

test("every spoken line has a caption cue", () => {
  for (const film of campaignFilms()) {
    const timing = getNarrationTiming(film.storyboard.id);
    assert.ok(timing, `${film.id} has no narration timing — run \`npm run narrate\``);

    for (const scene of film.storyboard.scenes) {
      for (const [index, line] of scene.voiceover.entries()) {
        const cue: NarrationCue | undefined = timing.cues.find(
          (c) => c.sceneId === scene.id && c.index === index,
        );
        assert.ok(cue, `${film.id}/${scene.id}[${index}] is spoken but has no caption cue`);
        assert.equal(
          cue.text,
          line.text,
          `${film.id}/${scene.id}[${index}]: the caption and the voiceover have drifted apart. ` +
            "Re-run `npm run narrate` after changing a line.",
        );
      }
    }
  }
});

test("no caption outlives the scene it belongs to", () => {
  for (const film of campaignFilms()) {
    const timing = getNarrationTiming(film.storyboard.id);
    assert.ok(timing);
    const fps = FORMATS[film.storyboard.format].fps;

    // Absolute start frame of every scene, accounting for transition overlap.
    const starts: number[] = [];
    let cursor = 0;
    film.storyboard.scenes.forEach((scene, i) => {
      starts.push(cursor);
      cursor += sceneFrames(scene, fps);
      if (i < film.storyboard.scenes.length - 1) {
        cursor -= transitionFrames(scene.transitionOut, fps);
      }
    });

    for (const cue of timing.cues) {
      const i = film.storyboard.scenes.findIndex((s) => s.id === cue.sceneId);
      assert.ok(i >= 0, `${film.id}: cue for unknown scene "${cue.sceneId}"`);
      const start = starts[i];
      const end = start + sceneFrames(film.storyboard.scenes[i], fps);
      assert.ok(
        cue.startFrame >= start && cue.endFrame <= end,
        `${film.id}/${cue.sceneId}[${cue.index}] runs ${cue.startFrame}–${cue.endFrame}, ` +
          `outside its scene (${start}–${end}). The voice would talk across the cut.`,
      );
    }
  }
});

test("captions do not overlap each other", () => {
  for (const film of campaignFilms()) {
    const timing = getNarrationTiming(film.storyboard.id);
    assert.ok(timing);
    const cues = [...timing.cues].sort((a, b) => a.startFrame - b.startFrame);
    for (let i = 1; i < cues.length; i += 1) {
      assert.ok(
        cues[i].startFrame >= cues[i - 1].endFrame,
        `${film.id}: "${cues[i - 1].text.slice(0, 32)}…" and "${cues[i].text.slice(0, 32)}…" ` +
          "overlap; two captions cannot be on screen at once",
      );
    }
  }
});

test("every campaign film ends on the campaign call to action", () => {
  for (const film of campaignFilms()) {
    const close = film.storyboard.scenes[film.storyboard.scenes.length - 1];
    assert.ok(close && close.kind === "closing", `${film.id} does not end on a closing scene`);
    assert.equal(close.cta, marketviewProduct.campaign.cta);
    assert.equal(close.website, marketviewProduct.campaign.website);
  }
});

test("partner names are carried but gated until permission is confirmed", () => {
  for (const film of campaignFilms()) {
    const close = film.storyboard.scenes[film.storyboard.scenes.length - 1];
    assert.ok(close && close.kind === "closing");
    assert.deepEqual(
      close.partners,
      [...marketviewProduct.campaign.partners],
      `${film.id} carries a different partner list from the product profile`,
    );
  }
  // Not an assertion about what the answer should be — a reminder that the
  // flag is what decides, so flipping it is a deliberate, reviewable act.
  assert.equal(
    typeof marketviewProduct.campaign.partnersCleared,
    "boolean",
    "partnersCleared must stay an explicit decision",
  );
});

test("no campaign film calls the mapped footprint 'verified'", () => {
  // The fact sheet's ~498k is a mapped population; the verified network is
  // three orders of magnitude smaller. Mixing the two would overstate the
  // product in the one place it is hardest to retract: an advertisement.
  const mapped = /498|500,000|half a million/i;
  for (const film of campaignFilms()) {
    for (const scene of film.storyboard.scenes) {
      const strings: string[] = scene.voiceover.map((v) => v.text);
      if (scene.kind === "closing") {
        strings.push(...scene.stats.map((s) => `${s.value} ${s.label}`));
      }
      for (const s of strings) {
        if (!mapped.test(s)) continue;
        assert.ok(
          !/verified/i.test(s),
          `${film.id}/${scene.id} describes the mapped footprint as verified: "${s}"`,
        );
      }
    }
  }
});
