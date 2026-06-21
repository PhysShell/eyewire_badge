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

export const DEFAULT_API = "https://eyewire.org/1.0";
export const PERIODS = ["day", "week", "month", "forever"];

/**
 * EyeWire usernames are conservative; allow letters, digits and a few safe
 * separators. This is a defence-in-depth guard, not authentication: it keeps
 * us from building weird URLs and bounces obvious garbage before any request.
 */
export const USERNAME_RE = /^[A-Za-z0-9_.-]{1,40}$/;

export function isValidUsername(name) {
  return typeof name === "string" && USERNAME_RE.test(name);
}

/** Build the request URL for either the direct API or a proxy base. */
export function buildStatsUrl(username, apiBase) {
  const user = encodeURIComponent(username);
  if (apiBase) {
    const base = String(apiBase).replace(/\/+$/, "");
    return `${base}/stats?u=${user}`;
  }
  return `${DEFAULT_API}/player/${user}/stats`;
}

/** Custom error so the widget can render the right state for each failure. */
export class StatsError extends Error {
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
export function normalizeStats(raw, period) {
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
export async function fetchStats(username, { period = "forever", apiBase = "", signal } = {}) {
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
