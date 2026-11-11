import assert from "node:assert/strict";
import { test } from "node:test";
import {
  defineStoryboard,
  sceneFrames,
  storyboardFrames,
  transitionFrames,
} from "../src/types/storyboard";
import { FILMS, filmFrames } from "../src/rendering/films";
import { FORMATS } from "../src/types/format";

const minimal = {
  id: "t",
  title: "t",
  template: "problemSolution" as const,
  productId: "marketview",
  brandId: "marketview",
  format: "wide" as const,
  scenes: [
    { id: "a", kind: "statement" as const, purpose: "p", seconds: 2, lines: ["one"] },
    { id: "b", kind: "statement" as const, purpose: "p", seconds: 2, lines: ["two"] },
  ],
};

test("a transition shortens the film by its own length", () => {
  const noTransition = defineStoryboard(minimal);
  assert.equal(storyboardFrames(noTransition, 30), 120);

  const withTransition = defineStoryboard({
    ...minimal,
    scenes: [
      { ...minimal.scenes[0], transitionOut: { kind: "fade" as const, seconds: 0.5 } },
      minimal.scenes[1],
    ],
  });
  assert.equal(storyboardFrames(withTransition, 30), 120 - 15);
});

test("a cut does not shorten the film", () => {
  const sb = defineStoryboard({
    ...minimal,
    scenes: [
      { ...minimal.scenes[0], transitionOut: { kind: "cut" as const, seconds: 0.5 } },
      minimal.scenes[1],
    ],
  });
  assert.equal(transitionFrames({ kind: "cut", seconds: 0.5 }, 30), 0);
  assert.equal(storyboardFrames(sb, 30), 120);
});

test("a transition on the final scene is ignored", () => {
  const sb = defineStoryboard({
    ...minimal,
    scenes: [
      minimal.scenes[0],
      { ...minimal.scenes[1], transitionOut: { kind: "fade" as const, seconds: 0.5 } },
    ],
  });
  assert.equal(storyboardFrames(sb, 30), 120);
});

test("defineStoryboard reports the path of an invalid field", () => {
  assert.throws(
    () =>
      defineStoryboard({
        ...minimal,
        scenes: [{ ...minimal.scenes[0], seconds: -1 }],
      }),
    /scenes\.0\.seconds/,
  );
});

test("defineStoryboard rejects an unknown scene kind", () => {
  assert.throws(
    () =>
      defineStoryboard({
        ...minimal,
        // @ts-expect-error deliberately invalid: this is what the guard is for
        scenes: [{ id: "x", kind: "explosion", purpose: "p", seconds: 2 }],
      }),
    /Invalid storyboard/,
  );
});

test("every scene duration lands on a whole frame", () => {
  for (const film of FILMS) {
    const fps = FORMATS[film.storyboard.format].fps;
    for (const scene of film.storyboard.scenes) {
      assert.equal(
        Math.abs(scene.seconds * fps - sceneFrames(scene, fps)) < 1e-9,
        true,
        `${film.id}/${scene.id} is ${scene.seconds}s, which is not a whole number of frames at ${fps}fps`,
      );
    }
  }
});

test("the reference edition is exactly 30 seconds", () => {
  const launch = FILMS.find((f) => f.id === "LaunchFilm");
  assert.ok(launch);
  assert.equal(filmFrames(launch), 900);
});

test("every film has a non-zero duration and a stated purpose per scene", () => {
  for (const film of FILMS) {
    assert.ok(filmFrames(film) > 0, `${film.id} has no frames`);
    for (const scene of film.storyboard.scenes) {
      assert.ok(scene.purpose.length > 10, `${film.id}/${scene.id} has no stated purpose`);
    }
  }
});
