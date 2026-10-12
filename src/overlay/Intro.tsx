"use client";

/**
 * Intro & loading choreography (FULL / LITE).
 *
 * It never covers the page: the server-rendered headline is already on
 * screen (it is the LCP element) while this runs.
 *  - The nav wordmark draws itself (DrawSVG), then fills.
 *  - A hairline under the nav tracks REAL loading: renderer init → shader
 *    compile (engine.loadProgress), not a timer.
 *  - When both are done — or after the 4 s cap — `introDone` flips: the
 *    canvas fades in and the hero light bar powers on. If the world is still
 *    compiling at the cap, it fades in at its current quality when ready.
 */

import { useEffect, useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import { intro } from "@/content/content";
import { engine, useEngine } from "@/engine/scroll/store";
import { useI18n } from "@/lib/i18n-context";
import { gsap, prefersReducedMotion, registerMotion } from "@/lib/motion";

export function Intro() {
  const { dict } = useI18n();
  const load = useEngine((s) => s.loadProgress);
  const ready = useEngine((s) => s.worldReady);
  const done = useEngine((s) => s.introDone);
  const [drawn, setDrawn] = useState(false);
  const bar = useRef<HTMLDivElement>(null);

  // Draw the wordmark once.
  useGSAP(() => {
    const letters = document.querySelectorAll<SVGPathElement>("header [data-wordmark] .letter");
    if (!letters.length || prefersReducedMotion()) {
      setDrawn(true);
      return;
    }
    registerMotion();
    gsap
      .timeline({ onComplete: () => setDrawn(true) })
      .set(letters, { attr: { stroke: "currentColor", "stroke-width": 1.2 }, fillOpacity: 0 })
      .fromTo(letters, { drawSVG: "0%" }, { drawSVG: "100%", duration: 1.1, stagger: 0.09, ease: "babu.glide" })
      .to(letters, { fillOpacity: 1, duration: 0.5, stagger: 0.05, ease: "babu.glide" }, "-=0.35")
      .set(letters, { attr: { "stroke-width": 0 } });
  });

  // Hard cap: never hold the experience longer than maxWaitMs.
  useEffect(() => {
    const t = window.setTimeout(() => engine.setState({ introDone: true }), intro.maxWaitMs);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    if (drawn && ready) engine.setState({ introDone: true });
  }, [drawn, ready]);

  // The hairline follows real progress, then leaves.
  useGSAP(
    () => {
      if (!bar.current) return;
      gsap.to(bar.current, { scaleX: Math.max(load, 0.04), duration: 0.6, ease: "babu.glide" });
      if (done) gsap.to(bar.current, { autoAlpha: 0, duration: 0.6, delay: 0.3, ease: "babu.glide" });
    },
    { dependencies: [load, done] },
  );

  return (
    <div
      ref={bar}
      role="progressbar"
      aria-label={dict.intro.loading}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(load * 100)}
      className="pointer-events-none fixed inset-x-0 top-0 z-50 h-[2px] origin-left bg-amber"
      style={{ transform: "scaleX(0.04)" }}
    />
  );
}
