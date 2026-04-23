// Inline markdown: bold, italic, code, link, br.
// Escapes HTML first, then applies inline transforms in order.

const ESC = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };

export function escapeHTML(s) {
  return String(s).replace(/[&<>"']/g, (c) => ESC[c]);
}

// Mask out fenced spans so we don't re-process their contents.
function inline(raw) {
  if (!raw) return "";
  let s = escapeHTML(raw);

  // Inline code: `code`
  const codeStash = [];
  s = s.replace(/`([^`\n]+?)`/g, (_, c) => {
    codeStash.push(c);
    return `\x00CODE${codeStash.length - 1}\x00`;
  });

  // Links: [text](url)
  s = s.replace(/\[([^\]]+?)\]\(([^)\s]+?)(?:\s+&quot;([^&]*?)&quot;)?\)/g, (_, text, url, title) => {
    const t = title ? ` title="${title}"` : "";
    return `<a href="${url}"${t}>${text}</a>`;
  });

  // Bold: **text** or __text__ (bold takes precedence over italic)
  s = s.replace(/\*\*([^*\n]+?)\*\*/g, "<strong>$1</strong>");
  s = s.replace(/__([^_\n]+?)__/g, "<strong>$1</strong>");

  // Italic: *text* or _text_
  s = s.replace(/(^|[\s(])\*([^*\n]+?)\*/g, "$1<em>$2</em>");
  s = s.replace(/(^|[\s(])_([^_\n]+?)_/g, "$1<em>$2</em>");

  // Hard break: two trailing spaces + newline, or explicit <br>
  s = s.replace(/  \n/g, "<br>\n");

  // Restore code spans
  s = s.replace(/\x00CODE(\d+)\x00/g, (_, i) => `<code>${codeStash[+i]}</code>`);

  return s;
}

// Exported as both a named fn and a default helper for convenience.
export default inline;
export { inline };
