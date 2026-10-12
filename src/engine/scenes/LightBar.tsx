"use client";
"use no memo"; // Frame-loop component: drives ignition/strobe uniforms every frame.

/**
 * Procedural LED light bar — the hero subject (⚑ procedural stand-in until a
 * GLB is supplied; content.lightBar.glb).
 *
 * mode "ignite": modules switch on one by one once the world is ready and the
 *                intro has finished ("power on"), then idle in a slow chase.
 * mode "strobe": the gantry bar of the signature moment — dark until the
 *                signature travel, then fires the shared strobe pattern.
 */

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three/webgpu";
import { color, float, instanceIndex, sin, smoothstep, time, uniform } from "three/tsl";
import { lightBar, palette } from "@/content/content";
import { bodyMaterial } from "@/engine/materials";
import { engine } from "@/engine/scroll/store";
import { strobe } from "@/engine/signature";
import { Box } from "./parts";

export function LightBar({
  mode,
  modules = lightBar.modules,
  length = lightBar.length,
  ...group
}: { mode: "ignite" | "strobe"; modules?: number; length?: number } & React.ComponentProps<"group">) {
  const started = useRef<number | null>(null);

  const { mesh, u } = useMemo(() => {
    const u = {
      ignite: uniform(-1),
      strobe: uniform(0),
      tint: uniform(new THREE.Color(palette.amber)),
    };
    const i = float(instanceIndex);
    const material = new THREE.MeshBasicNodeMaterial();
    if (mode === "ignite") {
      const on = smoothstep(0, 0.12, u.ignite.sub(i.mul(lightBar.igniteStagger)));
      const chase = sin(time.mul(2.2).sub(i.mul(0.55))).mul(0.18).add(0.82);
      material.colorNode = color(u.tint).mul(on.mul(chase).mul(5).add(0.04));
    } else {
      // Sweep across the bar so each flash travels left → right.
      const sweep = sin(i.div(modules).mul(Math.PI)).mul(0.4).add(0.6);
      material.colorNode = color(u.tint).mul(u.strobe.mul(sweep).mul(8).add(0.05));
    }
    const pitch = length / modules;
    const geo = new THREE.BoxGeometry(pitch * 0.82, 0.16, 0.06);
    const mesh = new THREE.InstancedMesh(geo, material, modules);
    const m = new THREE.Matrix4();
    for (let k = 0; k < modules; k++) {
      m.makeTranslation(-length / 2 + pitch * (k + 0.5), 0, 0.14);
      mesh.setMatrixAt(k, m);
    }
    mesh.instanceMatrix.needsUpdate = true;
    return { mesh, u };
  }, [mode, modules, length]);

  useEffect(
    () => () => {
      mesh.geometry.dispose();
      (mesh.material as THREE.Material).dispose();
    },
    [mesh],
  );

  const amber = useMemo(() => new THREE.Color(palette.amber), []);
  const blue = useMemo(() => new THREE.Color(palette.signalBlue), []);

  useFrame(({ clock }) => {
    const { worldReady, introDone } = engine.getState();
    if (mode === "ignite") {
      if (started.current === null && worldReady && introDone) started.current = clock.elapsedTime;
      u.ignite.value = started.current === null ? -1 : clock.elapsedTime - started.current;
    } else {
      const s = strobe();
      u.strobe.value = s.amount;
      u.tint.value.copy(s.blue ? blue : amber);
    }
  });

  const housing = bodyMaterial("#15191e", 0.35, 0.7);
  return (
    <group {...group}>
      <Box size={[length + 0.24, 0.3, 0.32]} material={housing} />
      <primitive object={mesh} />
      {[-1, 1].map((s) => (
        <Box key={s} size={[0.08, 0.36, 0.08]} material={housing} position={[s * (length / 2 - 0.4), -0.3, 0]} />
      ))}
    </group>
  );
}
