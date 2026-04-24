// OpenAI gpt-image-2 + SHA-256 cache. Zero deps; uses Node 18+ fetch.

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const ENDPOINT = "https://api.openai.com/v1/images/generations";
const STYLE_SUFFIX = "photographic, warm-toned, editorial light, no AI-illustration tropes, no over-saturated gradients";

export async function ensureImage({ prompt, size = "1536x1024", style = "photographic", cacheDir, apiKey }) {
  if (!cacheDir) throw new Error("cacheDir required");
  const imagesDir = path.join(cacheDir, "images");
  fs.mkdirSync(imagesDir, { recursive: true });

  const fullPrompt = `${prompt} | ${STYLE_SUFFIX}`;
  const hash = crypto.createHash("sha256").update(`${fullPrompt}|${size}|${style}`).digest("hex");
  const pngPath = path.join(imagesDir, `${hash}.png`);
  const metaPath = path.join(imagesDir, `${hash}.json`);

  if (fs.existsSync(pngPath)) {
    const buf = fs.readFileSync(pngPath);
    return { hit: true, path: pngPath, dataUrl: `data:image/png;base64,${buf.toString("base64")}` };
  }
  if (!apiKey) throw new Error("No cache hit and OPENAI_API_KEY missing");

  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: "gpt-image-2",
      prompt: fullPrompt,
      size,
      n: 1,
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`OpenAI ${res.status}: ${body.slice(0, 300)}`);
  }
  const json = await res.json();
  const b64 = json.data?.[0]?.b64_json;
  if (!b64) throw new Error("OpenAI returned no image data");
  const buf = Buffer.from(b64, "base64");
  fs.writeFileSync(pngPath, buf);
  fs.writeFileSync(metaPath, JSON.stringify({ prompt: fullPrompt, size, style, created_at: new Date().toISOString() }, null, 2));
  return { hit: false, path: pngPath, dataUrl: `data:image/png;base64,${b64}` };
}

export function clearCache(cacheDir) {
  const dir = path.join(cacheDir, "images");
  if (!fs.existsSync(dir)) return 0;
  let n = 0;
  for (const f of fs.readdirSync(dir)) {
    fs.unlinkSync(path.join(dir, f));
    n += 1;
  }
  return n;
}

export function placeholderSvg({ prompt = "AI image", size = "1536x1024" } = {}) {
  const [w, h] = size.split("x").map((n) => parseInt(n, 10) || 1024);
  const text = (prompt || "").slice(0, 80).replace(/[<>&]/g, " ");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <rect width="100%" height="100%" fill="#F0F0F0"/>
  <rect x="24" y="24" width="${w - 48}" height="${h - 48}" fill="none" stroke="#D4D4D4" stroke-width="2" stroke-dasharray="12 8"/>
  <text x="50%" y="${h / 2 - 24}" font-family="-apple-system, system-ui, sans-serif" font-size="48" font-weight="700" fill="#737373" text-anchor="middle">AI 이미지 placeholder</text>
  <text x="50%" y="${h / 2 + 32}" font-family="-apple-system, system-ui, sans-serif" font-size="24" fill="#A3A3A3" text-anchor="middle">${text}</text>
  <text x="50%" y="${h - 48}" font-family="-apple-system, system-ui, sans-serif" font-size="20" fill="#A3A3A3" text-anchor="middle">${w} × ${h}</text>
</svg>`;
  const b64 = Buffer.from(svg).toString("base64");
  return `data:image/svg+xml;base64,${b64}`;
}
