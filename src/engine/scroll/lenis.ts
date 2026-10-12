/**
 * One RAF for scroll and GSAP: Lenis is driven by gsap.ticker, and R3F's
 * frameloop renders from the same browser frame. Lenis writes progress and
 * velocity into the engine store; nothing else listens to scroll.
 */

import Lenis from "lenis";
import { gsap, ScrollTrigger, registerMotion } from "@/lib/motion";
import { setScroller } from "./handle";
import { engine } from "./store";
import { TRACK_VH, sample, sceneStartProgress } from "./timeline";

let lenis: Lenis | null = null;

/**
 * Pixel length of the camera journey. Progress is measured against the track
 * only — the in-flow contact section after it scrolls normally and must not
 * stretch the camera timeline.
 */
export function trackLength(): number {
  return (TRACK_VH / 100) * window.innerHeight;
}
let tick: ((time: number) => void) | null = null;

function publish(progress: number, velocity: number) {
  const s = sample(progress);
  const prev = engine.getState();
  // Only replace the object when DOM-visible fields change; progress/velocity
  // are read transiently by the 3D layer, so a plain setState is fine.
  engine.setState({
    progress,
    velocity,
    signature: s.signature,
    ...(prev.scene !== s.scene || prev.stop !== s.stop ? { scene: s.scene, stop: s.stop } : null),
  });
}

export function startLenis(): Lenis {
  if (lenis) return lenis;
  registerMotion();

  lenis = new Lenis({
    autoRaf: false,
    duration: 1.15,
    wheelMultiplier: 1,
    smoothWheel: true,
    anchors: false,
  });

  lenis.on("scroll", (l: Lenis) => {
    publish(Math.min(Math.max(l.scroll / trackLength(), 0), 1), l.velocity);
    ScrollTrigger.update();
  });

  tick = (time: number) => lenis?.raf(time * 1000);
  gsap.ticker.add(tick);
  gsap.ticker.lagSmoothing(0);

  publish(Math.min(Math.max(lenis.scroll / trackLength(), 0), 1), 0);
  setScroller(lenis);
  return lenis;
}

export function stopLenis() {
  if (tick) gsap.ticker.remove(tick);
  setScroller(null);
  lenis?.destroy();
  lenis = null;
  tick = null;
}

export function getLenis(): Lenis | null {
  return lenis;
}

/** Jump to a scene's first hold. `immediate` for reduced motion. */
export function scrollToScene(index: number, immediate = false) {
  const target = sceneStartProgress(index) * trackLength();
  if (lenis) lenis.scrollTo(target, { immediate, duration: 1.6, easing: (t) => 1 - Math.pow(1 - t, 3) });
  else window.scrollTo({ top: target, behavior: immediate ? "auto" : "smooth" });
}
