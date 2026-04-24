// Aesthetic family presets — overlay spacing/radius/shadow/font on top of ODS.
// Implements the 9 aesthetic families from awesome-claude-design.
// Tokens cascade through slide templates via var(--brand), var(--bg-canvas), etc.

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

  "cinematic-dark": {
    // Keynote-scale dark canvas (NVIDIA/RunwayML staging), but accent stays ODS orange
    // so the deck reads as Orangeimpact-on-black, not "someone else's brand".
    css: `
:root {
  --bg-canvas: #000000;
  --bg-subtle: #0a0a0a;
  --bg-muted:  #1a1a1a;
  --bg-brand-tint: rgba(255,111,31,0.14);
  --bg-hero-gradient: #000000;
  --fg-strong: #ffffff;
  --fg-normal: #f0f0f0;
  --fg-alternative: #a0a0a0;
  --fg-assistive: #707070;
  --fg-on-brand: #ffffff;
  --brand: var(--orange-700);
  --brand-hover: var(--orange-600);
  --brand-press: var(--orange-800);
  --accent: var(--orange-500);
  --border-subtle: #1f1f1f;
  --border-strong: #333333;
  --radius-lg: 4px;
  --radius-md: 2px;
  --radius-sm: 2px;
  --shadow-sm: 0 2px 8px rgba(0,0,0,0.6);
  --shadow-md: 0 24px 64px rgba(0,0,0,0.72);
  --shadow-lg: 0 48px 96px rgba(0,0,0,0.8);
}
html, body { background: #000000; color: #f0f0f0; }
.sl-title, .sl-h, h1, h2, h3 { letter-spacing: -0.5px; }
.sl-bignum-num, .sl-stats-num { font-feature-settings: "tnum" 1; }
.sl-card, .sl-bento-card, .sl-chain-card, .sl-stats-cell, .sl-process-cell, .sl-prompt-response {
  background: #0a0a0a;
  border: 1px solid #1f1f1f;
  box-shadow: none;
}
.sl-body ul li::before { background: var(--orange-700); }
/* Section dividers default to a brand-colored surface — keep them black here so
   the orange logo symbol stays visible at the top-right. */
.sl-section-divider { background: #000000; color: #ffffff; }
/* Keep the orange symbol; flip only the wordmark (paths without an explicit fill). */
.sl-logo svg path:not([fill]), .sl-closing-logo svg path:not([fill]) { fill: #ffffff; }
`.trim(),
  },

  "playful-color": {
    // Figma / Duolingo / Mailchimp: soft shadows, generous radii, pill buttons, flat hues.
    // Default brand is Figma's purple; override per-deck via brand.md accent.
    css: `
:root {
  --radius-lg: 16px;
  --radius-md: 12px;
  --radius-sm: 8px;
  --radius-xl: 20px;
  --brand: #a259ff;
  --brand-hover: #8e47ec;
  --brand-press: #7935d9;
  --brand-tint: #f1e6ff;
  --bg-brand-tint: #f7eeff;
  --accent: #1abcfe;
  --accent-tint: #e6f8ff;
  --shadow-sm: 0 4px 12px rgba(15,15,20,0.06);
  --shadow-md: 0 8px 24px rgba(15,15,20,0.08);
  --shadow-lg: 0 24px 48px rgba(15,15,20,0.12);
}
.sl-card, .sl-bento-card, .sl-chain-card, .sl-stats-cell, .sl-process-cell {
  border: 1px solid var(--border-subtle);
}
.sl-body ul li::before {
  width: 10px; height: 10px; border-radius: 999px; top: 18px; background: var(--brand);
}
.sl-chip, .sl-eyebrow-chip { border-radius: 999px; }
`.trim(),
  },

  "glass-futurism": {
    // Apple / Arc / Spotify: translucent layering, subtle dividers, SF Pro-ish stack.
    // Keeps light canvas but leans on backdrop-filter + soft tints for depth.
    css: `
:root {
  --font-sans: -apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display",
    "Pretendard Variable", Pretendard, system-ui, "Helvetica Neue", Arial,
    "Apple SD Gothic Neo", "Noto Sans KR", sans-serif;
  --radius-lg: 14px;
  --radius-md: 12px;
  --radius-sm: 10px;
  --radius-xl: 16px;
  --brand: #007aff;
  --brand-hover: #006de6;
  --brand-press: #005ecc;
  --brand-tint: #e6f1ff;
  --bg-brand-tint: rgba(0,122,255,0.08);
  --bg-subtle: #f2f7fa;
  --bg-muted: #e8eef3;
  --accent: #5ac8fa;
  --shadow-sm: 0 1px 0 rgba(0,0,0,0.04);
  --shadow-md: 0 2px 8px rgba(0,0,0,0.06);
  --shadow-lg: 0 8px 32px rgba(0,0,0,0.08);
}
.sl-card, .sl-bento-card, .sl-chain-card, .sl-stats-cell, .sl-process-cell, .sl-prompt-response {
  background: rgba(255,255,255,0.72);
  backdrop-filter: blur(30px) saturate(180%);
  -webkit-backdrop-filter: blur(30px) saturate(180%);
  border: 1px solid rgba(255,255,255,0.5);
  box-shadow: var(--shadow-md);
}
.sl-body ul li::before { width: 8px; height: 8px; border-radius: 999px; top: 19px; background: var(--brand); }
.sl-title, .sl-h, h1, h2, h3 { letter-spacing: -0.02em; font-feature-settings: "ss01" 1; }
`.trim(),
  },

  "neon-brutalist": {
    // The Verge / PlayStation / Bugatti: zero radius, 2px rules, orange-black-white only.
    // Strict: no shadows, no rounding — depth comes from size contrast and inversion.
    css: `
:root {
  --radius-lg: 0;
  --radius-md: 0;
  --radius-sm: 0;
  --radius-xl: 0;
  --radius-pill: 0;
  --brand: #ff6600;
  --brand-hover: #e55c00;
  --brand-press: #cc5200;
  --brand-tint: #fff1e6;
  --bg-brand-tint: #fff1e6;
  --accent: #ff6600;
  --border-subtle: #000000;
  --border-strong: #000000;
  --shadow-xs: none;
  --shadow-sm: none;
  --shadow-md: none;
  --shadow-lg: none;
}
html, body { letter-spacing: -0.01em; }
.sl-title, .sl-h, h1, h2, h3 { letter-spacing: -0.02em; font-weight: 800; }
.sl-card, .sl-bento-card, .sl-chain-card, .sl-stats-cell, .sl-process-cell, .sl-prompt-response {
  border: 2px solid #000000;
  box-shadow: none;
  border-radius: 0;
}
.sl-bento-grid, .sl-chain-grid, .sl-process-grid, .sl-stats-grid { gap: 0 !important; }
.sl-bento-card + .sl-bento-card, .sl-chain-card + .sl-chain-card,
.sl-stats-cell + .sl-stats-cell, .sl-process-cell + .sl-process-cell {
  border-left: 0;
}
.sl-chip, .sl-eyebrow-chip { border-radius: 0; border: 2px solid #000; }
.sl-body ul li::before { width: 12px; height: 12px; border-radius: 0; top: 20px; background: #000; }
`.trim(),
  },

  "indie-cult": {
    // Granola / Criterion / A24: cream canvas, warm serif, terracotta accent.
    // Uses a serif display via web-safe fallback (Georgia) since ODS ships Pretendard only.
    css: `
:root {
  --bg-canvas: #faf8f2;
  --bg-subtle: #fff9ef;
  --bg-muted:  #f0e8d8;
  --bg-brand-tint: #fbeadf;
  --bg-hero-gradient: linear-gradient(#faf8f2 0%, #fff4e0 100%);
  --fg-strong: #1a1814;
  --fg-normal: #2a2520;
  --fg-alternative: #6a5f52;
  --fg-assistive: #8a7f72;
  --brand: #b45837;
  --brand-hover: #a04a2c;
  --brand-press: #8a3f24;
  --brand-tint: #fbeadf;
  --accent: #e4b894;
  --border-subtle: #e4d4c0;
  --border-strong: #c9b59c;
  --radius-lg: 14px;
  --radius-md: 10px;
  --radius-sm: 8px;
  --shadow-sm: 0 2px 12px rgba(180,88,55,0.06);
  --shadow-md: 0 8px 32px rgba(180,88,55,0.08);
  --shadow-lg: 0 24px 64px rgba(180,88,55,0.10);
}
html, body { background: #faf8f2; color: #2a2520; }
.sl-title, .sl-h, h1, h2, h3 {
  font-family: "Georgia", "Times New Roman", "Noto Serif KR", serif;
  font-weight: 500;
  letter-spacing: -0.01em;
}
.sl-card, .sl-bento-card, .sl-chain-card, .sl-stats-cell, .sl-process-cell, .sl-prompt-response {
  background: rgba(255,251,244,0.7);
  backdrop-filter: blur(16px) saturate(150%);
  -webkit-backdrop-filter: blur(16px) saturate(150%);
  border: 1px solid var(--border-subtle);
  box-shadow: var(--shadow-sm);
}
.sl-body ul li::before { width: 8px; height: 8px; border-radius: 999px; top: 19px; background: #b45837; }
`.trim(),
  },
};

// Legacy / alias names from awesome-claude-design.
// Normalise to our canonical keys before lookup.
const ALIASES = {
  "glass-soft-futurism": "glass-futurism",
  "glass/soft-futurism": "glass-futurism",
  "soft-futurism": "glass-futurism",
  "cult-indie": "indie-cult",
  "cult/indie": "indie-cult",
  "indie/cult": "indie-cult",
  "cinematic": "cinematic-dark",
  "brutalist": "neon-brutalist",
  "playful": "playful-color",
};

export function familyToCss(family) {
  if (!family) return "";
  const raw = String(family).toLowerCase().trim();
  const key = ALIASES[raw] || raw;
  if (FAMILIES[key]) {
    if (!FAMILIES[key].css) return "";
    return `/* family preset: ${key} */\n${FAMILIES[key].css}`;
  }
  if (typeof console !== "undefined") {
    console.warn(`[design-deck] unknown family "${raw}". Known: ${Object.keys(FAMILIES).join(", ")}`);
  }
  return "";
}

export const FAMILY_NAMES = Object.keys(FAMILIES);
export const FAMILY_ALIASES = { ...ALIASES };
