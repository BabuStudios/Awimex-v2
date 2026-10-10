/**
 * TSL building blocks shared by the alive system and the scenes. Everything
 * here compiles to WGSL (WebGPU backend) and GLSL (WebGL2 backend) — no raw
 * shader strings anywhere in the project.
 *
 * Note: in TSL `t.mix(a, b)` means mix(a, b, t). Use the free `mix(a, b, t)`
 * to stay unambiguous.
 */

import { float, hash, length, mx_noise_vec3, smoothstep, uv, vec3 } from "three/tsl";
import type Node from "three/src/nodes/core/Node.js";

export type V3 = Node<"vec3">;
export type F = Node<"float">;

/** Drift field: smooth 3D noise sampled through slowly scrolling space. */
export function flowField(p: V3, t: F): V3 {
  return mx_noise_vec3(p.mul(0.07).add(vec3(t.mul(0.031), t.mul(0.047), t.mul(-0.023))));
}

/** Per-instance random in [0,1) from an index and a salt. */
export function rand(index: Node, salt: number): F {
  return hash(float(index as F).add(salt * 7.123));
}

/** Soft round sprite alpha from the quad's uv. */
export function softDisc(): F {
  return float(1).sub(smoothstep(0.15, 1, length(uv().sub(0.5)).mul(2)));
}

/** Wraps a position into a box of `size` centred on `center` (endless, camera-relative volumes). */
export function wrapBox(p: V3, center: V3, size: V3): V3 {
  const half = size.mul(0.5);
  const rel = p.sub(center).add(half);
  return rel.sub(size.mul(rel.div(size).floor())).sub(half).add(center);
}
