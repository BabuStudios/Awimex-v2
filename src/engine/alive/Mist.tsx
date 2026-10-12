"use client";
"use no memo"; // Frame-loop component: mutates uniforms and object counts every frame.

/**
 * Road mist — the alive system's main layer. A camera-relative volume of
 * soft sprites that wraps endlessly as the camera travels.
 *
 * WebGPU backend: positions/velocities live in storage buffers and are
 * integrated by a TSL compute shader each frame (flow field + drift + cursor
 * repulsion). WebGL2 backend: the same field drives positions analytically in
 * the vertex stage, at the reduced count.
 */

import { useEffect, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three/webgpu";
import { Fn, If, cameraPosition, color, deltaTime, float, instanceIndex, instancedArray, length, mix, positionWorld, smoothstep, time, uniform, vec3 } from "three/tsl";
import { alive } from "@/content/content";
import { engine } from "@/engine/scroll/store";
import { flowField, rand, softDisc, wrapBox } from "@/engine/tsl/shared";

const BOX = new THREE.Vector3(46, 14, 72);
const DRIFT = new THREE.Vector3(0.12, 0.02, 0.35);

export function Mist() {
  const gl = useThree((s) => s.gl) as unknown as THREE.WebGPURenderer;
  const profile = engine.getState().profile!;
  const isWebGPU = engine.getState().activeBackend === "webgpu";
  const max = Math.round(alive.mist.count * (isWebGPU ? 1 : alive.reducedScale) * (profile.tier === "LITE" ? alive.reducedScale : 1));

  const built = useMemo(() => {
    const center = uniform(new THREE.Vector3());
    const cursor = uniform(new THREE.Vector3(0, -999, 0));
    const box = uniform(BOX);
    const drift = vec3(DRIFT.x, DRIFT.y, DRIFT.z);
    const seedPos = (i: ReturnType<typeof float>) =>
      vec3(rand(i, 1).sub(0.5), rand(i, 2).sub(0.5), rand(i, 3).sub(0.5)).mul(box);

    const material = new THREE.SpriteNodeMaterial({ transparent: true, depthWrite: false });
    const size = mix(float(alive.mist.sizeMin), float(alive.mist.sizeMax), rand(instanceIndex, 4));
    material.scaleNode = size.mul(0.22);
    material.colorNode = color(alive.mist.color);
    // Fade out near the lens (no giant bokeh blobs) and toward the fog.
    const dist = length(positionWorld.sub(cameraPosition));
    const nearFade = smoothstep(2.5, 9, dist);
    material.opacityNode = softDisc().mul(rand(instanceIndex, 5).mul(0.07).add(0.025)).mul(nearFade);

    let update: THREE.ComputeNode | null = null;
    let init: THREE.ComputeNode | null = null;

    if (isWebGPU) {
      const positions = instancedArray(max, "vec3");
      const velocities = instancedArray(max, "vec3");

      init = Fn(() => {
        positions.element(instanceIndex).assign(seedPos(float(instanceIndex)).add(center));
      })().compute(max);

      update = Fn(() => {
        const p = positions.element(instanceIndex);
        const v = velocities.element(instanceIndex);
        const target = flowField(p, time).mul(0.6).add(drift);
        v.assign(mix(v, target, 0.04));
        const away = p.sub(cursor);
        const d = away.length();
        If(d.lessThan(3.5), () => {
          v.addAssign(away.normalize().mul(float(3.5).sub(d)).mul(0.08));
        });
        p.addAssign(v.mul(deltaTime));
        p.assign(wrapBox(p, center, box));
      })().compute(max);

      material.positionNode = positions.toAttribute();
    } else {
      const base = seedPos(float(instanceIndex));
      const drifted = base.add(drift.mul(time)).add(flowField(base, time).mul(1.6));
      material.positionNode = wrapBox(drifted.add(center), center, box);
    }

    const sprite = new THREE.Sprite(material);
    sprite.count = max;
    sprite.frustumCulled = false;
    sprite.renderOrder = 2;
    return { sprite, material, center, cursor, update, init };
  }, [isWebGPU, max]);

  useEffect(() => {
    if (built.init) gl.compute(built.init);
    return () => built.material.dispose();
  }, [built, gl]);

  const tmp = useMemo(() => new THREE.Vector3(), []);
  useFrame(({ camera }) => {
    const { degrade, pointer } = engine.getState();
    built.sprite.count = degrade >= 3 ? Math.round(max * 0.5) : max;
    built.center.value.copy(camera.position);
    // Cursor in world space, projected onto a plane 10 units ahead.
    tmp.set(pointer.x, pointer.y, 0.5).unproject(camera).sub(camera.position).normalize();
    built.cursor.value.copy(camera.position).addScaledVector(tmp, 10);
    if (built.update) gl.compute(built.update);
  });

  return <primitive object={built.sprite} />;
}

