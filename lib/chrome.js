// Common slide chrome: top breadcrumb + meta, bottom source + page.
// Title/section/closing layouts auto-suppress chrome via sl-no-chrome class.

import { escapeHTML } from "./inline.js";

export const CHROME_CSS = `
.sl-chrome-top {
  position: absolute;
  top: 0; left: 0;
  /* Stop short of the right edge so the logo (top-right) has clear space */
  right: 280px;
  height: 88px;
  padding: 32px 72px 0;
  display: flex;
  justify-content: flex-start;
  align-items: center;
  gap: 16px;
  font-size: 22px;
  line-height: 1.5;
  color: var(--fg-assistive);
  font-weight: 500;
  letter-spacing: 0;
  pointer-events: none;
}
.sl-chrome-top::after {
  content: "";
  position: absolute;
  left: 72px; right: -208px;  /* extend underline back across full width */
  top: 88px;
  height: 1px;
  background: var(--border-subtle);
}
.sl-chrome-top-left {
  display: flex;
  align-items: center;
  gap: 10px;
}
.sl-chrome-top-left::before {
  content: "";
  width: 8px;
  height: 8px;
  background: var(--brand);
  border-radius: 999px;
  display: inline-block;
  flex-shrink: 0;
}
.sl-chrome-top-right {
  text-align: left;
  font-feature-settings: "tnum" 1;
  color: var(--fg-alternative);
}
.sl-chrome-top-right:not(:empty)::before {
  content: "·";
  margin-right: 14px;
  color: var(--fg-disabled);
}
.sl-chrome-bottom {
  position: absolute;
  left: 0; right: 0; bottom: 0;
  height: 64px;
  padding: 0 72px 28px;
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  font-size: 20px;
  line-height: 28px;
  color: var(--fg-assistive);
  pointer-events: none;
}
.sl-chrome-bottom-right { font-feature-settings: "tnum" 1; }

.sl-no-chrome .sl-chrome-top,
.sl-no-chrome .sl-chrome-bottom { display: none; }

.sl[data-theme="dark"] .sl-chrome-top,
.sl[data-theme="dark"] .sl-chrome-bottom { color: rgba(255,255,255,0.5); }
.sl[data-theme="dark"] .sl-chrome-top::after { background: rgba(255,255,255,0.1); }
`;

export function renderChrome(slide, ctx) {
  if (["title", "section-divider", "closing", "part-cover", "statement"].includes(slide.layout)) {
    return "";
  }
  const d = slide.directives;
  const chapter = d.chapter || ctx.fm.chapter || "";
  const meta = d.meta || ctx.autoMeta(slide) || "";
  const source = d.source || ctx.fm.source || "";
  const page = d.page || `${String(slide.index + 1).padStart(2, "0")} / ${String(ctx.total).padStart(2, "0")}`;

  const parts = [];
  if (chapter || meta) {
    parts.push(
      `<div class="sl-chrome-top">` +
        `<div class="sl-chrome-top-left">${escapeHTML(chapter)}</div>` +
        `<div class="sl-chrome-top-right">${escapeHTML(meta)}</div>` +
      `</div>`
    );
  }
  parts.push(
    `<div class="sl-chrome-bottom">` +
      `<div class="sl-chrome-bottom-left">${escapeHTML(source)}</div>` +
      `<div class="sl-chrome-bottom-right">${escapeHTML(page)}</div>` +
    `</div>`
  );
  return parts.join("\n");
}
