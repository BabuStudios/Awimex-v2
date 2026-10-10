"use client";

/**
 * In-scene display text: one word per scene, lit by the world, faded by its
 * fog and softened by its DoF. Rendered from the page's own Archivo face into
 * a canvas texture on a TSL material — no troika/GLSL (compatibility gate).
 * Body copy never lives here; it is in the DOM overlay.
 */

import { useEffect, useMemo } from "react";
import * as THREE from "three/webgpu";
import { color, float, texture } from "three/tsl";
import { palette } from "@/content/content";

const FONT_PX = 220;

function displayFamily(): string {
  const v = getComputedStyle(document.documentElement).getPropertyValue("--font-archivo").trim();
  return v || "sans-serif";
}

function drawWord(word: string): { canvas: HTMLCanvasElement; aspect: number } {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;
  const font = `800 ${FONT_PX}px ${displayFamily()}`;
  ctx.font = font;
  (ctx as CanvasRenderingContext2D & { fontStretch?: string }).fontStretch = "expanded";
  (ctx as CanvasRenderingContext2D & { letterSpacing?: string }).letterSpacing = "6px";
  const width = Math.ceil(ctx.measureText(word).width) + 40;
  const height = Math.ceil(FONT_PX * 1.15);
  canvas.width = width;
  canvas.height = height;
  // Resizing resets the context state.
  ctx.font = font;
  (ctx as CanvasRenderingContext2D & { fontStretch?: string }).fontStretch = "expanded";
  (ctx as CanvasRenderingContext2D & { letterSpacing?: string }).letterSpacing = "6px";
  ctx.fillStyle = "#ffffff";
  ctx.textBaseline = "middle";
  ctx.fillText(word, 20, height / 2);
  return { canvas, aspect: width / height };
}

export function InSceneWord({
  word,
  width,
  position,
  glow = 0.55,
}: {
  word: string;
  /** World units across. */
  width: number;
  position: [number, number, number];
  /** Emissive gain; above ~1 starts to catch the bloom threshold. */
  glow?: number;
}) {
  const mesh = useMemo(() => {
    const { canvas, aspect } = drawWord(word);
    const map = new THREE.CanvasTexture(canvas);
    map.colorSpace = THREE.SRGBColorSpace;
    map.anisotropy = 4;
    const material = new THREE.MeshBasicNodeMaterial({ transparent: true, depthWrite: false, fog: true });
    const sample = texture(map);
    material.colorNode = color(palette.offWhite).mul(float(glow));
    material.opacityNode = sample.a;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(width, width / aspect), material);
    m.renderOrder = 1;
    m.userData.map = map;
    return m;
  }, [word, width, glow]);

  useEffect(
    () => () => {
      const mat = mesh.material as THREE.MeshBasicNodeMaterial;
      mesh.geometry.dispose();
      mat.dispose();
      (mesh.userData.map as THREE.Texture).dispose();
    },
    [mesh],
  );

  return <primitive object={mesh} position={position} />;
}
