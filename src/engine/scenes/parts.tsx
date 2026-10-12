"use client";

/**
 * Procedural kit for the world: boxes, wheels and simple vehicle
 * silhouettes built from shared unit geometry and the shared material
 * library. Low-poly on purpose — the fog, the lamps and the cursor light do
 * the storytelling; the shapes only have to read in silhouette.
 */

import * as THREE from "three/webgpu";
import type { ThreeElements } from "@react-three/fiber";
import { palette } from "@/content/content";
import { bodyMaterial, flashMaterial, glassMaterial, lampMaterial, windowMaterial } from "@/engine/materials";

const unitBox = new THREE.BoxGeometry(1, 1, 1);
/** Unit cylinder, axis +Y. Scale [radius, length, radius] before rotating. */
const cylinderGeo = new THREE.CylinderGeometry(1, 1, 1, 20);
const discGeo = new THREE.CircleGeometry(1, 24);

type V3 = [number, number, number];

export function Box({
  size,
  material,
  ...props
}: { size: V3; material: THREE.Material } & Omit<ThreeElements["mesh"], "geometry" | "material" | "scale">) {
  return <mesh geometry={unitBox} material={material} scale={size} {...props} />;
}

export function Cylinder({
  radius,
  length,
  material,
  ...props
}: { radius: number; length: number; material: THREE.Material } & Omit<ThreeElements["mesh"], "geometry" | "material" | "scale">) {
  return <mesh geometry={cylinderGeo} material={material} scale={[radius, length, radius]} {...props} />;
}

export function Disc({ radius, material, ...props }: { radius: number; material: THREE.Material } & Omit<ThreeElements["mesh"], "geometry" | "material" | "scale">) {
  return <mesh geometry={discGeo} material={material} scale={[radius, radius, 1]} {...props} />;
}

export function Wheels({ length, width, radius, axles = 2 }: { length: number; width: number; radius: number; axles?: number }) {
  const tyre = bodyMaterial("#0c0e10", 0.9, 0);
  const xs = Array.from({ length: axles }, (_, i) => -length / 2 + radius * 1.6 + (i * (length - radius * 3.2)) / Math.max(axles - 1, 1));
  return (
    <>
      {xs.flatMap((x) =>
        [-1, 1].map((side) => (
          <mesh
            key={`${x}-${side}`}
            geometry={cylinderGeo}
            material={tyre}
            position={[x, radius, (side * width) / 2]}
            scale={[radius, 0.3, radius]}
            rotation={[Math.PI / 2, 0, 0]}
          />
        )),
      )}
    </>
  );
}

/** Head/tail lights on the vehicle's ends (vehicles face +x). */
export function EndLights({ length, width, y, front = palette.offWhite, rear = "#ff2a1a" }: { length: number; width: number; y: number; front?: string; rear?: string }) {
  return (
    <>
      {[-1, 1].map((side) => (
        <group key={side}>
          <Box size={[0.05, 0.16, 0.34]} material={lampMaterial(front, 3)} position={[length / 2 + 0.02, y, side * (width / 2 - 0.3)]} />
          <Box size={[0.05, 0.2, 0.18]} material={lampMaterial(rear, 2.5)} position={[-length / 2 - 0.02, y, side * (width / 2 - 0.2)]} />
        </group>
      ))}
    </>
  );
}

/** Panel van: the work vehicle the hero light bar sits on, and the emergency vehicle. */
export function Van({ tint = "#1b2026", children }: { tint?: string; children?: React.ReactNode }) {
  const body = bodyMaterial(tint, 0.45, 0.55);
  return (
    <group>
      <Box size={[4.2, 1.9, 2]} material={body} position={[-0.5, 1.35, 0]} />
      <Box size={[1.2, 1.25, 2]} material={body} position={[2.2, 1.02, 0]} />
      <Box size={[0.9, 0.9, 1.9]} material={glassMaterial()} position={[1.75, 1.95, 0]} rotation={[0, 0, -0.5]} />
      <Wheels length={5.2} width={2} radius={0.38} />
      <EndLights length={5.6} width={2} y={1.1} />
      {children}
    </group>
  );
}

