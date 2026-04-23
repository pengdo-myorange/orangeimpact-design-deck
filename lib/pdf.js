// HTML → PDF. Tries Playwright first (better font/network handling), falls back to system Chrome headless.

import { spawn } from "node:child_process";
import fs from "node:fs";

const CHROME_PATHS = {
  darwin: [
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
    "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
  ],
  linux: ["/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser"],
  win32: ["C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe", "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe"],
};

export function findChrome() {
  const cands = CHROME_PATHS[process.platform] || [];
  for (const p of cands) if (fs.existsSync(p)) return p;
  return null;
}

function spawnAsync(bin, args) {
  return new Promise((resolve, reject) => {
    const p = spawn(bin, args, { stdio: ["ignore", "pipe", "pipe"] });
    let stderr = "";
    p.stderr.on("data", (d) => (stderr += d.toString()));
    p.on("error", reject);
    p.on("close", (code) => (code === 0 ? resolve() : reject(new Error(`${bin} exit ${code}: ${stderr}`))));
  });
}

export async function buildPDF({ htmlPath, outPath, width = 1920, height = 1080 }) {
  // Try Playwright first.
  try {
    const mod = await import("playwright");
    const chromium = mod.chromium || mod.default?.chromium;
    if (!chromium) throw new Error("playwright loaded but no chromium export");
    const browser = await chromium.launch();
    const ctx = await browser.newContext({ viewport: { width, height } });
    const page = await ctx.newPage();
    await page.goto("file://" + htmlPath, { waitUntil: "networkidle" }).catch(() => page.goto("file://" + htmlPath));
    await page.waitForTimeout(1500);
    await page.emulateMedia({ media: "print" });
    await page.pdf({
      path: outPath,
      width: width + "px",
      height: height + "px",
      printBackground: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
      preferCSSPageSize: true,
    });
    await browser.close();
    return { engine: "playwright" };
  } catch (e) {
    if (process.env.DEBUG) console.warn("[design-deck] playwright unavailable:", e.message);
  }

  const chrome = findChrome();
  if (!chrome) throw new Error("PDF: Playwright not installed and Chrome not found. `npm i playwright` or install Chrome.");
  await spawnAsync(chrome, [
    "--headless=new",
    "--disable-gpu",
    "--no-pdf-header-footer",
    "--virtual-time-budget=8000",
    "--print-to-pdf=" + outPath,
    "--print-to-pdf-no-header",
    "file://" + htmlPath,
  ]);
  return { engine: "chrome-headless" };
}
