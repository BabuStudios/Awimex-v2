"use client";
"use no memo"; // Frame-loop component: measures frame times every frame.

/**
 * Rolling 2 s FPS window. While the average sits below fps_floor the quality
 * steps down one level per window: DPR → post FX → particles → tier.
 * It never steps back up mid-session (that would flicker).
 * LITE that still runs under 30 fps falls through to STATIC.
 * A tier forced with ?tier= is left alone (QA).
 */

import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { post } from "@/content/content";
import { engine } from "@/engine/scroll/store";
import { track } from "@/lib/analytics";

const WINDOW = 2;
const WARMUP = 2.5;
const STATIC_FLOOR = 30;

export function AdaptiveQuality() {
  const setDpr = useThree((s) => s.setDpr);
  const acc = useRef({ time: 0, frames: 0, warm: 0 });

  useFrame((_, dt) => {
    const state = engine.getState();
    if (!state.worldReady || !state.introDone || state.tier === "STATIC" || state.profile?.forced) return;
    const a = acc.current;
    if (a.warm < WARMUP) {
      a.warm += dt;
      return;
    }
    a.time += dt;
    a.frames += 1;
    if (a.time < WINDOW) return;

    const fps = a.frames / a.time;
    a.time = 0;
    a.frames = 0;

    if (state.tier === "LITE" && state.degrade >= 3 && fps < STATIC_FLOOR) {
      engine.setState({ tier: "STATIC" });
      track({ name: "tier", value: "STATIC" });
      return;
    }
    if (fps >= post.fpsFloor) return;

    const next = Math.min(state.degrade + 1, 4);
    if (next === state.degrade) return;
    if (next === 1) setDpr(1);
    if (next === 4 && state.tier === "FULL") {
      engine.setState({ degrade: 3, tier: "LITE" });
      track({ name: "tier", value: "LITE" });
      return;
    }
    engine.setState({ degrade: next });
  });

  return null;
}
