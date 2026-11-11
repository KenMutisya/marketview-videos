import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { validate } from "../scripts/validate";
import { captureManifest, getCapture, getRegion, uiFrameSize } from "../src/utils/captures";
import { FORMATS } from "../src/types/format";

test("project validation reports no errors", () => {
  const errors = validate().filter((f) => f.level === "error");
  assert.deepEqual(errors, []);
});

test("every capture in the manifest exists on disk", () => {
  for (const capture of captureManifest.captures) {
    const file = path.resolve(process.cwd(), "public", capture.staticPath);
    assert.ok(existsSync(file), `missing capture file: ${capture.staticPath}`);
  }
});

test("the capture privacy scan is clean", () => {
  assert.equal(captureManifest.privacy.clean, true);
  assert.deepEqual(captureManifest.privacy.findings, []);
});

test("named regions are inside their capture", () => {
  for (const capture of captureManifest.captures) {
    for (const [name, r] of Object.entries(capture.regions)) {
      assert.ok(r.x >= 0 && r.y >= 0, `${capture.id}/${name} starts outside the image`);
      assert.ok(
        r.x + r.width <= 1.001 && r.y + r.height <= 1.001,
        `${capture.id}/${name} extends past the image`,
      );
      assert.ok(r.width > 0.01 && r.height > 0.01, `${capture.id}/${name} is degenerate`);
    }
  }
});

test("getRegion fails loudly on an unknown region", () => {
  assert.throws(() => getRegion("markets-network", "nope"), /has no region "nope"/);
  assert.throws(() => getCapture("nope"), /Unknown capture/);
});

test("a UI window always fits inside its canvas", () => {
  for (const format of Object.values(FORMATS)) {
    const size = uiFrameSize(format);
    const chrome = 46 * (format.width / 1920);
    assert.ok(
      size.height + chrome <= format.height,
      `${format.id}: window is ${size.height + chrome}px tall in a ${format.height}px canvas`,
    );
    assert.ok(size.width > 0 && size.height > 0, `${format.id}: degenerate window`);
  }
});
