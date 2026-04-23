#!/usr/bin/env node
// design-deck CLI: parse a markdown deck, render to a single self-contained 1920×1080 HTML.

import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";
import { fileURLToPath } from "node:url";

import { parseDeck } from "./lib/parse.js";
import { escapeHTML } from "./lib/inline.js";
import { renderSlide, LAYOUT_CSS } from "./lib/layouts.js";
import { CHROME_CSS } from "./lib/chrome.js";
import { PRINT_CSS } from "./lib/print-css.js";
import { STAGE_JS } from "./lib/stage.js";
import { REVIEW_CSS, REVIEW_HTML, REVIEW_JS } from "./lib/review.js";
import { resolveDesignSystem, loadODS, loadBrandSidecar, brandToCss, inlineImages } from "./lib/assets.js";
import { familyToCss } from "./lib/family-presets.js";
import { clearCache } from "./lib/image-gen.js";
import { lintDeck, formatWarnings } from "./lib/lint.js";
import { buildPDF } from "./lib/pdf.js";
import { verify, formatVerify } from "./lib/verify.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ---------------------------------------------------------------- CLI parsing

function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith("--")) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (!next || next.startsWith("--")) {
        args[key] = true;
      } else {
        args[key] = next;
        i++;
      }
    } else if (!args.input) {
      args.input = a;
    } else {
      args._.push(a);
    }
  }
  return args;
}

function help() {
  console.log(`design-deck — markdown → 1920×1080 HTML slide deck

Usage: build.js <input.md> [options]

Options:
  --out <path>             Output HTML path (default: <input>.html)
  --mode draft|final       draft: AI images placeholder / final: real (default: final)
  --design-system <path>   ODS path override
  --theme light|dark       Default theme (default: light)
  --pdf                    Build PDF after HTML (Playwright preferred, Chrome fallback)
  --slide <N[,N,...]>      Render only specified slide(s) → preview/slide-N.html
  --merge <N>              Merge preview/slide-N.html back into main deck
  --no-image-gen           AI images → placeholder only
  --images-only            Generate images, skip HTML build
  --clear-cache            Clear image cache and exit
  --interactive            Sequential single-slide build (placeholder)
  --yes                    Auto-confirm cost prompt
  --showcase               Build only 2 grammar-defining slides for review
  --verify                 Run verification after build
  --strict                 Fail build on lint warnings
  --critique               Same as --verify (kept for compat)
`);
}

// ---------------------------------------------------------------- helpers

function ask(q) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(q, (a) => { rl.close(); resolve(a.trim()); });
  });
}

function buildShell({ title, fontB64, odsCss, deckCss, layoutCss, brandCss, slidesHtml, total }) {
  const tplPath = path.join(__dirname, "templates", "shell.html");
  let tpl = fs.readFileSync(tplPath, "utf8");
  return tpl
    .replace("{{TITLE}}", escapeHTML(title))
    .replace("{{FONT_B64}}", fontB64)
    .replace("{{ODS_CSS}}", odsCss + "\n" + layoutCss + (brandCss ? "\n" + brandCss : ""))
    .replace("{{DECK_CSS}}", deckCss)
    .replace("{{PRINT_CSS}}", PRINT_CSS)
    .replace("{{CHROME_CSS}}", CHROME_CSS)
    .replace("{{REVIEW_CSS}}", REVIEW_CSS)
    .replace("{{SLIDES}}", slidesHtml)
    .replace("{{TOTAL}}", String(total))
    .replace("{{REVIEW_HTML}}", REVIEW_HTML)
    .replace("{{STAGE_JS}}", STAGE_JS)
    .replace("{{REVIEW_JS}}", REVIEW_JS);
}

function pickShowcaseSlides(slides) {
  // Pick first slide + the slide with the most distinct layout from it.
  if (slides.length < 5) return null;
  const first = slides[0];
  let best = slides[1];
  for (const s of slides.slice(1)) {
    if (s.layout !== first.layout) { best = s; break; }
  }
  return [first, best];
}

