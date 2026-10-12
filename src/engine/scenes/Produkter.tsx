"use client";
"use no memo"; // Frame-loop component: turns the exhibits and the beacon reflector.

/**
 * Scene 3 — Produkter. Five locked stops along the verge, one per product
 * family, each a procedural exhibit on a plinth with its own accent light
 * (⚑ procedural stand-ins; no product models were supplied). The camera
 * pans between them; the active exhibit turns slowly toward it.
 */

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group } from "three";
import { palette, productFamilies, type ProductForm } from "@/content/content";
import { bodyMaterial, domeMaterial, flashMaterial, glassMaterial, lampMaterial, windowMaterial } from "@/engine/materials";
import { engine } from "@/engine/scroll/store";
import { stopX } from "@/engine/scroll/timeline";
import { Box, Cylinder } from "./parts";

const dark = () => bodyMaterial("#16191d", 0.4, 0.75);
/** Exhibits stand forward of the scene origin: ~8.5 units from the camera at its stop. */
const EXHIBIT_Z = 5.5;

function WorkLight() {
  return (
    <group>
      <Box size={[1.5, 1.5, 0.55]} material={dark()} />
      {Array.from({ length: 16 }, (_, k) => (
        <Box
          key={k}
          size={[0.26, 0.26, 0.04]}
          material={lampMaterial("#fff2dc", 4.5)}
          position={[-0.51 + (k % 4) * 0.34, -0.51 + Math.floor(k / 4) * 0.34, 0.29]}
        />
      ))}
      {/* Cooling fins and a U-bracket. */}
      {Array.from({ length: 6 }, (_, k) => (
        <Box key={`f${k}`} size={[0.06, 1.3, 0.3]} material={dark()} position={[-0.6 + k * 0.24, 0, -0.42]} />
      ))}
      <Box size={[0.08, 1.1, 0.12]} material={dark()} position={[-0.86, -0.4, 0]} />
      <Box size={[0.08, 1.1, 0.12]} material={dark()} position={[0.86, -0.4, 0]} />
      <Box size={[1.8, 0.1, 0.4]} material={dark()} position={[0, -0.95, 0]} />
    </group>
  );
}

function Beacon() {
  const reflector = useRef<Group>(null);
  useFrame((_, dt) => {
    if (reflector.current) reflector.current.rotation.y += dt * 5;
  });
  return (
    <group position={[0, -0.4, 0]}>
      <Cylinder radius={0.62} length={0.34} material={dark()} />
      <Cylinder radius={0.55} length={0.9} material={domeMaterial()} position={[0, 0.62, 0]} />
      <group ref={reflector} position={[0, 0.62, 0]}>
        <Box size={[0.08, 0.5, 0.86]} material={lampMaterial(palette.signalBlue, 7)} />
      </group>
      <Cylinder radius={0.3} length={0.08} material={dark()} position={[0, 1.1, 0]} />
    </group>
  );
}

function PowerUnit() {
  return (
    <group>
      <Box size={[1.9, 1.05, 1.1]} material={bodyMaterial("#20252b", 0.3, 0.8)} />
      {Array.from({ length: 9 }, (_, k) => (
        <Box key={k} size={[0.05, 0.22, 1]} material={dark()} position={[-0.8 + k * 0.2, 0.63, 0]} />
      ))}
      <Cylinder radius={0.11} length={0.22} material={bodyMaterial("#a3221b", 0.4, 0.3)} position={[-0.6, 0.7, 0.35]} />
      <Cylinder radius={0.11} length={0.22} material={bodyMaterial("#0e0f10", 0.4, 0.3)} position={[0.6, 0.7, 0.35]} />
      <Box size={[0.6, 0.18, 0.02]} material={windowMaterial("#7fd1ff", 0.8)} position={[-0.4, 0.15, 0.56]} />
      <Box size={[0.08, 0.08, 0.02]} material={flashMaterial(palette.amber, "blink", 0, 0.7, 4)} position={[0.6, 0.15, 0.56]} />
    </group>
  );
}

