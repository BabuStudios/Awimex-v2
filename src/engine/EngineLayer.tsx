"use client";

/**
 * FULL / LITE presentation: Lenis + scroll track + DOM overlay, with the 3D
 * canvas behind it. The canvas (three.js + R3F) is its own dynamic chunk and
 * starts downloading only after this layer has painted and is interactive.
 */

import dynamic from "next/dynamic";
import { useEffect, useRef } from "react";
import { useGSAP } from "@gsap/react";
import { engine, useEngine } from "@/engine/scroll/store";
import { startLenis, stopLenis, scrollToScene } from "@/engine/scroll/lenis";
import { TRACK_VH } from "@/engine/scroll/timeline";
import { gsap } from "@/lib/motion";
import { HeroCopy, SceneFrame } from "@/overlay/HeroCopy";
import { Nav } from "@/overlay/Nav";

const Canvas3D = dynamic(() => import("./Canvas3D"), { ssr: false });

export default function EngineLayer() {
  const profile = useEngine((s) => s.profile);
  const scene = useEngine((s) => s.scene);
  const worldReady = useEngine((s) => s.worldReady);
  const hero = useRef<HTMLDivElement>(null);

  useEffect(() => {
    startLenis();
    const onPointer = (e: PointerEvent) => {
      engine.setState({
        pointer: { x: (e.clientX / window.innerWidth) * 2 - 1, y: -(e.clientY / window.innerHeight) * 2 + 1 },
      });
    };
    window.addEventListener("pointermove", onPointer, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onPointer);
      stopLenis();
    };
  }, []);

  // Until the intro lands (4d), the world counts as introduced once it is ready.
  useEffect(() => {
    if (worldReady) engine.setState({ introDone: true });
  }, [worldReady]);

  useGSAP(
    () => {
      gsap.to(hero.current, { autoAlpha: scene === 0 ? 1 : 0, duration: 0.6, ease: "babu.glide" });
    },
    { dependencies: [scene] },
  );

  return (
    <>
      {profile && (
        <div
          className="fixed inset-0 z-0 transition-opacity duration-[1400ms]"
          style={{ opacity: worldReady ? 1 : 0 }}
        >
          <Canvas3D profile={profile} />
        </div>
      )}

      <Nav onNavigate={(i) => scrollToScene(i)} activeScene={scene} />

      <div ref={hero} className="pointer-events-none fixed inset-0 z-10" style={{ background: "var(--scrim)" }}>
        <div className="pointer-events-auto">
          <SceneFrame>
            <HeroCopy />
          </SceneFrame>
        </div>
      </div>

      {/* The scroll track: its height is the whole journey. */}
      <div aria-hidden="true" style={{ height: `calc(${TRACK_VH}vh + 100vh)` }} />
    </>
  );
}
