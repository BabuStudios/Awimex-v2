"use client";

import { useI18n } from "@/lib/i18n-context";
import { BliKundButton } from "./BliKundButton";
import { Eyebrow } from "./Eyebrow";

/**
 * The hero copy — identical in the server render, the STATIC story and the 3D
 * overlay, so the first paint never shifts when the tier resolves. The
 * headline is the LCP element: plain DOM text, painted immediately, never
 * hidden behind an entrance animation.
 */
export function HeroCopy() {
  const { dict, tr } = useI18n();
  const h = dict.scenes.hero;
  return (
    <div className="max-w-3xl">
      <Eyebrow>{h.eyebrow}</Eyebrow>
      <p aria-hidden="true" className="display mt-6 text-[clamp(2.6rem,6.2vw,5.8rem)] font-extrabold">
        {h.heading}
      </p>
      <p aria-hidden="true" className="mt-6 max-w-xl text-lg leading-relaxed text-mist">
        {tr(h.subhead)}
      </p>
      <div className="mt-10">
        <BliKundButton id="hero" size="lg" />
      </div>
    </div>
  );
}

/** Content frame shared by every scene presentation (server hero, static story, overlay). */
export function SceneFrame({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto flex min-h-[100svh] max-w-[1600px] flex-col justify-center px-5 py-28 sm:px-10">{children}</div>;
}

export const heroAtmosphere =
  "radial-gradient(ellipse 60% 40% at 66% 52%, rgb(255 164 27 / 0.28), transparent 70%), radial-gradient(ellipse 90% 60% at 50% 100%, #1a1e23, #0b0d10 70%)";
