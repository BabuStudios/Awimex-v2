/**
 * One RAF for scroll and GSAP: Lenis is driven by gsap.ticker, and R3F's
 * frameloop renders from the same browser frame. Lenis writes progress and
 * velocity into the engine store; nothing else listens to scroll.
 */

import Lenis from "lenis";
import { gsap, ScrollTrigger, registerMotion } from "@/lib/motion";
import { engine } from "./store";
import { sample, sceneStartProgress } from "./timeline";

let lenis: Lenis | null = null;
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
    publish(l.progress || 0, l.velocity);
    ScrollTrigger.update();
  });

  tick = (time: number) => lenis?.raf(time * 1000);
  gsap.ticker.add(tick);
  gsap.ticker.lagSmoothing(0);

  publish(lenis.progress || 0, 0);
  return lenis;
}

export function stopLenis() {
  if (tick) gsap.ticker.remove(tick);
  lenis?.destroy();
  lenis = null;
  tick = null;
}

export function getLenis(): Lenis | null {
  return lenis;
}

/** Jump to a scene's first hold. `immediate` for reduced motion. */
export function scrollToScene(index: number, immediate = false) {
  const target = sceneStartProgress(index) * (lenis?.limit ?? document.documentElement.scrollHeight - innerHeight);
  if (lenis) lenis.scrollTo(target, { immediate, duration: 1.6, easing: (t) => 1 - Math.pow(1 - t, 3) });
  else window.scrollTo({ top: target, behavior: immediate ? "auto" : "smooth" });
}
