/**
 * The signature moment's timing, shared by the post chain (screen flash) and
 * the gantry light bar (the lamps that fire it).
 *
 * The strobe is TIME-based, not scroll-based: entering the produkter →
 * verksamhet travel fires one burst of three flashes (~1.4 s) regardless of
 * scroll speed. Scroll-based flashes would freeze mid-flash for anyone who
 * stops scrolling inside the travel. It re-arms once the camera leaves it.
 */

export const DURATION = 1.4;
export const FLASHES = [0.12, 0.38, 0.64] as const;
/** After this point of the burst the strobe turns from amber to blue. */
export const BLUE_FROM = 0.3;

let firedAt: number | null = null;
let armed = true;
let current = { amount: 0, blue: false };

/** Peak 1 at each flash, ~0 between them. `t` is 0..1 through the burst. */
function shape(t: number): { amount: number; blue: boolean } {
  if (t <= 0 || t >= 1) return { amount: 0, blue: false };
  let amount = 0;
  for (const f of FLASHES) amount = Math.max(amount, Math.exp(-Math.pow((t - f) / 0.05, 2)));
  return { amount, blue: t > BLUE_FROM };
}

/**
 * Called once per frame (CameraRig) with the signature travel progress from
 * the store and the clock time. Everyone else reads `strobe()`.
 */
export function tickSignature(travel: number, now: number) {
  if (travel > 0 && armed) {
    firedAt = now;
    armed = false;
  }
  if (travel === 0) armed = true;
  current = firedAt === null ? { amount: 0, blue: false } : shape((now - firedAt) / DURATION);
}

export function strobe(): { amount: number; blue: boolean } {
  return current;
}
