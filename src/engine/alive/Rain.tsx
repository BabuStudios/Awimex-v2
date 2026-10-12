"use client";

/**
 * Rain streaks for the 24V truck station only (FULL tier). Fall is computed
 * in the vertex stage from time — no buffers — so it runs the same on both
 * backends.
 */

import { useEffect, useMemo } from "react";
import * as THREE from "three/webgpu";
import { color, float, fract, instanceIndex, time, vec2, vec3 } from "three/tsl";
import { alive } from "@/content/content";
import { engine } from "@/engine/scroll/store";
import { rand, softDisc } from "@/engine/tsl/shared";

const BOX = { x: 16, y: 9, z: 10 };

export function Rain(props: React.ComponentProps<"group">) {
  const profile = engine.getState().profile!;
  const count = profile.rain ? alive.rain.count : 0;

  const sprite = useMemo(() => {
    const i = float(instanceIndex);
    const speed = rand(i, 21).mul(4).add(9);
    const fall = fract(rand(i, 22).sub(time.mul(speed).div(BOX.y)));
    const material = new THREE.SpriteNodeMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
    material.positionNode = vec3(
      rand(i, 23).sub(0.5).mul(BOX.x),
      fall.mul(BOX.y),
      rand(i, 24).sub(0.5).mul(BOX.z),
    );
    material.scaleNode = vec2(0.015, 0.34);
    material.colorNode = color(alive.rain.color).mul(1.4);
    material.opacityNode = softDisc().mul(0.22);
    const s = new THREE.Sprite(material);
    s.count = count;
    s.frustumCulled = false;
    return s;
  }, [count]);

  useEffect(() => () => (sprite.material as THREE.Material).dispose(), [sprite]);

  if (!count) return null;
  return (
    <group {...props}>
      <primitive object={sprite} />
    </group>
  );
}
