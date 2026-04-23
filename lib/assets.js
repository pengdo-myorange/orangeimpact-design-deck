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

  let logoSvg = "";
  const logoPath = path.join(ds.assetsDir, "orangeimpact-logo.svg");
  if (fs.existsSync(logoPath)) logoSvg = fs.readFileSync(logoPath, "utf8");

  return { odsCss, deckCss, fontB64, logoSvg };
}

export function loadBrandSidecar(mdDir) {
  const sidecar = path.join(mdDir, "brand.md");
  if (!fs.existsSync(sidecar)) return {};
  const src = fs.readFileSync(sidecar, "utf8");
  const m = src.match(/^---\s*\n([\s\S]*?)\n---/);
  if (!m) return {};
  const out = {};
  for (const line of m[1].split("\n")) {
    const km = line.match(/^\s*([A-Za-z_][\w-]*)\s*:\s*(.+?)\s*$/);
    if (!km) continue;
    let v = km[2];
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    out[km[1]] = v;
  }
  return out;
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
