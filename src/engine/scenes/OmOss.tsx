"use client";
"use no memo"; // Frame-loop component: animates the gauge needle.

/**
 * Scene 2 — Om oss. The Simrishamn workshop at dusk behind the road, and an
 * instrument cluster in front carrying the proof: the years gauge, the ISO
 * plates and the Relais Group plate. Every value comes from facts.ts.
 */

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three/webgpu";
import { palette } from "@/content/content";
import { facts } from "@/content/facts";
import { useI18n } from "@/lib/i18n-context";
import { formatFact } from "@/lib/format";
import { bodyMaterial, lampMaterial, skyMaterial, windowMaterial } from "@/engine/materials";
import { engine } from "@/engine/scroll/store";
import { Label } from "@/engine/text/Label";
import { Box } from "./parts";

const ARC = (240 * Math.PI) / 180;
const TICKS = 13;

function Gauge({ label }: { label: string }) {
  const needle = useRef<THREE.Group>(null);
  const tick = lampMaterial(palette.amber, 1.6);
  const face = bodyMaterial("#101317", 0.6, 0.4);
  const rest = ARC / 2;
  const target = -ARC / 2 + ARC * 0.82;

  useFrame((_, dt) => {
    if (!needle.current) return;
    const goal = engine.getState().scene === 1 ? target : rest;
    const z = needle.current.rotation.z;
    needle.current.rotation.z = z + (goal - z) * (1 - Math.pow(0.04, dt));
  });

  return (
    <group>
      <mesh material={face} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[1.05, 1.05, 0.12, 48]} />
      </mesh>
      {Array.from({ length: TICKS }, (_, k) => {
        const a = ARC / 2 - (k / (TICKS - 1)) * ARC + Math.PI / 2;
        const major = k % 3 === 0;
        return (
          <Box
            key={k}
            size={[0.04, major ? 0.2 : 0.11, 0.02]}
            material={tick}
            position={[Math.cos(a) * 0.86, Math.sin(a) * 0.86, 0.08]}
            rotation={[0, 0, a - Math.PI / 2]}
          />
        );
      })}
      <group ref={needle} position={[0, 0, 0.1]} rotation={[0, 0, rest]}>
        <Box size={[0.035, 0.78, 0.02]} material={lampMaterial(palette.offWhite, 2.2)} position={[0, 0.36, 0]} />
      </group>
      <Label lines={[{ text: label, size: 120, weight: 800, stretch: "expanded" }]} height={0.42} position={[0, -0.42, 0.09]} />
    </group>
  );
}

export function OmOss() {
  const { dict, locale } = useI18n();
  const proof = dict.scenes.omOss.proof;
  const panel = bodyMaterial("#161a1f", 0.5, 0.6);
  const plate = bodyMaterial("#2a2f35", 0.3, 0.85);

  return (
    <group>
      {/* Dusk over the workshop. */}
      <mesh material={skyMaterial("#4a2a0e", palette.asphalt, 0.9)} position={[0, 18, -48]}>
        <planeGeometry args={[260, 60]} />
      </mesh>

      {/* Workshop silhouette: long hall, three lit roller doors, clerestory strip. */}
      <group position={[-4, 0, -22]}>
        <Box size={[28, 7, 10]} material={bodyMaterial("#1a1e23", 0.9, 0.1)} position={[0, 3.5, 0]} />
        <Box size={[28.4, 0.5, 10.4]} material={bodyMaterial("#121518", 0.8, 0.2)} position={[0, 7.1, 0]} />
        {[-8, 0, 8].map((x) => (
          <Box key={x} size={[4.2, 4, 0.05]} material={windowMaterial("#ffc27a", 0.5)} position={[x, 2, 5.03]} />
        ))}
        <Box size={[24, 0.5, 0.05]} material={windowMaterial("#ffd9a8", 0.45)} position={[0, 6, 5.03]} />
        <Box size={[0.25, 0.25, 0.1]} material={lampMaterial(palette.amber, 3)} position={[-12, 5.2, 5.1]} />
        <Box size={[0.25, 0.25, 0.1]} material={lampMaterial(palette.amber, 3)} position={[12, 5.2, 5.1]} />
      </group>

      {/* Instrument cluster — the proof layer. */}
      <group position={[5.2, 1.5, 2.6]} rotation={[0, -0.32, 0]}>
        <Box size={[6.6, 2.7, 0.18]} material={panel} position={[0, 0, -0.1]} />
        <Box size={[6.6, 0.03, 0.04]} material={lampMaterial(palette.amber, 2)} position={[0, 1.36, 0]} />
        <group position={[-2, 0.15, 0]}>
          <Gauge label={formatFact("years_in_business", locale)} />
          <Label lines={[{ text: proof.yearsLabel.toUpperCase(), size: 60, weight: 600, stretch: "condensed", tracking: 10, color: palette.rim }]} height={0.18} position={[0, -1.12, 0.02]} />
        </group>
        {[facts.cert_iso9001.value, facts.cert_iso14001.value].map((cert, k) => (
          <group key={cert} position={[0.55 + k * 1.75, 0.45, 0.02]}>
            <Box size={[1.55, 0.7, 0.05]} material={plate} />
            <Label lines={[{ text: cert, size: 96, weight: 700, stretch: "condensed", tracking: 6 }]} height={0.3} position={[0, 0, 0.03]} glow={0.95} />
          </group>
        ))}
        <group position={[1.42, -0.62, 0.02]}>
          <Box size={[3.3, 0.7, 0.05]} material={plate} />
          <Label
            lines={[
              { text: proof.groupLabel.toUpperCase(), size: 44, weight: 600, stretch: "condensed", tracking: 10, color: palette.rim },
              { text: facts.parent_group.value, size: 84, weight: 800, stretch: "expanded" },
            ]}
            height={0.56}
            position={[0, 0, 0.03]}
            gap={0.1}
          />
        </group>
      </group>
    </group>
  );
}
