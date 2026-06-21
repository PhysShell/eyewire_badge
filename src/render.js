/**
 * Render helpers for <eyewire-stats>.
 *
 * Each function returns an HTML string for the shadow root. The only piece of
 * data that originates outside our control is the username, which is always run
 * through escapeHtml() before being interpolated.
 */

const NF = new Intl.NumberFormat("en-US");

export function formatNumber(n) {
  return NF.format(Math.round(Number(n) || 0));
}

/** Compact human label for an absolute timestamp ("2 min ago"). */
export function relativeTime(ts, now = Date.now()) {
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

export function escapeHtml(str) {
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
export function renderState(state, mode = "card") {
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

export function renderCard(d, opts = {}) {
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

export function renderMini(d) {
  const p = pct(d.fscore);
  const f = p == null ? "" : ` <span class="sep">·</span> <span class="f">F ${p}%</span>`;
  return `<div class="mini">
    <b>${escapeHtml(d.username)}</b>
    <span class="sep">·</span>
    <span class="num">${formatNumber(d.points)}</span> pts${f}
  </div>`;
}

export function renderBadge(d) {
  return `<div class="badge" title="${escapeHtml(d.username)} · EyeWire">
    <span class="k">EyeWire</span><span class="v">${formatNumber(d.points)} pts</span>
  </div>`;
}

/** Dispatch to the renderer for the requested mode. */
export function renderStats(mode, d, opts) {
  switch (mode) {
    case "mini":  return renderMini(d);
    case "badge": return renderBadge(d);
    case "card":
    default:      return renderCard(d, opts);
  }
}
