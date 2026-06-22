# EyeWire Stats Widget

An embeddable **Web Component** that shows a public [EyeWire](https://eyewire.org)
player's stats in a compact, dark sci‑fi / HUD card. Drop it on a personal site,
a portfolio, or a GitHub Pages page with **one `<script>` tag and one custom
element**.

```html
<script src="https://USERNAME.github.io/REPO/eyewire-widget.js" defer></script>

<eyewire-stats user="SomeEyeWireUser" mode="card" period="forever"></eyewire-stats>
```

- ✅ **Public data only** — no login, no password, no cookies, no tokens.
- ✅ **Shadow DOM** — the host page can't break the widget, and the widget can't
  leak styles onto the host page.
- ✅ **No backend required** — the EyeWire stats endpoint sends
  `Access-Control-Allow-Origin: *`, so the browser can fetch it directly.
  An optional Cloudflare Worker proxy is included for caching if you want it.
- ✅ `card`, `mini`, and `badge` modes; `day` / `week` / `month` / `forever`
  periods; dark + light themes.

---

## Quick start

### 1. The one‑liner (recommended)

Use the prebuilt single file `dist/eyewire-widget.js` (a plain classic script —
works with `defer`, no `type="module"` needed):

```html
<script src="https://USERNAME.github.io/REPO/eyewire-widget.js" defer></script>

<eyewire-stats user="crazyman4865"></eyewire-stats>
```

### 2. ES modules (for app bundlers / local dev)

The source in [`src/`](src/) is authored as clean ES modules:

```html
<script type="module" src="/src/eyewire-widget.js"></script>
<eyewire-stats user="crazyman4865"></eyewire-stats>
```

```js
// or import it from your own bundle
import "./src/eyewire-widget.js";
```

---

## Attributes

| Attribute      | Values                                   | Default     | Notes |
|----------------|------------------------------------------|-------------|-------|
| `user`         | EyeWire username                         | — (required)| Validated against `^[A-Za-z0-9_.-]{1,40}$`. |
| `mode`         | `card` · `mini` · `badge`                | `card`      | Display variant. |
| `period`       | `day` · `week` · `month` · `forever`     | `forever`   | Which stats window to show. |
| `theme`        | `dark` · `light`                         | `dark`      | |
| `compact`      | `true` · `false`                         | `false`     | Narrower card. |
| `show-updated` | `true` · `false`                         | `true`      | Footer "Updated …" line. |
| `api-base`     | URL                                      | _(none)_    | Optional proxy base; calls `${api-base}/stats?u=USER`. |

All attributes are **reactive** — change `user`, `period`, `mode`, etc. at
runtime (e.g. `el.setAttribute("user", "Nseraf")`) and the widget updates.
Changing `user`/`period`/`api-base` refetches; `mode`/`theme`/`compact` just
re‑render.

### Modes

| Mode    | Looks like |
|---------|------------|
| `card`  | Full HUD card: username, Score, Cubes, Trailblazes, (Scythes), (Completed), F‑score bar, "updated" footer. |
| `mini`  | Inline pill: `User · 4,579,373 pts · F 98.9%` |
| `badge` | Tiny two‑tone pill: `EyeWire ▏ 4,579,373 pts` |

### Events

The element emits bubbling, composed events you can hook into:

```js
el.addEventListener("eyewire:load",  (e) => console.log(e.detail)); // normalised stats
el.addEventListener("eyewire:error", (e) => console.log(e.detail.kind)); // invalid|not_found|unavailable
```

---

## Examples

Open these locally after building (`npm run build`):

- [`examples/basic.html`](examples/basic.html) — minimal embed
- [`examples/card.html`](examples/card.html) — every period, compact, light theme
- [`examples/mini.html`](examples/mini.html) — inline `mini` and `badge`

Live demo: **`docs/index.html`** → published at
`https://USERNAME.github.io/REPO/` once GitHub Pages is enabled (below).

---

## Plain HTML site

Copy `dist/eyewire-widget.js` next to your page and reference it:

```html
<!doctype html>
<html>
  <body>
    <script src="/js/eyewire-widget.js" defer></script>
    <eyewire-stats user="crazyman4865" mode="card"></eyewire-stats>
  </body>
</html>
```

That's it — no build step, no framework required.

---

## Deploy to GitHub Pages

This repo's demo lives in [`docs/`](docs/) and the build copies the widget into
`docs/eyewire-widget.js`, so Pages can serve everything from one folder.

1. **Settings → Pages → Build and deployment → Source:** *Deploy from a branch*.
2. **Branch:** your default branch, **folder:** `/docs` (recommended). The repo
   also ships a root `index.html` that redirects to `docs/`, so publishing from
   `/ (root)` works too — handy if you leave the folder on its default.
3. Save. After a minute your site is at `https://USERNAME.github.io/REPO/`.
4. Embed from anywhere using:
   ```html
   <script src="https://USERNAME.github.io/REPO/eyewire-widget.js" defer></script>
   <eyewire-stats user="SomeUser"></eyewire-stats>
   ```

> Rebuild the bundle after changing anything in `src/`: `npm run build`.

---

## CORS & the optional proxy

The public endpoint

```
GET https://eyewire.org/1.0/player/{username}/stats
```

responds with `Access-Control-Allow-Origin: *`, so **the widget fetches it
directly from the browser and no proxy is needed.** (An unknown player returns
HTTP `200` with `"id": null`, which the widget treats as *Player not found*.)

You only need a proxy if you want edge **caching**, **rate limiting**, or a
stable URL you control in case EyeWire ever changes its headers. A ready‑to‑ship
**Cloudflare Worker** is included in [`worker/`](worker/):

```bash
npm i -g wrangler
cd worker
wrangler deploy
# → https://eyewire-stats-proxy.<you>.workers.dev
```

Then point the widget at it:

```html
<eyewire-stats user="crazyman4865"
               api-base="https://eyewire-stats-proxy.you.workers.dev">
</eyewire-stats>
```

The Worker validates the username, applies a 12s upstream timeout, caches for
120s, sets `Cache-Control`, and returns the **same JSON shape** as EyeWire, so
the widget handles direct and proxied responses identically.

---

## SVG badge for GitHub READMEs

GitHub strips `<script>` from rendered Markdown, so the JS widget **cannot run in
a README**. For that case the Worker also exposes a static SVG badge:

```
GET /badge.svg?u=<username>
```

Embed it as a normal image:

```markdown
![EyeWire stats](https://your-worker.example/badge.svg?u=SomeUser)
```

Renders a shields‑style flat badge, e.g. `EyeWire | 4,579,373 pts`.

### Badge query parameters

| Param    | Values                                                        | Default     |
|----------|---------------------------------------------------------------|-------------|
| `u`      | EyeWire username (required)                                   | —           |
| `metric` | `points` · `cubes` · `trailblazes` · `scythes` · `complete` · `fscore` | `points` |
| `period` | `day` · `week` · `month` · `forever`                          | `forever`   |
| `label`  | Left‑side text                                                | `EyeWire`   |
| `color`  | Right‑side colour, `#rgb` or `#rrggbb`                        | `#2563eb`   |

Examples:

```markdown
![pts](https://your-worker.example/badge.svg?u=SomeUser)
![F-score](https://your-worker.example/badge.svg?u=SomeUser&metric=fscore&label=EyeWire%20F-score&color=#16a34a)
![cubes](https://your-worker.example/badge.svg?u=SomeUser&metric=cubes&period=week)
```

The badge endpoint always returns a **renderable** SVG (HTTP 200) — even for an
unknown player (`player not found`) or an outage (`unavailable`) — so a README
never shows a broken‑image icon. Successful badges cache for 120s; error badges
use a short 30s TTL so they self‑heal. This endpoint needs the Worker (an image
URL can't run client‑side fetch), so it isn't available in the no‑proxy setup.

---

## Security

This widget is intentionally minimal and safe to embed:

- **No authentication.** It never uses `/internal/account/authenticate/standard`,
  never asks for a username/password, and never sends credentials
  (`fetch(..., { credentials: "omit" })`).
- **No secrets in the frontend.** There is nothing to leak — only a public,
  read‑only endpoint is called.
- **No storage.** No cookies, no `localStorage`, no tokens.
- **Input validation.** Usernames must match `^[A-Za-z0-9_.-]{1,40}$` before any
  request is built (defence‑in‑depth, and it keeps URLs well‑formed).
- **Output escaping.** The only externally‑sourced string (the username) is HTML‑
  escaped before rendering, and everything renders inside a Shadow root.
- **Terse errors.** Failures surface as friendly states
  (*Loading…* / *Player not found* / *Invalid username* /
  *EyeWire stats unavailable*) without exposing internal details, and never throw
  up into the host page.

---

## Project layout

```
.
├─ src/                     # ES module source (authored here)
│  ├─ eyewire-widget.js     #   <eyewire-stats> custom element
│  ├─ api.js                #   fetch + validation + normalization
│  ├─ render.js             #   card / mini / badge / state renderers
│  └─ styles.js             #   Shadow DOM styles (themeable)
├─ dist/eyewire-widget.js   # built single-file bundle (generated)
├─ docs/                    # GitHub Pages demo (self-contained)
│  ├─ index.html
│  ├─ demo.css
│  ├─ eyewire-widget.js     #   bundle copy (generated)
│  └─ api-response-example.json
├─ examples/                # basic / card / mini standalone pages
├─ worker/                  # optional Cloudflare Worker proxy
│  ├─ index.js              #   /stats proxy + /badge.svg endpoint
│  ├─ badge.js              #   pure SVG badge generator
│  └─ wrangler.toml
├─ test/                    # unit tests (logic, element, badge)
├─ build.mjs                # zero-dependency bundler (src → dist + docs)
└─ package.json
```

## Develop

```bash
npm run build   # bundle src/ -> dist/ and docs/
npm test        # run unit tests (node --test)
```

There are **no runtime dependencies**. The build and tests use only Node's
standard library (Node ≥ 18).

---

## Roadmap

- ✅ ~~SVG badge endpoint (`/badge.svg?u=USER`) for GitHub READMEs~~ — shipped,
  see [SVG badge](#svg-badge-for-github-readmes) above.
- Additional themes / accent presets.

Explicitly **not** planned: EyeWire auth, private data, acting on behalf of a
user, OAuth, leaderboards, or anything that needs a secret.

---

## License

[MIT](LICENSE). Independent, unofficial project — not affiliated with or
endorsed by EyeWire or the Seung Lab.
