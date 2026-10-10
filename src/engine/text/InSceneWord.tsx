"use client";

/**
 * In-scene display text: one word per scene, lit by the world, faded by its
 * fog and softened by its DoF. Body copy never lives here; it is in the DOM
 * overlay.
 */

import { useEffect, useMemo } from "react";
import * as THREE from "three/webgpu";
import { color, float, texture } from "three/tsl";
import { palette } from "@/content/content";
import { textTexture } from "./canvasText";

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
  const { mesh, map } = useMemo(() => {
    const { texture: map, aspect } = textTexture([{ text: word, size: 220, weight: 800, stretch: "expanded", tracking: 6 }]);
    const material = new THREE.MeshBasicNodeMaterial({ transparent: true, depthWrite: false, fog: true });
    material.colorNode = color(palette.offWhite).mul(float(glow));
    material.opacityNode = texture(map).a;
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, width / aspect), material);
    mesh.renderOrder = 1;
    return { mesh, map };
  }, [word, width, glow]);

  useEffect(
    () => () => {
      mesh.geometry.dispose();
      (mesh.material as THREE.Material).dispose();
      map.dispose();
    },
    [mesh, map],
  );

  return <primitive object={mesh} position={position} />;
}
