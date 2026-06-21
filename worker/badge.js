/**
 * Pure SVG badge generation for the EyeWire badge endpoint.
 *
 * Kept dependency-free and side-effect-free so it runs in the Cloudflare Worker
 * and is unit-testable under `node --test`. Produces a shields.io-style "flat"
 * badge: a dark label segment and a coloured message segment.
 *
 * GitHub strips <script> from rendered Markdown, so a JS widget can't run in a
 * README — a static SVG served from the Worker is the right tool there:
 *   ![EyeWire stats](https://your-worker.example/badge.svg?u=SomeUser)
 */

const NF = new Intl.NumberFormat("en-US");

export function formatNumber(n) {
  return NF.format(Math.round(Number(n) || 0));
}

/** Coerce the API's mixed string/number numerics into real numbers. */
export function num(v) {
  if (v == null) return 0;
  const n = typeof v === "number" ? v : parseFloat(v);
  return Number.isFinite(n) ? n : 0;
}

/** Mean of the "full_window" F-scores (0..1), or null when unavailable. */
export function reduceFscore(fscore) {
  if (!Array.isArray(fscore) || fscore.length === 0) return null;
  const full = fscore.filter((f) => f && f.full_window && Number.isFinite(f.fscore));
  const pool = full.length ? full : fscore.filter((f) => f && Number.isFinite(f.fscore));
  if (pool.length === 0) return null;
  return Math.max(0, Math.min(1, pool.reduce((a, f) => a + f.fscore, 0) / pool.length));
}

export const METRICS = ["points", "cubes", "trailblazes", "scythes", "complete", "fscore"];

/**
 * Build the message text for a metric from a raw EyeWire payload.
 * @returns {string} e.g. "4,579,373 pts" or "98.9%"
 */
export function metricMessage(raw, period, metric) {
  if (metric === "fscore") {
    const f = reduceFscore(raw && raw.fscore);
    return f == null ? "n/a" : `${Math.round(f * 1000) / 10}%`;
  }
  const block = (raw && raw[period] && typeof raw[period] === "object") ? raw[period] : {};
  const suffix = {
    points: " pts",
    cubes: " cubes",
    trailblazes: " trailblazes",
    scythes: " scythes",
    complete: " completed",
  }[metric] || " pts";
  return formatNumber(num(block[metric])) + suffix;
}

// --- text measurement (approx Verdana @ 11px) -----------------------------
// Per-character widths so badges size correctly without a font metrics lib.
function charWidth(c) {
  if ("iIl.,:;'|!".includes(c)) return 3.2;
  if ("ftjr ()[]".includes(c)) return 4.4;
  if ("mwMW".includes(c)) return 10.5;
  if (c >= "0" && c <= "9") return 7;
  if (c >= "A" && c <= "Z") return 8;
  return 6.6;
}

export function textWidth(str) {
  let w = 0;
  for (const c of String(str)) w += charWidth(c);
  return w;
}

function escapeXml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Validate a #rrggbb / #rgb colour, falling back to `def` if not valid. */
export function safeColor(c, def) {
  return typeof c === "string" && /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(c) ? c : def;
}

export const COLORS = {
  label: "#30374a",
  message: "#2563eb",
  error: "#e05d44",
  muted: "#9f9f9f",
};

/**
 * Render a flat badge SVG.
 * @param {{label:string, message:string, labelColor?:string, messageColor?:string}} opts
 */
export function badgeSvg({ label, message, labelColor = COLORS.label, messageColor = COLORS.message }) {
  const PAD = 7;
  const H = 20;
  const labelW = Math.round(textWidth(label) + PAD * 2);
  const msgW = Math.round(textWidth(message) + PAD * 2);
  const W = labelW + msgW;
  const labelX = labelW / 2;
  const msgX = labelW + msgW / 2;
  const aria = `${label}: ${message}`;

  // text rendered twice: a subtle shadow then the white face, like shields.io
  const txt = (x, s) =>
    `<text x="${x}" y="15" fill="#010101" fill-opacity=".3">${escapeXml(s)}</text>` +
    `<text x="${x}" y="14">${escapeXml(s)}</text>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" role="img" aria-label="${escapeXml(aria)}">
  <title>${escapeXml(aria)}</title>
  <linearGradient id="g" x2="0" y2="100%">
    <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
    <stop offset="1" stop-opacity=".1"/>
  </linearGradient>
  <clipPath id="r"><rect width="${W}" height="${H}" rx="3" fill="#fff"/></clipPath>
  <g clip-path="url(#r)">
    <rect width="${labelW}" height="${H}" fill="${safeColor(labelColor, COLORS.label)}"/>
    <rect x="${labelW}" width="${msgW}" height="${H}" fill="${safeColor(messageColor, COLORS.message)}"/>
    <rect width="${W}" height="${H}" fill="url(#g)"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" font-size="11">
    ${txt(labelX, label)}
    ${txt(msgX, message)}
  </g>
</svg>`;
}
