"use client";

/**
 * Ambient audio. Mounts ONLY when `audio.enabled && audio.ambientSrc` — the
 * exact condition the Phase 5 gate checks (an `enabled` flag alone with no
 * source must never produce a silent toggle).
 *
 * Always off by default; a visible toggle starts it, so playback only ever
 * follows a user gesture. Currently disabled in content.ts (Phase 2 decision).
 */

import { useRef, useState } from "react";
import { audio } from "@/content/content";
import { useI18n } from "@/lib/i18n-context";

function AudioToggle({ src }: { src: string }) {
  const { dict } = useI18n();
  const el = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);

  const toggle = async () => {
    const a = el.current;
    if (!a) return;
    if (playing) {
      a.pause();
      setPlaying(false);
    } else {
      a.volume = 0.5;
      await a.play().catch(() => undefined);
      setPlaying(!a.paused);
    }
  };

  return (
    <>
      <audio ref={el} src={src} loop preload="none" />
      <button
        type="button"
        onClick={toggle}
        aria-pressed={playing}
        className="label fixed bottom-5 right-5 z-40 rounded-full border border-white/20 bg-asphalt/70 px-4 py-3 text-offwhite"
      >
        {playing ? dict.audio.off : dict.audio.on}
      </button>
    </>
  );
}

export function AudioManager() {
  if (!(audio.enabled && audio.ambientSrc)) return null;
  return <AudioToggle src={audio.ambientSrc} />;
}
