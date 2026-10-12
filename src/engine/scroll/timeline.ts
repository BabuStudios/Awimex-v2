/**
 * Scroll → world mapping. Pure functions, no DOM, no three.
 *
 * The scroll track is the sum of SCROLL_PER_SCENE_VH. Each scene owns a slice
 * of it, split into segments:
 *   hold   — camera rests (slight drift) on a scene or a locked stop
 *   pan    — lateral move between two locked stops (z plateau)
 *   travel — move to the next scene, SCENE_SPACING further down -z
 * The camera target is sampled from these segments; CameraRig lerps toward it.
 */

import { SCENE_SPACING, SCROLL_PER_SCENE_VH, camera, scenes } from "@/content/content";

export type SegmentKind = "hold" | "pan" | "travel";

export type Segment = {
  kind: SegmentKind;
  scene: number;
  /** Stop index within the scene; -1 for free (stop-less) scenes. */
  stop: number;
  /** Track position in vh. */
  start: number;
  end: number;
  from: { x: number; z: number };
  to: { x: number; z: number };
  /** The produkter → verksamhet travel: the "power on" strobe burst. */
  signature: boolean;
};

const TRAVEL_VH = 40;
const DRIFT = 2.5;
/** A pan is this fraction of a stop's hold. */
const PAN_RATIO = 0.6;

export const sceneZ = (index: number) => -index * SCENE_SPACING;
const restZ = (index: number) => sceneZ(index) + camera.standoff;
export const stopX = (stop: number, stops: number) => (stop - (stops - 1) / 2) * camera.stopSpacing;

function sceneEntry(index: number): { x: number; z: number } {
  const def = scenes[index]!;
  return { x: def.stops > 0 ? stopX(0, def.stops) : 0, z: restZ(index) };
}

function buildSegments(): { segments: Segment[]; totalVh: number } {
  const segments: Segment[] = [];
  let cursor = 0;
  const signatureFrom = scenes.findIndex((s) => s.id === "produkter");

  scenes.forEach((def, i) => {
    const vh = SCROLL_PER_SCENE_VH[def.id];
    const isLast = i === scenes.length - 1;
    const travel = isLast ? 0 : TRAVEL_VH;
    const body = vh - travel;
    const z = restZ(i);

    if (def.stops === 0) {
      segments.push({
        kind: "hold", scene: i, stop: -1, start: cursor, end: cursor + body,
        from: { x: 0, z }, to: { x: 0, z: z - DRIFT }, signature: false,
      });
      cursor += body;
    } else {
      const hold = body / (def.stops + (def.stops - 1) * PAN_RATIO);
      const pan = hold * PAN_RATIO;
      for (let s = 0; s < def.stops; s++) {
        const x = stopX(s, def.stops);
        segments.push({
          kind: "hold", scene: i, stop: s, start: cursor, end: cursor + hold,
          from: { x, z }, to: { x, z: z - DRIFT * 0.4 }, signature: false,
        });
        cursor += hold;
        if (s < def.stops - 1) {
          segments.push({
            kind: "pan", scene: i, stop: s, start: cursor, end: cursor + pan,
            from: { x, z: z - DRIFT * 0.4 }, to: { x: stopX(s + 1, def.stops), z }, signature: false,
          });
          cursor += pan;
        }
      }
    }

    if (!isLast) {
      const last = segments[segments.length - 1]!;
      segments.push({
        kind: "travel", scene: i, stop: def.stops > 0 ? def.stops - 1 : -1,
        start: cursor, end: cursor + travel,
        from: last.to, to: sceneEntry(i + 1), signature: i === signatureFrom,
      });
      cursor += travel;
    }
  });

  return { segments, totalVh: cursor };
}

export const { segments, totalVh: TRACK_VH } = buildSegments();

const smooth = (t: number) => t * t * (3 - 2 * t);

export type Sample = {
  x: number;
  z: number;
  /** Scene whose content is on screen; during travel, the scene being left until halfway. */
  scene: number;
  stop: number;
  kind: SegmentKind;
  /** 0..1 within the current segment. */
  local: number;
  /** 0..1 strobe progress during the signature travel, else 0. */
  signature: number;
};

/** progress: 0..1 over the whole track. */
export function sample(progress: number): Sample {
  const p = Math.min(Math.max(progress, 0), 1) * TRACK_VH;
  let seg = segments[segments.length - 1]!;
  for (const s of segments) {
    if (p < s.end) {
      seg = s;
      break;
    }
  }
  const local = Math.min(Math.max((p - seg.start) / (seg.end - seg.start || 1), 0), 1);
  const e = seg.kind === "hold" ? local : smooth(local);
  const scene = seg.kind === "travel" && local > 0.5 ? seg.scene + 1 : seg.scene;
  const stop =
    seg.kind === "travel"
      ? local > 0.5 ? (scenes[scene]!.stops > 0 ? 0 : -1) : seg.stop
      : seg.kind === "pan" && local > 0.5 ? seg.stop + 1 : seg.stop;
  return {
    x: seg.from.x + (seg.to.x - seg.from.x) * e,
    z: seg.from.z + (seg.to.z - seg.from.z) * e,
    scene,
    stop,
    kind: seg.kind,
    local,
    signature: seg.signature ? local : 0,
  };
}

/** Track progress (0..1) at which a scene's first hold begins — used for nav jumps. */
export function sceneStartProgress(index: number): number {
  const seg = segments.find((s) => s.scene === index && s.kind === "hold");
  return seg ? seg.start / TRACK_VH : 0;
}
