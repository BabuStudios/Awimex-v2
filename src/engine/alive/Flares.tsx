"use client";

/**
 * Distant beacon flares scattered along the road edges through the whole
 * world. Static positions (hashed from the instance index), pulsing emissive
 * — bright enough to catch the bloom threshold. Identical on both backends.
 */

import { useEffect, useMemo } from "react";
import * as THREE from "three/webgpu";
import { color, float, instanceIndex, sin, step, time, vec3 } from "three/tsl";
import { SCENE_SPACING, alive, scenes } from "@/content/content";
import { engine } from "@/engine/scroll/store";
import { rand, softDisc } from "@/engine/tsl/shared";

export function Flares() {
  const profile = engine.getState().profile!;
  const count = Math.round(alive.flares.count * (profile.tier === "LITE" ? 0.6 : 1));

  const sprite = useMemo(() => {
    const depth = SCENE_SPACING * scenes.length;
    const i = float(instanceIndex);
    const side = step(0.5, rand(i, 11)).mul(2).sub(1);
    const position = vec3(
      side.mul(rand(i, 12).mul(26).add(14)),
      rand(i, 13).mul(5).add(0.6),
      rand(i, 14).mul(-depth).add(10),
    );

    const material = new THREE.SpriteNodeMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    material.positionNode = position;
    material.scaleNode = rand(i, 15).mul(0.25).add(0.18);
    const pulse = sin(time.mul(rand(i, 16).mul(2).add(1.2)).add(rand(i, 17).mul(6.283))).mul(0.5).add(0.5);
    material.colorNode = color(alive.flares.color).mul(pulse.pow(3).mul(5).add(0.6));
    material.opacityNode = softDisc();

    const s = new THREE.Sprite(material);
    s.count = count;
    s.frustumCulled = false;
    s.renderOrder = 3;
    return s;
  }, [count]);

  useEffect(() => () => (sprite.material as THREE.Material).dispose(), [sprite]);

  return <primitive object={sprite} />;
}
