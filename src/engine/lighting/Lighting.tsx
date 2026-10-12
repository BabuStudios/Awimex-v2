"use client";
"use no memo"; // Frame-loop component: moves the cursor light every frame.

/**
 * The cursor is a work light: a spot held just below the camera, aimed
 * through the pointer, with a faint additive cone so the beam reads in the
 * fog. Plus a cold rim key light and a whisper of ambient.
 */

import { useEffect, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three/webgpu";
import { color, dot, float, normalView, positionViewDirection, positionWorld, smoothstep, uv } from "three/tsl";
import { lighting } from "@/content/content";
import { engine } from "@/engine/scroll/store";

const HAND = new THREE.Vector3(0.45, -0.55, -0.2);
const AIM_DEPTH = 18;
const BEAM_LENGTH = 11;
const BEAM_ANGLE = 0.2;

export function Lighting() {
  const { spot, target, cone } = useMemo(() => {
    const c = lighting.cursor;
    const spot = new THREE.SpotLight(c.color, c.intensity, c.distance, c.angle, c.penumbra, 1.6);
    const target = new THREE.Object3D();
    spot.target = target;

    // Beam cone: apex at the light, opening toward the aim point.
    // The visible beam is narrower and shorter than the light it suggests,
    // so it never slices through the road surface.
    const length = BEAM_LENGTH;
    const radius = Math.tan(BEAM_ANGLE) * length;
    const geometry = new THREE.ConeGeometry(radius, length, 40, 1, true);
    geometry.translate(0, -length / 2, 0);
    geometry.rotateX(-Math.PI / 2);
    const material = new THREE.MeshBasicNodeMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      fog: true,
    });
    material.colorNode = color(c.color);
    // Brightest near the lamp, fading along the beam; soft silhouette (the
    // beam is densest where the view looks through most of its volume).
    const facing = dot(normalView, positionViewDirection).abs().pow(2);
    const along = smoothstep(0, 0.9, uv().y).mul(float(1).sub(smoothstep(0.92, 1, uv().y)));
    const aboveGround = smoothstep(0.1, 0.9, positionWorld.y);
    material.opacityNode = float(0.035).mul(along).mul(facing).mul(aboveGround);
    const cone = new THREE.Mesh(geometry, material);
    cone.renderOrder = 4;
    return { spot, target, cone };
  }, []);

  useEffect(
    () => () => {
      cone.geometry.dispose();
      (cone.material as THREE.Material).dispose();
    },
    [cone],
  );

  const aim = useMemo(() => new THREE.Vector3(), []);
  const hand = useMemo(() => new THREE.Vector3(), []);
  useFrame(({ camera }) => {
    const { pointer } = engine.getState();
    hand.copy(HAND).applyQuaternion(camera.quaternion).add(camera.position);
    aim.set(pointer.x, pointer.y, 0.5).unproject(camera).sub(camera.position).normalize();
    aim.multiplyScalar(AIM_DEPTH).add(camera.position);
    spot.position.copy(hand);
    target.position.copy(aim);
    cone.position.copy(hand);
    cone.lookAt(aim);
  });

  return (
    <>
      <ambientLight intensity={lighting.ambient.intensity} />
      <directionalLight color={lighting.key.color} intensity={lighting.key.intensity} position={[-6, 9, -14]} />
      <primitive object={spot} />
      <primitive object={target} />
      <primitive object={cone} />
    </>
  );
}
