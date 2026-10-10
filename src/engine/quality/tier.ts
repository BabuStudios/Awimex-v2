/**
 * Tier and backend selection, run once on the client.
 *
 *   FULL   — capable desktop/tablet GPU, no reduced motion
 *   LITE   — mobile or low-end hardware (also reached later by the FPS monitor)
 *   STATIC — no WebGL2/WebGPU, prefers-reduced-motion, or Save-Data
 *
 * Overrides for QA: ?tier=full|lite|static and ?backend=webgl.
 * No third-party benchmark data is fetched (self-hosting rule).
 */

export type Tier = "FULL" | "LITE" | "STATIC";
export type Backend = "webgpu" | "webgl";

export type QualityProfile = {
  tier: Tier;
  /** Preferred backend; WebGPURenderer still falls back to WebGL2 on its own. */
  backend: Backend;
  dprMax: number;
  particleScale: number;
  dof: boolean;
  bloomHalfRes: boolean;
  rain: boolean;
  /** Set by ?tier= — QA must see the tier it asked for, so adaptive quality stays off. */
  forced: boolean;
};

const SOFTWARE_GL = /swiftshader|llvmpipe|software|basic render/i;

function hasWebGL2(): { ok: boolean; renderer: string } {
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2");
    if (!gl) return { ok: false, renderer: "" };
    const ext = gl.getExtension("WEBGL_debug_renderer_info");
    const renderer = ext ? String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)) : "";
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    return { ok: true, renderer };
  } catch {
    return { ok: false, renderer: "" };
  }
}

function param(name: string): string | null {
  return new URLSearchParams(window.location.search).get(name);
}

export function profileFor(tier: Tier, backend: Backend, forced = false): QualityProfile {
  if (tier === "FULL")
    return { tier, backend, forced, dprMax: 2, particleScale: backend === "webgpu" ? 1 : 0.35, dof: true, bloomHalfRes: false, rain: true };
  return { tier, backend, forced, dprMax: 1.5, particleScale: 0.35, dof: false, bloomHalfRes: true, rain: false };
}

export function detectQuality(): QualityProfile {
  const forcedTier = param("tier")?.toUpperCase();
  const forcedBackend = param("backend") === "webgl" ? "webgl" : null;
  const gl = hasWebGL2();
  const webgpu = typeof navigator !== "undefined" && "gpu" in navigator;
  const backend: Backend = forcedBackend ?? (webgpu ? "webgpu" : "webgl");

  if (forcedTier === "FULL" || forcedTier === "LITE" || forcedTier === "STATIC") {
    return profileFor(forcedTier, backend, true);
  }

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData === true;
  if (reducedMotion || saveData || (!gl.ok && !webgpu)) return profileFor("STATIC", backend);

  const coarse = window.matchMedia("(pointer: coarse)").matches;
  const narrow = window.innerWidth < 1024;
  const cores = navigator.hardwareConcurrency ?? 8;
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8;
  const lowEnd = cores <= 4 || memory <= 4 || SOFTWARE_GL.test(gl.renderer);

  return profileFor((coarse && narrow) || lowEnd ? "LITE" : "FULL", backend);
}
