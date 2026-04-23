// Aesthetic family presets — overlay spacing/radius/shadow/font on top of ODS.
// Inspired by awesome-claude-design's 9 aesthetic families catalog.
// We implement 4 explicitly; the other 5 enums fall back to warm-editorial
// with a console warning so brand.md authors can iterate without breakage.

const FAMILIES = {
  "warm-editorial": {
    // Our default — return empty CSS, ODS is already this aesthetic.
    css: "",
  },

  "editorial-minimalism": {
    // Linear / Stripe / Vercel: more whitespace, hairline shadow, sharper corners.
    css: `
:root {
  --radius-lg: 6px;
  --radius-md: 4px;
  --shadow-sm: 0 1px 0 rgba(0,0,0,0.04);
}
.sl-body { padding: 112px 144px 88px; }
.sl-card, .sl-bento-card, .sl-chain-card, .sl-stats-cell, .sl-process-cell, .sl-prompt-response {
  border: 1px solid var(--border-subtle);
  box-shadow: none;
}
.sl-body ul li::before { width: 16px; height: 2px; border-radius: 1px; top: 22px; }
`.trim(),
  },

  "data-dense-pro": {
    // PostHog / ClickHouse / Grafana: tighter spacing, denser cards, monospace headlines.
    css: `
:root {
  --radius-lg: 8px;
  --radius-md: 6px;
  --shadow-sm: 0 2px 4px rgba(15,23,42,0.06);
}
.sl-body { padding: 80px 96px 64px; }
.sl-bento-grid, .sl-chain-grid, .sl-process-grid, .sl-stats-grid {
  gap: 16px !important;
}
.sl-bento-card, .sl-chain-card, .sl-stats-cell, .sl-process-cell {
  padding: 24px 20px;
}
.sl-stats-num, .sl-bignum-num { font-feature-settings: "tnum" 1; }
.sl-body ul li::before { width: 14px; height: 2px; border-radius: 1px; top: 22px; }
`.trim(),
  },

  "terminal-core": {
    // Ollama / Warp / Raycast: monospace everywhere, near-black canvas, phosphor accent.
    // Note: switching the entire deck to dark canvas needs the per-slide theme="dark"
    // marker, so we limit ourselves to font-family + accent shift for safety.
    css: `
:root {
  --font-sans: var(--font-mono, "JetBrains Mono", "SF Mono", Menlo, monospace);
}
.sl-title, .sl-eyebrow, .sl-body p, .sl-body li, .sl-bento-title, .sl-chain-title {
  font-feature-settings: "tnum" 1, "calt" 0;
  letter-spacing: 0;
}
.sl-prompt-code { font-size: 24px; }
`.trim(),
  },
};

// Names from awesome-claude-design that we recognise but don't yet implement.
const KNOWN_FALLBACK = [
  "cinematic-dark",
  "playful-color",
  "glass-soft-futurism",
  "neon-brutalist",
  "cult-indie",
];

export function familyToCss(family) {
  if (!family) return "";
  const key = String(family).toLowerCase().trim();
  if (FAMILIES[key]) {
    if (!FAMILIES[key].css) return "";
    return `/* family preset: ${key} */\n${FAMILIES[key].css}`;
  }
  if (KNOWN_FALLBACK.includes(key)) {
    if (typeof console !== "undefined") {
      console.warn(`[design-deck] family "${key}" is not yet implemented — falling back to warm-editorial.`);
    }
    return "";
  }
  if (typeof console !== "undefined") {
    console.warn(`[design-deck] unknown family "${key}". Known: ${Object.keys(FAMILIES).concat(KNOWN_FALLBACK).join(", ")}`);
  }
  return "";
}

export const FAMILY_NAMES = Object.keys(FAMILIES);
export const FAMILY_FALLBACKS = KNOWN_FALLBACK.slice();
