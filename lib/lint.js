// Anti-AI-slop linter. Walks slide tokens, returns warnings array.
// Skip slides that begin with `<!-- lint: off -->`.

const EMOJI_RE = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{1FA70}-\u{1FAFF}]/u;
const FAKE_STATS_RE = /\d{3,}[+%]\s*(?:users?|customers?|uptime|happy|satisfaction|developers?)/i;
const GRADIENT_RE = /linear-gradient|radial-gradient|mesh-gradient|conic-gradient/i;
const SVG_PATH_RE = /<svg[^>]*>[\s\S]*?<path[^>]+d="[^"]*[CcSsQqTt][^"]*"[\s\S]*?<\/svg>/i;
const AI_PROMPT_SLOP_RE = /(gradient|purple|neon|cyberpunk|3d render|holographic)/i;

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

export function lintDeck(slides) {
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
    });
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
