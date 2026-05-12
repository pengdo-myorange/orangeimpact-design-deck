// visual-router: classify each slide into the best visual treatment.
//
// Categories:
//   - "chart"           : numeric data ≥4 points → existing chart layout
//   - "process"         : sequence of steps ≥3 → existing process/timeline
//   - "bento"           : 4–9 parallel highlights
//   - "infographic"     : data/process complex enough to warrant a NotebookLM
//                        infographic (semi-manual handoff via notebooklm-bridge)
//   - "concept-image"   : abstract/metaphor body → gpt-image-2 generated image
//   - "content"         : plain text suffices
//
// The router never *forces* a layout change — it returns a recommendation.
// build.js consumes recommendations only for slides whose explicit `layout:`
// directive is `auto` (or absent on body slides without a deliberate choice).

const ABSTRACT_KEYWORDS = [
  "윤리", "책임", "신뢰", "변화", "미래", "공감", "의미", "존재", "관계",
  "가치", "본질", "이해", "마음", "감정", "기억", "감각", "정체성",
  "자유", "선택", "지혜", "두려움", "용기", "성찰",
];

const METAPHOR_PATTERNS = [
  /~처럼\b/, /\b마치\b/, /\b비유하자면\b/, /\b마치 ~ 같\b/,
  /처럼\s/, /같은\s/,
];

const NUMERIC_RE = /(\d{1,3}(?:,\d{3})*|\d+(?:\.\d+)?)\s*(?:%|건|명|개|점|달러|원|시간|분|초)?/g;

function collectText(tokens) {
  const out = [];
  const walk = (ts) => {
    for (const t of ts || []) {
      if (t.type === "heading" || t.type === "paragraph") out.push(t.text || "");
      else if (t.type === "list") out.push((t.items || []).join(" "));
      else if (t.type === "quote") out.push(t.text || "");
      if (t.tokens) walk(t.tokens);
    }
  };
  walk(tokens);
  return out.join("\n");
}

function countDataPoints(text) {
  const matches = text.match(NUMERIC_RE) || [];
  return matches.filter((m) => {
    const n = parseFloat(m.replace(/,/g, ""));
    return !Number.isNaN(n) && n !== 0;
  }).length;
}

function countProcessSteps(slide) {
  const lists = (slide.tokens || []).filter((t) => t.type === "list" && t.ordered);
  const longest = lists.reduce((m, l) => Math.max(m, (l.items || []).length), 0);
  return longest;
}

function hasMetaphor(text) {
  return METAPHOR_PATTERNS.some((re) => re.test(text));
}

function abstractRatio(text) {
  if (!text) return 0;
  const total = text.replace(/\s+/g, " ").length;
  if (total < 30) return 0;
  let hits = 0;
  for (const kw of ABSTRACT_KEYWORDS) {
    const re = new RegExp(kw, "g");
    const m = text.match(re);
    if (m) hits += m.length;
  }
  return Math.min(1, (hits * 10) / Math.max(1, total / 50));
}

// Classify a single slide. Returns { recommended, reasons }.
export function classifySlide(slide) {
  const explicit = (slide.directives && slide.directives.layout) || "";
  if (explicit && explicit !== "auto") {
    return { recommended: explicit, reasons: ["explicit layout directive"], explicit: true };
  }
  // Cover / structural slides — keep author intent.
  if (["title", "section-divider", "closing", "toc", "part-cover", "statement"].includes(slide.layout)) {
    return { recommended: slide.layout, reasons: ["structural"], explicit: true };
  }

  const text = collectText(slide.tokens);
  const dataPoints = countDataPoints(text);
  const stepCount = countProcessSteps(slide);
  const metaphor = hasMetaphor(text);
  const absRatio = abstractRatio(text);
  const reasons = [];

  // Infographic candidate (NotebookLM handoff) — rich data or rich process.
  if (dataPoints >= 6 || stepCount >= 5) {
    reasons.push(`data=${dataPoints}, steps=${stepCount} → NotebookLM infographic`);
    return { recommended: "infographic", reasons, explicit: false };
  }
  if (dataPoints >= 4) {
    reasons.push(`data=${dataPoints} → chart`);
    return { recommended: "chart", reasons, explicit: false };
  }
  if (stepCount >= 3) {
    reasons.push(`steps=${stepCount} → process`);
    return { recommended: "process", reasons, explicit: false };
  }
  if (metaphor || absRatio >= 0.4) {
    reasons.push(`metaphor=${metaphor}, abstract=${absRatio.toFixed(2)} → concept-image`);
    return { recommended: "concept-image", reasons, explicit: false };
  }
  reasons.push("default content");
  return { recommended: "content", reasons, explicit: false };
}

