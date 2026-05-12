// notebooklm-bridge: semi-automated handoff for data/process infographics.
//
// NotebookLM has no programmatic API, so the bridge:
//   1. Detects slides routed as "infographic" (by visual-router).
//   2. Generates a NotebookLM-ready prompt per slide.
//   3. Watches `./infographics/slide-N.png` for user-supplied output.
//   4. When the PNG appears, the bridge swaps the slide into the `image`
//      layout pointing at the file so the next build picks it up.
//
// Side note: this module never auto-fetches; the user must paste the prompt
// into NotebookLM ("Visual Overview" → download PNG). Keeps us API-free.

import fs from "node:fs";
import path from "node:path";

const PROMPT_HEADER = `You are designing a single-slide infographic.
Constraints:
- Pure black background (#000000).
- Focal color: orange (#FF6F1F). Secondary color: white.
- Flat 2D vector style. No 3D, no gradients, no realistic rendering.
- No text labels other than absolutely necessary numerals/units.
- Single concept, centered composition.
- Generous negative space.

Content to visualize:
`;

function summarizeTokens(tokens) {
  const lines = [];
  const walk = (ts) => {
    for (const t of ts || []) {
      if (t.type === "heading") lines.push(`${"#".repeat(t.level)} ${t.text}`);
      else if (t.type === "paragraph") lines.push(t.text);
      else if (t.type === "list") {
        for (const it of t.items || []) lines.push(`- ${it}`);
      } else if (t.type === "quote") lines.push(`> ${t.text}`);
      if (t.tokens) walk(t.tokens);
    }
  };
  walk(tokens);
  return lines.join("\n");
}

export function buildPrompt(slide) {
  const summary = summarizeTokens(slide.tokens);
  return PROMPT_HEADER + summary.trim();
}

// Returns array of candidates [{slideIndex, prompt, expectedPath}].
// `infographicsDir` defaults to <mdDir>/infographics
export function collectCandidates(slides, opts = {}) {
  const dir = opts.infographicsDir;
  if (!dir) throw new Error("notebooklm-bridge: infographicsDir required");
  const candidates = [];
  for (const s of slides) {
    if (s.layout !== "infographic") continue;
    const expectedPath = path.join(dir, `slide-${s.index + 1}.png`);
    candidates.push({
      slideIndex: s.index,
      prompt: buildPrompt(s),
      expectedPath,
      exists: fs.existsSync(expectedPath),
    });
  }
  return candidates;
}

// For candidates whose PNG exists, rewrite the slide in-place:
//   - layout becomes "image"
//   - inject an image token pointing at the file
//   - keep the original heading as the slide title
// For candidates whose PNG is missing, the bridge leaves the layout as
// "infographic" so layouts.js can render a clear "awaiting NotebookLM" panel.
export function applyCandidates(slides, opts = {}) {
  const cands = collectCandidates(slides, opts);
  const applied = [];
  const pending = [];
  for (const c of cands) {
    const s = slides[c.slideIndex];
    if (!s) continue;
    if (c.exists) {
      // Inject image token at front; switch layout to `image`.
      s.layout = "image";
      const imgTok = { type: "image", alt: "infographic", url: c.expectedPath, title: "", isAI: false };
      // Preserve heading at position 0; image goes right after.
      const tokens = s.tokens.slice();
      const headingIdx = tokens.findIndex((t) => t.type === "heading" && t.level === 1);
      if (headingIdx >= 0) tokens.splice(headingIdx + 1, 0, imgTok);
      else tokens.unshift(imgTok);
      s.tokens = tokens;
      applied.push(c);
    } else {
      pending.push(c);
    }
  }
  return { applied, pending };
}

export function formatPendingReport(pending) {
  if (!pending.length) return "";
  const lines = [
    "",
    "📊 NotebookLM 인포그래픽 후보 — 다음 슬라이드는 인포그래픽이 이해를 돕습니다:",
    "",
  ];
  for (const c of pending) {
    lines.push(`Slide ${c.slideIndex + 1} → ${c.expectedPath}`);
    lines.push("-".repeat(60));
    lines.push(c.prompt);
    lines.push("");
  }
  lines.push("📌 위 프롬프트를 NotebookLM 의 'Visual Overview' 에 붙여 넣고");
  lines.push("   생성된 PNG 를 위 경로에 저장한 뒤 다시 빌드하면 자동 삽입됩니다.");
  lines.push("   끄려면 --no-infographic-auto.");
  return lines.join("\n");
}