// ---------------------------------------------------------------- main

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || args.h) { help(); return; }

  if (args["clear-cache"]) {
    const here = process.cwd();
    const dir = path.join(here, ".design-deck-cache");
    const n = clearCache(dir);
    console.log(`✓ cleared ${n} cached images from ${dir}`);
    return;
  }

  if (!args.input) { help(); process.exit(1); }
  const inputPath = path.resolve(args.input);
  if (!fs.existsSync(inputPath)) {
    console.error(`✗ input not found: ${inputPath}`);
    process.exit(1);
  }
  const mdDir = path.dirname(inputPath);
  const out = path.resolve(args.out || inputPath.replace(/\.md$/, ".html"));
  const mode = args.mode || "final";
  const noImageGen = !!args["no-image-gen"];
  const cacheDir = path.join(mdDir, ".design-deck-cache");

  // 1) Parse markdown
  const src = fs.readFileSync(inputPath, "utf8");
  const { frontMatter, slides } = parseDeck(src);

  // 2) Brand sidecar merge (sidecar overrides front-matter)
  const sidecar = loadBrandSidecar(mdDir);
  const fm = { ...frontMatter, ...sidecar };
  if (args.theme) fm.theme = args.theme;

  // 3) Design system
  const ds = resolveDesignSystem({ flag: args["design-system"], mdDir, skillDir: __dirname });
  const { odsCss, deckCss, fontB64, logoSvg } = loadODS(ds);

  // 4) Lint
  const warnings = lintDeck(slides, { accent: fm.accent });
  if (warnings.length) {
    console.log(`⚠ lint: ${warnings.length} warning(s)`);
    console.log(formatWarnings(warnings));
    if (args.strict) {
      console.error("✗ --strict: aborting due to lint warnings");
      process.exit(1);
    }
  } else {
    console.log("✓ lint clean");
  }

  // 5) Showcase mode — build only 2 grammar-defining slides
  let renderSet = slides;
  let outForThisRun = out;
  if (args.showcase) {
    const picked = pickShowcaseSlides(slides);
    if (!picked) {
      console.log("ℹ <5 slides — skipping showcase mode");
    } else {
      renderSet = picked.map((s, i) => ({ ...s, index: i }));
      outForThisRun = out.replace(/\.html$/, ".showcase.html");
      console.log(`📐 showcase: rendering slides ${picked[0].index + 1} + ${picked[1].index + 1} only → ${outForThisRun}`);
    }
  }

  // 6) Slide subset (--slide N[,N])
  if (args.slide) {
    const idxs = String(args.slide).split(",").map((s) => parseInt(s.trim(), 10) - 1).filter((n) => n >= 0 && n < slides.length);
    if (idxs.length) {
      renderSet = idxs.map((i, j) => ({ ...slides[i], index: j }));
      const previewDir = path.join(mdDir, "preview");
      fs.mkdirSync(previewDir, { recursive: true });
      outForThisRun = path.join(previewDir, `slide-${idxs.map((i) => i + 1).join("_")}.html`);
      console.log(`🔍 slide-only: rendering ${idxs.map((i) => i + 1).join(",")} → ${outForThisRun}`);
    }
  }

  // 7) Inline images (always — placeholder if draft/no-image-gen)
  const apiKey = process.env.OPENAI_API_KEY || "";
  const imgStats = await inlineImages(slides, { mdDir, mode, cacheDir, openaiKey: apiKey, noImageGen });

  // 8) Cost confirm in final mode if there are real generations
  if (mode === "final" && imgStats.generated > 0 && !args.yes && !args["images-only"]) {
    const ans = await ask(`💰 Will generate ${imgStats.generated} new image(s), est $${imgStats.costEstimate.toFixed(2)}. Continue? [y/N] `);
    if (!/^y(es)?$/i.test(ans)) { console.log("aborted"); process.exit(1); }
  }
  if (args["images-only"]) {
    console.log(`✓ images-only complete — generated ${imgStats.generated}, cache hits ${imgStats.hits}, placeholders ${imgStats.placeholders}`);
    return;
  }

  // 9) Render slides. Some layouts (e.g. section-divider without a hero
  // title) intentionally return "" so the slide is skipped. We render first,
  // then drop empties and recount so the total and chrome page numbers line up.
  const provisionalCtx = {
    fm,
    total: renderSet.length,
    logoSvg,
    autoMeta: () => "",
  };
  const firstPass = renderSet.map((s, i) => renderSlide({ ...s, index: i }, provisionalCtx));
  const kept = renderSet.filter((_, i) => (firstPass[i] || "").trim().length > 0);
  const skipped = firstPass.length - kept.length;
  if (skipped > 0) console.log(`ℹ skipped ${skipped} empty slide${skipped === 1 ? "" : "s"} (section-divider without hero)`);
  const total = kept.length;
  const ctx = { fm, total, logoSvg, autoMeta: () => "" };
  const slidesHtml = kept.map((s, i) => renderSlide({ ...s, index: i }, ctx)).join("\n");

  // 10) Layout distribution stats
  const layoutDist = {};
  for (const s of slides) layoutDist[s.layout] = (layoutDist[s.layout] || 0) + 1;

  // 11) Compose & write HTML
  // Family preset goes first (most generic), then explicit brand sidecar wins.
  const brandCss = [familyToCss(fm.family), brandToCss(fm)].filter(Boolean).join("\n");
  const html = buildShell({
    title: fm.title || path.basename(inputPath, ".md"),
    fontB64, odsCss, deckCss,
    layoutCss: LAYOUT_CSS,
    brandCss,
    slidesHtml,
    total,
  });
  fs.writeFileSync(outForThisRun, html);
  const sizeKb = (Buffer.byteLength(html, "utf8") / 1024).toFixed(0);
  console.log(`✓ wrote ${outForThisRun} (${sizeKb} KB, ${total} slide${total === 1 ? "" : "s"})`);

  // 12) PDF
  let pdfResult = null;
  if (args.pdf) {
    const pdfPath = outForThisRun.replace(/\.html$/, ".pdf");
    try {
      pdfResult = await buildPDF({ htmlPath: outForThisRun, outPath: pdfPath });
      console.log(`✓ pdf written ${pdfPath} (engine: ${pdfResult.engine})`);
    } catch (e) {
      console.warn(`⚠ pdf build failed: ${e.message}`);
    }
  }

  // 13) Verify
  let verifyResult = null;
  if (args.verify || args.critique) {
    verifyResult = await verify({ htmlPath: outForThisRun, expectedSlides: total });
    console.log(formatVerify(verifyResult));
  }

  // 14) Build report
  const reportPath = outForThisRun.replace(/\.html$/, ".build.json");
  const report = {
    input: inputPath,
    output: outForThisRun,
    mode,
    slides: total,
    bytes: Buffer.byteLength(html, "utf8"),
    layouts: layoutDist,
    images: imgStats,
    warnings,
    verify: verifyResult,
    pdf: pdfResult,
    builtAt: new Date().toISOString(),
  };
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`📋 report ${reportPath}`);

  if (verifyResult && !verifyResult.passed) process.exit(1);
}

main().catch((e) => {
  console.error("✗", e.message);
  if (process.env.DEBUG) console.error(e.stack);
  process.exit(1);
});