// Apply routing across all slides. Mutates slide.layout if route was implicit.
// Returns { decisions: [{slideIndex, from, to, reasons}], counts }.
export function routeDeck(slides, opts = {}) {
  const { conceptImageAuto = true, infographicAuto = true } = opts;
  const decisions = [];
  const counts = { content: 0, chart: 0, process: 0, "concept-image": 0, infographic: 0, structural: 0, other: 0 };
  for (const s of slides) {
    const before = s.layout;
    const c = classifySlide(s);
    let to = c.recommended;
    if (!conceptImageAuto && to === "concept-image") to = before;
    if (!infographicAuto && to === "infographic") to = before;
    decisions.push({ slideIndex: s.index, from: before, to, reasons: c.reasons, explicit: c.explicit });
    if (!c.explicit && to !== before) s.layout = to;
    counts[to] = (counts[to] || 0) + 1;
  }
  return { decisions, counts };
}

export const VISUAL_ROUTER_CONFIG = {
  ABSTRACT_KEYWORDS,
  METAPHOR_PATTERNS,
};

// Auto-inject AI image tokens into cover and concept-image slides that
// don't already carry an image. The prompt is derived from the slide's
// heading + first paragraph (Korean is fine — gpt-image-2 handles it).
// Sizes are tuned for the layout: cover is 16:9 full-bleed, concept is
// square half-slide.
function hasImage(slide) {
  return (slide.tokens || []).some((t) => t.type === "image");
}

function deriveCoverPrompt(slide) {
  const explicit = slide.directives && (slide.directives["cover-prompt"] || slide.directives["cover_prompt"]);
  if (explicit) return explicit;
  const headings = (slide.tokens || []).filter((t) => t.type === "heading" && t.level === 1);
  const para = (slide.tokens || []).find((t) => t.type === "paragraph");
  const parts = headings.map((h) => h.text).filter(Boolean);
  if (para && para.text) parts.push(para.text);
  // Fallback so we never send an empty prompt to the API.
  const merged = parts.join(" — ").trim();
  return merged || "minimal abstract icon, single orange shape with white accents";
}

function deriveConceptPrompt(slide) {
  const explicit = slide.directives && (slide.directives["concept-prompt"] || slide.directives["concept_prompt"]);
  if (explicit) return explicit;
  const h1 = (slide.tokens || []).find((t) => t.type === "heading" && t.level === 1);
  const para = (slide.tokens || []).find((t) => t.type === "paragraph");
  const parts = [];
  if (h1 && h1.text) parts.push(h1.text);
  if (para && para.text) parts.push(para.text.slice(0, 160));
  const merged = parts.join(" — ").trim();
  return merged || "single minimal orange icon, white accents";
}

export function injectGeneratedImages(slides, opts = {}) {
  const injected = [];
  for (const s of slides) {
    if (s.layout === "part-cover" && !hasImage(s)) {
      const prompt = deriveCoverPrompt(s);
      s.tokens = [...(s.tokens || []), {
        type: "image",
        alt: "cover",
        isAI: true,
        prompt,
        size: "1536x1024",
        style: "vector",
      }];
      injected.push({ slideIndex: s.index, kind: "cover", prompt });
    } else if (s.layout === "concept-image" && !hasImage(s)) {
      const prompt = deriveConceptPrompt(s);
      s.tokens = [...(s.tokens || []), {
        type: "image",
        alt: "concept",
        isAI: true,
        prompt,
        size: "1024x1024",
        style: "vector",
      }];
      injected.push({ slideIndex: s.index, kind: "concept", prompt });
    }
  }
  return injected;
}
