"use client";
"use no memo"; // Frame-loop component: drives uniforms and renders the pipeline.

/**
 * TSL post chain, built ONCE: scene → DoF → + bloom → chromatic aberration
 * → film grain → vignette → strobe tint. Every toggle is a uniform; nothing
 * is rebuilt mid-session (a rebuild recompiles shaders and hitches).
 *
 * Taking over rendering: this useFrame runs at priority 1, which tells R3F
 * to stop its own render call; the pipeline renders the frame instead.
 */

import { useEffect, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three/webgpu";
import { color, float, length, mix, pass, screenUV, smoothstep, uniform, vec2, vec4 } from "three/tsl";
import { bloom } from "three/addons/tsl/display/BloomNode.js";
import { chromaticAberration } from "three/addons/tsl/display/ChromaticAberrationNode.js";
import { dof } from "three/addons/tsl/display/DepthOfFieldNode.js";
import { film } from "three/addons/tsl/display/FilmNode.js";
import { camera as cam, palette, post } from "@/content/content";
import { engine } from "@/engine/scroll/store";
import type Node from "three/src/nodes/core/Node.js";

/** @types/three types the display nodes as their classes, not as vec4 nodes. */
const v4 = (n: unknown) => n as Node<"vec4">;

/** Three short flashes across the signature travel, amber → blue. */
function strobe(t: number): { amount: number; blue: number } {
  if (t <= 0 || t >= 1) return { amount: 0, blue: 0 };
  const flashes = [0.18, 0.34, 0.5];
  let amount = 0;
  for (const f of flashes) amount = Math.max(amount, Math.exp(-Math.pow((t - f) / 0.035, 2)));
  return { amount, blue: t > 0.3 ? 1 : 0 };
}

export function PostFX() {
  const { gl, scene, camera } = useThree();
  const renderer = gl as unknown as THREE.WebGPURenderer;
  const profile = engine.getState().profile!;

  const chain = useMemo(() => {
    const u = {
      dofMix: uniform(profile.dof ? 1 : 0),
      focus: uniform(cam.standoff),
      bloomStrength: uniform(post.bloom.strength),
      chroma: uniform(post.chromatic.idle),
      grain: uniform(post.grain),
      vignette: uniform(post.vignette),
      strobe: uniform(0),
      strobeColor: uniform(new THREE.Color(palette.amber)),
    };

    const scenePass = pass(scene, camera);
    const sceneColor = scenePass.getTextureNode("output");
    const viewZ = scenePass.getViewZNode();

    const focused = profile.dof
      ? mix(sceneColor, v4(dof(sceneColor, viewZ, u.focus, float(post.dof.focalLength), float(post.dof.bokehScale))), u.dofMix)
      : sceneColor;

    const bloomPass = bloom(sceneColor, post.bloom.strength, post.bloom.radius, post.bloom.threshold);
    bloomPass.strength = u.bloomStrength;
    bloomPass.setResolutionScale(profile.bloomHalfRes ? 0.5 : 1);

    const lit = vec4(focused).add(bloomPass);
    const aberrated = chromaticAberration(lit, u.chroma, vec2(0.5, 0.5), float(1.1));
    const grained = film(aberrated, u.grain);
    const edge = smoothstep(0.35, 1.15, length(screenUV.sub(0.5)).mul(1.6));
    const vignetted = v4(grained).rgb.mul(float(1).sub(edge.mul(u.vignette)));
    const tinted = vignetted.add(color(u.strobeColor).mul(u.strobe));

    const pipeline = new THREE.RenderPipeline(renderer, vec4(tinted, 1));
    return { pipeline, u, bloomPass };
  }, [renderer, scene, camera, profile.dof, profile.bloomHalfRes]);

  useEffect(() => () => chain.pipeline.dispose(), [chain]);

  const amber = useMemo(() => new THREE.Color(palette.amber), []);
  const blue = useMemo(() => new THREE.Color(palette.signalBlue), []);

  useFrame(() => {
    const { signature, degrade, tier } = engine.getState();
    const { u } = chain;
    const reduced = degrade >= 2 || tier === "LITE";

    u.dofMix.value = reduced ? 0 : 1;
    u.grain.value = reduced ? 0 : post.grain;
    const s = strobe(signature);
    u.strobe.value = s.amount * 0.22;
    u.strobeColor.value.copy(s.blue ? blue : amber);
    u.chroma.value = profile.tier === "FULL" && !reduced ? post.chromatic.idle + s.amount * post.chromatic.strobe * 150 : 0;
    u.bloomStrength.value = post.bloom.strength * (1 + s.amount * 0.8);

    chain.pipeline.render();
  }, 1);

  return null;
}
