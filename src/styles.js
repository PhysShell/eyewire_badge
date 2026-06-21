/**
 * Shadow DOM styles for <eyewire-stats>.
 *
 * Everything lives inside a Shadow root, so these rules cannot leak out to the
 * host page and the host page's rules cannot leak in. Colours and a few sizes
 * are exposed as CSS custom properties on :host so a `theme` attribute or
 * surrounding CSS can override them without forking the component.
 */
export const styles = `
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
