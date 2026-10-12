/**
 * Phase 5 — runtime gates (definition of done, part 2).
 *
 *   npm run build && npm start               # one terminal
 *   npm run verify:runtime [-- http://localhost:3000]
 *
 * Each gate reports PASS, FAIL or UNVERIFIED. UNVERIFIED means the gate
 * cannot be decided on this machine (e.g. no GPU) — it is never counted as a
 * pass. Exits non-zero on any FAIL.
 *
 * Browser: set CHROMIUM_PATH, or let playwright-core find an installed Chromium.
 */

import { readFileSync, writeFileSync, mkdtempSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { pathToFileURL } from "node:url";
import { chromium } from "playwright-core";
import ts from "typescript";

const BASE = (process.argv[2] ?? "http://localhost:3000").replace(/\/$/, "");
const ROOT = new URL("..", import.meta.url).pathname;
const results = [];
const gate = (name, status, detail = "") => results.push({ name, status, detail });
const pass = (name, ok, detail) => gate(name, ok ? "PASS" : "FAIL", detail);

/** Dependency noise that is not ours (documented in CLAUDE.md). */
const KNOWN_NOISE = /THREE\.Clock|GPU stall due to ReadPixels/;

const tmp = mkdtempSync(join(tmpdir(), "verify-rt-"));
async function loadTs(rel) {
  const src = readFileSync(join(ROOT, rel), "utf8");
  const out = ts.transpileModule(src, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
  const file = join(tmp, rel.replace(/[\\/]/g, "_") + ".mjs");
  writeFileSync(file, out);
  return import(pathToFileURL(file).href);
}

const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || undefined,
  args: ["--enable-unsafe-webgpu", "--ignore-gpu-blocklist"],
});
const consoleIssues = [];

async function open(path, ctxOpts = {}) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, ...ctxOpts });
  const page = await ctx.newPage();
  page.on("console", (m) => {
    if ((m.type() === "error" || m.type() === "warning") && !KNOWN_NOISE.test(m.text())) consoleIssues.push(`${path} ${m.type()}: ${m.text().slice(0, 160)}`);
  });
  page.on("pageerror", (e) => consoleIssues.push(`${path} pageerror: ${e.message.slice(0, 160)}`));
  page.on("response", (r) => r.status() >= 400 && consoleIssues.push(`${path} ${r.status()} ${r.url()}`));
  await page.goto(BASE + path, { waitUntil: "load" });
  return { ctx, page };
}

const wrapperState = (page) =>
  page.evaluate(() => {
    const w = document.querySelector("[data-tier]");
    // Target opacity (inline style): on a slow renderer the CSS transition can
    // still be mid-way when sampled, which says nothing about the site.
    return { tier: w?.getAttribute("data-tier") ?? null, backend: w?.getAttribute("data-backend") ?? null, opacity: w ? w.style.opacity : null, canvas: !!document.querySelector("canvas") };
  });

/* ── tiers ────────────────────────────────────────────────────────────── */

for (const tier of ["full", "lite"]) {
  const { ctx, page } = await open(`/?tier=${tier}`);
  await page.waitForFunction(() => document.querySelector("[data-tier]")?.getAttribute("data-backend"), null, { timeout: 60_000 }).catch(() => {});
  await page.waitForFunction(() => document.querySelector("[data-tier]")?.style.opacity === "1", null, { timeout: 60_000 }).catch(() => {});
  const s = await wrapperState(page);
  pass(`tier ${tier.toUpperCase()} renders`, s.canvas && s.tier === tier.toUpperCase() && s.opacity === "1", JSON.stringify(s));
  await ctx.close();
}
{
  const { ctx, page } = await open("/?tier=static");
  await page.waitForTimeout(3000);
  const s = await page.evaluate(() => ({ canvas: !!document.querySelector("canvas"), sections: document.querySelectorAll("[data-static-scene]").length }));
  pass("tier STATIC renders (no canvas, 5 sections)", !s.canvas && s.sections === 5, JSON.stringify(s));
  await ctx.close();
}

/* ── backends ─────────────────────────────────────────────────────────── */

{
  const { ctx, page } = await open("/?tier=full&backend=webgl");
  await page.waitForFunction(() => document.querySelector("[data-tier]")?.getAttribute("data-backend"), null, { timeout: 60_000 }).catch(() => {});
  const s = await wrapperState(page);
  pass("backend WebGL2 renders (?backend=webgl)", s.backend === "webgl" && s.canvas, JSON.stringify(s));
  await ctx.close();
}
{
  const { ctx, page } = await open("/?tier=full");
  await page.waitForFunction(() => document.querySelector("[data-tier]")?.getAttribute("data-backend"), null, { timeout: 60_000 }).catch(() => {});
  const s = await wrapperState(page);
  const ua = await page.evaluate(() => navigator.userAgent.match(/Chrome\/[\d.]+/)?.[0] ?? navigator.userAgent);
  if (s.backend === "webgpu") gate("backend WebGPU renders", "PASS", ua);
  else gate("backend WebGPU renders", "UNVERIFIED", `${ua}: WebGPU unavailable or rejected here; fell back to ${s.backend} (verify in current desktop Chrome)`);
  await ctx.close();
}

