"use client";

/**
 * Scene 5 — Kontakt. Dawn: the road runs on into a low amber horizon with
 * the sun just under it. The night is over; the light bar's colour has
 * become the sky's.
 */

import { palette } from "@/content/content";
import { backdropGlowMaterial, skyMaterial } from "@/engine/materials";
import { Disc } from "./parts";

export function Kontakt() {
  return (
    <group>
      <mesh material={skyMaterial("#c76a1e", "#1a2230", 1.1)} position={[0, 16, -52]}>
        <planeGeometry args={[280, 64]} />
      </mesh>
      <Disc radius={5.5} material={backdropGlowMaterial("#ffb259", 1.6)} position={[6, 0.4, -51]} />
      <pointLight color={palette.amber} intensity={6} distance={40} decay={1.2} position={[6, 3, -30]} />
    </group>
  );
}