function ControlUnit() {
  return (
    <group>
      <Box size={[2, 1.4, 0.36]} material={bodyMaterial("#1c2127", 0.35, 0.7)} />
      {Array.from({ length: 12 }, (_, k) => (
        <group key={k} position={[-0.75 + (k % 6) * 0.3, 0.3 - Math.floor(k / 6) * 0.6, 0.2]}>
          <Box size={[0.2, 0.44, 0.08]} material={bodyMaterial(k % 4 === 0 ? "#2b4c7a" : "#2a2f35", 0.5, 0.3)} />
          <Box size={[0.06, 0.06, 0.02]} material={flashMaterial(k % 3 ? palette.amber : "#4dff8a", "blink", (k * 0.37) % 1, 0.5 + (k % 3) * 0.3, 3)} position={[0, 0.16, 0.05]} />
        </group>
      ))}
    </group>
  );
}

function CameraSystem() {
  return (
    <group>
      <group position={[-0.65, 0.25, 0]} rotation={[0.25, 0.35, 0]}>
        <Box size={[0.62, 0.42, 0.55]} material={dark()} />
        <Cylinder radius={0.15} length={0.2} material={glassMaterial()} position={[0, 0, 0.32]} rotation={[Math.PI / 2, 0, 0]} />
        {Array.from({ length: 6 }, (_, k) => {
          const a = (k / 6) * Math.PI * 2;
          return <Box key={k} size={[0.04, 0.04, 0.02]} material={lampMaterial("#ff3b2e", 1.5)} position={[Math.cos(a) * 0.22, Math.sin(a) * 0.15, 0.29]} />;
        })}
      </group>
      <group position={[0.6, 0.1, 0.1]} rotation={[0, -0.25, 0]}>
        <Box size={[1.25, 0.82, 0.08]} material={dark()} />
        <Box size={[1.12, 0.68, 0.02]} material={windowMaterial("#5aa9d6", 0.55)} position={[0, 0, 0.05]} />
        {/* Parking guide lines on the screen. */}
        {[
          { x: -0.28, c: "#43e07a" },
          { x: 0.28, c: "#43e07a" },
        ].map(({ x, c }) => (
          <Box key={x} size={[0.03, 0.5, 0.01]} material={lampMaterial(c, 1.4)} position={[x, -0.05, 0.065]} rotation={[0, 0, x > 0 ? 0.35 : -0.35]} />
        ))}
        <Box size={[0.08, 0.6, 0.08]} material={dark()} position={[0, -0.7, -0.05]} />
      </group>
    </group>
  );
}

const exhibits: Record<ProductForm, () => React.ReactNode> = {
  workLight: WorkLight,
  beacon: Beacon,
  powerUnit: PowerUnit,
  controlUnit: ControlUnit,
  camera: CameraSystem,
};

export function Produkter({ index }: { index: number }) {
  const turns = useRef<(Group | null)[]>([]);

  useFrame((state, dt) => {
    const { scene, stop } = engine.getState();
    turns.current.forEach((g, k) => {
      if (!g) return;
      // The active exhibit turns to face the camera; the others idle.
      const active = scene === index && stop === k;
      const goal = active ? Math.sin(state.clock.elapsedTime * 0.4) * 0.25 : 0.6;
      g.rotation.y += (goal - g.rotation.y) * (1 - Math.pow(0.1, dt));
    });
  });

  return (
    <group>
      {productFamilies.map((family, k) => {
        const Exhibit = exhibits[family.form];
        return (
          <group key={family.id} position={[stopX(k, productFamilies.length), 0, EXHIBIT_Z]}>
            <Box size={[2.8, 0.7, 2.8]} material={bodyMaterial("#121518", 0.7, 0.3)} position={[0, 0.35, 0]} />
            <Box size={[2.82, 0.03, 2.82]} material={lampMaterial(family.accent, 1.8)} position={[0, 0.71, 0]} />
            <group
              ref={(g) => {
                turns.current[k] = g;
              }}
              position={[0, 2.15, 0]}
              scale={1.55}
            >
              <Exhibit />
            </group>
            <pointLight color={family.accent} intensity={14} distance={7} decay={1.7} position={[0, 3.6, 1.8]} />
          </group>
        );
      })}
    </group>
  );
}
