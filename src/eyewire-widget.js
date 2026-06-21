/**
 * <eyewire-stats> — a self-contained Web Component that shows a public EyeWire
 * player's stats. Uses Shadow DOM so the host page's CSS can't break it and its
 * CSS can't leak out. Public data only: no login, password, cookies or tokens.
 *
 *   <script type="module" src="src/eyewire-widget.js"></script>
 *   <eyewire-stats user="SomeUser" mode="card" period="forever"></eyewire-stats>
 *
 * Attributes:
 *   user          (required) EyeWire username
 *   mode          card | mini | badge        (default: card)
 *   period        day | week | month | forever (default: forever)
 *   theme         dark | light               (default: dark)
 *   compact       "true" to shrink the card
 *   show-updated  "false" to hide the footer timestamp
 *   api-base      optional proxy base (e.g. a Cloudflare Worker) → `${base}/stats?u=USER`
 */
import { styles } from "./styles.js";
import { fetchStats, StatsError, PERIODS } from "./api.js";
import { renderStats, renderState } from "./render.js";

const MODES = ["card", "mini", "badge"];

class EyeWireStats extends HTMLElement {
  static get observedAttributes() {
    return ["user", "mode", "period", "theme", "compact", "show-updated", "api-base"];
  }

  constructor() {
    super();
    this._root = this.attachShadow({ mode: "open" });
    this._style = document.createElement("style");
    this._style.textContent = styles;
    this._view = document.createElement("div");
    this._view.className = "ew-view";
    this._root.append(this._style, this._view);

    this._data = null;        // last good normalised stats
    this._fetchToken = 0;     // guards against out-of-order responses
    this._abort = null;
    this._scheduled = false;  // microtask coalescing
    this._needsFetch = false;
  }

  connectedCallback() {
    if (!this.hasAttribute("mode")) this.setAttribute("mode", "card");
    this._schedule(true);
  }

  disconnectedCallback() {
    if (this._abort) this._abort.abort();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) return;
    // user / period / api-base change the data → refetch.
    // mode / theme / compact / show-updated are presentation-only → re-render.
    const needsFetch = name === "user" || name === "period" || name === "api-base";
    this._schedule(needsFetch);
  }

  /**
   * Coalesce the burst of attributeChangedCallback calls that fire during
   * element upgrade (one per initial attribute) into a single update on the
   * next microtask, so we fetch at most once for a given configuration.
   */
  _schedule(needsFetch) {
    if (needsFetch) this._needsFetch = true;
    if (this._scheduled) return;
    this._scheduled = true;
    queueMicrotask(() => {
      this._scheduled = false;
      if (!this.isConnected) return;
      if (this._needsFetch || !this._data) {
        this._needsFetch = false;
        this._load();
      } else {
        this._paint();
      }
    });
  }

  // --- attribute getters with validation/defaults ---
  get user() { return (this.getAttribute("user") || "").trim(); }
  get mode() {
    const m = (this.getAttribute("mode") || "card").toLowerCase();
    return MODES.includes(m) ? m : "card";
  }
  get period() {
    const p = (this.getAttribute("period") || "forever").toLowerCase();
    return PERIODS.includes(p) ? p : "forever";
  }
  get apiBase() { return (this.getAttribute("api-base") || "").trim(); }
  get compact() { return this.getAttribute("compact") === "true"; }
  get showUpdated() { return this.getAttribute("show-updated") !== "false"; }

  async _load() {
    if (!this.isConnected) return;
    const user = this.user;
    if (!user) {
      this._data = null; // drop any stale stats so later re-renders stay in the error state
      this._error("invalid");
      return;
    }

    const token = ++this._fetchToken;
    if (this._abort) this._abort.abort();
    this._abort = new AbortController();

    this._data = null;
    this.setAttribute("aria-label", `Loading EyeWire stats for ${user}`);
    this._render(renderState({ kind: "loading" }, this.mode));

    try {
      const data = await fetchStats(user, {
        period: this.period,
        apiBase: this.apiBase,
        signal: this._abort.signal,
      });
      if (token !== this._fetchToken) return; // superseded by a newer request
      this._data = data;
      this._paint();
      this.dispatchEvent(new CustomEvent("eyewire:load", { detail: data, bubbles: true, composed: true }));
    } catch (err) {
      if (token !== this._fetchToken) return;
      if (err && err.name === "AbortError") return;
      const kind = err instanceof StatsError ? err.kind : "unavailable";
      this._error(kind);
      this.dispatchEvent(new CustomEvent("eyewire:error", { detail: { kind }, bubbles: true, composed: true }));
    }
  }

  _error(kind) {
    const labels = {
      invalid: "Invalid EyeWire username",
      not_found: "EyeWire player not found",
      unavailable: "EyeWire stats unavailable",
    };
    this.setAttribute("aria-label", labels[kind] || labels.unavailable);
    this._render(renderState({ kind: "error", errorKind: kind }, this.mode));
  }

  /** Re-render presentation from cached data (no network). */
  _paint() {
    if (!this._data) return;
    this.setAttribute("aria-label", `EyeWire stats for ${this._data.username}`);
    this._render(renderStats(this.mode, this._data, {
      compact: this.compact,
      showUpdated: this.showUpdated,
    }));
  }

  _render(html) {
    this._view.innerHTML = html;
  }
}

if (typeof customElements !== "undefined" && !customElements.get("eyewire-stats")) {
  customElements.define("eyewire-stats", EyeWireStats);
}

export { EyeWireStats };
