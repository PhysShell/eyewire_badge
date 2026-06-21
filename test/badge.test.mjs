/**
 * Tests for the pure SVG badge generator.
 *   node --test test/badge.test.mjs
 */
import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  formatNumber, num, reduceFscore, metricMessage, textWidth, safeColor,
  badgeSvg, COLORS, METRICS,
} from "../worker/badge.js";

const sample = JSON.parse(
  await readFile(new URL("../docs/api-response-example.json", import.meta.url), "utf8")
);

test("num coerces strings and nullish", () => {
  assert.equal(num("31453"), 31453);
  assert.equal(num(42), 42);
  assert.equal(num(null), 0);
  assert.equal(num("nope"), 0);
});

test("metricMessage builds per-metric text from the real sample", () => {
  assert.equal(metricMessage(sample, "forever", "points"), "4,579,373 pts");
  assert.equal(metricMessage(sample, "forever", "cubes"), "31,453 cubes");
  assert.equal(metricMessage(sample, "forever", "trailblazes"), "8,597 trailblazes");
  assert.equal(metricMessage(sample, "forever", "complete"), "11,689 completed");
  // fscore = mean of the two full_window windows, one decimal percent
  assert.match(metricMessage(sample, "forever", "fscore"), /^9[0-9]\.\d%$/);
});

test("metricMessage handles a zeroed period", () => {
  assert.equal(metricMessage(sample, "day", "points"), "0 pts");
});

test("reduceFscore returns null when no usable windows", () => {
  assert.equal(reduceFscore([]), null);
  assert.equal(reduceFscore(undefined), null);
});

test("METRICS list is the supported set", () => {
  assert.deepEqual(METRICS, ["points", "cubes", "trailblazes", "scythes", "complete", "fscore"]);
});

test("safeColor validates hex and falls back", () => {
  assert.equal(safeColor("#abc", "#000"), "#abc");
  assert.equal(safeColor("#aabbcc", "#000"), "#aabbcc");
  assert.equal(safeColor("red", "#000"), "#000");
  assert.equal(safeColor("#xyz", "#000"), "#000");
  assert.equal(safeColor(undefined, "#123456"), "#123456");
});

test("textWidth is positive and grows with length", () => {
  assert.ok(textWidth("EyeWire") > 0);
  assert.ok(textWidth("WWWW") > textWidth("iiii"));
});

test("badgeSvg produces well-formed, escaped SVG", () => {
  const out = badgeSvg({ label: "EyeWire", message: "4,579,373 pts" });
  assert.match(out, /^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg"/);
  assert.match(out, /<\/svg>$/);
  assert.match(out, /aria-label="EyeWire: 4,579,373 pts"/);
  assert.match(out, /4,579,373 pts/);
  // width attribute is a positive integer
  const w = Number(out.match(/width="(\d+)"/)[1]);
  assert.ok(w > 40);
  // balanced svg tags
  assert.equal((out.match(/<svg/g) || []).length, 1);
  assert.equal((out.match(/<\/svg>/g) || []).length, 1);
});

test("badgeSvg escapes XML-special characters in inputs", () => {
  const out = badgeSvg({ label: 'a&b<c>"d', message: "x" });
  assert.match(out, /a&amp;b&lt;c&gt;&quot;d/);
  assert.doesNotMatch(out, /<c>/); // raw angle brackets must not survive
});

test("badgeSvg applies custom colours (validated)", () => {
  const out = badgeSvg({ label: "L", message: "M", messageColor: "#ff0000", labelColor: "#00ff00" });
  assert.match(out, /fill="#ff0000"/);
  assert.match(out, /fill="#00ff00"/);
  assert.match(out, /fill="#fff"/); // text stays white
});

test("formatNumber groups thousands", () => {
  assert.equal(formatNumber(4579373), "4,579,373");
});
