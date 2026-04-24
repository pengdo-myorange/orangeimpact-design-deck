// 17 layout renderers. Each takes (slide, ctx) -> full <section> markup.
// ctx = { fm, total, autoMeta, dataUrlForImage(token) }

import { inline, escapeHTML } from "./inline.js";
import { renderChrome } from "./chrome.js";
import { icon } from "./icons.js";

// --------------------------------------------------------------------- helpers

const NO_CHROME = new Set(["title", "section-divider", "closing", "part-cover", "statement"]);

function autoLabel(slide) {
  // Best-effort label from first heading; falls back to layout name.
  for (const t of slide.tokens) {
    if (t.type === "heading" && t.level === 1) {
      const txt = t.text.replace(/[#*`]/g, "").trim().slice(0, 40);
      return `${String(slide.index + 1).padStart(2, "0")} ${txt}`;
    }
  }
  return `${String(slide.index + 1).padStart(2, "0")} ${slide.layout}`;
}

function findHeading(tokens, level) {
  return tokens.find((t) => t.type === "heading" && t.level === level);
}

function pickHeading(tokens, level) {
  // returns [heading, restTokens]
  const idx = tokens.findIndex((t) => t.type === "heading" && t.level === level);
  if (idx < 0) return [null, tokens.slice()];
  return [tokens[idx], tokens.slice(0, idx).concat(tokens.slice(idx + 1))];
}

function findFences(tokens, name) {
  return tokens.filter((t) => t.type === "fence" && t.name === name);
}

function isHighlighted(slide) {
  return slide.directives.highlight === "true" || slide.directives.highlight === true;
}

function renderImageToken(t, ctx, opts = {}) {
  const fit = opts.fit || "contain";
  const src = t.dataUrl || t.url || "";
  if (!src) return `<div class="sl-image-placeholder">${escapeHTML(t.alt || t.prompt || "image")}</div>`;
  const cap = t.title ? `<figcaption>${escapeHTML(t.title)}</figcaption>` : "";
  return `<figure class="sl-figure" style="--fit:${fit}"><img src="${src}" alt="${escapeHTML(t.alt || "")}">${cap}</figure>`;
}

function renderTokensGeneric(tokens, ctx) {
  const out = [];
  for (const t of tokens) {
    if (t.type === "heading") {
      out.push(`<h${t.level + 1} class="sl-h sl-h${t.level + 1}">${inline(t.text)}</h${t.level + 1}>`);
    } else if (t.type === "paragraph") {
      out.push(`<p>${inline(t.text)}</p>`);
    } else if (t.type === "list") {
      const tag = t.ordered ? "ol" : "ul";
      out.push(`<${tag}>${t.items.map((it) => `<li>${inline(it)}</li>`).join("")}</${tag}>`);
    } else if (t.type === "quote") {
      const cite = t.attribution ? `<cite>— ${escapeHTML(t.attribution)}</cite>` : "";
      out.push(`<blockquote>${inline(t.text)}${cite}</blockquote>`);
    } else if (t.type === "image") {
      out.push(renderImageToken(t, ctx));
    } else if (t.type === "table") {
      out.push(renderTable(t));
    } else if (t.type === "codefence" && /^mermaid$/i.test(t.lang || "")) {
      // Mermaid diagram — client-side rendered via CDN loader injected by build.js.
      out.push(`<div class="sl-mermaid mermaid">${escapeHTML(t.content)}</div>`);
    } else if (t.type === "codefence") {
      out.push(`<pre class="sl-code"><code>${escapeHTML(t.content)}</code></pre>`);
    } else if (t.type === "fence" && t.name === "highlight") {
      out.push(`<div class="sl-highlight">${renderTokensGeneric(t.tokens || [], ctx)}</div>`);
    } else if (t.type === "fence" && t.name === "flow") {
      out.push(renderFlow(t));
    } else if (t.type === "fence" && t.name === "note") {
      out.push(`<aside class="sl-note">${renderTokensGeneric(t.tokens || [], ctx)}</aside>`);
    } else if (t.type === "fence" && t.name === "callout") {
      out.push(`<aside class="sl-callout">${renderTokensGeneric(t.tokens || [], ctx)}</aside>`);
    }
  }
  return out.join("\n");
}

function renderTable(t) {
  const thead = t.headers
    .map((h, i) => `<th style="text-align:${t.aligns[i] || "left"}">${inline(h)}</th>`)
    .join("");
  const tbody = t.rows
    .map(
      (row) =>
        `<tr>${row
          .map((c, i) => `<td style="text-align:${t.aligns[i] || "left"}">${inline(c)}</td>`)
          .join("")}</tr>`
    )
    .join("");
  return `<table class="sl-table"><thead><tr>${thead}</tr></thead><tbody>${tbody}</tbody></table>`;
}

// Simple offline flow: each non-empty line becomes a node, rendered as a
// left-to-right row of cards separated by arrows. Use ` | ` to split a line
// into two stacked lines inside one card.
function renderFlow(t) {
  const steps = (t.content || "")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
  const cells = steps
    .map((s, i) => {
      const [head, ...rest] = s.split(" | ").map((x) => x.trim());
      const headHtml = `<div class="sl-flow-head">${inline(head)}</div>`;
      const subHtml = rest.length ? `<div class="sl-flow-sub">${inline(rest.join(" · "))}</div>` : "";
      const arrow = i < steps.length - 1 ? `<div class="sl-flow-arrow" aria-hidden="true">${icon("arrow-right", { size: 32, color: "var(--brand)" })}</div>` : "";
      return `<div class="sl-flow-step"><div class="sl-flow-card">${headHtml}${subHtml}</div>${arrow}</div>`;
    })
    .join("");
  return `<div class="sl-flow" data-steps="${steps.length}">${cells}</div>`;
}

// Layouts whose background is dark or brand-colored — must use white logo.
const DARK_BG_LAYOUTS = new Set(["section-divider"]);

// Layouts that render their own logo placement (skip the top-right one).
const NO_TOP_LOGO = new Set(["closing"]);

function wrap(slide, ctx, inner, extraClasses = "") {
  const noChrome = NO_CHROME.has(slide.layout);
  const cls = ["sl", `sl-${slide.layout}`, extraClasses];
  if (noChrome) cls.push("sl-no-chrome");
  const theme = slide.directives.theme || ctx.fm.theme || "light";
  const accent = slide.directives.accent || ctx.fm.accent || "";
  const label = slide.directives.label || autoLabel(slide);
  const themeAttr = theme === "dark" ? ` data-theme="dark"` : "";
  const accentAttr = accent ? ` data-accent="${escapeHTML(accent)}"` : "";
  const chrome = noChrome ? "" : renderChrome(slide, ctx);

  // Logo on every slide (top-right). Pick white for dark/brand-bg slides.
  // cinematic-dark owns the logo look via family CSS (orange symbol +
  // wordmark-only white), so we skip the all-white swap for that family.
  const darkFamily = ctx.fm && /^cinematic-dark$/i.test(String(ctx.fm.family || ""));
  const useWhite = !darkFamily && (theme === "dark" || DARK_BG_LAYOUTS.has(slide.layout));
  const logoSvg = useWhite ? (ctx.logoSvgWhite || ctx.logoSvg) : ctx.logoSvg;
  const logoHtml = logoSvg && !NO_TOP_LOGO.has(slide.layout) ? `<div class="sl-logo">${logoSvg}</div>` : "";

  return (
    `<section class="${cls.filter(Boolean).join(" ")}" data-screen-label="${escapeHTML(label)}"${themeAttr}${accentAttr}>` +
    logoHtml +
    chrome +
    inner +
    `</section>`
  );
}

// --------------------------------------------------------------------- A. Structure

function renderTitle(slide, ctx) {
  const h1s = slide.tokens.filter((t) => t.type === "heading" && t.level === 1);
  const h2 = slide.tokens.find((t) => t.type === "heading" && t.level === 2);
  const lastP = [...slide.tokens].reverse().find((t) => t.type === "paragraph");
  const img = slide.tokens.find((t) => t.type === "image");
  const mark = slide.directives.mark || "";
  const titleHtml = h1s.map((h) => `<span>${inline(h.text)}</span>`).join("");
  const subHtml = h2 ? `<div class="sl-title-sub">${inline(h2.text)}</div>` : "";
  const meta = lastP ? `<div class="sl-title-meta">${inline(lastP.text)}</div>` : "";

  // Image-on-top variant: when a title slide has an image, stack it above the text block.
  if (img) {
    const src = img.dataUrl || img.url || "";
    const credit = slide.directives["image-credit"] || "";
    const creditHtml = credit
      ? `<div class="sl-title-image-credit">${escapeHTML(credit)}</div>`
      : "";
    const imgHtml = src
      ? `<div class="sl-title-image" style="background-image:url('${src}')">${creditHtml}</div>`
      : `<div class="sl-title-image sl-title-image-empty">${creditHtml}</div>`;
    return wrap(
      slide,
      ctx,
      `<div class="sl-title-stack">${imgHtml}<div class="sl-title-text"><h1 class="sl-title-hero">${titleHtml}</h1>${subHtml}${meta}</div></div>`
    );
  }

  const markCard = mark
    ? `<aside class="sl-title-mark"><div class="sl-title-mark-badge">${escapeHTML(mark)}</div></aside>`
    : "";
  return wrap(
    slide,
    ctx,
    `<div class="sl-title-grid"><div class="sl-title-text"><h1 class="sl-title-hero">${titleHtml}</h1>${subHtml}${meta}</div>${markCard}</div>`
  );
}

function renderSectionDivider(slide, ctx) {
  const h1 = findHeading(slide.tokens, 1);
  const h2 = findHeading(slide.tokens, 2);
  // Skip rendering when the hero title is missing — a section-divider with
  // only "01 / 06" style number and no heading is almost always an authoring
  // mistake (not a deliberate design choice). Returning "" lets build.js
  // filter the slide out entirely so the deck doesn't carry a blank page.
  if (!h1 || !(h1.text || "").trim()) return "";
  const num = h2 ? `<div class="sl-section-num">${inline(h2.text)}</div>` : "";
  return wrap(
    slide,
    ctx,
    `<div class="sl-section-body">${num}<h1 class="sl-section-hero">${inline(h1.text)}</h1></div>`
  );
}

function renderPartCover(slide, ctx) {
  const headings = slide.tokens.filter((t) => t.type === "heading" && t.level === 1);
  const partLabel = headings[0] ? inline(headings[0].text) : "";
  const partTitle = headings[1] ? inline(headings[1].text) : "";
  const paragraphs = slide.tokens.filter((t) => t.type === "paragraph");
  const sub = paragraphs[0] ? `<p class="sl-part-sub">${inline(paragraphs[0].text)}</p>` : "";
  const tag = paragraphs[1] ? `<div class="sl-part-tag">${inline(paragraphs[1].text)}</div>` : "";
  return wrap(
    slide,
    ctx,
    `<div class="sl-part-body"><div class="sl-part-label">${partLabel}</div><h1 class="sl-part-title">${partTitle}</h1>${sub}${tag}</div>`
  );
}

function renderStatement(slide, ctx) {
  const h1 = findHeading(slide.tokens, 1);
  const sub = slide.tokens.find((t) => t.type === "paragraph");
  // Bold keywords get orange.
  const text = h1 ? inline(h1.text).replace(/<strong>/g, '<strong class="sl-orange">') : "";
  const subHtml = sub ? `<p class="sl-statement-sub">${inline(sub.text)}</p>` : "";
  return wrap(slide, ctx, `<div class="sl-statement-body"><h1 class="sl-statement-hero">${text}</h1>${subHtml}</div>`);
}

function renderToc(slide, ctx) {
  const h1 = findHeading(slide.tokens, 1);
  const list = slide.tokens.find((t) => t.type === "list" && t.ordered);
  const items = list ? list.items : [];
  const cells = items
    .map((it, i) => {
      const num = String(i + 1).padStart(2, "0");
      // optional " — page" splitting on `· p.`
      let label = it;
      let page = "";
      const m = it.match(/^(.*?)\s+·\s*p\.?\s*(\d+)\s*$/);
      if (m) {
        label = m[1];
        page = `<span class="sl-toc-page">p.${m[2]}</span>`;
      }
      return `<li class="sl-toc-item"><span class="sl-toc-num">${num}</span><span class="sl-toc-label">${inline(label)}</span>${page}</li>`;
    })
    .join("");
  return wrap(
    slide,
    ctx,
    `<div class="sl-toc-body"><h1 class="sl-toc-title">${inline(h1 ? h1.text : "Contents")}</h1><ol class="sl-toc-list">${cells}</ol></div>`
  );
}

function renderClosing(slide, ctx) {
  const h1 = findHeading(slide.tokens, 1);
  const paras = slide.tokens.filter((t) => t.type === "paragraph");
  const meta = paras.map((p) => `<p>${inline(p.text)}</p>`).join("");
  const logo = ctx.logoSvg || "";
  return wrap(
    slide,
    ctx,
    `<div class="sl-closing-body"><h1 class="sl-closing-hero">${inline(h1 ? h1.text : "Thank you")}</h1><div class="sl-closing-meta">${meta}</div>${logo ? `<div class="sl-closing-logo">${logo}</div>` : ""}</div>`
  );
}

// --------------------------------------------------------------------- B. Content

function renderContent(slide, ctx) {
  const [h1, rest] = pickHeading(slide.tokens, 1);
  const title = h1 ? `<h1 class="sl-title">${inline(h1.text)}</h1>` : "";
  return wrap(slide, ctx, `<div class="sl-body">${title}${renderTokensGeneric(rest, ctx)}</div>`);
}

function renderTwoColumn(slide, ctx) {
  const [h1, rest] = pickHeading(slide.tokens, 1);
  const cols = findFences(rest, "col");
  const colsHtml = cols
    .map((c) => `<div class="sl-col">${renderTokensGeneric(c.tokens || [], ctx)}</div>`)
    .join("");
  const title = h1 ? `<h1 class="sl-title">${inline(h1.text)}</h1>` : "";
  return wrap(slide, ctx, `<div class="sl-body">${title}<div class="sl-twocol">${colsHtml}</div></div>`);
}

function renderQuote(slide, ctx) {
  const q = slide.tokens.find((t) => t.type === "quote");
  if (!q) return renderContent(slide, ctx);
  const cite = q.attribution ? `<cite class="sl-quote-cite">— ${escapeHTML(q.attribution)}</cite>` : "";
  return wrap(
    slide,
    ctx,
    `<div class="sl-body sl-quote-body"><blockquote class="sl-quote-bq">${inline(q.text)}</blockquote>${cite}</div>`
  );
}

function renderImage(slide, ctx) {
  const [h1, rest] = pickHeading(slide.tokens, 1);
  const img = rest.find((t) => t.type === "image");
  const fit = slide.directives.fit || "cover";
  const title = h1 ? `<h1 class="sl-title">${inline(h1.text)}</h1>` : "";
  const cap = img && img.title ? `<div class="sl-image-caption">${escapeHTML(img.title)}</div>` : "";
  const src = img ? img.dataUrl || img.url : "";
  const imgHtml = src
    ? `<div class="sl-image-frame" style="background-image:url('${src}'); background-size:${fit}; background-position:center; background-repeat:no-repeat;"></div>`
    : `<div class="sl-image-frame sl-image-empty">이미지 없음</div>`;
  return wrap(slide, ctx, `<div class="sl-body sl-image-body">${title}${imgHtml}${cap}</div>`);
}

// --------------------------------------------------------------------- C. Numbers

function renderBigNumber(slide, ctx) {
  const h1 = findHeading(slide.tokens, 1);
  const paras = slide.tokens.filter((t) => t.type === "paragraph");
  const q = slide.tokens.find((t) => t.type === "quote");
  const num = h1 ? inline(h1.text) : "";
  const lead = paras[0] ? `<p class="sl-bignum-lead">${inline(paras[0].text)}</p>` : "";
  const quote = q
    ? `<blockquote class="sl-bignum-quote"><div class="sl-bignum-q-text">${inline(q.text)}</div>${q.attribution ? `<cite>— ${escapeHTML(q.attribution)}</cite>` : ""}</blockquote>`
    : "";
  return wrap(
    slide,
    ctx,
    `<div class="sl-body sl-bignum-body"><div class="sl-bignum-hero">${num}</div>${lead}${quote}</div>`
  );
}

function renderStats(slide, ctx) {
  const [h1, rest] = pickHeading(slide.tokens, 1);
  // Each stat = h2 + all following paragraphs until next h2 or end.
  const cells = [];
  let i = 0;
  while (i < rest.length) {
    const t = rest[i];
    if (t.type === "heading" && t.level === 2) {
      const value = inline(t.text);
      i += 1;
      const bodyParts = [];
      while (i < rest.length && !(rest[i].type === "heading" && rest[i].level === 2)) {
        if (rest[i].type === "paragraph") {
          bodyParts.push(`<p>${inline(rest[i].text)}</p>`);
        }
        i += 1;
      }
      cells.push({ value, body: bodyParts.join("") });
    } else {
      i += 1;
    }
  }
  const n = cells.length || parseInt(slide.directives.stats, 10) || 3;
  const grid = cells
    .map(
      (c) =>
        `<div class="sl-stats-cell"><div class="sl-stats-value">${c.value}</div><div class="sl-stats-body">${c.body}</div></div>`
    )
    .join("");
  const title = h1 ? `<h1 class="sl-title">${inline(h1.text)}</h1>` : "";
  return wrap(
    slide,
    ctx,
    `<div class="sl-body sl-stats-body" data-cells="${n}">${title}<div class="sl-stats-grid">${grid}</div></div>`
  );
}

function renderChart(slide, ctx) {
  const [h1, rest] = pickHeading(slide.tokens, 1);
  const kind = (slide.directives.chart || "donut").toLowerCase();
  const highlightIdx = parseInt(slide.directives.highlight, 10);
  // Data block: `label | value | value2-or-color | color?`
  // For most charts: parts = [label, value, color?]
  // For dumbbell: parts = [label, value1, value2, color?]
  const dataFence = findFences(rest, "data")[0];
  const items = [];
  if (dataFence) {
    for (const line of dataFence.content.split("\n")) {
      const parts = line.split("|").map((s) => s.trim());
      if (parts.length >= 2 && parts[0]) {
        const v2num = parts[2] && !isNaN(parseFloat(parts[2])) ? parseFloat(parts[2]) : undefined;
        const color = v2num !== undefined ? parts[3] || "" : parts[2] || "";
        items.push({ label: parts[0], value: parseFloat(parts[1]) || 0, value2: v2num, color });
      }
    }
  }
  // Color aliases — short tokens authors can use in the data fence's color column.
  // Resolves to ODS CSS vars so the chart stays themeable across families.
  const COLOR_ALIASES = {
    orange: "var(--orange-700)",
    "orange-dark": "var(--orange-900)",
    "orange-light": "var(--orange-500)",
    "orange-tint": "var(--orange-300)",
    blue: "var(--blue-500)",
    "blue-dark": "var(--blue-700)",
    "blue-light": "var(--blue-300)",
    gray: "var(--neutral-400)",
    "gray-dark": "var(--neutral-700)",
    "gray-light": "var(--neutral-300)",
    black: "#0A0A0A",
    white: "#FFFFFF",
  };
  const resolveColor = (c) => (c ? (COLOR_ALIASES[String(c).toLowerCase().trim()] || c) : "");
  const palette = ["var(--brand)", "var(--accent)", "var(--neutral-400)", "var(--orange-300)", "var(--blue-300)", "var(--neutral-700)"];
  const enriched = items.map((it, i) => {
    const isHl = i + 1 === highlightIdx;
    const col = it.color ? resolveColor(it.color) : (isHl ? "var(--brand)" : palette[i % palette.length]);
    return { ...it, color: col, highlight: isHl };
  });
  const total = enriched.reduce((s, it) => s + it.value, 0) || 1;

  let chart = "";
  let showLegend = true;
  if (kind === "donut") {
    // Each segment is an independent SVG path — two concentric arcs joined
    // by radial edges. This avoids stroke-dasharray wrap artifacts that
    // caused the top segment to visibly overlap the starting one.
    const cx = 200, cy = 200, outerR = 170, innerR = 115;
    let angle = -Math.PI / 2; // start at 12 o'clock
    const ringes = enriched
      .map((it) => {
        const frac = it.value / total;
        if (frac <= 0) return "";
        const endAngle = angle + frac * 2 * Math.PI;
        const largeArc = frac > 0.5 ? 1 : 0;
        const p = (r, a) => [cx + r * Math.cos(a), cy + r * Math.sin(a)];
        const [x1, y1] = p(outerR, angle);
        const [x2, y2] = p(outerR, endAngle);
        const [x3, y3] = p(innerR, endAngle);
        const [x4, y4] = p(innerR, angle);
        const d = `M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${outerR} ${outerR} 0 ${largeArc} 1 ${x2.toFixed(2)} ${y2.toFixed(2)} L ${x3.toFixed(2)} ${y3.toFixed(2)} A ${innerR} ${innerR} 0 ${largeArc} 0 ${x4.toFixed(2)} ${y4.toFixed(2)} Z`;
        angle = endAngle;
        return `<path d="${d}" fill="${it.color}"/>`;
      })
      .join("");
    // Optional center label: first H2 in rest becomes the big caption,
    // the paragraph that follows becomes the sublabel.
    const h2 = (rest || []).find((t) => t && t.type === "heading" && t.level === 2);
    let centerHtml = "";
    if (h2) {
      const idx = rest.indexOf(h2);
      const sub = (rest || []).slice(idx + 1).find((t) => t && t.type === "paragraph");
      const top = escapeHTML(h2.text || "");
      const bot = sub ? escapeHTML(sub.text || "") : "";
      centerHtml =
        `<text x="${cx}" y="${cy - 4}" text-anchor="middle" font-size="40" font-weight="800" fill="var(--fg-strong)" style="font-family:inherit;">${top}</text>` +
        (bot ? `<text x="${cx}" y="${cy + 34}" text-anchor="middle" font-size="22" fill="var(--fg-alternative)" style="font-family:inherit;">${bot}</text>` : "");
    }
    chart = `<svg class="sl-chart-svg sl-chart-donut" viewBox="0 0 400 400" preserveAspectRatio="xMidYMid meet" style="width:100%;max-width:640px;height:auto;">${ringes}${centerHtml}</svg>`;
  } else if (kind === "pie") {
    const cx = 200, cy = 200, r = 180;
    let angle = -Math.PI / 2;
    const slices = enriched.map((it) => {
      const frac = it.value / total;
      const endAngle = angle + frac * 2 * Math.PI;
      const largeArc = frac > 0.5 ? 1 : 0;
      const x1 = cx + r * Math.cos(angle);
      const y1 = cy + r * Math.sin(angle);
      const x2 = cx + r * Math.cos(endAngle);
      const y2 = cy + r * Math.sin(endAngle);
      const path = `M ${cx} ${cy} L ${x1.toFixed(2)} ${y1.toFixed(2)} A ${r} ${r} 0 ${largeArc} 1 ${x2.toFixed(2)} ${y2.toFixed(2)} Z`;
      // percent label at slice centroid
      const midA = angle + frac * Math.PI;
      const lx = cx + (r * 0.6) * Math.cos(midA);
      const ly = cy + (r * 0.6) * Math.sin(midA);
      const pct = (frac * 100).toFixed(1);
      angle = endAngle;
      return `<path d="${path}" fill="${it.color}" stroke="white" stroke-width="2"/><text x="${lx.toFixed(1)}" y="${ly.toFixed(1)}" text-anchor="middle" dominant-baseline="middle" font-size="22" font-weight="700" fill="white">${pct}%</text>`;
    }).join("");
    chart = `<svg class="sl-chart-svg" viewBox="0 0 400 400" width="440" height="440">${slices}</svg>`;
  } else if (kind === "stackedbar") {
    const w = 1200, h = 120, gap = 8;
    const segTotalW = w - gap * (enriched.length - 1);
    let x = 0;
    const segs = enriched.map((it, i) => {
      const segW = (it.value / total) * segTotalW;
      const seg = `<g transform="translate(${x} 0)">
        <rect x="0" y="0" width="${segW}" height="${h}" fill="${it.color}" rx="6"/>
        <text x="${segW/2}" y="${h/2 + 8}" text-anchor="middle" fill="white" font-size="24" font-weight="700">${it.value}%</text>
      </g>`;
      x += segW + gap;
      return seg;
    }).join("");
    chart = `<svg class="sl-chart-svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" preserveAspectRatio="xMidYMid meet" style="width:100%;max-width:1200px;height:auto;">${segs}</svg>`;
  } else if (kind === "dumbbell") {
    const w = 1000, rowH = 96, leftW = 220, rightW = 140, chartW = w - leftW - rightW;
    const maxV = 100;
    const rows = enriched.map((it, i) => {
      const y = i * rowH + 48;
      const v1 = it.value;
      const v2 = it.value2 !== undefined ? it.value2 : 0;
      const x1 = leftW + (v1 / maxV) * chartW;
      const x2 = leftW + (v2 / maxV) * chartW;
      const lineX1 = Math.min(x1, x2);
      const lineX2 = Math.max(x1, x2);
      return `
        <text x="${leftW - 20}" y="${y + 8}" text-anchor="end" font-size="26" fill="var(--fg-strong)" font-weight="600">${escapeHTML(it.label)}</text>
        <line x1="${lineX1}" y1="${y}" x2="${lineX2}" y2="${y}" stroke="var(--neutral-300)" stroke-width="5"/>
        <circle cx="${x1}" cy="${y}" r="16" fill="var(--neutral-400)"/>
        <text x="${x1}" y="${y - 24}" text-anchor="middle" font-size="18" fill="var(--fg-alternative)">체감 ${v1}%</text>
        <circle cx="${x2}" cy="${y}" r="16" fill="var(--brand)"/>
        <text x="${x2}" y="${y + 40}" text-anchor="middle" font-size="18" fill="var(--brand)" font-weight="700">실제 ${v2}%</text>
        <text x="${w - rightW + 16}" y="${y + 8}" font-size="22" fill="var(--fg-alternative)" font-weight="600">갭 ${Math.abs(v1 - v2)}%p</text>
      `;
    }).join("");
    const h = enriched.length * rowH + 24;
    chart = `<svg class="sl-chart-svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" preserveAspectRatio="xMidYMid meet" style="width:100%;max-width:1000px;height:auto;">${rows}</svg>`;
    showLegend = false;
  } else {
    // bar
    const max = Math.max(...enriched.map((it) => it.value), 1);
    const barH = 36, gap = 16, w = 520;
    const bars = enriched
      .map((it, i) => {
        const y = i * (barH + gap);
        const bw = (it.value / max) * w;
        return `<g transform="translate(0 ${y})"><rect x="0" y="0" width="${bw}" height="${barH}" fill="${it.color}" rx="4"/></g>`;
      })
      .join("");
    const hSvg = enriched.length * (barH + gap);
    chart = `<svg class="sl-chart-svg" viewBox="0 0 ${w} ${hSvg}" width="${w}" height="${hSvg}">${bars}</svg>`;
  }
  // Legend label may be `main / sub` — render as a two-line stack (sample-deck style).
  // For donut/pie, values are percentages, so append a % suffix automatically.
  const isPct = kind === "donut" || kind === "pie";
  const legend = showLegend ? enriched
    .map((it) => {
      const parts = String(it.label).split(/\s+\/\s+/);
      const main = escapeHTML(parts[0] || "");
      const sub = parts.length > 1 ? escapeHTML(parts.slice(1).join(" / ")) : "";
      const labelBlock = sub
        ? `<div class="sl-chart-label-stack"><span class="sl-chart-label">${main}</span><span class="sl-chart-sub">${sub}</span></div>`
        : `<span class="sl-chart-label">${main}</span>`;
      const valText = it.value2 !== undefined
        ? `${escapeHTML(String(it.value))} / ${escapeHTML(String(it.value2))}`
        : `${escapeHTML(String(it.value))}${isPct ? "%" : ""}`;
      return `<li class="sl-chart-legend-item"><span class="sl-chart-swatch" style="background:${it.color}"></span>${labelBlock}<span class="sl-chart-value">${valText}</span></li>`;
    })
    .join("") : "";
  const title = h1 ? `<h1 class="sl-title">${inline(h1.text)}</h1>` : "";
  const legendHtml = legend ? `<ul class="sl-chart-legend">${legend}</ul>` : "";
  const gridClass = kind === "stackedbar" || kind === "dumbbell" ? "sl-chart-grid sl-chart-grid-full" : "sl-chart-grid";
  return wrap(
    slide,
    ctx,
    `<div class="sl-body sl-chart-body">${title}<div class="${gridClass}"><div class="sl-chart-viz">${chart}</div>${legendHtml}</div></div>`
  );
}

// --------------------------------------------------------------------- D. Compare / Grid

function renderCompare(slide, ctx) {
  const [h1, rest] = pickHeading(slide.tokens, 1);
  const before = findFences(rest, "compare-before")[0];
  const after = findFences(rest, "compare-after")[0];
  function cardHtml(fence, kind) {
    if (!fence) return "";
    const label = fence.variant || (kind === "before" ? "BEFORE" : "AFTER");
    return `<div class="sl-compare-card sl-compare-${kind}"><div class="sl-compare-label">${escapeHTML(label)}</div>${renderTokensGeneric(fence.tokens || [], ctx)}</div>`;
  }
  const title = h1 ? `<h1 class="sl-title">${inline(h1.text)}</h1>` : "";
  return wrap(
    slide,
    ctx,
    `<div class="sl-body sl-compare-body">${title}<div class="sl-compare-grid">${cardHtml(before, "before")}${cardHtml(after, "after")}</div></div>`
  );
}

function renderBento(slide, ctx) {
  const [h1, rest] = pickHeading(slide.tokens, 1);
  const cards = findFences(rest, "card");
  const cells = cards
    .map((c, i) => {
      // First h3 in card becomes label; first h4 is title; remainder is body.
      const tokens = c.tokens || [];
      const labelTok = tokens.find((t) => t.type === "heading" && t.level === 3);
      const titleTok = tokens.find((t) => t.type === "heading" && t.level === 4);
      const bodyTokens = tokens.filter((t) => !(t === labelTok || t === titleTok));
      const iconName = (c.variant || "").trim();
      const iconHtml = iconName ? `<div class="sl-bento-icon">${icon(iconName, { size: 28 })}</div>` : "";
      const label = labelTok ? `<div class="sl-bento-label">${inline(labelTok.text)}</div>` : "";
      const title = titleTok ? `<h4 class="sl-bento-title">${inline(titleTok.text)}</h4>` : "";
      return `<article class="sl-bento-card">${iconHtml}${label}${title}${renderTokensGeneric(bodyTokens, ctx)}</article>`;
    })
    .join("");
  const title = h1 ? `<h1 class="sl-title">${inline(h1.text)}</h1>` : "";
  return wrap(slide, ctx, `<div class="sl-body sl-bento-body">${title}<div class="sl-bento-grid" data-cells="${cards.length}">${cells}</div></div>`);
}

function renderChain(slide, ctx) {
  const [h1, rest] = pickHeading(slide.tokens, 1);
  const cards = findFences(rest, "card");
  const cells = cards
    .map((c, i) => {
      const hl = (c.variant || "").includes("highlight");
      const titleTok = (c.tokens || []).find((t) => t.type === "heading");
      const bodyTokens = (c.tokens || []).filter((t) => t !== titleTok);
      const titleHtml = titleTok ? `<h3 class="sl-chain-title">${inline(titleTok.text)}</h3>` : "";
      const arrow =
        i < cards.length - 1
          ? `<div class="sl-chain-arrow" aria-hidden="true">${icon("arrow-right", { size: 36, color: "var(--brand)" })}</div>`
          : "";
      return `<article class="sl-chain-card${hl ? " sl-chain-highlight" : ""}">${titleHtml}${renderTokensGeneric(bodyTokens, ctx)}</article>${arrow}`;
    })
    .join("");
  const title = h1 ? `<h1 class="sl-title">${inline(h1.text)}</h1>` : "";
  return wrap(slide, ctx, `<div class="sl-body sl-chain-body">${title}<div class="sl-chain-grid">${cells}</div></div>`);
}

// --------------------------------------------------------------------- E. Flow

function renderTimeline(slide, ctx) {
  const [h1, rest] = pickHeading(slide.tokens, 1);
  const list = rest.find((t) => t.type === "list" && t.ordered);
  const items = list ? list.items : [];
  const points = items
    .map((it, i) => {
      // expected: "**라벨** — 본문"
      const m = it.match(/^\*\*([^*]+)\*\*\s*[—-]\s*(.+)$/);
      const label = m ? m[1] : `Step ${i + 1}`;
      const body = m ? m[2] : it;
      const isHl = (slide.directives.highlight && parseInt(slide.directives.highlight, 10) === i + 1) || i === 0;
      return `<li class="sl-timeline-item${isHl ? " sl-timeline-active" : ""}"><div class="sl-timeline-dot"></div><div class="sl-timeline-label">${escapeHTML(label)}</div><div class="sl-timeline-body">${inline(body)}</div></li>`;
    })
    .join("");
  const title = h1 ? `<h1 class="sl-title">${inline(h1.text)}</h1>` : "";
  return wrap(slide, ctx, `<div class="sl-body sl-timeline-body">${title}<ol class="sl-timeline">${points}</ol></div>`);
}

function renderProcess(slide, ctx) {
  const [h1, rest] = pickHeading(slide.tokens, 1);
  const list = rest.find((t) => t.type === "list" && t.ordered);
  const items = list ? list.items : [];
  const hlIdx = parseInt(slide.directives.highlight, 10);
  const cells = items
    .map((it, i) => {
      const m = it.match(/^\*\*([^*]+)\*\*\s*[—-]\s*(.+)$/);
      const t = m ? m[1] : it;
      const body = m ? m[2] : "";
      const hl = i + 1 === hlIdx;
      return `<li class="sl-process-cell${hl ? " sl-process-highlight" : ""}"><div class="sl-process-num">${String(i + 1).padStart(2, "0")}</div><div class="sl-process-title">${inline(t)}</div>${body ? `<div class="sl-process-body">${inline(body)}</div>` : ""}</li>`;
    })
    .join("");
  const title = h1 ? `<h1 class="sl-title">${inline(h1.text)}</h1>` : "";
  return wrap(
    slide,
    ctx,
    `<div class="sl-body sl-process-body">${title}<ol class="sl-process-grid" data-cells="${items.length}">${cells}</ol></div>`
  );
}

// --------------------------------------------------------------------- F. Specialized

function renderProfile(slide, ctx) {
  const photo = slide.tokens.find((t) => t.type === "image");
  const h2 = findHeading(slide.tokens, 2);
  const list = slide.tokens.find((t) => t.type === "list");
  const thumbs = findFences(slide.tokens, "thumbnails")[0];
  const photoHtml = photo
    ? `<div class="sl-profile-photo"><img src="${photo.dataUrl || photo.url || ""}" alt="${escapeHTML(photo.alt || "")}"></div>`
    : `<div class="sl-profile-photo sl-profile-photo-empty"></div>`;
  const name = h2 ? `<h2 class="sl-profile-name">${inline(h2.text)}</h2>` : "";
  const bullets = list ? `<ul class="sl-profile-bullets">${list.items.map((i) => `<li>${inline(i)}</li>`).join("")}</ul>` : "";
  const thumbsHtml = thumbs
    ? `<div class="sl-profile-thumbs">${(thumbs.tokens || [])
        .filter((t) => t.type === "image")
        .map((t) => `<img src="${t.dataUrl || t.url || ""}" alt="${escapeHTML(t.alt || "")}">`)
        .join("")}</div>`
    : "";
  return wrap(
    slide,
    ctx,
    `<div class="sl-body sl-profile-body"><div class="sl-profile-grid">${photoHtml}<div class="sl-profile-text">${name}${bullets}</div></div>${thumbsHtml}</div>`
  );
}

function renderPromptDemo(slide, ctx) {
  const chip = findFences(slide.tokens, "domain-chip")[0];
  const promptCode = slide.tokens.find((t) => t.type === "codefence" && t.lang === "prompt");
  const response = findFences(slide.tokens, "response")[0];
  const analysis = slide.tokens.find((t) => t.type === "heading" && t.level === 3);
  const analysisIdx = analysis ? slide.tokens.indexOf(analysis) : -1;
  const analysisRest = analysisIdx >= 0 ? slide.tokens.slice(analysisIdx + 1) : [];
  const chipHtml = chip
    ? `<div class="sl-prompt-chip">${escapeHTML((chip.tokens && chip.tokens[0] && chip.tokens[0].text) || chip.content || "")}</div>`
    : "";
  const variant = promptCode ? promptCode.variant : "";
  const variantBadge = variant ? `<div class="sl-prompt-variant">${escapeHTML(variant)}</div>` : "";
  const codeHtml = promptCode
    ? `<pre class="sl-prompt-code"><code>${escapeHTML(promptCode.content)}</code></pre>`
    : "";
  const responseHtml = response
    ? `<div class="sl-prompt-response">${renderTokensGeneric(response.tokens || [], ctx)}</div>`
    : "";
  const analysisHtml = analysis
    ? `<div class="sl-prompt-analysis"><h3 class="sl-prompt-analysis-h">${inline(analysis.text)}</h3>${renderTokensGeneric(analysisRest, ctx)}</div>`
    : "";
  return wrap(
    slide,
    ctx,
    `<div class="sl-body sl-prompt-demo-body">${chipHtml}<div class="sl-prompt-grid"><div class="sl-prompt-side">${variantBadge}${codeHtml}</div><div class="sl-prompt-side">${responseHtml}</div></div>${analysisHtml}</div>`
  );
}

function renderCheckpointRows(slide, ctx) {
  const [h1, rest] = pickHeading(slide.tokens, 1);
  // each paragraph is one row of: A | sub ↔ B | desc
  const rows = rest.filter((t) => t.type === "paragraph" && t.text.includes("↔"));
  const html = rows
    .map((p) => {
      const [left, right] = p.text.split("↔").map((s) => s.trim());
      const [a, aSub] = (left || "").split("|").map((s) => s.trim());
      const [b, bDesc] = (right || "").split("|").map((s) => s.trim());
      return `<li class="sl-cp-row"><div class="sl-cp-left"><div class="sl-cp-name">${inline(a || "")}</div><div class="sl-cp-sub">${inline(aSub || "")}</div></div><div class="sl-cp-arrow">↔</div><div class="sl-cp-right"><div class="sl-cp-name">${inline(b || "")}</div><div class="sl-cp-sub">${inline(bDesc || "")}</div></div></li>`;
    })
    .join("");
  const title = h1 ? `<h1 class="sl-title">${inline(h1.text)}</h1>` : "";
  return wrap(slide, ctx, `<div class="sl-body sl-cp-body">${title}<ul class="sl-cp-list">${html}</ul></div>`);
}

// --------------------------------------------------------------------- G. Opening 2.pdf adopted

function renderAgendaColumns(slide, ctx) {
  const [h1, rest] = pickHeading(slide.tokens, 1);
  const cols = findFences(rest, "column");
  const cells = cols
    .map((c) => {
      const raw = (c.variant ? `${c.variant} | ` : "") + (c.content || "").replace(/\n/g, " ");
      const [eyebrow = "", title = "", footer = ""] = raw.split("|").map((s) => s.trim());
      return `<article class="sl-agenda-col">
        <div class="sl-agenda-eyebrow">${inline(eyebrow)}</div>
        <h3 class="sl-agenda-title">${inline(title)}</h3>
        <div class="sl-agenda-spacer"></div>
        <div class="sl-agenda-footer">${inline(footer)}</div>
      </article>`;
    })
    .join("");
  const title = h1 ? `<h1 class="sl-title">${inline(h1.text)}</h1>` : "";
  return wrap(
    slide,
    ctx,
    `<div class="sl-body sl-agenda-body">${title}<div class="sl-agenda-rule"></div><div class="sl-agenda-grid" data-cells="${cols.length}">${cells}</div></div>`
  );
}

function renderDebateCards(slide, ctx) {
  const [h1, rest] = pickHeading(slide.tokens, 1);
  const h2 = rest.find((t) => t.type === "heading" && t.level === 2);
  const sides = findFences(rest, "side");
  const callout = findFences(rest, "callout")[0];
  const sideHtml = sides
    .map((s) => {
      const eyebrow = (s.variant || "").trim();
      return `<article class="sl-debate-card">
        <div class="sl-debate-eyebrow">${inline(eyebrow)}</div>
        <div class="sl-debate-content">${renderTokensGeneric(s.tokens || [], ctx)}</div>
      </article>`;
    })
    .join("");
  const calloutHtml = callout
    ? `<aside class="sl-callout sl-debate-callout">${renderTokensGeneric(callout.tokens || [], ctx)}</aside>`
    : "";
  const title = h1 ? `<h1 class="sl-title">${inline(h1.text)}</h1>` : "";
  const sub = h2 ? `<p class="sl-debate-sub">${inline(h2.text)}</p>` : "";
  return wrap(
    slide,
    ctx,
    `<div class="sl-body sl-debate-body">${title}${sub}<div class="sl-debate-grid">${sideHtml}</div>${calloutHtml}</div>`
  );
}

function renderAxisDiagram(slide, ctx) {
  const [h1, rest] = pickHeading(slide.tokens, 1);
  const lead = rest.find((t) => t.type === "paragraph");
  const axisFence = findFences(rest, "axis")[0];
  const rows = axisFence
    ? axisFence.content.split("\n").map((s) => s.trim()).filter(Boolean).map((line) => {
        const [k, ko, en, color] = line.split("|").map((s) => s.trim());
        return { k, ko, en, color: color || "var(--brand)" };
      })
    : [];
  const xRow = rows.find((r) => r.k === "x") || rows[0] || { ko: "", en: "", color: "var(--brand)" };
  const yRow = rows.find((r) => r.k === "y") || rows[1] || { ko: "", en: "", color: "var(--blue-500, #2B7BE4)" };
  const zRow = rows.find((r) => r.k === "z") || rows[2] || { ko: "", en: "", color: "var(--neutral-600, #737373)" };

  // 2D isometric SVG: origin at (120, 480). x→right (orange), y→up (blue), z→diag (gray arrow).
  const ox = 120, oy = 480;
  const xEnd = { x: ox + 380, y: oy };
  const yEnd = { x: ox, y: oy - 380 };
  const zEnd = { x: ox + 300, y: oy - 300 };
  const dash = "stroke-dasharray='6 8' stroke='var(--neutral-300)'";
  const svg = `<svg class="sl-axis-svg" viewBox="0 0 620 560" preserveAspectRatio="xMidYMid meet">
    <defs>
      <marker id="ah-x" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="8" markerHeight="8" orient="auto"><path d="M0 0 L10 5 L0 10 Z" fill="${xRow.color}"/></marker>
      <marker id="ah-y" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="8" markerHeight="8" orient="auto"><path d="M0 0 L10 5 L0 10 Z" fill="${yRow.color}"/></marker>
      <marker id="ah-z" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="8" markerHeight="8" orient="auto"><path d="M0 0 L10 5 L0 10 Z" fill="${zRow.color}"/></marker>
    </defs>
    <!-- iso guide lines -->
    <line x1="${xEnd.x}" y1="${xEnd.y}" x2="${xEnd.x + 300}" y2="${xEnd.y - 300}" ${dash} fill="none"/>
    <line x1="${yEnd.x}" y1="${yEnd.y}" x2="${yEnd.x + 300}" y2="${yEnd.y - 300}" ${dash} fill="none"/>
    <line x1="${zEnd.x}" y1="${zEnd.y}" x2="${zEnd.x + 80}" y2="${zEnd.y}" ${dash} fill="none"/>
    <line x1="${zEnd.x}" y1="${zEnd.y}" x2="${zEnd.x}" y2="${zEnd.y + 80}" ${dash} fill="none"/>
    <!-- x (orange) -->
    <line x1="${ox}" y1="${oy}" x2="${xEnd.x}" y2="${xEnd.y}" stroke="${xRow.color}" stroke-width="4" marker-end="url(#ah-x)"/>
    <text x="${xEnd.x - 10}" y="${xEnd.y + 36}" text-anchor="end" font-size="22" font-weight="700" fill="${xRow.color}">${escapeHTML(xRow.ko)}</text>
    <text x="${xEnd.x - 10}" y="${xEnd.y + 62}" text-anchor="end" font-size="18" fill="var(--fg-alternative)">${escapeHTML(xRow.en)}</text>
    <!-- y (blue) -->
    <line x1="${ox}" y1="${oy}" x2="${yEnd.x}" y2="${yEnd.y}" stroke="${yRow.color}" stroke-width="4" marker-end="url(#ah-y)"/>
    <text x="${yEnd.x}" y="${yEnd.y - 30}" font-size="22" font-weight="700" fill="${yRow.color}">${escapeHTML(yRow.ko)}</text>
    <text x="${yEnd.x}" y="${yEnd.y - 8}" font-size="18" fill="var(--fg-alternative)">${escapeHTML(yRow.en)}</text>
    <!-- z (gray, diagonal) -->
    <line x1="${ox}" y1="${oy}" x2="${zEnd.x}" y2="${zEnd.y}" stroke="var(--fg-strong)" stroke-width="4" marker-end="url(#ah-z)"/>
    <text x="${zEnd.x + 16}" y="${zEnd.y + 6}" font-size="22" font-weight="700" fill="var(--fg-strong)">${escapeHTML(zRow.ko)}</text>
    <text x="${zEnd.x + 16}" y="${zEnd.y + 30}" font-size="18" fill="var(--fg-alternative)">${escapeHTML(zRow.en)}</text>
    <!-- origin dot -->
    <circle cx="${ox}" cy="${oy}" r="4" fill="var(--fg-strong)"/>
  </svg>`;

  const labels = [xRow, yRow, zRow]
    .map((r, i) => `<article class="sl-axis-label">
      <div class="sl-axis-eyebrow">AXIS ${i + 1}</div>
      <h3 class="sl-axis-en">${escapeHTML(r.en)}</h3>
      <p class="sl-axis-ko">${escapeHTML(r.ko)}${r.desc ? ` — ${escapeHTML(r.desc)}` : ""}</p>
    </article>`)
    .join("");

  const title = h1 ? `<h1 class="sl-title">${inline(h1.text)}</h1>` : "";
  const leadHtml = lead ? `<p class="sl-axis-lead">${inline(lead.text)}</p>` : "";
  return wrap(
    slide,
    ctx,
    `<div class="sl-body sl-axis-body">${title}${leadHtml}<div class="sl-axis-grid"><div class="sl-axis-viz">${svg}</div><div class="sl-axis-labels">${labels}</div></div></div>`
  );
}

function renderStatsBars(slide, ctx) {
  const [h1, rest] = pickHeading(slide.tokens, 1);
  // Left = h2 stats (same extraction as renderStats)
  const cells = [];
  let i = 0;
  while (i < rest.length) {
    const t = rest[i];
    if (t.type === "heading" && t.level === 2) {
      const value = inline(t.text);
      i += 1;
      const bodyParts = [];
      while (i < rest.length && !(rest[i].type === "heading" && rest[i].level === 2) && !(rest[i].type === "fence" && rest[i].name === "bars")) {
        if (rest[i].type === "paragraph") bodyParts.push(`<p>${inline(rest[i].text)}</p>`);
        i += 1;
      }
      cells.push({ value, body: bodyParts.join("") });
    } else {
      i += 1;
    }
  }
  const leftHtml = cells
    .map((c) => `<div class="sl-statsbars-cell"><div class="sl-statsbars-value">${c.value}</div><div class="sl-statsbars-copy">${c.body}</div></div>`)
    .join("");

  const barsFence = findFences(rest, "bars")[0];
  const barsTitle = barsFence && barsFence.variant ? barsFence.variant.replace(/^\*\*|\*\*$/g, "") : "";
  const items = barsFence
    ? barsFence.content.split("\n").map((s) => s.trim()).filter(Boolean).map((line) => {
        const [label, value] = line.split("|").map((s) => s.trim());
        return { label, value: parseFloat(value) || 0 };
      })
    : [];
  const max = Math.max(...items.map((it) => it.value), 1);
  const rowsHtml = items
    .map((it) => `<li class="sl-statsbars-row">
      <div class="sl-statsbars-row-label">${escapeHTML(it.label)}</div>
      <div class="sl-statsbars-row-track"><div class="sl-statsbars-row-fill" style="width:${(it.value / max) * 100}%"></div></div>
      <div class="sl-statsbars-row-value">${escapeHTML(String(it.value))}</div>
    </li>`)
    .join("");
  const barsHtml = barsFence
    ? `<div class="sl-statsbars-chart"><div class="sl-statsbars-chart-title">${escapeHTML(barsTitle)}</div><ul class="sl-statsbars-list">${rowsHtml}</ul></div>`
    : "";

  const title = h1 ? `<h1 class="sl-title">${inline(h1.text)}</h1>` : "";
  return wrap(
    slide,
    ctx,
    `<div class="sl-body sl-statsbars-body">${title}<div class="sl-statsbars-grid"><div class="sl-statsbars-left">${leftHtml}</div><div class="sl-statsbars-right">${barsHtml}</div></div></div>`
  );
}

function renderChipTable(slide, ctx) {
  const [h1, rest] = pickHeading(slide.tokens, 1);
  const table = rest.find((t) => t.type === "table");
  const note = findFences(rest, "note")[0];
  let tableHtml = "";
  if (table) {
    const thead = table.headers.map((h) => `<th>${inline(h)}</th>`).join("");
    const tbody = table.rows
      .map((row) => {
        const cells = row.map((c, idx) => {
          if (idx === 1) {
            return `<td class="sl-chiptable-map"><span class="sl-chiptable-arrow">→</span><div class="sl-chiptable-chips">${inline(c)}</div></td>`;
          }
          return `<td>${inline(c)}</td>`;
        }).join("");
        return `<tr>${cells}</tr>`;
      })
      .join("");
    tableHtml = `<table class="sl-chiptable"><thead><tr>${thead}</tr></thead><tbody>${tbody}</tbody></table>`;
  }
  const noteHtml = note ? `<aside class="sl-chiptable-note">${renderTokensGeneric(note.tokens || [], ctx)}</aside>` : "";
  const title = h1 ? `<h1 class="sl-title">${inline(h1.text)}</h1>` : "";
  return wrap(
    slide,
    ctx,
    `<div class="sl-body sl-chiptable-body">${title}${tableHtml}${noteHtml}</div>`
  );
}

function renderQuoteMark(slide, ctx) {
  const q = slide.tokens.find((t) => t.type === "quote");
  const note = findFences(slide.tokens, "note")[0];
  const quoteText = q ? inline(q.text) : "";
  const cite = q && q.attribution ? `<div class="sl-quotemark-cite">— ${escapeHTML(q.attribution)}</div>` : "";
  const noteHtml = note ? `<aside class="sl-note sl-quotemark-note">${renderTokensGeneric(note.tokens || [], ctx)}</aside>` : "";
  return wrap(
    slide,
    ctx,
    `<div class="sl-body sl-quotemark-body"><div class="sl-quotemark-mark" aria-hidden="true">&ldquo;</div><blockquote class="sl-quotemark-text">${quoteText}</blockquote>${cite}${noteHtml}</div>`
  );
}

// --------------------------------------------------------------------- dispatch

const LAYOUTS = {
  title: renderTitle,
  "section-divider": renderSectionDivider,
  "part-cover": renderPartCover,
  statement: renderStatement,
  toc: renderToc,
  closing: renderClosing,
  content: renderContent,
  "two-column": renderTwoColumn,
  quote: renderQuote,
  image: renderImage,
  "big-number": renderBigNumber,
  stats: renderStats,
  chart: renderChart,
  compare: renderCompare,
  bento: renderBento,
  chain: renderChain,
  timeline: renderTimeline,
  process: renderProcess,
  profile: renderProfile,
  "prompt-demo": renderPromptDemo,
  "checkpoint-rows": renderCheckpointRows,
  "agenda-columns": renderAgendaColumns,
  "debate-cards": renderDebateCards,
  "axis-diagram": renderAxisDiagram,
  "stats-bars": renderStatsBars,
  "chip-table": renderChipTable,
  "quote-mark": renderQuoteMark,
};

export function renderSlide(slide, ctx) {
  const fn = LAYOUTS[slide.layout];
  if (!fn) {
    if (typeof console !== "undefined") console.warn(`[design-deck] unknown layout: ${slide.layout} (slide ${slide.index + 1}); falling back to content`);
    return renderContent(slide, ctx);
  }
  return fn(slide, ctx);
}

// ---------------------------------------------------------------------- CSS

export const LAYOUT_CSS = `
/* ============================================================
   Brand highlight (==text== in markdown) — bold accent orange
   with transparent bg. Used sparingly, 1-2 words per slide.
   ============================================================ */
.sl-hi {
  background: transparent;
  color: var(--brand);
  font-weight: 800;
  font-style: inherit;
  padding: 0;
}

/* ============================================================
   Logo (top-right, every slide). White on dark/brand backgrounds.
   ============================================================ */
.sl-logo {
  position: absolute;
  top: 32px;
  right: 56px;
  height: 32px;
  z-index: 5;
  pointer-events: none;
}
.sl-logo svg { height: 100%; width: auto; display: block; }

/* ============================================================
   Title
   ============================================================ */
.sl-title { background: var(--bg-hero-gradient); }
.sl-title-grid { position: absolute; inset: 0; padding: 120px 120px; display: grid; grid-template-columns: 1.4fr 1fr; align-items: center; gap: 80px; }
.sl-title-hero { font-size: var(--deck-heading-xl); line-height: var(--deck-heading-xl-lh); font-weight: 800; letter-spacing: -1.5px; color: var(--fg-strong); margin: 0; display: flex; flex-direction: column; gap: 8px; }
.sl-title-hero span { display: block; }
/* Subtitle uses an editorial eyebrow treatment: orange accent rule,
   small uppercase + tracking, brand color — visually distinct from the
   bold-black hero so the two don't read as one run of type. */
.sl-title-sub {
  margin-top: 48px;
  font-size: 22px;
  line-height: 1.4;
  color: var(--brand);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  display: flex;
  align-items: center;
  gap: 20px;
}
.sl-title-sub::before {
  content: "";
  display: block;
  flex: 0 0 48px;
  height: 3px;
  background: var(--brand);
}
.sl-title-meta { margin-top: 48px; font-size: 26px; line-height: 1.5; color: var(--fg-assistive); font-weight: 500; }
.sl-title-mark { background: var(--bg-brand-tint); border-radius: var(--radius-xl); width: 100%; max-width: 480px; height: 680px; position: relative; }
.sl-title-mark-badge { position: absolute; left: 56px; bottom: 80px; width: 140px; height: 140px; border-radius: 50%; background: var(--brand); color: var(--fg-on-brand); font-size: 48px; font-weight: 800; letter-spacing: -1px; display: flex; align-items: center; justify-content: center; line-height: 1; }
.sl-title-stack { position: absolute; inset: 0; padding: 56px 120px 72px; display: grid; grid-template-rows: 1fr auto; gap: 40px; align-items: stretch; }
.sl-title-stack .sl-title-image { border-radius: var(--radius-xl); background-size: cover; background-position: center; background-repeat: no-repeat; background-color: var(--bg-muted); box-shadow: var(--shadow-md); min-height: 0; position: relative; }
.sl-title-stack .sl-title-image-credit { position: absolute; bottom: 14px; right: 18px; font-size: 14px; color: rgba(255,255,255,0.85); background: rgba(0,0,0,0.35); backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px); padding: 6px 12px; border-radius: 999px; font-weight: 500; letter-spacing: 0.2px; }
.sl-title-stack .sl-title-image-empty { background: var(--bg-muted); }
.sl-title-stack .sl-title-text { padding: 0; }
.sl-title-stack .sl-title-hero { font-size: 84px; line-height: 1.05; gap: 4px; }
.sl-title-stack .sl-title-sub { margin-top: 14px; font-size: 38px; line-height: 1.3; text-transform: none; letter-spacing: 0; font-weight: 500; color: var(--fg-strong); display: block; }
.sl-title-stack .sl-title-sub::before { display: none; }
.sl-title-stack .sl-title-meta { margin-top: 18px; font-size: 22px; color: var(--fg-assistive); }

/* ============================================================
   Section Divider
   ============================================================ */
.sl-section-divider { background: var(--brand); color: var(--fg-on-brand); }
.sl-section-body { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: flex-start; justify-content: center; padding: 0 160px; gap: 32px; }
.sl-section-num { font-size: 32px; font-weight: 600; opacity: 0.7; letter-spacing: 0.5px; }
.sl-section-hero { font-size: var(--deck-heading-hero); line-height: var(--deck-heading-hero-lh); font-weight: 800; color: var(--fg-on-brand); margin: 0; letter-spacing: -2px; max-width: 1500px; }

/* ============================================================
   Part Cover
   ============================================================ */
.sl-part-cover { background: var(--bg-canvas); }
.sl-part-body { position: absolute; inset: 0; padding: 140px 160px; display: flex; flex-direction: column; gap: 40px; justify-content: center; }
.sl-part-label { color: var(--brand); font-size: 36px; font-weight: 700; letter-spacing: 0; }
.sl-part-title { font-size: var(--deck-heading-hero); line-height: var(--deck-heading-hero-lh); font-weight: 800; color: var(--fg-strong); margin: 0; letter-spacing: -2px; }
.sl-part-sub { font-size: 28px; line-height: 1.4; color: var(--fg-alternative); margin: 0; max-width: 1200px; }
.sl-part-tag { margin-top: 32px; padding: 24px 32px; background: var(--bg-brand-tint); border-radius: var(--radius-lg); align-self: flex-start; font-size: 20px; color: var(--fg-strong); font-weight: 500; }

/* ============================================================
   Statement
   ============================================================ */
.sl-statement-body { position: absolute; inset: 0; padding: 0 160px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 48px; text-align: center; }
.sl-statement-hero { font-size: 112px; line-height: 1.1; font-weight: 800; color: var(--fg-strong); margin: 0; letter-spacing: -2.4px; max-width: 1600px; }
.sl-statement-hero .sl-orange, .sl-statement-hero strong.sl-orange { color: var(--brand); font-weight: 800; }
.sl-statement-sub { font-size: 40px; line-height: 1.55; color: var(--fg-alternative); margin: 0; max-width: 1200px; }

/* ============================================================
   TOC
   ============================================================ */
.sl-toc-body { position: absolute; inset: 0; padding: 140px 160px 100px; display: flex; flex-direction: column; gap: 64px; }
.sl-toc-title { font-size: 56px; font-weight: 700; color: var(--fg-strong); margin: 0; }
.sl-toc-list { list-style: none; padding: 0; margin: 0; display: grid; grid-template-columns: 1fr 1fr; gap: 32px 80px; }
.sl-toc-item { display: flex; align-items: baseline; gap: 24px; padding: 14px 0; border-bottom: 1px solid var(--border-subtle); font-size: 26px; }
.sl-toc-num { color: var(--brand); font-weight: 700; font-feature-settings: "tnum" 1; min-width: 64px; }
.sl-toc-label { color: var(--fg-strong); flex: 1; font-weight: 500; }
.sl-toc-page { color: var(--fg-assistive); font-size: 20px; font-feature-settings: "tnum" 1; }

/* ============================================================
   Closing
   ============================================================ */
.sl-closing-body { position: absolute; inset: 0; padding: 0 160px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 48px; text-align: center; }
.sl-closing-hero { font-size: var(--deck-heading-xl); line-height: var(--deck-heading-xl-lh); font-weight: 800; color: var(--fg-strong); margin: 0; }
.sl-closing-meta p { font-size: 26px; color: var(--fg-alternative); margin: 8px 0; }
.sl-closing-logo { position: absolute; left: 50%; bottom: 80px; transform: translateX(-50%); margin: 0; }
.sl-closing-logo svg { height: 56px; width: auto; }

/* ============================================================
   Content / two-column / quote / image
   ============================================================ */
.sl-twocol { display: grid; grid-template-columns: 1fr 1fr; gap: 80px; padding-top: 16px; }
.sl-twocol .sl-col { padding-right: 20px; border-right: 1px solid var(--border-subtle); }
.sl-twocol .sl-col:last-child { border-right: none; padding-right: 0; padding-left: 20px; }
.sl-quote-body { padding: 120px 160px 80px !important; align-items: flex-start; }
.sl-quote-bq { font-size: var(--deck-heading-l); line-height: 1.38; font-weight: 500; color: var(--fg-strong); margin: 0; padding: 0; max-width: 1500px; position: relative; }
.sl-quote-bq::before { content: "\\201C"; position: absolute; left: -80px; top: -20px; color: var(--brand); font-size: 200px; line-height: 1; font-family: Georgia, serif; }
.sl-quote-cite { display: block; margin-top: 48px; font-size: 26px; color: var(--fg-alternative); font-style: normal; font-weight: 500; padding-left: 4px; }
.sl-quote-cite::before { content: ""; display: inline-block; width: 80px; height: 3px; background: var(--brand); vertical-align: middle; margin-right: 16px; }
.sl-image-body { padding: 96px 120px 72px; }
.sl-image-frame { flex: 1; min-height: 720px; border-radius: var(--radius-lg); background: var(--bg-muted); box-shadow: var(--shadow-md); }
.sl-image-empty { display: flex; align-items: center; justify-content: center; color: var(--fg-disabled); font-size: 24px; }
.sl-image-caption { margin-top: 16px; font-size: 22px; color: var(--fg-assistive); }
.sl-figure { margin: 16px 0; }
.sl-figure img { max-width: 100%; height: auto; border-radius: var(--radius-md); }
.sl-figure figcaption { margin-top: 8px; font-size: 20px; color: var(--fg-assistive); }

/* ============================================================
   Big Number
   ============================================================ */
.sl-bignum-body { padding: 220px 160px 100px; gap: 32px; }
.sl-bignum-hero { font-size: 260px; line-height: var(--deck-number-mega-lh); font-weight: 800; color: var(--brand); letter-spacing: -5.4px; font-feature-settings: "tnum" 1, "lnum" 1; margin-top: 48px; }
.sl-bignum-lead { font-size: 40px; line-height: 1.6; color: var(--fg-strong); max-width: 1400px; margin: 0; font-weight: 500; }
.sl-bignum-quote { background: var(--bg-brand-tint); padding: 32px 40px; border-radius: var(--radius-lg); margin: 0; max-width: 1200px; }
.sl-bignum-q-text { font-size: 26px; line-height: 1.5; color: var(--fg-strong); font-style: italic; }
.sl-bignum-quote cite { display: block; margin-top: 14px; font-size: 20px; color: var(--fg-alternative); font-style: normal; }

/* ============================================================
   Stats
   ============================================================ */
.sl-stats-body { padding: 120px 120px 80px; gap: 32px; }
.sl-stats-grid { display: grid; gap: 32px; flex: 1; }
.sl-stats-body[data-cells="2"] .sl-stats-grid { grid-template-columns: 1fr 1fr; }
.sl-stats-body[data-cells="3"] .sl-stats-grid { grid-template-columns: repeat(3, 1fr); }
.sl-stats-body[data-cells="4"] .sl-stats-grid { grid-template-columns: repeat(4, 1fr); }
.sl-stats-body[data-cells="5"] .sl-stats-grid { grid-template-columns: repeat(5, 1fr); }
.sl-stats-body[data-cells="6"] .sl-stats-grid { grid-template-columns: repeat(3, 1fr); grid-auto-rows: 1fr; }
.sl-stats-cell { background: var(--bg-canvas); border: 1px solid var(--border-subtle); border-radius: 24px; padding: 48px 40px; display: flex; flex-direction: column; gap: 20px; }
.sl-stats-value { font-size: 140px; line-height: 1; font-weight: 800; color: var(--brand); letter-spacing: -4px; font-feature-settings: "tnum" 1, "lnum" 1; }
.sl-stats-cell .sl-stats-body { font-size: 26px; line-height: 1.5; color: var(--fg-normal); padding: 0; white-space: pre-line; }
.sl-stats-cell .sl-stats-body p { margin: 0 0 12px; }
.sl-stats-cell .sl-stats-body p:last-child { margin-bottom: 0; }

/* ============================================================
   Chart
   ============================================================ */
.sl-chart-body { padding: 120px 120px 80px; }
.sl-chart-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 80px; align-items: center; flex: 1; }
.sl-chart-grid-full { grid-template-columns: 1fr; gap: 40px; }
.sl-chart-viz { display: flex; align-items: center; justify-content: center; }
.sl-chart-legend { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 20px; }
.sl-chart-legend-item { display: grid; grid-template-columns: 28px 1fr auto; gap: 20px; align-items: center; padding: 18px 0; border-bottom: 1px solid var(--border-subtle); font-size: 26px; }
.sl-chart-swatch { width: 20px; height: 20px; border-radius: 4px; align-self: start; margin-top: 6px; }
.sl-chart-label { color: var(--fg-strong); font-weight: 700; }
.sl-chart-label-stack { display: flex; flex-direction: column; gap: 4px; line-height: 1.2; }
.sl-chart-label-stack .sl-chart-label { font-weight: 700; }
.sl-chart-sub { color: var(--fg-alternative); font-weight: 400; font-size: 20px; }
.sl-chart-value { color: var(--fg-strong); font-weight: 700; font-size: 30px; font-feature-settings: "tnum" 1; align-self: center; }

/* ============================================================
   Compare
   ============================================================ */
.sl-compare-body { padding: 120px 120px 80px; }
.sl-compare-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; flex: 1; }
.sl-compare-card { padding: 40px; border-radius: var(--radius-lg); display: flex; flex-direction: column; gap: 16px; }
.sl-compare-before { background: var(--bg-subtle); }
.sl-compare-after { background: var(--bg-brand-tint); }
.sl-compare-label { font-size: 20px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; }
.sl-compare-before .sl-compare-label { color: var(--fg-assistive); }
.sl-compare-after .sl-compare-label { color: var(--brand); }
.sl-compare-card h3 { margin: 0 0 8px; font-size: 28px; color: var(--fg-strong); }
.sl-compare-card ul { padding: 0 0 0 20px; }
.sl-compare-card ul li { font-size: 26px; line-height: 1.6; color: var(--fg-normal); }

/* ============================================================
   Bento
   ============================================================ */
.sl-bento-body { padding: 120px 120px 80px; }
.sl-bento-grid { display: grid; gap: 24px; flex: 1; }
.sl-bento-grid[data-cells="3"] { grid-template-columns: repeat(3, 1fr); }
.sl-bento-grid[data-cells="4"] { grid-template-columns: repeat(2, 1fr); grid-auto-rows: 1fr; }
.sl-bento-grid[data-cells="6"] { grid-template-columns: repeat(3, 1fr); grid-auto-rows: 1fr; }
.sl-bento-card { position: relative; background: var(--bg-canvas); border: 1px solid var(--border-subtle); border-radius: 24px; padding: 40px; display: flex; flex-direction: column; gap: 12px; }
.sl-bento-icon { position: absolute; top: 32px; right: 32px; width: 56px; height: 56px; border-radius: 12px; background: var(--bg-brand-tint); color: var(--brand); display: flex; align-items: center; justify-content: center; }
.sl-bento-label { font-size: 24px; font-weight: 800; letter-spacing: 0.5px; color: var(--brand); font-feature-settings: "tnum" 1; }
.sl-bento-title { font-size: 32px; font-weight: 700; color: var(--fg-strong); margin: 0; line-height: 1.3; }
/* Push the description block to the bottom so cards read top (number +
   icon) / middle (title) / bottom (description), matching sample p12. */
.sl-bento-card > :last-child:not(.sl-bento-title):not(.sl-bento-label) { margin-top: auto; color: var(--fg-alternative); }

/* ============================================================
   Chain
   ============================================================ */
.sl-chain-body { padding: 140px 80px 100px; }
.sl-chain-grid { display: flex; align-items: stretch; gap: 0; flex: 1; }
.sl-chain-card { flex: 1; background: var(--bg-canvas); border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); padding: 32px; display: flex; flex-direction: column; gap: 12px; }
.sl-chain-highlight { background: var(--bg-brand-tint); border-color: transparent; }
.sl-chain-arrow { display: flex; align-items: center; justify-content: center; padding: 0 16px; flex-shrink: 0; }
.sl-chain-title { font-size: 28px; font-weight: 700; color: var(--fg-strong); margin: 0; }

/* ============================================================
   Timeline
   ============================================================ */
.sl-timeline-body { padding: 140px 120px 100px; }
.sl-timeline { list-style: none; padding: 0; margin: 0; display: grid; grid-template-columns: repeat(auto-fit, minmax(0, 1fr)); gap: 0; position: relative; flex: 1; align-content: center; }
.sl-timeline::before { content: ""; position: absolute; left: 5%; right: 5%; top: 64px; height: 2px; background: var(--border-strong); }
.sl-timeline-item { display: flex; flex-direction: column; align-items: center; gap: 16px; padding: 0 8px; text-align: center; position: relative; }
.sl-timeline-dot { width: 24px; height: 24px; border-radius: 999px; background: var(--neutral-300); border: 4px solid var(--bg-canvas); margin-top: 52px; z-index: 1; }
.sl-timeline-active .sl-timeline-dot { background: var(--brand); }
.sl-timeline-label { font-size: 22px; font-weight: 700; color: var(--fg-strong); margin-top: 8px; }
.sl-timeline-active .sl-timeline-label { color: var(--brand); }
.sl-timeline-body { display: flex; flex-direction: column; }
.sl-timeline-item .sl-timeline-body { font-size: 22px; line-height: 1.4; color: var(--fg-alternative); padding: 0; max-width: 320px; }

/* ============================================================
   Process
   ============================================================ */
.sl-process-body { padding: 140px 80px 100px; }
.sl-process-grid { list-style: none; padding: 0; margin: 0; display: grid; gap: 16px; flex: 1; }
.sl-process-grid[data-cells="3"] { grid-template-columns: repeat(3, 1fr); }
.sl-process-grid[data-cells="4"] { grid-template-columns: repeat(4, 1fr); }
.sl-process-grid[data-cells="5"] { grid-template-columns: repeat(5, 1fr); }
.sl-process-grid[data-cells="6"] { grid-template-columns: repeat(6, 1fr); }
.sl-process-grid[data-cells="7"] { grid-template-columns: repeat(7, 1fr); }
.sl-process-cell { background: var(--bg-canvas); border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); padding: 28px 20px; display: flex; flex-direction: column; gap: 12px; align-items: flex-start; }
.sl-process-highlight { background: var(--bg-brand-tint); border-color: transparent; }
.sl-process-num { background: var(--neutral-900); color: var(--fg-on-brand); font-size: 20px; font-weight: 700; padding: 8px 16px; border-radius: var(--radius-pill); font-feature-settings: "tnum" 1; }
.sl-process-highlight .sl-process-num { background: var(--brand); }
.sl-process-title { font-size: 26px; font-weight: 700; color: var(--fg-strong); line-height: 1.3; }
.sl-process-body { font-size: 26px; line-height: 1.5; color: var(--fg-alternative); padding: 0; }

/* ============================================================
   Profile
   ============================================================ */
.sl-profile-body { padding: 120px 160px 80px; gap: 48px; }
.sl-profile-grid { display: grid; grid-template-columns: 360px 1fr; gap: 64px; align-items: flex-start; }
.sl-profile-photo { width: 360px; height: 360px; border-radius: 999px; overflow: hidden; box-shadow: var(--shadow-md); background: var(--bg-muted); }
.sl-profile-photo img { width: 100%; height: 100%; object-fit: cover; }
.sl-profile-name { font-size: 40px; font-weight: 700; color: var(--fg-strong); margin: 0 0 24px; }
.sl-profile-bullets { padding-left: 28px; }
.sl-profile-bullets li { font-size: 26px; line-height: 1.6; margin-bottom: 10px; color: var(--fg-normal); }
.sl-profile-thumbs { display: flex; gap: 16px; align-items: center; }
.sl-profile-thumbs img { height: 120px; border-radius: var(--radius-md); box-shadow: var(--shadow-sm); }

/* ============================================================
   Prompt Demo
   ============================================================ */
.sl-prompt-demo-body { padding: 120px 80px 80px; gap: 24px; }
.sl-prompt-chip { background: var(--bg-brand-tint); color: var(--brand); padding: 10px 24px; border-radius: var(--radius-pill); font-size: 20px; font-weight: 700; align-self: flex-start; letter-spacing: 0.5px; text-transform: uppercase; }
.sl-prompt-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; flex: 1; }
.sl-prompt-side { display: flex; flex-direction: column; gap: 16px; }
.sl-prompt-variant { background: var(--brand); color: var(--fg-on-brand); padding: 6px 16px; border-radius: var(--radius-sm); font-size: 17px; font-weight: 700; align-self: flex-start; text-transform: uppercase; letter-spacing: 0.5px; }
.sl-prompt-code { background: var(--neutral-950); color: #E5E5E5; padding: 32px; border-radius: var(--radius-lg); margin: 0; font-family: var(--font-mono, "SF Mono", Menlo, monospace); font-size: 22px; line-height: 1.6; overflow: hidden; flex: 1; white-space: pre-wrap; }
.sl-prompt-response { background: var(--bg-canvas); border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); padding: 32px; box-shadow: var(--shadow-sm); flex: 1; font-size: 26px; line-height: 1.5; }
.sl-prompt-analysis { padding: 16px 24px; border-left: 4px solid var(--brand); }
.sl-prompt-analysis-h { font-size: 25px; font-weight: 700; color: var(--brand); margin: 0 0 10px; }

/* ============================================================
   Checkpoint Rows
   ============================================================ */
.sl-cp-body { padding: 120px 120px 80px; }
.sl-cp-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 0; flex: 1; }
.sl-cp-row { display: grid; grid-template-columns: 1fr 80px 1fr; gap: 24px; align-items: center; padding: 28px 0; border-bottom: 1px solid var(--border-subtle); }
.sl-cp-row:last-child { border-bottom: none; }
.sl-cp-name { font-size: 28px; font-weight: 700; color: var(--fg-strong); }
.sl-cp-sub { font-size: 22px; color: var(--fg-alternative); margin-top: 6px; line-height: 1.4; }
.sl-cp-arrow { font-size: 32px; color: var(--brand); text-align: center; font-weight: 700; }

/* ============================================================
   Highlight (generic)
   ============================================================ */
.sl-highlight { background: var(--bg-brand-tint); padding: 24px 32px; border-radius: var(--radius-lg); margin: 16px 0; }

/* ============================================================
   Generic content blocks — tables, simple flow, mermaid
   ============================================================ */
.sl-table { width: 100%; border-collapse: collapse; font-size: 24px; line-height: 1.4; margin: 16px 0 24px; }
.sl-table thead th { text-align: left; padding: 14px 18px; border-bottom: 3px solid var(--brand); color: var(--fg-strong); font-weight: 700; font-feature-settings: "tnum" 1; }
.sl-table tbody td { padding: 14px 18px; border-bottom: 1px solid var(--border-subtle); color: var(--fg-normal); font-feature-settings: "tnum" 1; vertical-align: top; }
.sl-table tbody tr:last-child td { border-bottom: none; }
.sl-table tbody tr:hover td { background: var(--bg-subtle); }

.sl-flow { display: flex; align-items: stretch; gap: 0; margin: 24px 0; flex-wrap: wrap; }
.sl-flow-step { display: flex; align-items: center; gap: 16px; }
.sl-flow-card { background: var(--bg-canvas); border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); padding: 24px 28px; box-shadow: var(--shadow-sm); display: flex; flex-direction: column; gap: 6px; min-width: 180px; max-width: 320px; }
.sl-flow-head { font-size: 24px; font-weight: 700; color: var(--fg-strong); line-height: 1.3; }
.sl-flow-sub { font-size: 18px; color: var(--fg-alternative); line-height: 1.4; }
.sl-flow-arrow { display: flex; align-items: center; padding: 0 4px; }
.sl-flow[data-steps="4"] .sl-flow-card, .sl-flow[data-steps="5"] .sl-flow-card { padding: 20px 22px; min-width: 150px; }
.sl-flow[data-steps="5"] .sl-flow-head, .sl-flow[data-steps="6"] .sl-flow-head { font-size: 22px; }

.sl-mermaid { margin: 16px 0; display: flex; justify-content: center; align-items: center; min-height: 200px; }
.sl-mermaid svg { max-width: 100%; height: auto; }

/* ============================================================
   Dark theme overrides
   ============================================================ */
.sl[data-theme="dark"] .sl-bento-card,
.sl[data-theme="dark"] .sl-stats-cell,
.sl[data-theme="dark"] .sl-process-cell,
.sl[data-theme="dark"] .sl-chain-card { background: var(--neutral-900); border-color: var(--neutral-700); color: var(--fg-on-brand); }
.sl[data-theme="dark"] .sl-bento-title,
.sl[data-theme="dark"] .sl-process-title,
.sl[data-theme="dark"] .sl-chain-title { color: var(--fg-on-brand); }
.sl[data-theme="dark"] .sl-prompt-response { background: var(--neutral-900); border-color: var(--neutral-700); color: var(--fg-on-brand); }

/* ============================================================
   Shared callouts — used across layouts via :::note and :::callout fences.
   ============================================================ */
.sl-note { border-left: 4px solid var(--brand); padding: 20px 28px; margin: 24px 0; color: var(--fg-strong); font-size: 26px; line-height: 1.55; font-weight: 500; }
.sl-note p { margin: 0; }
.sl-callout { background: var(--bg-brand-tint); padding: 32px 40px; border-radius: 16px; margin: 32px 0; text-align: center; font-size: 28px; font-weight: 600; color: var(--fg-strong); }
.sl-callout p { margin: 0; }

/* Accent override (per-slide / per-deck blue) */
.sl[data-accent="blue"] {
  --brand: var(--blue-500);
  --brand-tint: var(--blue-50);
  --bg-brand-tint: var(--blue-50);
  --bg-hero-gradient: linear-gradient(#FFFFFF 0%, #E6F1FF 100%);
}

/* ============================================================
   Inline chips — used anywhere inline text appears (table cells,
   paragraphs, callouts). Three color variants.
   ============================================================ */
.sl-chip {
  display: inline-block;
  padding: 6px 16px;
  border-radius: 999px;
  font-size: 20px;
  font-weight: 600;
  line-height: 1.2;
  letter-spacing: 0;
  vertical-align: baseline;
  margin: 0 2px;
}
.sl-chip-orange { background: var(--bg-brand-tint); color: var(--brand); }
.sl-chip-blue { background: var(--blue-50, #E6F1FF); color: var(--blue-500, #2B7BE4); }
.sl-chip-gray { background: var(--neutral-100, #F3F3F3); color: var(--fg-alternative); }

/* ============================================================
   Agenda Columns (PDF p14)
   ============================================================ */
.sl-agenda-body { padding: 120px 120px 100px; gap: 32px; }
.sl-agenda-rule { height: 3px; background: var(--brand); border-radius: 2px; margin-top: 24px; }
.sl-agenda-grid { display: grid; gap: 24px; margin-top: 24px; flex: 1; }
.sl-agenda-grid[data-cells="3"] { grid-template-columns: repeat(3, 1fr); }
.sl-agenda-grid[data-cells="4"] { grid-template-columns: repeat(4, 1fr); }
.sl-agenda-grid[data-cells="5"] { grid-template-columns: repeat(5, 1fr); }
.sl-agenda-grid[data-cells="6"] { grid-template-columns: repeat(6, 1fr); }
.sl-agenda-col {
  background: var(--bg-canvas);
  border: 1px solid var(--border-subtle);
  border-radius: 24px;
  padding: 40px 28px;
  display: flex;
  flex-direction: column;
  min-height: 520px;
}
.sl-agenda-eyebrow {
  font-size: 16px;
  font-weight: 700;
  letter-spacing: 1.4px;
  text-transform: uppercase;
  color: var(--fg-assistive);
  margin-bottom: 20px;
}
.sl-agenda-title { font-size: 30px; line-height: 1.3; font-weight: 700; color: var(--fg-strong); margin: 0; }
.sl-agenda-spacer { flex: 1; min-height: 40px; }
.sl-agenda-footer { font-size: 22px; font-weight: 700; color: var(--brand); margin-top: 16px; }

/* ============================================================
   Debate Cards (PDF p11)
   ============================================================ */
.sl-debate-body { padding: 120px 120px 80px; gap: 24px; }
.sl-debate-sub { font-size: 26px; color: var(--fg-alternative); margin: 0 0 8px; line-height: 1.4; }
.sl-debate-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; flex: 1; }
.sl-debate-card {
  background: var(--bg-canvas);
  border: 1px solid var(--border-subtle);
  border-radius: 24px;
  padding: 40px 44px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.sl-debate-eyebrow {
  font-size: 18px;
  font-weight: 600;
  color: var(--fg-assistive);
  letter-spacing: 0.5px;
}
.sl-debate-content { display: flex; flex-direction: column; gap: 14px; }
.sl-debate-content blockquote {
  margin: 0;
  padding: 0;
  font-size: 28px;
  font-weight: 700;
  color: var(--fg-strong);
  line-height: 1.35;
}
.sl-debate-content blockquote cite {
  display: block;
  margin-top: 10px;
  font-size: 20px;
  color: var(--fg-alternative);
  font-style: normal;
  font-weight: 500;
}
.sl-debate-content ul { padding-left: 24px; margin: 8px 0 0; }
.sl-debate-content ul li { font-size: 22px; line-height: 1.5; color: var(--fg-normal); margin-bottom: 6px; }
.sl-debate-callout { margin: 0; }

/* ============================================================
   Axis Diagram (PDF p5)
   ============================================================ */
.sl-axis-body { padding: 120px 120px 80px; gap: 16px; }
.sl-axis-lead { font-size: 28px; color: var(--fg-alternative); margin: 0 0 24px; line-height: 1.4; }
.sl-axis-grid { display: grid; grid-template-columns: 1.1fr 1fr; gap: 56px; align-items: center; flex: 1; }
.sl-axis-viz { display: flex; align-items: center; justify-content: center; }
.sl-axis-svg { width: 100%; max-width: 560px; height: auto; }
.sl-axis-labels { display: flex; flex-direction: column; gap: 32px; }
.sl-axis-label { display: flex; flex-direction: column; gap: 6px; }
.sl-axis-eyebrow {
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 1.4px;
  text-transform: uppercase;
  color: var(--brand);
}
.sl-axis-en { font-size: 32px; font-weight: 800; color: var(--fg-strong); margin: 0; letter-spacing: -0.5px; }
.sl-axis-ko { font-size: 22px; color: var(--fg-alternative); margin: 0; line-height: 1.45; }

/* ============================================================
   Stats Bars (PDF p9)
   ============================================================ */
.sl-statsbars-body { padding: 120px 120px 80px; gap: 32px; }
.sl-statsbars-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 80px; flex: 1; }
.sl-statsbars-left { display: flex; flex-direction: column; gap: 24px; }
.sl-statsbars-cell {
  padding: 16px 0;
  border-top: 1px solid var(--border-subtle);
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.sl-statsbars-cell:first-child { border-top: none; padding-top: 0; }
.sl-statsbars-value {
  font-size: 100px;
  line-height: 1.05;
  font-weight: 800;
  color: var(--brand);
  letter-spacing: -3px;
  font-feature-settings: "tnum" 1, "lnum" 1;
}
.sl-statsbars-copy { font-size: 24px; line-height: 1.5; color: var(--fg-normal); }
.sl-statsbars-copy p { margin: 0; }
.sl-statsbars-right { display: flex; flex-direction: column; gap: 24px; justify-content: flex-start; padding-top: 16px; }
.sl-statsbars-chart { display: flex; flex-direction: column; gap: 20px; }
.sl-statsbars-chart-title {
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 1.4px;
  text-transform: uppercase;
  color: var(--fg-assistive);
}
.sl-statsbars-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 18px; }
.sl-statsbars-row {
  display: grid;
  grid-template-columns: 220px 1fr 72px;
  gap: 20px;
  align-items: center;
}
.sl-statsbars-row-label { font-size: 22px; color: var(--fg-strong); font-weight: 500; }
.sl-statsbars-row-track {
  height: 22px;
  background: var(--neutral-100, #F3F3F3);
  border-radius: 999px;
  overflow: hidden;
}
.sl-statsbars-row-fill {
  height: 100%;
  background: var(--brand);
  border-radius: 999px;
}
.sl-statsbars-row-value {
  font-size: 24px;
  font-weight: 700;
  color: var(--fg-strong);
  text-align: right;
  font-feature-settings: "tnum" 1;
}

/* ============================================================
   Chip Table (PDF p6)
   ============================================================ */
.sl-chiptable-body { padding: 120px 120px 80px; gap: 32px; }
.sl-chiptable {
  width: 100%;
  border-collapse: collapse;
  font-size: 24px;
  margin: 16px 0 0;
}
.sl-chiptable thead th {
  text-align: left;
  padding: 14px 8px;
  border-bottom: 1px solid var(--border-subtle);
  color: var(--fg-assistive);
  font-weight: 500;
  font-size: 18px;
  letter-spacing: 0.5px;
}
.sl-chiptable tbody td {
  padding: 22px 8px;
  border-bottom: 1px solid var(--border-subtle);
  color: var(--fg-strong);
  vertical-align: middle;
}
.sl-chiptable tbody td:first-child { font-weight: 700; font-size: 28px; }
.sl-chiptable-map {
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 22px 8px;
}
.sl-chiptable-arrow { color: var(--fg-disabled); font-size: 24px; flex: 0 0 auto; }
.sl-chiptable-chips { display: flex; flex-wrap: wrap; gap: 10px; }
.sl-chiptable-note {
  background: var(--bg-subtle);
  padding: 24px 32px;
  border-radius: 12px;
  margin: 24px 0 0;
  font-size: 22px;
  color: var(--fg-strong);
  text-align: center;
  border-left: none;
}
.sl-chiptable-note p { margin: 0; }

/* ============================================================
   Quote Mark (PDF p8) — peach tint, giant orange quote glyph.
   ============================================================ */
.sl-quote-mark { background: var(--bg-brand-tint); }
.sl-quotemark-body { padding: 160px 160px 100px; gap: 48px; }
.sl-quotemark-mark {
  font-family: Georgia, "Times New Roman", serif;
  font-size: 180px;
  line-height: 0.8;
  color: var(--brand);
  opacity: 0.9;
  font-weight: 700;
}
.sl-quotemark-text {
  margin: 0;
  padding: 0;
  font-size: 56px;
  line-height: 1.45;
  font-weight: 600;
  color: var(--fg-strong);
  letter-spacing: -0.5px;
  max-width: 1400px;
}
.sl-quotemark-cite {
  font-size: 24px;
  color: var(--fg-alternative);
  font-weight: 500;
}
.sl-quotemark-note { margin-top: 24px; max-width: 1400px; }
`;
