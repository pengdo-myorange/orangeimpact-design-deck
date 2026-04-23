// Markdown parser: front-matter, slide splitting, directives, fenced blocks.

export function parseDeck(src) {
  const { frontMatter, body } = extractFrontMatter(src);
  const slideRawList = splitSlides(body);
  const slides = slideRawList.map((raw, i) => parseSlide(raw, i));
  return { frontMatter, slides };
}

function extractFrontMatter(src) {
  // Must match `---\n...\n---` at the very top.
  const m = src.match(/^---\s*\n([\s\S]*?)\n---\s*\n?/);
  if (!m) return { frontMatter: {}, body: src };
  const frontMatter = parseYAMLish(m[1]);
  return { frontMatter, body: src.slice(m[0].length) };
}

// Minimal YAML: key: value, one per line, quotes optional.
function parseYAMLish(s) {
  const out = {};
  for (const line of s.split("\n")) {
    const m = line.match(/^\s*([A-Za-z_][\w-]*)\s*:\s*(.+?)\s*$/);
    if (!m) continue;
    let v = m[2];
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    out[m[1]] = v;
  }
  return out;
}

function splitSlides(body) {
  // Split on lines that are exactly `---` (no leading/trailing content).
  const parts = [];
  let buf = [];
  for (const line of body.split("\n")) {
    if (/^---\s*$/.test(line)) {
      parts.push(buf.join("\n"));
      buf = [];
    } else {
      buf.push(line);
    }
  }
  if (buf.length) parts.push(buf.join("\n"));
  return parts.map((s) => s.replace(/^\n+/, "").replace(/\n+$/, "")).filter((s) => s.length);
}

function parseSlide(raw, index) {
  // Collect leading HTML-comment directives
  const directives = {};
  const lines = raw.split("\n");
  let i = 0;
  while (i < lines.length) {
    const ln = lines[i].trim();
    if (!ln) { i++; continue; }
    const m = ln.match(/^<!--\s*([a-zA-Z_-]+)\s*:\s*(.+?)\s*-->$/);
    if (!m) break;
    let val = m[2];
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    directives[m[1].toLowerCase()] = val;
    i++;
  }
  // Also allow directives to appear anywhere with `<!-- highlight -->` (boolean flags)
  const rest = lines.slice(i).join("\n");
  const layout = (directives.layout || "content").toLowerCase();

  // Parse block structure (fenced :::, ```, etc.) into tokens.
  const tokens = tokenize(rest);

  return {
    index,
    raw,
    layout,
    directives,
    tokens,
  };
}

