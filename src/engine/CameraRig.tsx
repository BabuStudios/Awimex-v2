"use client";
"use no memo"; // Frame-loop component: writes camera transforms every frame.

/**
 * z-travel camera. Every frame the scroll progress is sampled into a target
 * (timeline.ts) and the camera lerps toward it, frame-rate independent.
 * Tilt is ASSIGNED from a clamped target — never rotateX/rotateY, which
 * accumulate and drift over a long scroll.
 * The signature travel adds a speed burst: a short FOV kick.
 */

import { useFrame } from "@react-three/fiber";
import type { PerspectiveCamera } from "three";
import { CAMERA_FOV, camera as cam } from "@/content/content";
import { engine } from "@/engine/scroll/store";
import { sample } from "@/engine/scroll/timeline";

const clamp = (v: number, m: number) => Math.max(-m, Math.min(m, v));
const damp = (current: number, target: number, lerp: number, dt: number) =>
  current + (target - current) * (1 - Math.pow(1 - lerp, dt * 60));

let tiltX = 0;
let tiltY = 0;

export function CameraRig() {
  useFrame((state, dt) => {
    const camera = state.camera as PerspectiveCamera;
    const { progress, pointer, signature } = engine.getState();
    const target = sample(progress);
    const delta = Math.min(dt, 0.1);

    camera.position.x = damp(camera.position.x, target.x, cam.lerp, delta);
    camera.position.z = damp(camera.position.z, target.z, cam.lerp, delta);
    camera.position.y = cam.eyeHeight + Math.sin(state.clock.elapsedTime * 0.35) * 0.06;

    tiltY = damp(tiltY, clamp(-pointer.x * cam.tiltMax, cam.tiltMax), cam.tiltLerp, delta);
    tiltX = damp(tiltX, clamp(pointer.y * cam.tiltMax * 0.6, cam.tiltMax), cam.tiltLerp, delta);
    camera.rotation.set(tiltX, tiltY, 0, "YXZ");

    // Speed burst: bell-shaped FOV kick across the signature travel.
    const burst = signature > 0 ? Math.sin(signature * Math.PI) : 0;
    const fov = CAMERA_FOV + burst * 14;
    if (Math.abs(camera.fov - fov) > 0.01) {
      camera.fov = fov;
      camera.updateProjectionMatrix();
    }
  }, -1);

  return null;
}