/* ── reduced motion ───────────────────────────────────────────────────── */

{
  const { ctx, page } = await open("/", { reducedMotion: "reduce" });
  await page.waitForTimeout(3000);
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight / 2));
  await page.waitForTimeout(1500);
  const s = await page.evaluate(() => ({
    canvas: !!document.querySelector("canvas"),
    splitLines: document.querySelectorAll(".split-line").length,
    movedLayers: [...document.querySelectorAll("[data-parallax]")].filter((e) => getComputedStyle(e).transform !== "none").length,
  }));
  pass("reduced motion: no camera travel, no auto animation", !s.canvas && !s.splitLines && !s.movedLayers, JSON.stringify(s));
  await ctx.close();
}

/* ── LCP (mobile, throttled like Lighthouse's slow 4G + 4× CPU) ──────── */

{
  const ctx = await browser.newContext({ viewport: { width: 412, height: 823 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  const cdp = await ctx.newCDPSession(page);
  await cdp.send("Network.enable");
  await cdp.send("Network.emulateNetworkConditions", { offline: false, latency: 150, downloadThroughput: (1.6 * 1024 * 1024) / 8, uploadThroughput: (750 * 1024) / 8 });
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
  await page.addInitScript(() => {
    window.__lcp = null;
    new PerformanceObserver((list) => {
      const e = list.getEntries().at(-1);
      window.__lcp = { time: Math.round(e.startTime), tag: e.element?.tagName ?? "?", text: (e.element?.textContent ?? "").trim().slice(0, 40) };
    }).observe({ type: "largest-contentful-paint", buffered: true });
  });
  await page.goto(BASE + "/", { waitUntil: "load" });
  await page.waitForTimeout(4000);
  const lcp = await page.evaluate(() => window.__lcp);
  pass("LCP element is DOM text, < 2.5 s (mobile, throttled)", !!lcp && lcp.tag !== "CANVAS" && lcp.time < 2500, JSON.stringify(lcp));
  await ctx.close();
}

/* ── frame rate ───────────────────────────────────────────────────────── */

{
  const { ctx, page } = await open("/?tier=full");
  await page.waitForTimeout(8000);
  const fps = await page.evaluate(
    () =>
      new Promise((resolve) => {
        let n = 0;
        const t0 = performance.now();
        const step = () => (++n, performance.now() - t0 < 3000 ? requestAnimationFrame(step) : resolve(Math.round((n / (performance.now() - t0)) * 1000)));
        requestAnimationFrame(step);
      }),
  );
  const renderer = await page.evaluate(() => {
    const gl = document.createElement("canvas").getContext("webgl2");
    const ext = gl?.getExtension("WEBGL_debug_renderer_info");
    return ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : "unknown";
  });
  const software = /swiftshader|llvmpipe|software/i.test(renderer);
  const { post } = await loadTs("src/content/content.ts").catch(() => ({ post: { fpsFloor: 50 } }));
  if (software) gate(`FULL holds ≥ fps_floor (${post?.fpsFloor ?? 50})`, "UNVERIFIED", `${fps} fps on software GL (${renderer}) — measure on the reference machine`);
  else pass(`FULL holds ≥ fps_floor (${post?.fpsFloor ?? 50})`, fps >= (post?.fpsFloor ?? 50), `${fps} fps on ${renderer}`);
  await ctx.close();
}

/* ── audio ────────────────────────────────────────────────────────────── */

{
  const src = readFileSync(join(ROOT, "src/engine/audio/AudioManager.tsx"), "utf8");
  const exact = src.includes("if (!(audio.enabled && audio.ambientSrc)) return null;");
  const { ctx, page } = await open("/?tier=full");
  await page.waitForTimeout(4000);
  const s = await page.evaluate(() => ({ audioEls: document.querySelectorAll("audio").length, playing: [...document.querySelectorAll("audio")].some((a) => !a.paused) }));
  pass("audio: mount condition is enabled && ambientSrc; silent until a gesture", exact && !s.playing, JSON.stringify({ exactCondition: exact, ...s }));
  await ctx.close();
}

/* ── semantic mirror ──────────────────────────────────────────────────── */

{
  const { sv } = await loadTs("src/content/i18n/sv.ts");
  const { facts } = await loadTs("src/content/facts.ts");
  const html = await (await fetch(BASE + "/")).text();
  const main = html.match(/<main id="innehall"[\s\S]*?<\/main>/)?.[0] ?? "";
  const text = main.replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/\s+/g, " ");
  const headings = Object.values(sv.scenes).map((s) => s.heading);
  const shownFacts = ["30+", ...Object.entries(facts).filter(([, f]) => f.kind === "text").map(([, f]) => f.value)];
  const missing = [...headings, ...shownFacts].filter((v) => !text.includes(v));
  pass("semantic mirror: every heading + every visible fact", !!main && !missing.length, missing.length ? `missing: ${missing.join(", ")}` : `${headings.length} headings, ${shownFacts.length} facts`);
}

/* ── keyboard ─────────────────────────────────────────────────────────── */

{
  const { ctx, page } = await open("/?tier=full&backend=webgl");
  await page.waitForTimeout(6000);
  const describe = () =>
    page.evaluate(() => {
      const el = document.activeElement;
      if (!el || el === document.body) return { label: "body", hidden: false };
      const hidden = !!el.closest("[inert]") || getComputedStyle(el).visibility === "hidden";
      return { label: (el.textContent || el.getAttribute("aria-label") || "").trim().slice(0, 30), hidden };
    });
  const reached = [];
  let hiddenFocus = 0;
  for (let i = 0; i < 9; i++) {
    await page.keyboard.press("Tab");
    const d = await describe();
    reached.push(d.label);
    if (d.hidden) hiddenFocus++;
  }
  // Jump to the last scene with the nav, then tab to its CTA.
  await page.getByRole("link", { name: "Kontakt" }).first().click();
  await page.waitForTimeout(5000);
  await page.locator("body").focus();
  let kontaktCta = false;
  for (let i = 0; i < 14 && !kontaktCta; i++) {
    await page.keyboard.press("Tab");
    const d = await describe();
    if (d.hidden) hiddenFocus++;
    // The Kontakt panel's own CTA (below the nav), not the persistent one.
    kontaktCta = await page.evaluate(() => {
      const el = document.activeElement;
      return !!el && !el.closest("[inert]") && !el.closest("header") && (el.textContent ?? "").includes("Bli kund");
    });
  }
  await page.keyboard.press("Enter");
  // The bridge modal is lazy-loaded on first open: wait for it, not a timer.
  const dialogOpen = await page.waitForFunction(() => document.querySelector("dialog")?.open === true, null, { timeout: 60_000 }).then(() => true, () => false);
  await page.keyboard.press("Escape");
  const dialogClosed = await page.waitForFunction(() => !(document.querySelector("dialog")?.open ?? false), null, { timeout: 30_000 }).then(() => true, () => false);
  const navCta = reached.filter((l) => l.includes("Bli kund")).length >= 2;
  pass(
    "keyboard: every CTA reachable, no focus on hidden UI, dialog opens/closes",
    navCta && kontaktCta && !hiddenFocus && dialogOpen && dialogClosed,
    JSON.stringify({ navAndHeroCta: navCta, kontaktCta, hiddenFocus, dialogOpen, dialogClosed }),
  );
  await ctx.close();
}

/* ── rendered-language leakage ────────────────────────────────────────── */

{
  const EN = /\b(the|and|with|your|our|from|this|that|more|read|learn|contact|about|products|customer|loading|menu|open|close|skip|become)\b/i;
  const hits = [];
  for (const path of ["/?tier=static", "/?tier=full&backend=webgl"]) {
    const { ctx, page } = await open(path);
    await page.waitForTimeout(5000);
    const strings = await page.evaluate(() => {
      const out = [];
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      while (walker.nextNode()) {
        const t = walker.currentNode.textContent.trim();
        if (t && !walker.currentNode.parentElement.closest("script,style")) out.push(t);
      }
      document.querySelectorAll("[aria-label],[alt],[title]").forEach((e) => ["aria-label", "alt", "title"].forEach((a) => e.getAttribute(a) && out.push(e.getAttribute(a))));
      return out;
    });
    for (const s of strings) if (EN.test(s)) hits.push(`${path}: "${s.slice(0, 50)}"`);
    await ctx.close();
  }
  pass("rendered DOM: no other-language strings (sv)", !hits.length, hits.slice(0, 6).join(" ; "));
}

await browser.close();
pass("console: no errors/warnings from app code", !consoleIssues.length, consoleIssues.slice(0, 6).join(" ; "));

const width = Math.max(...results.map((r) => r.name.length));
for (const r of results) console.log(`${r.status.padEnd(10)}  ${r.name.padEnd(width)}  ${r.detail}`);
const failed = results.filter((r) => r.status === "FAIL").length;
const unverified = results.filter((r) => r.status === "UNVERIFIED").length;
console.log(`\n${results.length - failed - unverified}/${results.length} runtime gates passed, ${failed} failed, ${unverified} unverified on this machine.`);
process.exit(failed ? 1 : 0);
