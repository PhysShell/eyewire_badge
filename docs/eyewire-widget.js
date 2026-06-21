/*!
 * eyewire-stats widget — generated bundle. Do not edit by hand.
 * Source: src/*.js  ·  Rebuild: node build.mjs
 * Public EyeWire stats only — no auth, no cookies, no tokens.
 */
(function () {
  "use strict";

  // ---- src/styles.js ----
  /**
   * Shadow DOM styles for <eyewire-stats>.
   *
   * Everything lives inside a Shadow root, so these rules cannot leak out to the
   * host page and the host page's rules cannot leak in. Colours and a few sizes
   * are exposed as CSS custom properties on :host so a `theme` attribute or
   * surrounding CSS can override them without forking the component.
   */
  const styles = `
    :host {
      /* --- themeable tokens (dark sci-fi / HUD by default) --- */
      --ew-bg: #0a0e1a;
      --ew-bg-2: #0e1424;
      --ew-panel: rgba(20, 30, 54, 0.55);
      --ew-border: rgba(96, 165, 250, 0.28);
      --ew-grid: rgba(96, 165, 250, 0.07);
      --ew-text: #e7eefc;
      --ew-muted: #8aa0c8;
      --ew-accent: #38bdf8;       /* cyan   */
      --ew-accent-2: #818cf8;     /* indigo */
      --ew-accent-3: #c084fc;     /* violet */
      --ew-good: #34d399;
      --ew-warn: #fbbf24;
      --ew-bad: #f87171;
      --ew-radius: 14px;
      --ew-font: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto,
                 Helvetica, Arial, sans-serif;
      --ew-mono: ui-monospace, "SF Mono", "JetBrains Mono", "Fira Code",
                 Menlo, Consolas, monospace;
  
      display: inline-block;
      box-sizing: border-box;
      color: var(--ew-text);
      font-family: var(--ew-font);
      line-height: 1.4;
      -webkit-font-smoothing: antialiased;
    }
  
    :host([theme="light"]) {
      --ew-bg: #f4f7ff;
      --ew-bg-2: #e9eefb;
      --ew-panel: rgba(255, 255, 255, 0.7);
      --ew-border: rgba(37, 99, 235, 0.25);
      --ew-grid: rgba(37, 99, 235, 0.06);
      --ew-text: #0f1b33;
      --ew-muted: #5b6b8c;
      --ew-accent: #0284c7;
      --ew-accent-2: #4f46e5;
      --ew-accent-3: #9333ea;
    }
  
    * { box-sizing: border-box; }
  
    /* ---------------- CARD ---------------- */
    .card {
      position: relative;
      width: 320px;
      max-width: 100%;
      padding: 18px 18px 14px;
      border: 1px solid var(--ew-border);
      border-radius: var(--ew-radius);
      background:
        radial-gradient(120% 80% at 100% 0%, rgba(129,140,248,0.16), transparent 60%),
        linear-gradient(180deg, var(--ew-bg-2), var(--ew-bg));
      box-shadow:
        0 0 0 1px rgba(0,0,0,0.2),
        0 10px 30px rgba(2, 8, 23, 0.55),
        inset 0 0 40px rgba(56, 189, 248, 0.05);
      overflow: hidden;
    }
    .card::before {
      /* faint HUD grid */
      content: "";
      position: absolute;
      inset: 0;
      background-image:
        linear-gradient(var(--ew-grid) 1px, transparent 1px),
        linear-gradient(90deg, var(--ew-grid) 1px, transparent 1px);
      background-size: 22px 22px;
      pointer-events: none;
      mask-image: linear-gradient(180deg, rgba(0,0,0,0.9), transparent 75%);
    }
    .card::after {
      /* top accent line */
      content: "";
      position: absolute;
      top: 0; left: 0; right: 0;
      height: 2px;
      background: linear-gradient(90deg,
        transparent, var(--ew-accent), var(--ew-accent-2), var(--ew-accent-3), transparent);
      opacity: 0.85;
    }
    .card.compact { width: 248px; padding: 14px 14px 12px; }
  
    .head {
      position: relative;
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      gap: 10px;
      margin-bottom: 14px;
    }
    .user {
      font-weight: 700;
      font-size: 16px;
      letter-spacing: 0.2px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .brand {
      flex: none;
      font-family: var(--ew-mono);
      font-size: 10px;
      letter-spacing: 2px;
      text-transform: uppercase;
      color: var(--ew-accent);
      opacity: 0.85;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .brand .dot {
      width: 7px; height: 7px; border-radius: 50%;
      background: var(--ew-accent);
      box-shadow: 0 0 8px var(--ew-accent);
      animation: ew-pulse 2.4s ease-in-out infinite;
    }
    @keyframes ew-pulse { 0%,100% { opacity: 0.4; } 50% { opacity: 1; } }
  
    .metrics {
      position: relative;
      display: grid;
      gap: 8px;
      margin-bottom: 14px;
    }
    .metric {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      gap: 12px;
      padding-bottom: 6px;
      border-bottom: 1px dashed rgba(138, 160, 200, 0.16);
    }
    .metric:last-child { border-bottom: 0; padding-bottom: 0; }
    .metric .label {
      font-size: 11px;
      letter-spacing: 0.6px;
      text-transform: uppercase;
      color: var(--ew-muted);
    }
    .metric .value {
      font-family: var(--ew-mono);
      font-size: 17px;
      font-weight: 600;
      color: var(--ew-text);
      font-variant-numeric: tabular-nums;
    }
    .metric .value .accent { color: var(--ew-accent); }
  
    .fscore { position: relative; }
    .fscore .row {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      margin-bottom: 6px;
    }
    .fscore .label {
      font-size: 11px;
      letter-spacing: 0.6px;
      text-transform: uppercase;
      color: var(--ew-muted);
    }
    .fscore .pct {
      font-family: var(--ew-mono);
      font-weight: 700;
      font-size: 14px;
      color: var(--ew-good);
      font-variant-numeric: tabular-nums;
    }
    .bar {
      position: relative;
      height: 8px;
      border-radius: 6px;
      background: rgba(138, 160, 200, 0.14);
      overflow: hidden;
    }
    .bar > span {
      position: absolute;
      inset: 0 auto 0 0;
      border-radius: 6px;
      background: linear-gradient(90deg, var(--ew-accent), var(--ew-accent-2), var(--ew-accent-3));
      box-shadow: 0 0 10px rgba(56, 189, 248, 0.5);
      transition: width 0.6s ease;
    }
  
    .foot {
      position: relative;
      margin-top: 12px;
      font-size: 10.5px;
      letter-spacing: 0.4px;
      color: var(--ew-muted);
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .foot .tick { color: var(--ew-accent); }
  
    /* ---------------- MINI ---------------- */
    .mini {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 7px 12px;
      border: 1px solid var(--ew-border);
      border-radius: 999px;
      background: linear-gradient(180deg, var(--ew-bg-2), var(--ew-bg));
      font-size: 13px;
      box-shadow: 0 4px 14px rgba(2, 8, 23, 0.4);
    }
    .mini b { font-weight: 700; }
    .mini .sep { color: var(--ew-muted); opacity: 0.6; }
    .mini .num { font-family: var(--ew-mono); color: var(--ew-accent); font-variant-numeric: tabular-nums; }
    .mini .f { font-family: var(--ew-mono); color: var(--ew-good); }
  
    /* ---------------- BADGE ---------------- */
    .badge {
      display: inline-flex;
      align-items: stretch;
      border-radius: 6px;
      overflow: hidden;
      font-family: var(--ew-mono);
      font-size: 11px;
      line-height: 1;
      border: 1px solid var(--ew-border);
    }
    .badge .k {
      background: #1b2540;
      color: #cfe0ff;
      padding: 6px 8px;
      letter-spacing: 1px;
      text-transform: uppercase;
    }
    .badge .v {
      background: linear-gradient(90deg, var(--ew-accent), var(--ew-accent-2));
      color: #04111f;
      font-weight: 700;
      padding: 6px 8px;
    }
  
    /* ---------------- STATES ---------------- */
    .state {
      width: 320px;
      max-width: 100%;
      min-height: 84px;
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 18px;
      border: 1px solid var(--ew-border);
      border-radius: var(--ew-radius);
      background: linear-gradient(180deg, var(--ew-bg-2), var(--ew-bg));
      color: var(--ew-muted);
      font-size: 13px;
    }
    .state.mini, .state.badge { width: auto; min-height: 0; padding: 8px 12px; border-radius: 999px; }
    .state .spinner {
      flex: none;
      width: 18px; height: 18px;
      border-radius: 50%;
      border: 2px solid rgba(138,160,200,0.25);
      border-top-color: var(--ew-accent);
      animation: ew-spin 0.8s linear infinite;
    }
    @keyframes ew-spin { to { transform: rotate(360deg); } }
    .state .ico { flex: none; font-size: 18px; line-height: 1; }
    .state.error { color: var(--ew-bad); border-color: rgba(248,113,113,0.35); }
    .state strong { color: var(--ew-text); font-weight: 600; }
    .state .sub { color: var(--ew-muted); font-size: 11.5px; margin-top: 2px; }
  
    @media (prefers-reduced-motion: reduce) {
      .spinner, .brand .dot, .bar > span { animation: none; transition: none; }
    }
  `;
  
  // ---- src/api.js ----
  /**
   * EyeWire API client for the widget.
   *
   * Talks only to the PUBLIC stats endpoint:
   *   GET https://eyewire.org/1.0/player/{username}/stats
   *
   * No login, no password, no cookies, no tokens. The endpoint already sends
   * `Access-Control-Allow-Origin: *`, so a direct browser fetch works. An
   * optional `apiBase` (e.g. a Cloudflare Worker) can be supplied to add caching
   * / rate limiting, in which case we call `${apiBase}/stats?u={username}`.
   */
  
  const DEFAULT_API = "https://eyewire.org/1.0";
  const PERIODS = ["day", "week", "month", "forever"];
  
  /**
   * EyeWire usernames are conservative; allow letters, digits and a few safe
   * separators. This is a defence-in-depth guard, not authentication: it keeps
   * us from building weird URLs and bounces obvious garbage before any request.
   */
  const USERNAME_RE = /^[A-Za-z0-9_.-]{1,40}$/;
  
  function isValidUsername(name) {
    return typeof name === "string" && USERNAME_RE.test(name);
  }
  
  /** Build the request URL for either the direct API or a proxy base. */
  function buildStatsUrl(username, apiBase) {
    const user = encodeURIComponent(username);
    if (apiBase) {
      const base = String(apiBase).replace(/\/+$/, "");
      return `${base}/stats?u=${user}`;
    }
    return `${DEFAULT_API}/player/${user}/stats`;
  }
  
  /** Custom error so the widget can render the right state for each failure. */
  class StatsError extends Error {
    constructor(kind, message) {
      super(message);
      this.name = "StatsError";
      this.kind = kind; // "invalid" | "not_found" | "unavailable"
    }
  }
  
  /** Coerce the API's mixed string/number numerics into real numbers. */
  function num(v) {
    if (v == null) return 0;
    const n = typeof v === "number" ? v : parseFloat(v);
    return Number.isFinite(n) ? n : 0;
  }
  
  /**
   * Reduce the `fscore` array into a single 0..1 value.
   * EyeWire returns several windows; we average the "full_window" ones (falling
   * back to whatever is present) to get a representative accuracy figure.
   */
  function reduceFscore(fscore) {
    if (!Array.isArray(fscore) || fscore.length === 0) return null;
    const full = fscore.filter((f) => f && f.full_window && Number.isFinite(f.fscore));
    const pool = full.length ? full : fscore.filter((f) => f && Number.isFinite(f.fscore));
    if (pool.length === 0) return null;
    const sum = pool.reduce((acc, f) => acc + f.fscore, 0);
    return Math.max(0, Math.min(1, sum / pool.length));
  }
  
  /**
   * Normalise a raw API payload into a stable shape for the renderers.
   * Throws StatsError("not_found") when the player does not exist — the API
   * signals this with `id: null` and an HTTP 200, not a 404.
   */
  function normalizeStats(raw, period) {
    if (!raw || typeof raw !== "object") {
      throw new StatsError("unavailable", "Malformed response");
    }
    if (raw.id == null) {
      throw new StatsError("not_found", "Player not found");
    }
    const p = PERIODS.includes(period) ? period : "forever";
    const block = (raw[p] && typeof raw[p] === "object") ? raw[p] : {};
    const fscore = reduceFscore(raw.fscore);
  
    return {
      id: raw.id,
      username: typeof raw.username === "string" ? raw.username : String(raw.username),
      period: p,
      points: num(block.points),
      cubes: num(block.cubes),
      trailblazes: num(block.trailblazes),
      scythes: num(block.scythes),
      complete: num(block.complete),
      fscore, // 0..1 or null
      fetchedAt: Date.now(),
    };
  }
  
  /**
   * Fetch + normalise stats for a username.
   * @returns {Promise<object>} normalised stats
   * @throws {StatsError}
   */
  async function fetchStats(username, { period = "forever", apiBase = "", signal } = {}) {
    if (!isValidUsername(username)) {
      throw new StatsError("invalid", "Invalid username");
    }
  
    // Per-request timeout, combined with any caller-provided signal.
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 12000);
    if (signal) {
      if (signal.aborted) ctrl.abort();
      else signal.addEventListener("abort", () => ctrl.abort(), { once: true });
    }
  
    let res;
    try {
      res = await fetch(buildStatsUrl(username, apiBase), {
        method: "GET",
        // Public data only — never send cookies/credentials.
        credentials: "omit",
        headers: { Accept: "application/json" },
        signal: ctrl.signal,
      });
    } catch (err) {
      throw new StatsError("unavailable", "Network error");
    } finally {
      clearTimeout(timer);
    }
  
    if (res.status === 404) {
      throw new StatsError("not_found", "Player not found");
    }
    if (!res.ok) {
      throw new StatsError("unavailable", `HTTP ${res.status}`);
    }
  
    let raw;
    try {
      raw = await res.json();
    } catch (err) {
      throw new StatsError("unavailable", "Invalid JSON");
    }
  
    return normalizeStats(raw, period);
  }
  
  // ---- src/render.js ----
  /**
   * Render helpers for <eyewire-stats>.
   *
   * Each function returns an HTML string for the shadow root. The only piece of
   * data that originates outside our control is the username, which is always run
   * through escapeHtml() before being interpolated.
   */
  
  const NF = new Intl.NumberFormat("en-US");
  
  function formatNumber(n) {
    return NF.format(Math.round(Number(n) || 0));
  }
  
  /** Compact human label for an absolute timestamp ("2 min ago"). */
  function relativeTime(ts, now = Date.now()) {
    const s = Math.max(0, Math.round((now - ts) / 1000));
    if (s < 5) return "just now";
    if (s < 60) return `${s}s ago`;
    const m = Math.round(s / 60);
    if (m < 60) return `${m} min ago`;
    const h = Math.round(m / 60);
    if (h < 24) return `${h}h ago`;
    const d = Math.round(h / 24);
    return `${d}d ago`;
  }
  
  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }
  
  function pct(fscore) {
    return fscore == null ? null : Math.round(fscore * 1000) / 10; // one decimal
  }
  
  /** Loading / error states, shaped to match the active mode. */
  function renderState(state, mode = "card") {
    const cls = mode === "mini" ? "mini" : mode === "badge" ? "badge" : "card";
    if (state.kind === "loading") {
      return `<div class="state ${cls}" role="status" aria-live="polite">
        <span class="spinner" aria-hidden="true"></span>
        <span>Loading EyeWire stats…</span>
      </div>`;
    }
    const map = {
      invalid:    { ico: "⚠", title: "Invalid username", sub: "Check the user attribute." },
      not_found:  { ico: "∅", title: "Player not found", sub: "No EyeWire player by that name." },
      unavailable:{ ico: "⚡", title: "EyeWire stats unavailable", sub: "Could not reach the API." },
    };
    const e = map[state.errorKind] || map.unavailable;
    return `<div class="state ${cls} error" role="alert">
      <span class="ico" aria-hidden="true">${e.ico}</span>
      <span><strong>${escapeHtml(e.title)}</strong><span class="sub">${escapeHtml(e.sub)}</span></span>
    </div>`;
  }
  
  function metricRow(label, value, accent = false) {
    const v = accent ? `<span class="accent">${value}</span>` : value;
    return `<div class="metric"><span class="label">${label}</span><span class="value">${v}</span></div>`;
  }
  
  function renderCard(d, opts = {}) {
    const compact = opts.compact ? " compact" : "";
    const showUpdated = opts.showUpdated !== false;
    const p = pct(d.fscore);
  
    const rows = [
      metricRow("Score", formatNumber(d.points), true),
      metricRow("Cubes", formatNumber(d.cubes)),
      metricRow("Trailblazes", formatNumber(d.trailblazes)),
    ];
    if (d.scythes > 0) rows.push(metricRow("Scythes", formatNumber(d.scythes)));
  
    const fscoreBlock = p == null ? "" : `
      <div class="fscore">
        <div class="row"><span class="label">F-score</span><span class="pct">${p}%</span></div>
        <div class="bar"><span style="width:${Math.max(0, Math.min(100, p))}%"></span></div>
      </div>`;
  
    const foot = showUpdated ? `
      <div class="foot"><span class="tick">▸</span> Updated ${relativeTime(d.fetchedAt)} · ${escapeHtml(d.period)}</div>` : "";
  
    return `<div class="card${compact}">
      <div class="head">
        <span class="user" title="${escapeHtml(d.username)}">${escapeHtml(d.username)}</span>
        <span class="brand"><span class="dot"></span>EyeWire</span>
      </div>
      <div class="metrics">${rows.join("")}</div>
      ${fscoreBlock}
      ${foot}
    </div>`;
  }
  
  function renderMini(d) {
    const p = pct(d.fscore);
    const f = p == null ? "" : ` <span class="sep">·</span> <span class="f">F ${p}%</span>`;
    return `<div class="mini">
      <b>${escapeHtml(d.username)}</b>
      <span class="sep">·</span>
      <span class="num">${formatNumber(d.points)}</span> pts${f}
    </div>`;
  }
  
  function renderBadge(d) {
    return `<div class="badge" title="${escapeHtml(d.username)} · EyeWire">
      <span class="k">EyeWire</span><span class="v">${formatNumber(d.points)} pts</span>
    </div>`;
  }
  
  /** Dispatch to the renderer for the requested mode. */
  function renderStats(mode, d, opts) {
    switch (mode) {
      case "mini":  return renderMini(d);
      case "badge": return renderBadge(d);
      case "card":
      default:      return renderCard(d, opts);
    }
  }
  
  // ---- src/eyewire-widget.js ----
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
        this._error("invalid");
        return;
      }
  
      const token = ++this._fetchToken;
      if (this._abort) this._abort.abort();
      this._abort = new AbortController();
  
      this._data = null;
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
      this._render(renderState({ kind: "error", errorKind: kind }, this.mode));
    }
  
    /** Re-render presentation from cached data (no network). */
    _paint() {
      if (!this._data) return;
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
})();
