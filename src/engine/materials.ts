/**
 * Shared TSL materials for the procedural world. Created lazily, once, and
 * reused by every scene (one material per look keeps draw-state changes and
 * shader variants down). Emissive looks are MeshBasicNodeMaterial with HDR
 * colour above 1 so they reach the bloom threshold.
 */

import * as THREE from "three/webgpu";
import { cameraPosition, color, float, fract, length, mix, mx_noise_float, positionWorld, sin, smoothstep, step, time, vec3 } from "three/tsl";
import { palette } from "@/content/content";

const cache = new Map<string, THREE.Material>();

function once<T extends THREE.Material>(key: string, make: () => T): T {
  let m = cache.get(key) as T | undefined;
  if (!m) {
    m = make();
    cache.set(key, m);
  }
  return m;
}

/** Painted metal / plastic bodies. */
export const bodyMaterial = (tint = "#1d2228", rough = 0.55, metal = 0.5) =>
  once(`body:${tint}:${rough}:${metal}`, () => new THREE.MeshStandardNodeMaterial({ color: tint, roughness: rough, metalness: metal }));

/** Dark glazing with a faint sheen. */
export const glassMaterial = () =>
  once("glass", () => new THREE.MeshStandardNodeMaterial({ color: "#0a0d11", roughness: 0.08, metalness: 0.9 }));

/** Steady emissive light. `gain` > 1 blooms. */
export const lampMaterial = (hex: string, gain = 4) =>
  once(`lamp:${hex}:${gain}`, () => {
    const m = new THREE.MeshBasicNodeMaterial();
    m.colorNode = color(hex).mul(gain);
    return m;
  });

/** Warm interior glow — windows, roller doors. Below the bloom threshold on purpose. */
export const windowMaterial = (hex = "#ffcf8a", gain = 0.9) =>
  once(`window:${hex}:${gain}`, () => {
    const m = new THREE.MeshBasicNodeMaterial();
    m.colorNode = color(hex).mul(gain);
    return m;
  });

/**
 * Flashing warning light. `pattern`:
 *  - "double": two quick flashes per cycle (European blue-light rhythm)
 *  - "rotate": smooth rotating-beacon sweep
 *  - "blink":  plain on/off
 * `phase` (0..1) offsets lamps so left/right halves alternate.
 */
export const flashMaterial = (hex: string, pattern: "double" | "rotate" | "blink", phase = 0, rate = 1.6, gain = 6) =>
  once(`flash:${hex}:${pattern}:${phase}:${rate}:${gain}`, () => {
    const m = new THREE.MeshBasicNodeMaterial();
    const t = fract(time.mul(rate).add(phase));
    const on =
      pattern === "double"
        ? step(t, 0.08).add(step(0.16, t).mul(step(t, 0.24)))
        : pattern === "rotate"
          ? sin(t.mul(Math.PI * 2)).mul(0.5).add(0.5).pow(6)
          : step(t, 0.5);
    m.colorNode = color(hex).mul(on.mul(gain).add(0.08));
    return m;
  });

/** Wet asphalt: dark, slightly glossy, with puddle-like roughness variation. */
export const asphaltMaterial = () =>
  once("asphalt", () => {
    const m = new THREE.MeshStandardNodeMaterial({ color: "#121519", metalness: 0.2 });
    const puddles = smoothstep(0.15, 0.55, mx_noise_float(positionWorld.xz.mul(0.18)));
    // Subtle: with no environment to reflect, a very smooth/dark puddle reads
    // as a hole in the road, so the sheen stays modest.
    m.roughnessNode = float(0.72).sub(puddles.mul(0.24));
    m.colorNode = color("#121519").mul(float(1).sub(puddles.mul(0.1)));
    return m;
  });

/** Lane paint: dashed centre line, faintly retro-reflective. */
export const lanePaintMaterial = (dashed: boolean) =>
  once(`lane:${dashed}`, () => {
    const m = new THREE.MeshStandardNodeMaterial({ roughness: 0.6, metalness: 0 });
    const dash = dashed ? step(0.45, fract(positionWorld.z.mul(0.11))) : float(1);
    m.colorNode = color(palette.mist).mul(0.55);
    m.opacityNode = dash;
    m.transparent = dashed;
    m.alphaTest = dashed ? 0.5 : 0;
    m.emissiveNode = vec3(0.05, 0.05, 0.045).mul(dash);
    return m;
  });

/**
 * Sky gradient for per-scene horizons. Fog is off (it IS the backdrop), so it
 * fades out with camera distance instead — a scene's sky must never show
 * through from the neighbouring scene.
 */
export const skyMaterial = (low: string, high: string, gain = 1) =>
  once(`sky:${low}:${high}:${gain}`, () => {
    const m = new THREE.MeshBasicNodeMaterial({ fog: false, depthWrite: false, transparent: true });
    const h = smoothstep(-0.1, 0.6, positionWorld.y.div(40));
    m.colorNode = mix(color(low), color(high), h).mul(gain);
    m.opacityNode = float(1).sub(smoothstep(72, 96, length(positionWorld.xz.sub(cameraPosition.xz))));
    return m;
  });

/** Fog-free emissive for backdrop elements (sun), faded by camera distance like the skies. */
export const backdropGlowMaterial = (hex: string, gain = 1.6) =>
  once(`backdrop:${hex}:${gain}`, () => {
    const m = new THREE.MeshBasicNodeMaterial({ fog: false, depthWrite: false, transparent: true });
    m.colorNode = color(hex).mul(gain);
    m.opacityNode = float(1).sub(smoothstep(72, 96, length(positionWorld.xz.sub(cameraPosition.xz))));
    return m;
  });

/** Tinted translucent lens (beacon domes): lets the rotating reflector read through. */
export const domeMaterial = (hex = palette.signalBlue) =>
  once(`dome:${hex}`, () => {
    const m = new THREE.MeshStandardNodeMaterial({ color: hex, roughness: 0.15, metalness: 0.1, transparent: true, opacity: 0.38, depthWrite: false });
    m.emissiveNode = color(hex).mul(0.25);
    return m;
  });