// Tokenize slide body into a flat array of block tokens.
// Token types:
//   { type: 'heading', level, text }
//   { type: 'paragraph', text }
//   { type: 'list', ordered, items: [text] }
//   { type: 'quote', text, attribution }
//   { type: 'image', alt, url, title, isAI?, prompt?, size?, style? }
//   { type: 'fence', name, variant, content }   // :::name variant ... :::
//   { type: 'codefence', lang, variant, content }  // ```lang variant ... ```
//   { type: 'hr' }
//   { type: 'directive', name, value }  // inline <!-- foo: bar --> between blocks
export function tokenize(src) {
  const tokens = [];
  const lines = src.split("\n");
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const trim = line.trim();

    if (!trim) { i++; continue; }

    // Fenced block :::name [variant] ... :::
    const fenceOpen = trim.match(/^:::([\w-]+)(?:\s+(.+))?$/);
    if (fenceOpen) {
      const name = fenceOpen[1];
      const variant = fenceOpen[2] || "";
      const bufBody = [];
      i++;
      let depth = 1;
      while (i < lines.length) {
        const t = lines[i].trim();
        if (/^:::\s*$/.test(t)) {
          depth--;
          if (depth === 0) { i++; break; }
        } else if (/^:::[\w-]+/.test(t)) {
          depth++;
        }
        bufBody.push(lines[i]);
        i++;
      }
      tokens.push({
        type: "fence",
        name,
        variant,
        content: bufBody.join("\n"),
        tokens: tokenize(bufBody.join("\n")),
      });
      continue;
    }

    // Code fence ```lang [variant]
    const codeOpen = trim.match(/^```(\S+)?(?:\s+(.+))?$/);
    if (codeOpen) {
      const lang = codeOpen[1] || "";
      const variant = codeOpen[2] || "";
      const buf = [];
      i++;
      while (i < lines.length) {
        if (/^```\s*$/.test(lines[i].trim())) { i++; break; }
        buf.push(lines[i]);
        i++;
      }
      tokens.push({ type: "codefence", lang, variant, content: buf.join("\n") });
      continue;
    }

    // HTML comment directive between blocks
    const dirMatch = trim.match(/^<!--\s*([a-zA-Z_-]+)(?:\s*:\s*(.+?))?\s*-->$/);
    if (dirMatch) {
      tokens.push({ type: "directive", name: dirMatch[1].toLowerCase(), value: dirMatch[2] || "true" });
      i++;
      continue;
    }

    // Heading
    const h = trim.match(/^(#{1,6})\s+(.+?)\s*$/);
    if (h) {
      tokens.push({ type: "heading", level: h[1].length, text: h[2] });
      i++;
      continue;
    }

    // Blockquote
    if (trim.startsWith(">")) {
      const qLines = [];
      while (i < lines.length && lines[i].trim().startsWith(">")) {
        qLines.push(lines[i].trim().replace(/^>\s?/, ""));
        i++;
      }
      // Check if next non-empty line is "— attribution"
      let attribution = "";
      while (i < lines.length && !lines[i].trim()) i++;
      if (i < lines.length) {
        const next = lines[i].trim();
        if (/^(?:—|--|-)\s+/.test(next)) {
          attribution = next.replace(/^(?:—|--|-)\s+/, "");
          i++;
        }
      }
      tokens.push({ type: "quote", text: qLines.join("\n"), attribution });
      continue;
    }

    // List (ordered or unordered)
    const uliMatch = trim.match(/^[-*+]\s+(.+)$/);
    const oliMatch = trim.match(/^(\d+)\.\s+(.+)$/);
    if (uliMatch || oliMatch) {
      const ordered = !!oliMatch;
      const items = [];
      while (i < lines.length) {
        const t = lines[i].trim();
        const um = t.match(/^[-*+]\s+(.+)$/);
        const om = t.match(/^\d+\.\s+(.+)$/);
        if (ordered && om) items.push(om[1]);
        else if (!ordered && um) items.push(um[1]);
        else if (!t) { i++; break; }
        else break;
        i++;
      }
      tokens.push({ type: "list", ordered, items });
      continue;
    }

    // Standalone image line — captured as its own token.
    const imgLine = trim.match(/^!\[([^\]]*)\]\(([^)]+?)(?:\s+"([^"]*)")?\)$/);
    if (imgLine) {
      tokens.push(parseImage(imgLine[1], imgLine[2], imgLine[3] || ""));
      i++;
      continue;
    }

    // Markdown table: `| c1 | c2 |` header followed by `| --- | --- |` separator
    // (optionally `:---`, `---:`, `:---:` for alignment), then data rows.
    if (trim.startsWith("|") && trim.endsWith("|")) {
      const nextTrim = i + 1 < lines.length ? lines[i + 1].trim() : "";
      if (/^\|\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?$/.test(nextTrim)) {
        const headers = trim.slice(1, -1).split("|").map((c) => c.trim());
        const aligns = nextTrim.replace(/^\|/, "").replace(/\|$/, "").split("|").map((c) => {
          const t = c.trim();
          const left = t.startsWith(":");
          const right = t.endsWith(":");
          if (left && right) return "center";
          if (right) return "right";
          return "left";
        });
        i += 2;
        const rows = [];
        while (i < lines.length) {
          const rt = lines[i].trim();
          if (!(rt.startsWith("|") && rt.endsWith("|"))) break;
          rows.push(rt.slice(1, -1).split("|").map((c) => c.trim()));
          i++;
        }
        tokens.push({ type: "table", headers, aligns, rows });
        continue;
      }
    }

    // Horizontal rule (shouldn't happen here because --- splits slides, but kept)
    if (/^\*{3,}$/.test(trim)) { tokens.push({ type: "hr" }); i++; continue; }

    // Paragraph: collect until blank line
    const pBuf = [line];
    i++;
    while (i < lines.length && lines[i].trim() && !/^(#{1,6}\s|>|:::|\`\`\`|[-*+]\s|\d+\.\s|<!--)/.test(lines[i].trim())) {
      pBuf.push(lines[i]);
      i++;
    }
    tokens.push({ type: "paragraph", text: pBuf.join("\n") });
  }
  return tokens;
}

function parseImage(alt, url, title) {
  // AI image: url looks like `ai:"prompt" size:1536x1024 style:photographic`
  const aiMatch = url.match(/^ai:(.+)$/);
  if (aiMatch) {
    const spec = aiMatch[1];
    const promptMatch = spec.match(/^"([^"]+)"/);
    const prompt = promptMatch ? promptMatch[1] : spec.trim();
    const sizeMatch = spec.match(/size:\s*(\d+x\d+)/);
    const styleMatch = spec.match(/style:\s*([A-Za-z]+)/);
    return {
      type: "image",
      alt,
      title,
      isAI: true,
      prompt,
      size: sizeMatch ? sizeMatch[1] : "1536x1024",
      style: styleMatch ? styleMatch[1] : "photographic",
    };
  }
  return { type: "image", alt, url, title, isAI: false };
}

// Collect all AI images across slides (for batch generation).
export function collectAIImages(slides) {
  const out = [];
  const walk = (tokens) => {
    for (const t of tokens) {
      if (t.type === "image" && t.isAI) out.push(t);
      if (t.tokens) walk(t.tokens);
    }
  };
  for (const s of slides) walk(s.tokens);
  return out;
}
