// Design system resolution + brand sidecar + asset (font/image) base64 inlining.

import fs from "node:fs";
import path from "node:path";
import { ensureImage, placeholderSvg } from "./image-gen.js";

const MIME = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
};

export function resolveDesignSystem({ flag, mdDir, skillDir }) {
  const candidates = [];
  if (flag) candidates.push(path.resolve(flag));
  if (mdDir) candidates.push(path.join(mdDir, "Orangeimpact Design System"));
  if (skillDir) candidates.push(path.join(skillDir, "design-system"));
  for (const c of candidates) {
    if (c && fs.existsSync(path.join(c, "colors_and_type.css"))) {
      return {
        root: c,
        cssPath: path.join(c, "colors_and_type.css"),
        deckCssPath: path.join(c, "deck.css"),
        fontPath: path.join(c, "fonts", "PretendardVariable.woff2"),
        assetsDir: path.join(c, "assets"),
      };
    }
  }
  throw new Error(`Design system not found in: ${candidates.join(", ")}`);
}

export function loadODS(ds) {
  let odsCss = fs.readFileSync(ds.cssPath, "utf8");
  // Strip the @font-face from colors_and_type.css — shell injects its own with embedded base64.
  odsCss = odsCss.replace(/@font-face\s*{[^}]*}/g, "");

  let deckCss = "";
  if (fs.existsSync(ds.deckCssPath)) deckCss = fs.readFileSync(ds.deckCssPath, "utf8");

  const fontB64 = fs.existsSync(ds.fontPath) ? fs.readFileSync(ds.fontPath).toString("base64") : "";

  // Logo (color) — used on light slides
  let logoSvg = "";
  const logoCandidates = ["logos/orangeimpact.svg", "orangeimpact.svg", "orangeimpact-logo.svg"];
  for (const rel of logoCandidates) {
    const p = path.join(ds.assetsDir, rel);
    if (fs.existsSync(p)) { logoSvg = fs.readFileSync(p, "utf8"); break; }
  }

  // Logo (white) — used on dark / brand-background slides
  let logoSvgWhite = "";
  const whiteCandidates = ["logos/orangeimpact-all-white.svg", "orangeimpact-all-white.svg", "orangeimpact-wordmark-white.svg"];
  for (const rel of whiteCandidates) {
    const p = path.join(ds.assetsDir, rel);
    if (fs.existsSync(p)) { logoSvgWhite = fs.readFileSync(p, "utf8"); break; }
  }

  return { odsCss, deckCss, fontB64, logoSvg, logoSvgWhite };
}

// Minimal 1-level-nested YAML reader. Sufficient for brand.md sidecar
// (DESIGN.md v2 spec): flat keys + `typography:` / `component_overrides:` blocks.
function parseNestedYAML(src) {
  const out = {};
  const lines = src.split("\n");
  let parentKey = null;
  for (const raw of lines) {
    if (!raw.trim() || raw.trim().startsWith("#")) continue;
    const indentMatch = raw.match(/^(\s*)(.*)$/);
    const indent = indentMatch[1].length;
    const body = indentMatch[2];
    const km = body.match(/^([A-Za-z_][\w-]*)\s*:\s*(.*)$/);
    if (!km) continue;
    const key = km[1];
    let val = km[2];
    if (val === "" && indent === 0) {
      parentKey = key;
      out[parentKey] = {};
      continue;
    }
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (indent > 0 && parentKey && typeof out[parentKey] === "object") {
      out[parentKey][key] = val;
    } else {
      parentKey = null;
      out[key] = val;
    }
  }
  return out;
}

export function loadBrandSidecar(mdDir) {
  const sidecar = path.join(mdDir, "brand.md");
  if (!fs.existsSync(sidecar)) return {};
  const src = fs.readFileSync(sidecar, "utf8");
  const m = src.match(/^---\s*\n([\s\S]*?)\n---/);
  if (!m) return {};
  return parseNestedYAML(m[1]);
}

