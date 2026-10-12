"use client";

/**
 * The DOM overlay over the 3D world (FULL / LITE). One panel per scene,
 * cross-faded as the camera arrives; the two locked scenes swap a card per
 * stop. Headlines are SplitText line reveals synced to scene arrival.
 *
 * Visual text is aria-hidden (the semantic mirror is the accessible copy);
 * links and buttons are real. Inactive panels are `inert`, so keyboard focus
 * only ever lands on what is on screen.
 */

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { areas, productFamilies } from "@/content/content";
import { useEngine } from "@/engine/scroll/store";
import { useI18n } from "@/lib/i18n-context";
import { gsap } from "@/lib/motion";
import { BliKundButton } from "./BliKundButton";
import { Eyebrow } from "./Eyebrow";
import { HeroCopy, SceneFrame } from "./HeroCopy";
import { SplitHeading } from "./SplitHeading";

function Panel({ active, initiallyVisible = false, children }: { active: boolean; initiallyVisible?: boolean; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useGSAP(
    () => {
      gsap.to(ref.current, {
        autoAlpha: active ? 1 : 0,
        y: active ? 0 : 14,
        duration: active ? 0.9 : 0.45,
        delay: active ? 0.15 : 0,
        ease: "babu.glide",
      });
    },
    { dependencies: [active] },
  );
  return (
    <div
      ref={ref}
      inert={!active}
      className="pointer-events-none absolute inset-0"
      style={initiallyVisible ? undefined : { opacity: 0, visibility: "hidden" }}
    >
      <div className="pointer-events-auto h-full">{children}</div>
    </div>
  );
}

/** The per-stop card in a locked scene. Re-keyed per stop so it re-enters. */
function StopCard({ index, total, title, body, accent, footnote }: { index: number; total: number; title: string; body: string; accent: string; footnote?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useGSAP(() => {
    gsap.from(ref.current, { autoAlpha: 0, x: -16, duration: 0.7, ease: "babu.glide" });
  });
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    <div ref={ref} aria-hidden="true" className="mt-10 max-w-md border-l-2 pl-6" style={{ borderColor: accent }}>
      <p className="label text-rim">
        {pad(index + 1)} <span className="text-white/30">/</span> {pad(total)}
      </p>
      <p className="display mt-3 text-3xl font-bold text-offwhite sm:text-4xl">{title}</p>
      <p className="mt-3 text-base leading-relaxed text-mist">{body}</p>
      {footnote && <p className="mt-6 text-sm text-mist/80">{footnote}</p>}
    </div>
  );
}

export function Overlay() {
  const { dict, tr } = useI18n();
  const scene = useEngine((s) => s.scene);
  const stop = useEngine((s) => s.stop);
  const s = dict.scenes;
  const heading = "display mt-6 text-[clamp(2.2rem,4.6vw,4.2rem)] font-extrabold";
  const stopIndex = Math.max(stop, 0);

  return (
    <div className="pointer-events-none fixed inset-0 z-10" style={{ background: "var(--scrim)" }}>
      <Panel active={scene === 0} initiallyVisible>
        <SceneFrame>
          <HeroCopy />
        </SceneFrame>
      </Panel>

      <Panel active={scene === 1}>
        <SceneFrame>
          <div className="max-w-xl">
            <Eyebrow>{s.omOss.eyebrow}</Eyebrow>
            <SplitHeading as="p" play={scene === 1} className={heading}>
              {s.omOss.heading}
            </SplitHeading>
            <p aria-hidden="true" className="mt-6 text-base leading-relaxed text-mist sm:text-lg">
              {tr(s.omOss.lead)}
            </p>
            <dl aria-hidden="true" className="mt-10 space-y-5">
              {Object.values(s.omOss.pillars).map((pillar) => (
                <div key={pillar.title} className="border-l border-amber/50 pl-5">
                  <dt className="display text-xl font-bold text-offwhite">{pillar.title}</dt>
                  <dd className="mt-1 hidden text-sm leading-relaxed text-mist sm:block">{tr(pillar.body)}</dd>
                </div>
              ))}
            </dl>
          </div>
        </SceneFrame>
      </Panel>

      <Panel active={scene === 2}>
        <SceneFrame>
          <div className="max-w-xl">
            <Eyebrow>{s.produkter.eyebrow}</Eyebrow>
            <SplitHeading as="p" play={scene === 2} className={heading}>
              {s.produkter.heading}
            </SplitHeading>
            <p aria-hidden="true" className="mt-6 hidden text-base leading-relaxed text-mist sm:block">
              {s.produkter.lead}
            </p>
            {scene === 2 && (
              <StopCard
                key={`p${stopIndex}`}
                index={stopIndex}
                total={productFamilies.length}
                title={s.produkter.families[productFamilies[stopIndex]!.id].title}
                body={s.produkter.families[productFamilies[stopIndex]!.id].body}
                accent={productFamilies[stopIndex]!.accent}
                footnote={stopIndex === productFamilies.length - 1 ? s.produkter.more : undefined}
              />
            )}
          </div>
        </SceneFrame>
      </Panel>

      <Panel active={scene === 3}>
        <SceneFrame>
          <div className="max-w-xl">
            <Eyebrow>{s.verksamhet.eyebrow}</Eyebrow>
            <SplitHeading as="p" play={scene === 3} className={heading}>
              {s.verksamhet.heading}
            </SplitHeading>
            <p aria-hidden="true" className="mt-6 hidden text-base leading-relaxed text-mist sm:block">
              {s.verksamhet.lead}
            </p>
            {scene === 3 && (
              <StopCard
                key={`v${stopIndex}`}
                index={stopIndex}
                total={areas.length}
                title={s.verksamhet.areas[areas[stopIndex]!.id].title}
                body={s.verksamhet.areas[areas[stopIndex]!.id].body}
                accent={areas[stopIndex]!.beacon}
              />
            )}
          </div>
        </SceneFrame>
      </Panel>

      <Panel active={scene === 4}>
        <SceneFrame>
          <div className="max-w-2xl">
            <Eyebrow>{s.kontakt.eyebrow}</Eyebrow>
            <SplitHeading as="p" play={scene === 4} className={heading}>
              {s.kontakt.heading}
            </SplitHeading>
            <p aria-hidden="true" className="mt-6 text-base leading-relaxed text-mist sm:text-lg">
              {tr(s.kontakt.lead)}
            </p>
            <div className="mt-10">
              <BliKundButton id="kontakt" size="lg" />
            </div>
          </div>
        </SceneFrame>
      </Panel>
    </div>
  );
}
