// Anti-AI-slop linter. Walks slide tokens, returns warnings array.
// Skip slides that begin with `<!-- lint: off -->`.

const EMOJI_RE = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{1FA70}-\u{1FAFF}]/u;
const FAKE_STATS_RE = /\d{3,}[+%]\s*(?:users?|customers?|uptime|happy|satisfaction|developers?)/i;
const GRADIENT_RE = /linear-gradient|radial-gradient|mesh-gradient|conic-gradient/i;
const SVG_PATH_RE = /<svg[^>]*>[\s\S]*?<path[^>]+d="[^"]*[CcSsQqTt][^"]*"[\s\S]*?<\/svg>/i;
const AI_PROMPT_SLOP_RE = /(gradient|purple|neon|cyberpunk|3d render|holographic)/i;

// Round 4 (awesome-claude-design) rules.
const BLINKING_DOT_TEXT_RE = /(?:🟢\s*LIVE|🔴\s*LIVE|pulse[-_ ]?dot|blinking[-_ ]?dot)/i;
const BLINKING_DOT_DIRECTIVE_RE = /^chip$/i;
const BLINKING_DOT_DIRECTIVE_VAL_RE = /\b(?:live|pulse|blinking)\b/i;
// Claude Design default teal accent. Anchor at #16d5e6 in HSL space ≈ (185°, 84%, 50%).
// We flag any accent within ±20° hue and saturation/lightness > 50%.
const TEAL_HEX_RE = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i;
const ICON_STACK_THRESHOLD = 3;
const GENERIC_ICON_NAMES = new Set(["arrow-right", "check", "x"]); // chain/process default; ignore.

function walk(tokens, fn) {
  for (const t of tokens || []) {
    fn(t);
    if (t && t.tokens) walk(t.tokens, fn);
  }
}

function textOf(t) {
  if (!t) return "";
  if (t.type === "paragraph") return t.text || "";
  if (t.type === "heading") return t.text || "";
  if (t.type === "list") return (t.items || []).join(" ");
  if (t.type === "quote") return t.text || "";
  if (t.type === "codefence") return ""; // never lint code
  return "";
}

// ---- Round 4 helpers --------------------------------------------------------

function hexToHsl(hex) {
  const m = TEAL_HEX_RE.exec(hex.trim());
  if (!m) return null;
  let h = m[1];
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let s = 0;
  let hue = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) hue = ((g - b) / d + (g < b ? 6 : 0)) * 60;
    else if (max === g) hue = ((b - r) / d + 2) * 60;
    else hue = ((r - g) / d + 4) * 60;
  }
  return { h: hue, s, l };
}

function isTealLike(accent) {
  if (!accent || typeof accent !== "string") return false;
  const named = accent.toLowerCase().trim();
  if (named === "teal" || named === "cyan") return true;
  const hsl = hexToHsl(accent);
  if (!hsl) return false;
  // Claude Design default #16d5e6 → h≈186, s≈0.83, l≈0.5
  const hueDiff = Math.min(Math.abs(hsl.h - 186), 360 - Math.abs(hsl.h - 186));
  return hueDiff <= 20 && hsl.s >= 0.5 && hsl.l >= 0.35 && hsl.l <= 0.7;
}

function collectIconUsage(slides) {
  // Map<iconName, Set<slideIndex>>
  const usage = new Map();
  for (const s of slides) {
    if (s.directives.lint === "off") continue;
    walk(s.tokens, (t) => {
      if (!t || t.type !== "fence") return;
      if (t.name !== "card") return;
      const variant = (t.variant || "").trim().split(/\s+/)[0];
      if (!variant || variant === "highlight") return;
      if (GENERIC_ICON_NAMES.has(variant)) return;
      let set = usage.get(variant);
      if (!set) { set = new Set(); usage.set(variant, set); }
      set.add(s.index);
    });
  }
  return usage;
}

// ---- Public API -------------------------------------------------------------

export function lintDeck(slides, opts = {}) {
  const warnings = [];
  for (const s of slides) {
    if (s.directives.lint === "off") continue;
    walk(s.tokens, (t) => {
      const text = textOf(t);
      if (text && EMOJI_RE.test(text)) {
        warnings.push({ slide: s.index + 1, rule: "no-emoji", text: text.slice(0, 60) });
      }
      if (text && FAKE_STATS_RE.test(text)) {
        warnings.push({ slide: s.index + 1, rule: "no-data-slop", text: text.slice(0, 60) });
      }
      if (text && GRADIENT_RE.test(text)) {
        warnings.push({ slide: s.index + 1, rule: "no-gradient", text: text.slice(0, 60) });
      }
      if (t && t.type === "paragraph" && SVG_PATH_RE.test(t.text || "")) {
        warnings.push({ slide: s.index + 1, rule: "no-svg-imagery", text: "inline SVG with curve paths detected" });
      }
      if (t && t.type === "image" && t.isAI && AI_PROMPT_SLOP_RE.test(t.prompt || "")) {
        warnings.push({ slide: s.index + 1, rule: "ai-prompt-slop", text: t.prompt });
      }
      // R6: blinking status dot — text patterns + directive
      if (text && BLINKING_DOT_TEXT_RE.test(text)) {
        warnings.push({ slide: s.index + 1, rule: "no-blinking-dot", text: text.slice(0, 60) });
      }
      if (t && t.type === "directive" && BLINKING_DOT_DIRECTIVE_RE.test(t.name) && BLINKING_DOT_DIRECTIVE_VAL_RE.test(String(t.value || ""))) {
        warnings.push({ slide: s.index + 1, rule: "no-blinking-dot", text: `<!-- chip: ${t.value} -->` });
      }
    });
    // Per-slide chip directive (top of slide)
    if (s.directives.chip && BLINKING_DOT_DIRECTIVE_VAL_RE.test(String(s.directives.chip))) {
      warnings.push({ slide: s.index + 1, rule: "no-blinking-dot", text: `<!-- chip: ${s.directives.chip} -->` });
    }
  }

  // R7: no-teal-default — check brand accent
  const accent = opts.accent || "";
  if (accent && isTealLike(accent)) {
    warnings.push({ slide: 0, rule: "no-teal-default", text: `accent ${accent} ≈ Claude Design default teal #16d5e6` });
  }

  // R8: no-icon-stack — same icon reused across ≥3 slides
  const usage = collectIconUsage(slides);
  for (const [name, slideSet] of usage) {
    if (slideSet.size >= ICON_STACK_THRESHOLD) {
      warnings.push({
        slide: Array.from(slideSet).sort((a, b) => a - b)[0] + 1,
        rule: "no-icon-stack",
        text: `icon "${name}" repeats across ${slideSet.size} slides`,
      });
    }
  }

  return warnings;
}

export function formatWarnings(warnings) {
  if (!warnings.length) return "✓ lint clean";
  const grouped = {};
  for (const w of warnings) (grouped[w.rule] ||= []).push(w);
  const lines = [];
  for (const rule of Object.keys(grouped)) {
    lines.push(`  ⚠ ${rule} (${grouped[rule].length})`);
    for (const w of grouped[rule].slice(0, 5)) lines.push(`      slide ${w.slide}: ${w.text}`);
    if (grouped[rule].length > 5) lines.push(`      ... +${grouped[rule].length - 5} more`);
  }
  return lines.join("\n");
}
