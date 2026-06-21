/**
 * Optional Cloudflare Worker proxy for the EyeWire stats widget.
 *
 * The public EyeWire endpoint already sends `Access-Control-Allow-Origin: *`,
 * so the widget works WITHOUT this proxy. Deploy it only when you want:
 *   - edge caching (don't hammer EyeWire on every page view),
 *   - a stable URL you control if EyeWire changes headers,
 *   - basic rate limiting / username validation at the edge.
 *
 * Endpoint:
 *   GET /stats?u=<username>   ->  the player's stats JSON (passed through)
 *
 * It returns the raw EyeWire shape unchanged, so the widget's own
 * normalizeStats() handles both direct and proxied responses identically.
 *
 * Deploy:
 *   npm i -g wrangler
 *   wrangler deploy        # uses worker/wrangler.toml
 *
 * Security: public data only. No auth, no cookies, no secrets. We never forward
 * the client's cookies upstream and never set any.
 */

const UPSTREAM = "https://eyewire.org/1.0/player";
const USERNAME_RE = /^[A-Za-z0-9_.-]{1,40}$/;
const CACHE_SECONDS = 120; // EyeWire stats don't need to be real-time.

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
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...CORS,
      ...extraHeaders,
    },
  });
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
    if (url.pathname !== "/stats") {
      return json({ error: "not_found" }, 404);
    }

    const user = (url.searchParams.get("u") || "").trim();
    if (!USERNAME_RE.test(user)) {
      // Deliberately terse — don't echo back arbitrary input.
      return json({ error: "invalid_username" }, 400);
    }

    // Serve from the edge cache when we can.
    const cache = caches.default;
    const cacheKey = new Request(`${url.origin}/stats?u=${encodeURIComponent(user)}`, request);
    const cached = await cache.match(cacheKey);
    if (cached) return cached;

    // Per-request timeout so a slow upstream can't hang the Worker.
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 12000);

    let upstream;
    try {
      upstream = await fetch(`${UPSTREAM}/${encodeURIComponent(user)}/stats`, {
        method: "GET",
        headers: { Accept: "application/json" },
        signal: ctrl.signal,
      });
    } catch (_err) {
      clearTimeout(timer);
      return json({ error: "upstream_unavailable" }, 502);
    }
    clearTimeout(timer);

    if (!upstream.ok) {
      return json({ error: "upstream_error", status: upstream.status }, 502);
    }

    let data;
    try {
      data = await upstream.json();
    } catch (_err) {
      return json({ error: "upstream_bad_json" }, 502);
    }

    const res = json(data, 200, {
      "Cache-Control": `public, max-age=${CACHE_SECONDS}`,
    });
    ctx.waitUntil(cache.put(cacheKey, res.clone()));
    return res;
  },
};
