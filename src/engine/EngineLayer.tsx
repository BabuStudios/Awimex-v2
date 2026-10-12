"use client";

/**
 * FULL / LITE presentation: Lenis + scroll track + DOM overlay, with the 3D
 * canvas behind it. The canvas (three.js + R3F) is its own dynamic chunk and
 * starts downloading only after this layer has painted and is interactive.
 *
 * `?capture` hides the DOM layers so scripts/capture-posters.mjs can shoot
 * clean scene posters.
 */

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { scenes } from "@/content/content";
import { engine, useEngine } from "@/engine/scroll/store";
import { startLenis, stopLenis, scrollToScene } from "@/engine/scroll/lenis";
import { TRACK_VH } from "@/engine/scroll/timeline";
import { track } from "@/lib/analytics";
import { ContactSection } from "@/overlay/ContactSection";
import { Intro } from "@/overlay/Intro";
import { Nav } from "@/overlay/Nav";
import { Overlay } from "@/overlay/Overlay";

const Canvas3D = dynamic(() => import("./Canvas3D"), { ssr: false });

const DEPTHS = [25, 50, 75, 100] as const;

export default function EngineLayer() {
  const profile = useEngine((s) => s.profile);
  const scene = useEngine((s) => s.scene);
  const introDone = useEngine((s) => s.introDone);
  const worldReady = useEngine((s) => s.worldReady);
  const [capture, setCapture] = useState(false);

  useEffect(() => {
    setCapture(new URLSearchParams(window.location.search).has("capture"));
    startLenis();
    engine.setState({ loadProgress: 0.1 });
    const onPointer = (e: PointerEvent) => {
      engine.setState({
        pointer: { x: (e.clientX / window.innerWidth) * 2 - 1, y: -(e.clientY / window.innerHeight) * 2 + 1 },
      });
    };
    window.addEventListener("pointermove", onPointer, { passive: true });

    // Scroll-depth analytics, read transiently from the store (no re-render).
    const reached = new Set<number>();
    const unsubscribe = engine.subscribe((s) => {
      for (const d of DEPTHS) {
        if (s.progress * 100 >= d && !reached.has(d)) {
          reached.add(d);
          track({ name: "scroll_depth", value: d });
        }
      }
    });

    return () => {
      unsubscribe();
      window.removeEventListener("pointermove", onPointer);
      stopLenis();
    };
  }, []);

  useEffect(() => {
    track({ name: "scene_enter", id: scenes[scene]!.id });
  }, [scene]);

  // Capture mode has no intro: the world counts as introduced once ready.
  useEffect(() => {
    if (capture && worldReady) engine.setState({ introDone: true });
  }, [capture, worldReady]);

  return (
    <>
      {profile && (
        <div
          className="fixed inset-0 z-0 transition-opacity duration-[1400ms]"
          style={{ opacity: worldReady && introDone ? 1 : 0 }}
        >
          <Canvas3D profile={profile} />
        </div>
      )}

      {!capture && (
        <>
          <Intro />
          <Nav onNavigate={(i) => scrollToScene(i)} activeScene={scene} />
          <Overlay />
        </>
      )}

      {/* The scroll track: its height is the whole camera journey. */}
      <div aria-hidden="true" style={{ height: `calc(${TRACK_VH}vh + 100vh)` }} />

      {!capture && <ContactSection />}
    </>
  );
}
