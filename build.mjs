/**
 * Tiny zero-dependency bundler.
 *
 * The source in src/ is authored as clean ES modules (nice to read, nice to
 * test). GitHub Pages READMEs and the "one <script> tag" use-case are happiest
 * with a single classic script, so we concatenate the modules into one IIFE at
 * dist/eyewire-widget.js. There is no minifier and no transpiler — we simply
 * strip the local `import`/`export` lines (the modules have no external deps)
 * and wrap the result so nothing leaks to global scope.
 *
 *   node build.mjs
 */
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = dirname(fileURLToPath(import.meta.url));

// Concatenation order matters: dependencies first, the custom element last.
const ORDER = ["styles.js", "api.js", "render.js", "eyewire-widget.js"];

function stripModuleSyntax(code) {
  return code
    .split("\n")
    .filter((line) => {
      const t = line.trim();
      // Drop local import statements and bare re-export lines.
      if (/^import\s.+from\s+['"]\.\/.+['"];?$/.test(t)) return false;
      if (/^export\s*\{[^}]*\};?$/.test(t)) return false;
      return true;
    })
    // `export const/function/class/let/var X` -> `const/function/class/...`
    .map((line) => line.replace(/^(\s*)export\s+(const|let|var|function|class|async)\b/, "$1$2"))
    .join("\n");
}

const header = `/*!
 * eyewire-stats widget — generated bundle. Do not edit by hand.
 * Source: src/*.js  ·  Rebuild: node build.mjs
 * Public EyeWire stats only — no auth, no cookies, no tokens.
 */`;

const parts = [];
for (const file of ORDER) {
  const code = await readFile(join(root, "src", file), "utf8");
  parts.push(`// ---- src/${file} ----\n${stripModuleSyntax(code).trim()}`);
}

const bundle = `${header}
(function () {
  "use strict";

${parts.join("\n\n").replace(/^/gm, "  ")}
})();
`;

// Emit the canonical bundle to dist/ and a copy into docs/ so GitHub Pages
// (served from /docs) is fully self-contained with no path juggling.
const targets = ["dist/eyewire-widget.js", "docs/eyewire-widget.js"];
for (const rel of targets) {
  await mkdir(join(root, dirname(rel)), { recursive: true });
  await writeFile(join(root, rel), bundle, "utf8");
}
console.log(`Built ${targets.join(", ")} (${bundle.length} bytes)`);
