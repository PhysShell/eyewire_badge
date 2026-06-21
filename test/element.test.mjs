/**
 * Exercises the <eyewire-stats> custom element lifecycle without a real browser
 * by shimming just enough DOM (HTMLElement, attachShadow, customElements,
 * createElement, innerHTML) and mocking fetch. Validates: mount -> loading ->
 * fetch -> render, the not_found state, and attribute reactivity.
 *
 *   node --test test/element.test.mjs
 */
import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

// ---- minimal DOM shim ----
class Node { append(...kids) { (this.children ||= []).push(...kids); } }
class Element extends Node {
  constructor(tag = "div") { super(); this.tagName = tag; this._attrs = {}; this._shadow = null; this.isConnected = true; this.innerHTML = ""; this.className = ""; this.textContent = ""; }
  attachShadow() { this._shadow = new Element("#shadow"); return this._shadow; }
  setAttribute(n, v) {
    const old = this._attrs[n] ?? null; v = String(v); this._attrs[n] = v;
    if (this.attributeChangedCallback && this.constructor.observedAttributes?.includes(n)) {
      this.attributeChangedCallback(n, old, v);
    }
  }
  getAttribute(n) { return this._attrs[n] ?? null; }
  hasAttribute(n) { return n in this._attrs; }
  dispatchEvent(e) { (this._events ||= []).push(e); return true; }
  get shadowView() { return this._shadow.children.find((c) => c.className === "ew-view"); }
}
globalThis.HTMLElement = Element;
globalThis.CustomEvent = class { constructor(t, o = {}) { this.type = t; this.detail = o.detail; } };
globalThis.document = { createElement: (t) => new Element(t) };
const registry = new Map();
globalThis.customElements = {
  define: (n, c) => registry.set(n, c),
  get: (n) => registry.get(n),
};

const sample = JSON.parse(
  await readFile(new URL("../docs/api-response-example.json", import.meta.url), "utf8")
);

let fetchImpl;
globalThis.fetch = (...a) => fetchImpl(...a);

const { EyeWireStats } = await import("../src/eyewire-widget.js");

function mount(attrs) {
  const el = new EyeWireStats();
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  el.connectedCallback();
  return el;
}
const tick = () => new Promise((r) => setTimeout(r, 0));

test("element registered", () => {
  assert.equal(customElements.get("eyewire-stats"), EyeWireStats);
});

test("mount shows loading, then renders the card after fetch resolves", async () => {
  fetchImpl = async () => ({ ok: true, status: 200, json: async () => sample });
  const el = mount({ user: "crazyman4865", mode: "card", period: "forever" });
  await Promise.resolve();                 // updates are coalesced into a microtask
  assert.match(el.shadowView.innerHTML, /Loading EyeWire stats/);
  await tick();
  const html = el.shadowView.innerHTML;
  assert.match(html, /crazyman4865/);
  assert.match(html, /4,579,373/);   // formatted score
  assert.match(html, /F-score/);
});

test("unknown player (id null) renders not-found state", async () => {
  fetchImpl = async () => ({ ok: true, status: 200, json: async () => ({ id: null, username: "ghost", forever: {} }) });
  const el = mount({ user: "ghost" });
  await tick();
  assert.match(el.shadowView.innerHTML, /Player not found/);
});

test("invalid username never fetches", async () => {
  let called = false;
  fetchImpl = async () => { called = true; return { ok: true, status: 200, json: async () => sample }; };
  const el = mount({ user: "bad name!" });
  await tick();
  assert.equal(called, false);
  assert.match(el.shadowView.innerHTML, /Invalid username/);
});

test("dispatches eyewire:load with normalised detail on success", async () => {
  fetchImpl = async () => ({ ok: true, status: 200, json: async () => sample });
  const el = mount({ user: "crazyman4865" });
  await tick();
  const ev = (el._events || []).find((e) => e.type === "eyewire:load");
  assert.ok(ev, "eyewire:load should be dispatched");
  assert.equal(ev.detail.username, "crazyman4865");
  assert.equal(ev.detail.points, 4579373);
});

test("dispatches eyewire:error with kind on failure", async () => {
  fetchImpl = async () => ({ ok: true, status: 200, json: async () => ({ id: null, username: "ghost", forever: {} }) });
  const el = mount({ user: "ghost" });
  await tick();
  const ev = (el._events || []).find((e) => e.type === "eyewire:error");
  assert.ok(ev, "eyewire:error should be dispatched");
  assert.equal(ev.detail.kind, "not_found");
});

test("emptying user clears cached data so presentation-only changes stay in error", async () => {
  fetchImpl = async () => ({ ok: true, status: 200, json: async () => sample });
  const el = mount({ user: "crazyman4865" });
  await tick();
  assert.match(el.shadowView.innerHTML, /4,579,373/); // loaded the previous user

  el.setAttribute("user", "");        // user emptied -> invalid
  await tick();
  assert.match(el.shadowView.innerHTML, /Invalid username/);

  el.setAttribute("mode", "mini");    // presentation-only change must NOT resurrect old stats
  await tick();
  assert.doesNotMatch(el.shadowView.innerHTML, /4,579,373/);
  assert.match(el.shadowView.innerHTML, /Invalid username/);
});

test("changing user attribute refetches", async () => {
  const seen = [];
  fetchImpl = async (url) => { seen.push(url); return { ok: true, status: 200, json: async () => sample }; };
  const el = mount({ user: "crazyman4865" });
  await tick();
  el.setAttribute("user", "Nseraf");
  await tick();
  assert.equal(seen.length, 2);
  assert.match(seen[1], /Nseraf/);
});
