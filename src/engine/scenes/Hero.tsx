"use client";

/**
 * Scene 1 — Hero. A lone LED light bar hangs in the fog over the wet road,
 * right of the headline. After the intro it powers on, module by module,
 * and throws an amber pool onto the asphalt.
 */

import { useMemo } from "react";
import * as THREE from "three/webgpu";
import { color, float, length, smoothstep, uv } from "three/tsl";
import { palette } from "@/content/content";
import { LightBar } from "./LightBar";

function GroundGlow(props: React.ComponentProps<"mesh">) {
  const material = useMemo(() => {
    const m = new THREE.MeshBasicNodeMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
    m.colorNode = color(palette.amber);
    m.opacityNode = float(1).sub(smoothstep(0, 0.5, length(uv().sub(0.5)))).pow(2).mul(0.22);
    return m;
  }, []);
  return (
    <mesh material={material} rotation={[-Math.PI / 2, 0, 0]} {...props}>
      <planeGeometry args={[9, 5]} />
    </mesh>
  );
}

export function Hero() {
  return (
    <group>
      <LightBar mode="ignite" position={[3.4, 1.9, 1.5]} rotation={[0.08, -0.42, 0]} />
      <pointLight color={palette.amber} intensity={9} distance={9} decay={1.6} position={[3.4, 1.7, 2.4]} />
      <GroundGlow position={[3.2, 0.02, 2.2]} />
    </group>
  );
}
