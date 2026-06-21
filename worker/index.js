/**
 * Optional Cloudflare Worker proxy for the EyeWire stats widget.
 *
 * The public EyeWire endpoint already sends `Access-Control-Allow-Origin: *`,
 * so the widget works WITHOUT this proxy. Deploy it only when you want:
 *   - edge caching (don't hammer EyeWire on every page view),
 *   - a stable URL you control if EyeWire changes headers,
 *   - username validation at the edge (and an obvious place to add rate
 *     limiting or an origin allow-list if you ever need them),
 *   - an SVG badge for GitHub READMEs (GitHub strips <script>, so the JS
 *     widget can't run there — a static image can).
 *
 * Endpoints:
 *   GET /stats?u=<username>                  -> the player's stats JSON (passed through)
 *   GET /badge.svg?u=<username>&metric=&...  -> an SVG badge (image/svg+xml)
 *
 * /stats returns the raw EyeWire shape unchanged, so the widget's own
 * normalizeStats() handles both direct and proxied responses identically.
 *
 * Deploy:
 *   npm i -g wrangler
 *   wrangler deploy        # uses worker/wrangler.toml
 *
 * Security: public data only. No auth, no cookies, no secrets. We never forward
 * the client's cookies upstream and never set any.
 */
import { badgeSvg, metricMessage, safeColor, COLORS, METRICS } from "./badge.js";

const UPSTREAM = "https://eyewire.org/1.0/player";
const USERNAME_RE = /^[A-Za-z0-9_.-]{1,40}$/;
const PERIODS = ["day", "week", "month", "forever"];
const CACHE_SECONDS = 120; // EyeWire stats don't need to be real-time.
const ERROR_CACHE_SECONDS = 30; // recover quickly from transient failures.

const CORS = {
  // Public data, so a wildcard is acceptable for the MVP. Lock this down to
  // specific origins if you ever add non-public modes.
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400",
};

function json(body, status, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", ...CORS, ...extraHeaders },
  });
}

function svg(body, { status = 200, cache = CACHE_SECONDS } = {}) {
  return new Response(body, {
    status,
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": `public, max-age=${cache}`,
      ...CORS,
    },
  });
}

/** Thrown when the upstream itself is unreachable / errored (not "no such player"). */
class UpstreamError extends Error {}

/**
 * Fetch + parse a player's raw stats and return the payload unchanged.
 * Note: an unknown player is NOT an error here — EyeWire signals it with
 * `id: null` and an HTTP 200, which we pass straight through so `/stats` stays a
 * transparent proxy. Callers that care (e.g. the badge) inspect `data.id`.
 * Throws UpstreamError only when the upstream is unreachable or malformed.
 */
async function fetchPlayer(user) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 12000);
  let res;
  try {
    res = await fetch(`${UPSTREAM}/${encodeURIComponent(user)}/stats`, {
      method: "GET",
      headers: { Accept: "application/json" },
      signal: ctrl.signal,
    });
  } catch (_err) {
    throw new UpstreamError("unavailable");
  } finally {
    clearTimeout(timer);
  }
  if (!res.ok) throw new UpstreamError("unavailable");

  let data;
  try {
    data = await res.json();
  } catch (_err) {
    throw new UpstreamError("malformed upstream response");
  }
  return data;
}

// ---------------------------------------------------------------- /stats
async function handleStats(url, ctx) {
  const user = (url.searchParams.get("u") || "").trim();
  if (!USERNAME_RE.test(user)) {
    return json({ error: "invalid_username" }, 400);
  }

  // Edge cache with a minimal canonical key so odd client headers can't
  // fragment the cache for the same username.
  const cache = caches.default;
  const cacheKey = new Request(
    `${url.origin}/stats?u=${encodeURIComponent(user)}`,
    { method: "GET", headers: { Accept: "application/json" } }
  );
  const cached = await cache.match(cacheKey);
  if (cached) return cached;

  // Transparent passthrough: forward EyeWire's payload verbatim, INCLUDING the
  // unknown-player case (id:null, HTTP 200). The widget's normalizeStats() reads
  // id:null as "not found", and plain proxy consumers get the same shape they'd
  // get from EyeWire directly. Only a real upstream failure becomes a 502.
  let data;
  try {
    data = await fetchPlayer(user);
  } catch (_err) {
    return json({ error: "upstream_unavailable" }, 502);
  }

  const res = json(data, 200, { "Cache-Control": `public, max-age=${CACHE_SECONDS}` });
  ctx.waitUntil(cache.put(cacheKey, res.clone()));
  return res;
}

// ------------------------------------------------------------ /badge.svg
async function handleBadge(url, ctx) {
  const user = (url.searchParams.get("u") || "").trim();
  const label = (url.searchParams.get("label") || "EyeWire").slice(0, 40);
  const metricParam = (url.searchParams.get("metric") || "points").toLowerCase();
  const metric = METRICS.includes(metricParam) ? metricParam : "points";
  const periodParam = (url.searchParams.get("period") || "forever").toLowerCase();
  const period = PERIODS.includes(periodParam) ? periodParam : "forever";
  const color = safeColor(url.searchParams.get("color"), COLORS.message);

  // Badges are images embedded in READMEs: always return a *renderable* SVG
  // (HTTP 200) even on error, so the reader sees a clear status instead of a
  // broken-image icon. Errors get a short TTL so they self-heal.
  if (!USERNAME_RE.test(user)) {
    return svg(
      badgeSvg({ label, message: "invalid user", messageColor: COLORS.error }),
      { cache: ERROR_CACHE_SECONDS }
    );
  }

  const cache = caches.default;
  const cacheKey = new Request(
    `${url.origin}/badge.svg?u=${encodeURIComponent(user)}&metric=${metric}&period=${period}` +
      `&label=${encodeURIComponent(label)}&color=${encodeURIComponent(color)}`,
    { method: "GET" }
  );
  const cached = await cache.match(cacheKey);
  if (cached) return cached;

  let message;
  let messageColor = color;
  let cacheSeconds = CACHE_SECONDS;
  try {
    const data = await fetchPlayer(user);
    if (!data || data.id == null) {
      // Unknown player (EyeWire returns id:null with HTTP 200).
      message = "player not found";
      messageColor = COLORS.error;
      cacheSeconds = ERROR_CACHE_SECONDS;
    } else {
      message = metricMessage(data, period, metric);
    }
  } catch (_err) {
    message = "unavailable";
    messageColor = COLORS.muted;
    cacheSeconds = ERROR_CACHE_SECONDS;
  }

  const res = svg(badgeSvg({ label, message, messageColor }), { cache: cacheSeconds });
  // Only cache successful badges long-term; transient errors use the response's
  // own short TTL but we still memoise briefly to smooth out bursts.
  ctx.waitUntil(cache.put(cacheKey, res.clone()));
  return res;
}

export default {
  async fetch(request, _env, ctx) {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS });
    }
    if (request.method !== "GET") {
      return json({ error: "method_not_allowed" }, 405);
    }

    const url = new URL(request.url);
    if (url.pathname === "/stats") return handleStats(url, ctx);
    if (url.pathname === "/badge.svg") return handleBadge(url, ctx);
    return json({ error: "not_found" }, 404);
  },
};
