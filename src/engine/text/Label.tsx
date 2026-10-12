"use client";

/** A flat in-world label: text texture on a quad, lit by nothing, faded by fog. */

import { useEffect, useMemo } from "react";
import * as THREE from "three/webgpu";
import { color, texture } from "three/tsl";
import { palette } from "@/content/content";
import { textTexture, type TextLine } from "./canvasText";

export function Label({
  lines,
  height,
  glow = 1,
  gap,
  align,
  ...props
}: { lines: TextLine[]; height: number; glow?: number; gap?: number; align?: "center" | "left" } & React.ComponentProps<"mesh">) {
  const linesKey = JSON.stringify(lines);
  const { material, aspect, map } = useMemo(() => {
    const { texture: map, aspect } = textTexture(JSON.parse(linesKey) as TextLine[], { gap, align });
    const material = new THREE.MeshBasicNodeMaterial({ transparent: true, depthWrite: false });
    material.colorNode = color(palette.offWhite).mul(glow).mul(texture(map).rgb);
    material.opacityNode = texture(map).a;
    return { material, aspect, map };
  }, [linesKey, gap, glow, align]);

  useEffect(
    () => () => {
      material.dispose();
      map.dispose();
    },
    [material, map],
  );

  return (
    <mesh material={material} {...props}>
      <planeGeometry args={[height * aspect, height]} />
    </mesh>
  );
}
