"use client";

/**
 * Tier switch. The server (and the first client paint) render only the hero
 * frame — DOM text, the LCP element. Once the tier resolves:
 *   STATIC      → StaticStory (no R3F in its import graph; own chunk)
 *   FULL / LITE → scroll track + overlay + the 3D canvas, dynamically imported
 * A mid-session fall to STATIC (adaptive quality) lands here too.
 */

import dynamic from "next/dynamic";
import { useEffect } from "react";
import { engine, useEngine } from "@/engine/scroll/store";
import { detectQuality } from "@/engine/quality/tier";
import { track } from "@/lib/analytics";
import { HeroCopy, SceneFrame, heroAtmosphere } from "@/overlay/HeroCopy";
import { Nav } from "@/overlay/Nav";

// Both presentations are their own chunks: the first paint ships neither
// GSAP nor Lenis nor three — only the hero frame.
const EngineLayer = dynamic(() => import("./EngineLayer"), { ssr: false, loading: () => <HeroFrame /> });
const StaticStory = dynamic(() => import("@/static/StaticStory").then((m) => m.StaticStory), {
  ssr: false,
  loading: () => <HeroFrame />,
});

function HeroFrame() {
  return (
    <div className="relative isolate overflow-hidden" style={{ background: heroAtmosphere }}>
      <Nav />
      <SceneFrame>
        <HeroCopy />
      </SceneFrame>
    </div>
  );
}

export function Experience() {
  const tier = useEngine((s) => s.tier);

  useEffect(() => {
    const profile = detectQuality();
    engine.setState({ tier: profile.tier, backend: profile.backend, profile });
    track({ name: "tier", value: profile.tier });
  }, []);

  if (tier === null) return <HeroFrame />;
  if (tier === "STATIC") return <StaticStory />;
  return <EngineLayer />;
}
