// Static + headless verification of a built deck HTML.

import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { spawn } from "node:child_process";
import { findChrome } from "./pdf.js";

function spawnAsync(bin, args) {
  return new Promise((resolve) => {
    const p = spawn(bin, args, { stdio: ["ignore", "pipe", "pipe"] });
    let stderr = "";
    p.stderr.on("data", (d) => (stderr += d.toString()));
    p.on("error", () => resolve({ ok: false, stderr: "spawn error" }));
    p.on("close", (code) => resolve({ ok: code === 0, stderr }));
  });
}

export async function verify({ htmlPath, expectedSlides }) {
  const failures = [];
  if (!fs.existsSync(htmlPath)) return { passed: false, failures: ["output html not found"] };
  const src = fs.readFileSync(htmlPath, "utf8");

  // Static checks
  const slideMatches = src.match(/class="sl /g) || [];
  if (expectedSlides && slideMatches.length !== expectedSlides) {
    failures.push(`slide count: expected ${expectedSlides}, got ${slideMatches.length}`);
  }
  if (!/@page\s*\{\s*size:\s*1920px 1080px/.test(src)) failures.push("@page 1920×1080 missing");
  if (!/data:font\/woff2/.test(src)) failures.push("Pretendard base64 not embedded");
  const labelMatches = src.match(/data-screen-label=/g) || [];
  if (slideMatches.length !== labelMatches.length) {
    failures.push(`data-screen-label count (${labelMatches.length}) ≠ slide count (${slideMatches.length})`);
  }

  // Headless screenshot of first slide (best-effort).
  let screenshot = "";
  const chrome = findChrome();
  if (chrome) {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "design-deck-verify-"));
    screenshot = path.join(tmp, "first.png");
    const res = await spawnAsync(chrome, [
      "--headless=new",
      "--disable-gpu",
      "--hide-scrollbars",
      "--screenshot=" + screenshot,
      "--window-size=1920,1080",
      "file://" + htmlPath,
    ]);
    if (!res.ok || !fs.existsSync(screenshot)) {
      failures.push("headless screenshot failed");
      screenshot = "";
    }
  }

  return {
    passed: failures.length === 0,
    failures,
    slides: slideMatches.length,
    expectedSlides,
    screenshot,
  };
}

export function formatVerify(result) {
  const lines = [];
  if (result.passed) {
    lines.push(`✓ verify passed — ${result.slides} slides, font embedded, @page set`);
  } else {
    lines.push(`✗ verify failed`);
    for (const f of result.failures) lines.push(`    ✗ ${f}`);
  }
  if (result.screenshot) lines.push(`    📸 ${result.screenshot}`);
  return lines.join("\n");
}
