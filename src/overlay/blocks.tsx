"use client";

/**
 * Content blocks shared by the overlay (FULL/LITE) and the static story.
 * Visual text is aria-hidden — the semantic mirror is the accessible copy —
 * while links stay real, focusable and outside any aria-hidden subtree.
 */

import { facts } from "@/content/facts";
import { contactGroups } from "@/content/people";
import { useI18n } from "@/lib/i18n-context";
import { formatFact, toTelHref } from "@/lib/format";

export { Eyebrow } from "./Eyebrow";

export function ProofCluster() {
  const { dict, locale } = useI18n();
  const p = dict.scenes.omOss.proof;
  return (
    <dl aria-hidden="true" className="grid grid-cols-1 gap-6 border-t border-white/10 pt-8 sm:grid-cols-3">
      <div>
        <dt className="label text-rim">{p.yearsLabel}</dt>
        <dd className="display mt-2 text-5xl font-extrabold text-offwhite">{formatFact("years_in_business", locale)}</dd>
      </div>
      <div>
        <dt className="label text-rim">{p.certifiedLabel}</dt>
        <dd className="mt-3 flex flex-wrap gap-2">
          {[facts.cert_iso9001.value, facts.cert_iso14001.value].map((cert) => (
            <span key={cert} className="label rounded border border-amber/60 px-3 py-2 text-offwhite">
              {cert}
            </span>
          ))}
        </dd>
      </div>
      <div>
        <dt className="label text-rim">{p.groupLabel}</dt>
        <dd className="display mt-3 text-2xl font-bold text-offwhite">{facts.parent_group.value}</dd>
      </div>
    </dl>
  );
}

export function Card({ index, title, body, accent }: { index: number; title: string; body: string; accent?: string }) {
  return (
    <article aria-hidden="true" className="relative border-t border-white/15 pt-5">
      <span className="absolute -top-px left-0 h-px w-12" style={{ background: accent ?? "var(--color-amber)" }} />
      <p className="label text-rim">{String(index + 1).padStart(2, "0")}</p>
      <h3 className="display mt-3 text-2xl font-bold text-offwhite">{title}</h3>
      <p className="mt-3 max-w-md text-base leading-relaxed text-mist">{body}</p>
    </article>
  );
}

export function ContactDetails() {
  const { dict } = useI18n();
  const l = dict.scenes.kontakt.labels;
  const link = "text-offwhite underline decoration-amber/70 underline-offset-4 hover:decoration-amber";
  return (
    <dl className="grid grid-cols-1 gap-6 text-sm sm:grid-cols-2 lg:grid-cols-4">
      <div>
        <dt className="label text-rim">{l.address}</dt>
        <dd className="mt-2 text-offwhite">
          {facts.street.value}
          <br />
          {facts.postal_code.value} {facts.city.value}
        </dd>
      </div>
      <div>
        <dt className="label text-rim">{l.phone}</dt>
        <dd className="mt-2">
          <a className={link} href={toTelHref(facts.phone_main.value)}>
            {facts.phone_main.value}
          </a>
        </dd>
      </div>
      <div>
        <dt className="label text-rim">{l.email}</dt>
        <dd className="mt-2 space-y-1">
          <a className={`${link} block`} href={`mailto:${facts.email_info.value}`}>
            {facts.email_info.value}
          </a>
          <span className="block text-mist">
            {l.orderEmail}:{" "}
            <a className={link} href={`mailto:${facts.email_order.value}`}>
              {facts.email_order.value}
            </a>
          </span>
        </dd>
      </div>
      <div>
        <dt className="label text-rim">{l.hours}</dt>
        <dd className="mt-2 text-offwhite">
          {l.monThu} {facts.hours_mon_thu.value}
          <br />
          {l.fri} {facts.hours_fri.value}
        </dd>
      </div>
    </dl>
  );
}

export function PeopleDirectory() {
  const { dict, tr } = useI18n();
  const k = dict.scenes.kontakt;
  return (
    <div className="grid grid-cols-1 gap-x-10 gap-y-8 sm:grid-cols-2 xl:grid-cols-4">
      {contactGroups.map((group) => (
        <section key={group.id} aria-labelledby={`people-${group.id}`}>
          <h3 id={`people-${group.id}`} className="label text-amber">
            {k.groups[group.id]}
          </h3>
          <ul className="mt-3 space-y-2.5">
            {group.people.map((p) => (
              <li key={p.name + p.role} className="text-sm leading-snug">
                <span className="block text-offwhite">{p.name}</span>
                <span className="block text-xs text-mist">{dict.roles[p.role]}</span>
                <a
                  href={toTelHref(p.phone)}
                  aria-label={tr(k.callPerson, { name: p.name })}
                  className="text-xs text-rim underline decoration-white/20 underline-offset-2 hover:text-offwhite"
                >
                  {p.phone}
                </a>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
