/**
 * Renders text with the page's own fonts into a CanvasTexture, for in-world
 * labels (scene words, fact plates, gauge faces). TSL materials sample it —
 * no SDF/GLSL text library is involved (compatibility gate).
 */

import * as THREE from "three/webgpu";

type Ctx = CanvasRenderingContext2D & { fontStretch?: string; letterSpacing?: string };

export type TextLine = {
  text: string;
  /** Pixel size at texture resolution. */
  size: number;
  weight?: number;
  family?: "display" | "body";
  stretch?: "expanded" | "normal" | "condensed";
  tracking?: number;
  color?: string;
};

function family(kind: "display" | "body"): string {
  const v = getComputedStyle(document.documentElement)
    .getPropertyValue(kind === "display" ? "--font-archivo" : "--font-open-sans")
    .trim();
  return v || "sans-serif";
}

function apply(ctx: Ctx, line: TextLine) {
  ctx.font = `${line.weight ?? 700} ${line.size}px ${family(line.family ?? "display")}`;
  ctx.fontStretch = line.stretch ?? "normal";
  ctx.letterSpacing = `${line.tracking ?? 0}px`;
}

/**
 * Draws lines centred (or left-aligned) on a transparent canvas sized to fit.
 * Returns the texture and its aspect (width / height) for sizing a plane.
 */
export function textTexture(lines: TextLine[], opts: { align?: "center" | "left"; pad?: number; gap?: number } = {}) {
  const pad = opts.pad ?? 24;
  const gap = opts.gap ?? 0.25;
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d") as Ctx;

  const metrics = lines.map((l) => {
    apply(ctx, l);
    return { width: ctx.measureText(l.text).width, height: l.size * (1 + gap) };
  });
  const width = Math.ceil(Math.max(...metrics.map((m) => m.width)) + pad * 2);
  const height = Math.ceil(metrics.reduce((sum, m) => sum + m.height, 0) + pad * 2);
  canvas.width = width;
  canvas.height = height;

  let y = pad;
  lines.forEach((l, i) => {
    apply(ctx, l); // resizing the canvas resets context state
    ctx.fillStyle = l.color ?? "#ffffff";
    ctx.textBaseline = "middle";
    ctx.textAlign = opts.align === "left" ? "left" : "center";
    const h = metrics[i]!.height;
    ctx.fillText(l.text, opts.align === "left" ? pad : width / 2, y + h / 2);
    y += h;
  });

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return { texture, aspect: width / height };
}
