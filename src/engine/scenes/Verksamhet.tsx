"use client";

/**
 * Scene 4 — Verksamhetsområden. Five roadside stations, one per area of
 * operation, each a vehicle silhouette that is read through its lights
 * (⚑ procedural stand-ins). Before them, spanning the road, the gantry whose
 * light bar fires the signature strobe as the camera bursts through.
 */

import { SCENE_SPACING, areas, camera, palette, type StationForm } from "@/content/content";
import { bodyMaterial, flashMaterial, lampMaterial } from "@/engine/materials";
import { stopX } from "@/engine/scroll/timeline";
import { Rain } from "@/engine/alive/Rain";
import { LightBar } from "./LightBar";
import { Armored, Box, Camper, Cylinder, Truck, Tug, Van } from "./parts";

/** Blue light bar for the emergency van: left/right halves alternate. */
function EmergencyBar() {
  const housing = bodyMaterial("#15191e", 0.35, 0.7);
  return (
    <group position={[0.4, 2.42, 0]}>
      <Box size={[0.5, 0.16, 1.5]} material={housing} />
      <Box size={[0.42, 0.12, 0.62]} material={flashMaterial(palette.signalBlue, "double", 0, 1.4)} position={[0.02, 0.04, -0.36]} />
      <Box size={[0.42, 0.12, 0.62]} material={flashMaterial(palette.signalBlue, "double", 0.5, 1.4)} position={[0.02, 0.04, 0.36]} />
    </group>
  );
}

function Emergency() {
  return (
    <Van tint="#d6dadd">
      <EmergencyBar />
      {[-0.55, 0.55].map((z, k) => (
        <Box key={z} size={[0.04, 0.1, 0.3]} material={flashMaterial(palette.signalBlue, "double", k * 0.5 + 0.25, 1.4)} position={[2.82, 0.95, z]} />
      ))}
    </Van>
  );
}

function Apron() {
  return (
    <group>
      <Tug />
      {/* Taxiway edge: blue lamps; holding point: amber. */}
      {Array.from({ length: 7 }, (_, k) => (
        <group key={k} position={[-5 + k * 1.7, 0, 3.2]}>
          <Cylinder radius={0.06} length={0.3} material={bodyMaterial("#2a2f35", 0.6, 0.3)} position={[0, 0.15, 0]} />
          <Cylinder radius={0.08} length={0.1} material={lampMaterial(k === 3 ? palette.amber : palette.signalBlue, 4)} position={[0, 0.34, 0]} />
        </group>
      ))}
    </group>
  );
}

function Station({ station }: { station: StationForm }) {
  switch (station) {
    case "emergency":
      return <Emergency />;
    case "apron":
      return <Apron />;
    case "military":
      return <Armored />;
    case "camper":
      return <Camper />;
    case "truck":
      return (
        <group>
          <Truck>
            <group position={[4.4, 3.65, 0]}>
              <Box size={[0.4, 0.14, 1.7]} material={bodyMaterial("#15191e", 0.35, 0.7)} />
              <Box size={[0.34, 0.1, 0.7]} material={flashMaterial(palette.amber, "rotate", 0, 1.2)} position={[0.03, 0.04, -0.4]} />
              <Box size={[0.34, 0.1, 0.7]} material={flashMaterial(palette.amber, "rotate", 0.5, 1.2)} position={[0.03, 0.04, 0.4]} />
            </group>
          </Truck>
          <Rain position={[0, 0, 0]} />
        </group>
      );
  }
}

/** The signature gantry sits midway along the travel into this scene. */
const GANTRY_Z = camera.standoff + SCENE_SPACING * 0.5;
const GANTRY_SPAN = 64;

function Gantry() {
  const steel = bodyMaterial("#22272d", 0.5, 0.7);
  return (
    <group position={[0, 0, GANTRY_Z]}>
      {[-1, 1].map((s) => (
        <Box key={s} size={[0.5, 7, 0.5]} material={steel} position={[(s * GANTRY_SPAN) / 2, 3.5, 0]} />
      ))}
      <Box size={[GANTRY_SPAN, 0.6, 0.6]} material={steel} position={[0, 7, 0]} />
      <LightBar mode="strobe" modules={40} length={GANTRY_SPAN - 4} position={[0, 6.45, 0.35]} />
    </group>
  );
}

export function Verksamhet() {
  return (
    <group>
      <Gantry />
      {areas.map((area, k) => (
        <group key={area.id} position={[stopX(k, areas.length), 0, -2]} rotation={[0, -0.4, 0]}>
          <Station station={area.station} />
          <pointLight color={area.beacon} intensity={16} distance={16} decay={1.5} position={[1, 5, 4]} />
          <pointLight color="#9fb4c8" intensity={8} distance={18} decay={1.4} position={[-4, 6, 6]} />
        </group>
      ))}
    </group>
  );
}
