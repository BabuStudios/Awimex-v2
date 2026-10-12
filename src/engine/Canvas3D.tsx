"use client";

/**
 * The one and only <Canvas>. WebGPURenderer from three/webgpu; it falls back
 * to its WebGL2 backend on its own when WebGPU is unavailable, and
 * `?backend=webgl` forces that path for QA. Loaded through a dynamic import
 * (ssr: false) after the DOM overlay has painted.
 */

import { Canvas } from "@react-three/fiber";
import * as THREE from "three/webgpu";
import { CAMERA_FOV, camera as cam } from "@/content/content";
import { engine } from "@/engine/scroll/store";
import type { QualityProfile } from "@/engine/quality/tier";
import { World } from "./World";

/**
 * three r186 always passes `swizzle: "rgba"` when creating texture views.
 * Browsers that shipped an earlier shape of that field (e.g. Chromium 141)
 * throw a TypeError on every view, so probe once and fall back to WebGL2.
 */
type ProbeTexture = { createView(d: object): unknown; destroy(): void };
type ProbeDevice = { createTexture(d: object): ProbeTexture; destroy(): void };
type ProbeGPU = { requestAdapter(): Promise<{ requestDevice(): Promise<ProbeDevice> } | null> };
const TEXTURE_BINDING = 0x04;

async function webgpuUsable(): Promise<boolean> {
  try {
    const gpu = (navigator as Navigator & { gpu?: ProbeGPU }).gpu;
    const adapter = await gpu?.requestAdapter();
    if (!adapter) return false;
    const device = await adapter.requestDevice();
    const tex = device.createTexture({ size: [1, 1], format: "rgba8unorm", usage: TEXTURE_BINDING });
    try {
      tex.createView({ swizzle: "rgba" });
      return true;
    } catch {
      return false;
    } finally {
      tex.destroy();
      device.destroy();
    }
  } catch {
    return false;
  }
}

export default function Canvas3D({ profile }: { profile: QualityProfile }) {
  return (
    <Canvas
      aria-hidden="true"
      className="!fixed !inset-0 !h-[100lvh] !w-full"
      style={{ pointerEvents: "none" }}
      dpr={[1, profile.dprMax]}
      camera={{ fov: CAMERA_FOV, near: 0.1, far: 240, position: [0, cam.eyeHeight, cam.standoff] }}
      shadows={{ enabled: false, type: THREE.PCFShadowMap }}
      gl={async (props) => {
        const forceWebGL = profile.backend === "webgl" || !(await webgpuUsable());
        const renderer = new THREE.WebGPURenderer({
          canvas: props.canvas as HTMLCanvasElement,
          antialias: false,
          alpha: false,
          powerPreference: "high-performance",
          forceWebGL,
        });
        await renderer.init();
        const backend = (renderer.backend as { isWebGPUBackend?: boolean }).isWebGPUBackend ? "webgpu" : "webgl";
        engine.setState({ activeBackend: backend, loadProgress: 0.25 });
        return renderer as unknown as THREE.WebGPURenderer;
      }}
      onCreated={({ gl }) => {
        const renderer = gl as unknown as THREE.WebGPURenderer;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.05;
      }}
    >
      <World />
    </Canvas>
  );
}