/** Heavy truck: cab + box trailer (24V). */
export function Truck({ children }: { children?: React.ReactNode }) {
  const cab = bodyMaterial("#20262d", 0.4, 0.6);
  const trailer = bodyMaterial("#2a2f36", 0.7, 0.3);
  return (
    <group>
      <Box size={[2.4, 2.9, 2.5]} material={cab} position={[4.4, 2.1, 0]} />
      <Box size={[0.08, 1.1, 2.2]} material={glassMaterial()} position={[5.62, 2.7, 0]} />
      <Box size={[8.2, 3.4, 2.55]} material={trailer} position={[-1.2, 2.55, 0]} />
      <Wheels length={10.8} width={2.4} radius={0.52} axles={4} />
      <EndLights length={11.3} width={2.5} y={1.2} />
      {children}
    </group>
  );
}

/** Motorhome with solar panels and a warm interior. */
export function Camper() {
  const shell = bodyMaterial("#cfd3d6", 0.6, 0.1);
  const panel = bodyMaterial("#13233d", 0.2, 0.8);
  return (
    <group>
      <Box size={[6.4, 2.6, 2.3]} material={shell} position={[-0.3, 1.85, 0]} />
      <Box size={[1.2, 1.4, 2.2]} material={shell} position={[3.4, 1.1, 0]} />
      <Box size={[0.8, 0.8, 2.1]} material={glassMaterial()} position={[3.1, 2, 0]} rotation={[0, 0, -0.55]} />
      {[-1.6, 0.2, 1.8].map((x) => (
        <Box key={x} size={[1.1, 0.5, 0.04]} material={windowMaterial()} position={[x, 2.1, 1.16]} />
      ))}
      {[-2.2, -0.6, 1].map((x) => (
        <Box key={x} size={[1.4, 0.05, 1]} material={panel} position={[x, 3.2, 0]} rotation={[0, 0, 0.08]} />
      ))}
      <Wheels length={6.6} width={2.3} radius={0.4} />
      <EndLights length={7.3} width={2.3} y={1.1} />
    </group>
  );
}

/** Armoured utility vehicle with blackout lamps. */
export function Armored() {
  const hull = bodyMaterial("#2a2f24", 0.85, 0.2);
  return (
    <group>
      <Box size={[5.4, 1.6, 2.6]} material={hull} position={[-0.2, 1.5, 0]} />
      <Box size={[1.3, 1.1, 2.4]} material={hull} position={[2.7, 1.25, 0]} rotation={[0, 0, -0.45]} />
      <Box size={[2.2, 0.7, 2]} material={hull} position={[-0.8, 2.6, 0]} />
      <Wheels length={5.6} width={2.6} radius={0.55} axles={3} />
      <EndLights length={6.4} width={2.6} y={1.2} front="#ffb35c" rear="#7a1208" />
    </group>
  );
}

/** Airport tug with an amber rotating beacon. */
export function Tug() {
  const body = bodyMaterial("#d9a419", 0.6, 0.2);
  return (
    <group>
      <Box size={[3.4, 0.9, 1.8]} material={body} position={[0, 0.85, 0]} />
      <Box size={[1.1, 1, 1.6]} material={glassMaterial()} position={[-0.6, 1.75, 0]} />
      <Box size={[1.2, 0.08, 1.7]} material={body} position={[-0.6, 2.28, 0]} />
      <mesh geometry={cylinderGeo} material={flashMaterial(palette.amber, "rotate", 0, 1.1)} position={[-0.6, 2.45, 0]} scale={[0.16, 0.22, 0.16]} />
      <Wheels length={3.2} width={1.8} radius={0.36} />
      <EndLights length={3.5} width={1.8} y={0.9} />
    </group>
  );
}
