"use client";

import { useEffect } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three/webgpu";
import { FOG_FAR, FOG_NEAR, lighting, palette } from "@/content/content";
import { engine } from "@/engine/scroll/store";
import { CameraRig } from "./CameraRig";
import { Flares } from "./alive/Flares";
import { Mist } from "./alive/Mist";
import { Lighting } from "./lighting/Lighting";
import { PostFX } from "./post/PostFX";
import { AdaptiveQuality } from "./quality/AdaptiveQuality";
import { Scenes } from "./scenes/Scenes";
import { Road } from "./environment/Road";

/**
 * The single world. Linear fog with FOG_FAR < SCENE_SPACING guarantees only
 * one scene reads at a time. Shaders are compiled up front (compileAsync), so
 * "ready" means ready — the intro reads that progress, not a timer.
 */
export function World() {
  const { gl, scene, camera } = useThree();

  useEffect(() => {
    scene.background = new THREE.Color(palette.asphalt);
    scene.fog = new THREE.Fog(lighting.fog.color, FOG_NEAR, FOG_FAR);
    const renderer = gl as unknown as THREE.WebGPURenderer;
    let cancelled = false;
    engine.setState({ loadProgress: 0.5 });
    renderer
      .compileAsync(scene, camera)
      .catch(() => undefined)
      .then(() => {
        if (cancelled) return;
        engine.setState({ loadProgress: 1, worldReady: true });
      });
    return () => {
      cancelled = true;
    };
  }, [gl, scene, camera]);

  return (
    <>
      <CameraRig />
      <Lighting />
      <Mist />
      <Flares />
      <Road />
      <Scenes />
      <PostFX />
      <AdaptiveQuality />
    </>
  );
}
