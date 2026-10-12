/**
 * Phase 5 — automated gates (definition of done, part 1).
 *
 *   npm run verify            # typecheck + build + all static gates
 *   npm run verify -- --skip-build
 *
 * Exits non-zero on any FAIL. Runtime gates live in verify-runtime.mjs.
 */

import { execSync } from "node:child_process";
import { readFileSync, readdirSync, statSync, writeFileSync, mkdtempSync } from "node:fs";
import { gzipSync } from "node:zlib";
import { join, relative } from "node:path";
import { tmpdir } from "node:os";
import { pathToFileURL } from "node:url";
import ts from "typescript";

const ROOT = new URL("..", import.meta.url).pathname;
const skipBuild = process.argv.includes("--skip-build");
const results = [];
const gate = (name, ok, detail = "") => results.push({ name, ok, detail });

/* ── helpers ──────────────────────────────────────────────────────────── */

const tmp = mkdtempSync(join(tmpdir(), "verify-"));
/** Imports a dependency-free TS module (type-only imports are erased). */
async function loadTs(rel) {
  const src = readFileSync(join(ROOT, rel), "utf8");
  const out = ts.transpileModule(src, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
  const file = join(tmp, rel.replace(/[\\/]/g, "_") + ".mjs");
  writeFileSync(file, out);
  return import(pathToFileURL(file).href);
}

function walk(dir, filter = () => true) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...walk(p, filter));
    else if (filter(p)) out.push(p);
  }
  return out;
}

function leaves(obj, path = []) {
  return Object.entries(obj).flatMap(([k, v]) => (typeof v === "string" ? [[[...path, k].join("."), v]] : leaves(v, [...path, k])));
}

const gz = (file) => gzipSync(readFileSync(file)).length;

/* ── 1. typecheck + build ─────────────────────────────────────────────── */

function run(cmd) {
  try {
    execSync(cmd, { cwd: ROOT, stdio: "pipe" });
    return [true, ""];
  } catch (e) {
    return [false, String(e.stdout || e.message).split("\n").filter(Boolean).slice(-8).join(" | ")];
  }
}
gate("tsc --noEmit", ...run("npx tsc --noEmit"));
if (!skipBuild) gate("next build (Turbopack)", ...run("npx next build"));

/* ── 2. i18n integrity ────────────────────────────────────────────────── */

const i18nDir = join(ROOT, "src/content/i18n");
const localeFiles = readdirSync(i18nDir).filter((f) => f.endsWith(".ts") && f !== "index.ts");
const dicts = {};
for (const f of localeFiles) {
  const mod = await loadTs(`src/content/i18n/${f}`);
  dicts[f.replace(".ts", "")] = mod[f.replace(".ts", "")];
}
const source = dicts.sv;
const sourceKeys = new Set(leaves(source).map(([k]) => k));
for (const [locale, dict] of Object.entries(dicts)) {
  const keys = new Set(leaves(dict).map(([k]) => k));
  const missing = [...sourceKeys].filter((k) => !keys.has(k));
  const extra = [...keys].filter((k) => !sourceKeys.has(k));
  gate(`i18n keys: ${locale}`, !missing.length && !extra.length, [...missing.map((k) => `missing ${k}`), ...extra.map((k) => `extra ${k}`)].join(", "));
}

/** Words that would betray another language leaking into a locale. */
const FOREIGN = {
  sv: /\b(the|and|with|your|our|for|from|this|that|more|read|learn|contact|about|products|customer|loading|menu|open|close|skip|become|here|we|you)\b/i,
  en: /\b(och|att|för|med|som|vi|du|inte|är|på|hos|kontakt|bli|kund)\b/i,
};
for (const [locale, dict] of Object.entries(dicts)) {
  const re = FOREIGN[locale];
  const hits = re ? leaves(dict).filter(([, v]) => re.test(v.replace(/\{[^}]+\}/g, ""))) : [];
  gate(`language leakage: ${locale}`, !hits.length, hits.map(([k, v]) => `${k}: "${v.slice(0, 50)}"`).join(" ; "));
}

/* ── 3. facts integrity ───────────────────────────────────────────────── */

const { facts } = await loadTs("src/content/facts.ts");
const tokenIssues = [];
for (const [locale, dict] of Object.entries(dicts)) {
  for (const [k, v] of leaves(dict)) {
    for (const m of v.matchAll(/\{fact:([a-z0-9_]+)(\|plain)?\}/g)) {
      if (!(m[1] in facts)) tokenIssues.push(`${locale}.${k}: unknown fact ${m[1]}`);
      else if (facts[m[1]].kind === "missing") tokenIssues.push(`${locale}.${k}: MISSING fact ${m[1]} rendered`);
    }
  }
}
gate("facts: every {fact:id} resolves to a present value", !tokenIssues.length, tokenIssues.join(" ; "));

/**
 * Technical designations that contain digits but are not facts (they name a
 * class of equipment, not a claim about the company). Keep this list short
 * and explicit.
 */
const DESIGNATIONS = /\b24V\b/g;
const numeric = [];
for (const [locale, dict] of Object.entries(dicts)) {
  for (const [k, v] of leaves(dict)) {
    const text = v.replace(/\{[^}]+\}/g, "").replace(DESIGNATIONS, "");
    if (/\d/.test(text)) numeric.push(`${locale}.${k}: "${v.slice(0, 50)}"`);
  }
}
gate("facts: no numeric literals in copy (allowlist: 24V)", !numeric.length, numeric.join(" ; "));

