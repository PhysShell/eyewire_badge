/**
 * Integration tests for the Worker's request handling. Node 22 provides global
 * fetch/Request/Response/URL/AbortController; we shim Cloudflare's `caches` and
 * mock the upstream fetch.
 *   node --test test/worker.test.mjs
 */
import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const sample = JSON.parse(
  await readFile(new URL("../docs/api-response-example.json", import.meta.url), "utf8")
);
const UNKNOWN = { id: null, username: "ghost", day: {}, week: {}, month: {}, forever: {}, fscore: [] };

// Cloudflare cache shim: never hit, always store (so handlers exercise the put path).
globalThis.caches = { default: { match: async () => undefined, put: async () => {} } };

const realFetch = globalThis.fetch;
let upstreamImpl;
globalThis.fetch = (...args) =>
  (upstreamImpl ? upstreamImpl(...args) : Promise.reject(new Error("no upstream mock")));

const worker = (await import("../worker/index.js")).default;
const ctx = { waitUntil() {} };
const call = (path) => worker.fetch(new Request(`https://w.example${path}`), {}, ctx);

test.after(() => { globalThis.fetch = realFetch; });

function upstreamReturns(body, init = { status: 200 }) {
  upstreamImpl = async () => new Response(JSON.stringify(body), {
    status: init.status,
    headers: { "Content-Type": "application/json" },
  });
}

test("/stats passes through a known player verbatim (200)", async () => {
  upstreamReturns(sample);
  const res = await call("/stats?u=crazyman4865");
  assert.equal(res.status, 200);
  assert.equal(res.headers.get("access-control-allow-origin"), "*");
  assert.deepEqual(await res.json(), sample);
});

test("/stats preserves the unknown-player passthrough (200, id:null) — not a 404", async () => {
  upstreamReturns(UNKNOWN);
  const res = await call("/stats?u=ghost");
  assert.equal(res.status, 200); // regression guard: must NOT become 404
  const body = await res.json();
  assert.equal(body.id, null);
  assert.equal(body.username, "ghost");
});

test("/stats rejects an invalid username (400) without calling upstream", async () => {
  let called = false;
  upstreamImpl = async () => { called = true; return new Response("{}"); };
  const res = await call("/stats?u=bad%20name");
  assert.equal(res.status, 400);
  assert.equal(called, false);
});

test("/stats returns 502 when upstream is unreachable", async () => {
  upstreamImpl = async () => { throw new Error("network"); };
  const res = await call("/stats?u=crazyman4865");
  assert.equal(res.status, 502);
});

test("/badge.svg renders the points badge", async () => {
  upstreamReturns(sample);
  const res = await call("/badge.svg?u=crazyman4865");
  assert.equal(res.status, 200);
  assert.match(res.headers.get("content-type"), /image\/svg\+xml/);
  const body = await res.text();
  assert.match(body, /4,579,373 pts/);
  assert.match(body, /<\/svg>$/);
});

test("/badge.svg renders fscore and respects metric+label", async () => {
  upstreamReturns(sample);
  const res = await call("/badge.svg?u=crazyman4865&metric=fscore&label=F");
  const body = await res.text();
  assert.match(body, /aria-label="F: 9[0-9]\.\d%"/);
});

test("/badge.svg shows 'player not found' for unknown user (still 200)", async () => {
  upstreamReturns(UNKNOWN);
  const res = await call("/badge.svg?u=ghost");
  assert.equal(res.status, 200); // never a broken image in a README
  assert.match(await res.text(), /player not found/);
});

test("/badge.svg shows 'invalid user' for bad username (no upstream call)", async () => {
  let called = false;
  upstreamImpl = async () => { called = true; return new Response("{}"); };
  const res = await call("/badge.svg?u=bad%20name");
  assert.equal(res.status, 200);
  assert.match(await res.text(), /invalid user/);
  assert.equal(called, false);
});

test("/badge.svg shows 'unavailable' on upstream failure", async () => {
  upstreamImpl = async () => { throw new Error("network"); };
  const res = await call("/badge.svg?u=crazyman4865");
  assert.equal(res.status, 200);
  assert.match(await res.text(), /unavailable/);
});

test("unknown route returns 404", async () => {
  const res = await call("/nope");
  assert.equal(res.status, 404);
});