// Convert resolved brand front-matter into a CSS string that overrides
// ODS variables on the deck root. Supports DESIGN.md v2 typography +
// component_overrides plus the legacy flat `accent`. Leaves ODS intact
// when the brand sidecar is absent.
//
// Recognized keys:
//   accent: "#hex" | named token  → --brand
//   typography.headline | body    → font-family of titles / body
//   typography.mono               → --font-mono (used by .sl-prompt-code etc.)
//   component_overrides.card_radius   (px or any CSS length) → --radius-lg
//   component_overrides.card_shadow   (CSS shadow value)     → --shadow-sm
//   component_overrides.bullet_shape  square|disc|dash       → bullet pseudo-element shape
export function brandToCss(fm) {
  if (!fm) return "";
  const lines = [];
  const root = [];
  if (fm.accent && /^#[0-9a-f]{3,8}$/i.test(String(fm.accent).trim())) {
    root.push(`  --brand: ${fm.accent};`);
  }
  const t = fm.typography || {};
  if (t.body) root.push(`  --font-sans: ${quoteFamily(t.body)};`);
  if (t.mono) root.push(`  --font-mono: ${quoteFamily(t.mono)};`);
  const co = fm.component_overrides || {};
  if (co.card_radius != null && co.card_radius !== "") {
    root.push(`  --radius-lg: ${cssLength(co.card_radius)};`);
  }
  if (co.card_shadow) root.push(`  --shadow-sm: ${co.card_shadow};`);
  if (root.length) lines.push(`:root {\n${root.join("\n")}\n}`);

  // Headline font requires per-element override (no shared --font-headline ODS var)
  if (t.headline) {
    lines.push(
      `.sl-title, .sl-body h1, .sl-body h2, .sl-body h3, .sl-body h4, .sl-title-hero h1, .sl-section-num, .sl-bignum-num, .sl-stats-num { font-family: ${quoteFamily(t.headline)}; }`
    );
  }

  // Bullet shape variants
  if (co.bullet_shape) {
    const shape = String(co.bullet_shape).toLowerCase();
    if (shape === "disc") {
      lines.push(`.sl-body ul li::before { border-radius: 50%; }`);
    } else if (shape === "dash") {
      lines.push(`.sl-body ul li::before { width: 16px; height: 2px; border-radius: 1px; top: 22px; }`);
    } /* default 'square' = ODS default; no override needed */
  }

  return lines.length ? `/* brand sidecar (DESIGN.md v2) */\n${lines.join("\n")}` : "";
}

function quoteFamily(name) {
  const trimmed = String(name).trim();
  if (/^["'].*["']$/.test(trimmed)) return trimmed;
  if (/[ ,]/.test(trimmed)) return `"${trimmed.replace(/"/g, '\\"')}"`;
  return trimmed;
}

function cssLength(v) {
  if (typeof v === "number") return v + "px";
  const s = String(v).trim();
  if (/^\d+(\.\d+)?$/.test(s)) return s + "px";
  return s;
}

function readImageDataUrl(absPath) {
  if (!fs.existsSync(absPath)) return "";
  const ext = path.extname(absPath).toLowerCase();
  const mime = MIME[ext] || "application/octet-stream";
  const buf = fs.readFileSync(absPath);
  return `data:${mime};base64,${buf.toString("base64")}`;
}

export async function inlineImages(slides, opts) {
  const { mdDir, mode, cacheDir, openaiKey, noImageGen } = opts;
  const stats = { generated: 0, hits: 0, placeholders: 0, costEstimate: 0 };
  const all = [];
  const walk = (tokens) => {
    for (const t of tokens) {
      if (t && t.type === "image") all.push(t);
      if (t && t.tokens) walk(t.tokens);
    }
  };
  for (const s of slides) walk(s.tokens);

  for (const t of all) {
    if (t.isAI) {
      if (noImageGen || mode === "draft" || !openaiKey) {
        t.dataUrl = placeholderSvg({ prompt: t.prompt, size: t.size });
        stats.placeholders += 1;
        continue;
      }
      try {
        const r = await ensureImage({ prompt: t.prompt, size: t.size, style: t.style, cacheDir, apiKey: openaiKey });
        t.dataUrl = r.dataUrl;
        if (r.hit) stats.hits += 1;
        else {
          stats.generated += 1;
          stats.costEstimate += estimateCost(t.size);
        }
      } catch (e) {
        console.warn(`[design-deck] image-gen failed for "${(t.prompt || "").slice(0, 40)}": ${e.message}`);
        t.dataUrl = placeholderSvg({ prompt: t.prompt, size: t.size });
        stats.placeholders += 1;
      }
    } else if (t.url) {
      const abs = path.isAbsolute(t.url) ? t.url : path.resolve(mdDir, t.url);
      const dataUrl = readImageDataUrl(abs);
      if (dataUrl) t.dataUrl = dataUrl;
      else stats.placeholders += 1;
    }
  }
  return stats;
}

function estimateCost(size) {
  // Rough estimates for gpt-image-2; tune when official pricing confirmed.
  if (!size) return 0.03;
  if (size.startsWith("1024x1024")) return 0.02;
  return 0.03;
}