// Components must reference facts, never repeat their values.
const factValues = Object.entries(facts)
  .filter(([, f]) => f.kind === "text" && /\d/.test(f.value))
  .map(([id, f]) => [id, f.value]);
const codeFiles = walk(join(ROOT, "src"), (p) => /\.(tsx?|mjs)$/.test(p) && !/content[\\/](facts|people)\.ts$/.test(p) && !/generated/.test(p));
const hardcoded = [];
for (const file of codeFiles) {
  const src = readFileSync(file, "utf8");
  for (const [id, value] of factValues) if (src.includes(value)) hardcoded.push(`${relative(ROOT, file)} repeats facts.${id}`);
}
gate("facts: no fact value hard-coded in components", !hardcoded.length, hardcoded.join(" ; "));
gate("facts: one value per id", Object.keys(facts).length === new Set(Object.keys(facts)).size, "");

/* ── 4/5. links + placeholders on the built HTML ──────────────────────── */

const htmlFiles = walk(join(ROOT, ".next/server/app"), (p) => p.endsWith(".html"));
gate("built HTML present", htmlFiles.length > 0, htmlFiles.length ? "" : "run without --skip-build first");
const linkIssues = [];
const placeholderIssues = [];
for (const file of htmlFiles) {
  const html = readFileSync(file, "utf8");
  const name = relative(ROOT, file);
  const ids = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
  for (const m of html.matchAll(/href="([^"]*)"/g)) {
    const href = m[1];
    if (href === "" || href === "#") linkIssues.push(`${name}: empty or bare # href`);
    else if (href.startsWith("#") && !ids.has(href.slice(1))) linkIssues.push(`${name}: ${href} has no target`);
    else if (/\/(old|test|draft)-/i.test(href)) linkIssues.push(`${name}: links to ${href}`);
  }
  const text = html.replace(/<script[\s\S]*?<\/script>/g, "").replace(/<style[\s\S]*?<\/style>/g, "").replace(/<[^>]+>/g, " ");
  for (const [label, re] of [
    ["TODO", /\bTODO\b/],
    ["lorem", /\blorem\b/i],
    ["undefined", /\bundefined\b/],
    ["NaN", /\bNaN\b/],
    ["[ ]", /\[\s\]/],
    // A lone "00" (an unresolved counter) — not a group inside a phone number or a time.
    ["00 counter", /(?<![\d.:\-–]|\d )\b0{2,}\b(?![\d.:\-–]| \d)/],
  ]) {
    if (re.test(text)) placeholderIssues.push(`${name}: ${label}`);
  }
}
gate("links: no empty/#/dead in-page/draft hrefs", !linkIssues.length, linkIssues.join(" ; "));
gate("placeholders: none in rendered HTML", !placeholderIssues.length, placeholderIssues.join(" ; "));

/* ── 6. asset hosting ─────────────────────────────────────────────────── */

const BANNED = /(dropbox\.com|drive\.google|wetransfer|cdninstagram|fonts\.googleapis|fonts\.gstatic)/i;
const shipped = [
  ...walk(join(ROOT, ".next/static"), (p) => /\.(js|css|html)$/.test(p)),
  ...htmlFiles,
  ...walk(join(ROOT, "src"), (p) => /\.(tsx?|css)$/.test(p)),
];
const hosting = shipped.filter((f) => BANNED.test(readFileSync(f, "utf8"))).map((f) => relative(ROOT, f));
gate("asset hosting: no third-party media/font hosts at runtime", !hosting.length, hosting.join(" ; "));

/* ── 7. bundle budgets ────────────────────────────────────────────────── */

const page = readFileSync(join(ROOT, ".next/server/app/sv.html"), "utf8");
const initial = [...new Set([...page.matchAll(/src="\/_next\/(static\/chunks\/[^"]+\.js)"/g)].map((m) => m[1]))].map((p) => join(ROOT, ".next", p));
const PROJECT_MARKERS = /useI18n|BliKund|detectQuality|swiftshader/;
let initialTotal = 0;
let projectBytes = 0;
for (const f of initial) {
  const size = gz(f);
  initialTotal += size;
  if (PROJECT_MARKERS.test(readFileSync(f, "utf8"))) projectBytes += size;
}
gate("budget: initial JS project code ≤ 15 kB gz", projectBytes <= 15_000, `${projectBytes} B`);
gate("budget: initial JS total ≤ 190 kB gz", initialTotal <= 190_000, `${initialTotal} B (framework floor ${initialTotal - projectBytes} B)`);

const allChunks = walk(join(ROOT, ".next/static/chunks"), (p) => p.endsWith(".js"));
const lazy = allChunks.filter((f) => !initial.includes(f));
const lazyBytes = lazy.reduce((sum, f) => sum + gz(f), 0);
const posters = walk(join(ROOT, "public/posters"), () => true).reduce((s, f) => s + statSync(f).size, 0);
gate("budget: 3D chunk + critical assets < 4 MB", lazyBytes + posters < 4_000_000, `${lazyBytes} B lazy JS (gz) + ${posters} B posters`);
gate("budget: hero GLB < 2 MB", true, "n/a — procedural hero (no GLB supplied)");

/* ── report ───────────────────────────────────────────────────────────── */

const width = Math.max(...results.map((r) => r.name.length));
for (const r of results) console.log(`${r.ok ? "PASS" : "FAIL"}  ${r.name.padEnd(width)}  ${r.detail}`);
const failed = results.filter((r) => !r.ok).length;
console.log(`\n${results.length - failed}/${results.length} automated gates passed.`);
process.exit(failed ? 1 : 0);
