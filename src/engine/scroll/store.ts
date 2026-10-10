/**
 * The scroll bridge. Lenis writes here with setState; R3F reads with
 * getState() inside useFrame — never through a hook (a hook would re-render
 * 3D components on every scroll frame). DOM components may subscribe with
 * narrow selectors (scene, stop), which change a handful of times per page.
 */

import { createStore, useStore } from "zustand";
import type { Backend, QualityProfile, Tier } from "@/engine/quality/tier";

export type EngineState = {
  /** 0..1 over the whole scroll track. */
  progress: number;
  /** Lenis velocity, px per frame. */
  velocity: number;
  scene: number;
  stop: number;
  /** 0..1 during the signature strobe travel. */
  signature: number;
  /** Pointer in normalised device coordinates, -1..1. */
  pointer: { x: number; y: number };
  tier: Tier | null;
  /** Requested backend; `activeBackend` is what WebGPURenderer actually ran on. */
  backend: Backend | null;
  activeBackend: Backend | null;
  profile: QualityProfile | null;
  /**
   * Adaptive quality step, only ever increases:
   * 0 none · 1 DPR · 2 post FX · 3 particles · 4 drop a tier (FULL→LITE, LITE→STATIC).
   */
  degrade: number;
  /** 0..1 from the three.js loading manager. */
  loadProgress: number;
  /** The world has rendered its first frame. */
  worldReady: boolean;
  /** The intro has finished or was skipped. */
  introDone: boolean;
};

export const engine = createStore<EngineState>(() => ({
  progress: 0,
  velocity: 0,
  scene: 0,
  stop: -1,
  signature: 0,
  pointer: { x: 0, y: 0 },
  tier: null,
  backend: null,
  activeBackend: null,
  profile: null,
  degrade: 0,
  loadProgress: 0,
  worldReady: false,
  introDone: false,
}));

/** For DOM components only. */
export function useEngine<T>(selector: (s: EngineState) => T): T {
  return useStore(engine, selector);
}
