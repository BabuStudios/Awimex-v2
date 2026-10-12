"use client";

/**
 * STATIC tier: the whole story without WebGL. Poster per scene (CSS
 * atmosphere until posters are captured), SplitText headlines, CSS
 * parallax ≤ 20px, native scroll. Zero R3F/three imports — this file must
 * stay outside the 3D chunk.
 */

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { areas, productFamilies, scenes, type SceneId } from "@/content/content";
import { useI18n } from "@/lib/i18n-context";
import { gsap, prefersReducedMotion, registerMotion } from "@/lib/motion";
import { BliKundButton } from "@/overlay/BliKundButton";
import { HeroCopy, SceneFrame, heroAtmosphere } from "@/overlay/HeroCopy";
import { Card, ContactDetails, Eyebrow, PeopleDirectory, ProofCluster } from "@/overlay/blocks";
import { Nav } from "@/overlay/Nav";
import { SplitHeading } from "@/overlay/SplitHeading";
import { posters } from "./posters.generated";

/**
 * CSS atmospheres — the documented fallback when a scene poster is missing.
 * Image layers only: a bare colour is not a valid background-image layer and
 * would invalidate the whole declaration (the base colour is set separately).
 */
const atmosphere: Record<SceneId, string> = {
  hero: heroAtmosphere,
  omOss: "radial-gradient(ellipse 80% 35% at 50% 85%, rgb(255 164 27 / 0.16), transparent 70%), linear-gradient(#0b0d10, #1a1e23 70%, #0b0d10)",
  produkter: "radial-gradient(circle at 20% 60%, rgb(255 164 27 / 0.14), transparent 30%), radial-gradient(circle at 80% 40%, rgb(30 107 255 / 0.12), transparent 30%)",
  verksamhet: "radial-gradient(ellipse 50% 40% at 25% 55%, rgb(30 107 255 / 0.2), transparent 70%), radial-gradient(ellipse 50% 40% at 78% 50%, rgb(255 164 27 / 0.18), transparent 70%)",
  kontakt: "linear-gradient(to top, rgb(255 164 27 / 0.22), rgb(159 180 200 / 0.08) 35%, #0b0d10 70%)",
};

function SceneSection({ id, anchor, children }: { id: SceneId; anchor: string; children: React.ReactNode }) {
  const poster = posters[id];
  return (
    <section id={anchor} className="relative isolate overflow-hidden" data-static-scene>
      <div
        data-parallax
        aria-hidden="true"
        className="absolute -inset-y-6 inset-x-0 -z-10 bg-cover bg-center"
        style={{
          backgroundColor: "var(--color-asphalt)",
          backgroundImage: poster ? `url(${poster.src}), ${atmosphere[id]}` : atmosphere[id],
        }}
      />
      <div aria-hidden="true" className="absolute inset-0 -z-10" style={{ background: "var(--scrim)" }} />
      <SceneFrame>{children}</SceneFrame>
    </section>
  );
}

export function StaticStory() {
  const { dict, tr } = useI18n();
  const root = useRef<HTMLDivElement>(null);
  const s = dict.scenes;

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      registerMotion();
      gsap.utils.toArray<HTMLElement>("[data-static-scene]").forEach((section) => {
        const layer = section.querySelector("[data-parallax]");
        if (!layer) return;
        gsap.fromTo(layer, { y: -20 }, { y: 20, ease: "none", scrollTrigger: { trigger: section, start: "top bottom", end: "bottom top", scrub: true } });
      });
    },
    { scope: root },
  );

  return (
    <div ref={root}>
      <Nav />

      <SceneSection id="hero" anchor={scenes[0].anchor}>
        <HeroCopy />
      </SceneSection>

      <SceneSection id="omOss" anchor={scenes[1].anchor}>
        <div className="max-w-3xl">
          <Eyebrow>{s.omOss.eyebrow}</Eyebrow>
          <SplitHeading as="p" scrollTrigger className="display mt-6 text-[clamp(2.2rem,5vw,4.4rem)] font-extrabold">
            {s.omOss.heading}
          </SplitHeading>
          <p aria-hidden="true" className="mt-6 text-lg leading-relaxed text-mist">
            {tr(s.omOss.lead)}
          </p>
        </div>
        <div className="mt-14 grid grid-cols-1 gap-10 md:grid-cols-3">
          {Object.values(s.omOss.pillars).map((pillar, i) => (
            <Card key={pillar.title} index={i} title={pillar.title} body={tr(pillar.body)} />
          ))}
        </div>
        <div className="mt-14">
          <ProofCluster />
        </div>
      </SceneSection>

      <SceneSection id="produkter" anchor={scenes[2].anchor}>
        <div className="max-w-3xl">
          <Eyebrow>{s.produkter.eyebrow}</Eyebrow>
          <SplitHeading as="p" scrollTrigger className="display mt-6 text-[clamp(2.2rem,5vw,4.4rem)] font-extrabold">
            {s.produkter.heading}
          </SplitHeading>
          <p aria-hidden="true" className="mt-6 text-lg leading-relaxed text-mist">
            {s.produkter.lead}
          </p>
        </div>
        <div className="mt-14 grid grid-cols-1 gap-10 sm:grid-cols-2 xl:grid-cols-5">
          {productFamilies.map((f, i) => (
            <Card key={f.id} index={i} title={s.produkter.families[f.id].title} body={s.produkter.families[f.id].body} accent={f.accent} />
          ))}
        </div>
        <p aria-hidden="true" className="mt-12 max-w-2xl text-mist">
          {s.produkter.more}
        </p>
      </SceneSection>

      <SceneSection id="verksamhet" anchor={scenes[3].anchor}>
        <div className="max-w-3xl">
          <Eyebrow>{s.verksamhet.eyebrow}</Eyebrow>
          <SplitHeading as="p" scrollTrigger className="display mt-6 text-[clamp(2.2rem,5vw,4.4rem)] font-extrabold">
            {s.verksamhet.heading}
          </SplitHeading>
          <p aria-hidden="true" className="mt-6 text-lg leading-relaxed text-mist">
            {s.verksamhet.lead}
          </p>
        </div>
        <div className="mt-14 grid grid-cols-1 gap-10 sm:grid-cols-2 xl:grid-cols-5">
          {areas.map((a, i) => (
            <Card key={a.id} index={i} title={s.verksamhet.areas[a.id].title} body={s.verksamhet.areas[a.id].body} accent={a.beacon} />
          ))}
        </div>
      </SceneSection>

      <SceneSection id="kontakt" anchor={scenes[4].anchor}>
        <div className="max-w-3xl">
          <Eyebrow>{s.kontakt.eyebrow}</Eyebrow>
          <SplitHeading as="p" scrollTrigger className="display mt-6 text-[clamp(2.2rem,5vw,4.4rem)] font-extrabold">
            {s.kontakt.heading}
          </SplitHeading>
          <p aria-hidden="true" className="mt-6 text-lg leading-relaxed text-mist">
            {tr(s.kontakt.lead)}
          </p>
          <div className="mt-10">
            <BliKundButton id="static_kontakt" size="lg" />
          </div>
        </div>
        <div className="mt-16">
          <ContactDetails />
        </div>
        <div className="mt-16">
          <PeopleDirectory />
        </div>
        <footer aria-hidden="true" className="mt-20 flex flex-wrap justify-between gap-4 border-t border-white/10 pt-6 text-xs text-mist">
          <span>{tr(dict.footer.legal)}</span>
          <span>{tr(dict.footer.group)}</span>
        </footer>
      </SceneSection>
    </div>
  );
}
