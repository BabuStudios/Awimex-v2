"use client";

/**
 * The night road the camera travels: wet asphalt with lane paint, running
 * the full length of the world, on a dark verge. One mesh each — the fog
 * hides everything beyond the current scene.
 */

import { SCENE_SPACING, camera, scenes } from "@/content/content";
import { asphaltMaterial, bodyMaterial, lanePaintMaterial } from "@/engine/materials";
import { Box } from "@/engine/scenes/parts";

const START = camera.standoff + 30;
const END = -(SCENE_SPACING * scenes.length + 60);
const LENGTH = START - END;
const MID = (START + END) / 2;
const WIDTH = 9;

export function Road() {
  return (
    <group>
      {/* Verge: wide enough for the lateral stops (±24) and beyond. */}
      <Box size={[220, 0.02, LENGTH]} material={bodyMaterial("#0d1013", 0.95, 0)} position={[0, -0.03, MID]} />
      <Box size={[WIDTH, 0.02, LENGTH]} material={asphaltMaterial()} position={[0, 0, MID]} receiveShadow={false} />
      <Box size={[0.16, 0.01, LENGTH]} material={lanePaintMaterial(true)} position={[0, 0.015, MID]} />
      {[-1, 1].map((side) => (
        <Box key={side} size={[0.14, 0.01, LENGTH]} material={lanePaintMaterial(false)} position={[side * (WIDTH / 2 - 0.35), 0.015, MID]} />
      ))}
    </group>
  );
}
