/**
 * Lightweight assertions for the pure logic (no DOM needed).
 *   node --test test/logic.test.mjs
 */
import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { isValidUsername, normalizeStats, StatsError, buildStatsUrl } from "../src/api.js";
import { formatNumber, relativeTime } from "../src/render.js";

const sample = JSON.parse(
  await readFile(new URL("../docs/api-response-example.json", import.meta.url), "utf8")
);

test("isValidUsername accepts and rejects sensibly", () => {
  assert.ok(isValidUsername("crazyman4865"));
  assert.ok(isValidUsername("a.b-c_d"));
  assert.ok(!isValidUsername(""));
  assert.ok(!isValidUsername("has space"));
  assert.ok(!isValidUsername("../etc"));
  assert.ok(!isValidUsername("a".repeat(41)));
  assert.ok(!isValidUsername("inject<script>"));
});

test("buildStatsUrl direct vs proxy", () => {
  assert.equal(buildStatsUrl("Bob"), "https://eyewire.org/1.0/player/Bob/stats");
  assert.equal(buildStatsUrl("Bob", "https://w.example/"), "https://w.example/stats?u=Bob");
});

test("normalizeStats parses the real forever block (strings -> numbers)", () => {
  const d = normalizeStats(sample, "forever");
  assert.equal(d.username, "crazyman4865");
  assert.equal(d.points, 4579373);
  assert.equal(d.cubes, 31453);
  assert.equal(d.trailblazes, 8597);
  assert.equal(d.scythes, 2567);
  // fscore = mean of the two full_window windows
  assert.ok(d.fscore > 0.98 && d.fscore < 0.99);
});

test("normalizeStats throws not_found when id is null", () => {
  assert.throws(
    () => normalizeStats({ id: null, username: "ghost", forever: {} }, "forever"),
    (e) => e instanceof StatsError && e.kind === "not_found"
  );
});

test("formatNumber and relativeTime", () => {
  assert.equal(formatNumber(4579373), "4,579,373");
  assert.equal(formatNumber("31453"), "31,453");
  const now = Date.now();
  assert.equal(relativeTime(now, now), "just now");
  assert.equal(relativeTime(now - 120000, now), "2 min ago");
});
