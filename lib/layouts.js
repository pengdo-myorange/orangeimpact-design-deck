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
    } else if (t.type === "codefence") {
      out.push(`<pre class="sl-code"><code>${escapeHTML(t.content)}</code></pre>`);
    } else if (t.type === "fence" && t.name === "highlight") {
      out.push(`<div class="sl-highlight">${renderTokensGeneric(t.tokens || [], ctx)}</div>`);
    }
  }
  return out.join("\n");
}

// Layouts whose background is dark or brand-colored — must use white logo.
const DARK_BG_LAYOUTS = new Set(["section-divider"]);

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
  const useWhite = theme === "dark" || DARK_BG_LAYOUTS.has(slide.layout);
  const logoSvg = useWhite ? (ctx.logoSvgWhite || ctx.logoSvg) : ctx.logoSvg;
  const logoHtml = logoSvg ? `<div class="sl-logo">${logoSvg}</div>` : "";

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
  const mark = slide.directives.mark || "";
  const titleHtml = h1s.map((h) => `<span>${inline(h.text)}</span>`).join("");
  const subHtml = h2 ? `<div class="sl-title-sub">${inline(h2.text)}</div>` : "";
  const meta = lastP ? `<div class="sl-title-meta">${inline(lastP.text)}</div>` : "";
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
  const num = h2 ? `<div class="sl-section-num">${inline(h2.text)}</div>` : "";
  return wrap(
    slide,
    ctx,
    `<div class="sl-section-body">${num}<h1 class="sl-section-hero">${inline(h1 ? h1.text : "")}</h1></div>`
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
    `<div class="sl-closing-body"><h1 class="sl-closing-hero">${inline(h1 ? h1.text : "Thank you")}</h1><div class="sl-closing-meta">${meta}</div><div class="sl-closing-logo">${logo}</div></div>`
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
    `<div class="sl-body sl-quote-body"><blockquote class="sl-quote-mark">${inline(q.text)}</blockquote>${cite}</div>`
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
  // Each stat = h2 + following paragraph.
  const cells = [];
  let i = 0;
  while (i < rest.length) {
    const t = rest[i];
    if (t.type === "heading" && t.level === 2) {
      const value = inline(t.text);
      let body = "";
      const next = rest[i + 1];
      if (next && next.type === "paragraph") {
        body = inline(next.text);
        i += 2;
      } else {
        i += 1;
      }
      cells.push({ value, body });
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
  // Data block: looks for a `:::data` fence containing lines `label | value | color?`
  const dataFence = findFences(rest, "data")[0];
  const items = [];
  if (dataFence) {
    for (const line of dataFence.content.split("\n")) {
      const parts = line.split("|").map((s) => s.trim());
      if (parts.length >= 2 && parts[0]) {
        items.push({ label: parts[0], value: parseFloat(parts[1]) || 0, color: parts[2] || "" });
      }
    }
  }
  const palette = ["var(--brand)", "var(--accent)", "var(--neutral-400)", "var(--orange-300)", "var(--blue-300)", "var(--neutral-700)"];
  const enriched = items.map((it, i) => ({ ...it, color: it.color || palette[i % palette.length] }));
  const total = enriched.reduce((s, it) => s + it.value, 0) || 1;

  let chart = "";
  if (kind === "donut") {
    const r = 120, cx = 160, cy = 160, sw = 56;
    const C = 2 * Math.PI * r;
    let off = 0;
    const ringes = enriched
      .map((it) => {
        const frac = it.value / total;
        const dash = frac * C;
        const seg = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${it.color}" stroke-width="${sw}" stroke-dasharray="${dash} ${C - dash}" stroke-dashoffset="${-off}" transform="rotate(-90 ${cx} ${cy})"/>`;
        off += dash;
        return seg;
      })
      .join("");
    chart = `<svg class="sl-chart-svg" viewBox="0 0 320 320" width="380" height="380">${ringes}</svg>`;
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
  const legend = enriched
    .map(
      (it) =>
        `<li class="sl-chart-legend-item"><span class="sl-chart-swatch" style="background:${it.color}"></span><span class="sl-chart-label">${escapeHTML(it.label)}</span><span class="sl-chart-value">${escapeHTML(String(it.value))}</span></li>`
    )
    .join("");
  const title = h1 ? `<h1 class="sl-title">${inline(h1.text)}</h1>` : "";
  return wrap(
    slide,
    ctx,
    `<div class="sl-body sl-chart-body">${title}<div class="sl-chart-grid"><div class="sl-chart-viz">${chart}</div><ul class="sl-chart-legend">${legend}</ul></div></div>`
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
.sl-title-mark { background: var(--bg-brand-tint); border-radius: var(--radius-xl); aspect-ratio: 1; max-width: 480px; display: flex; align-items: center; justify-content: center; }
.sl-title-mark-badge { background: var(--brand); color: var(--fg-on-brand); font-size: 120px; font-weight: 800; letter-spacing: -2px; padding: 48px 56px; border-radius: var(--radius-pill); line-height: 1; }

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
.sl-statement-sub { font-size: 28px; line-height: 1.4; color: var(--fg-alternative); margin: 0; max-width: 1200px; }

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
.sl-closing-logo { margin-top: 80px; }
.sl-closing-logo svg { height: 48px; width: auto; }

/* ============================================================
   Content / two-column / quote / image
   ============================================================ */
.sl-twocol { display: grid; grid-template-columns: 1fr 1fr; gap: 80px; padding-top: 16px; }
.sl-twocol .sl-col { padding-right: 20px; border-right: 1px solid var(--border-subtle); }
.sl-twocol .sl-col:last-child { border-right: none; padding-right: 0; padding-left: 20px; }
.sl-quote-body { padding: 120px 160px 80px !important; align-items: flex-start; }
.sl-quote-mark { font-size: var(--deck-heading-l); line-height: var(--deck-heading-l-lh); font-weight: 500; color: var(--fg-strong); margin: 0; padding: 0; max-width: 1500px; position: relative; }
.sl-quote-mark::before { content: "\\201C"; position: absolute; left: -80px; top: -20px; color: var(--brand); font-size: 200px; line-height: 1; font-family: Georgia, serif; }
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
.sl-bignum-body { padding: 140px 160px 100px; gap: 32px; }
.sl-bignum-hero { font-size: 224px; line-height: var(--deck-number-mega-lh); font-weight: 800; color: var(--brand); letter-spacing: -4.8px; font-feature-settings: "tnum" 1, "lnum" 1; }
.sl-bignum-lead { font-size: 28px; line-height: 1.5; color: var(--fg-strong); max-width: 1400px; margin: 0; font-weight: 500; }
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
.sl-stats-cell { background: var(--bg-canvas); border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); padding: 40px 32px; box-shadow: var(--shadow-sm); display: flex; flex-direction: column; gap: 16px; }
.sl-stats-value { font-size: 120px; line-height: 1; font-weight: 800; color: var(--brand); letter-spacing: -3px; font-feature-settings: "tnum" 1, "lnum" 1; }
.sl-stats-cell .sl-stats-body { font-size: 26px; line-height: 1.5; color: var(--fg-normal); padding: 0; }

/* ============================================================
   Chart
   ============================================================ */
.sl-chart-body { padding: 120px 120px 80px; }
.sl-chart-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 80px; align-items: center; flex: 1; }
.sl-chart-viz { display: flex; align-items: center; justify-content: center; }
.sl-chart-legend { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 20px; }
.sl-chart-legend-item { display: grid; grid-template-columns: 32px 1fr auto; gap: 20px; align-items: center; padding: 14px 0; border-bottom: 1px solid var(--border-subtle); font-size: 26px; }
.sl-chart-swatch { width: 24px; height: 24px; border-radius: 6px; }
.sl-chart-label { color: var(--fg-strong); font-weight: 500; }
.sl-chart-value { color: var(--fg-alternative); font-weight: 700; font-feature-settings: "tnum" 1; }

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
.sl-bento-card { position: relative; background: var(--bg-canvas); border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); padding: 32px; box-shadow: var(--shadow-sm); display: flex; flex-direction: column; gap: 12px; }
.sl-bento-icon { position: absolute; top: 24px; right: 24px; color: var(--brand); }
.sl-bento-label { font-size: 20px; font-weight: 700; letter-spacing: 1px; color: var(--brand); text-transform: uppercase; }
.sl-bento-title { font-size: 28px; font-weight: 700; color: var(--fg-strong); margin: 0; }

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

/* Accent override (per-slide / per-deck blue) */
.sl[data-accent="blue"] {
  --brand: var(--blue-500);
  --brand-tint: var(--blue-50);
  --bg-brand-tint: var(--blue-50);
  --bg-hero-gradient: linear-gradient(#FFFFFF 0%, #E6F1FF 100%);
}
`;
