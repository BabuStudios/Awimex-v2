import { areas, productFamilies, scenes } from "@/content/content";
import { facts } from "@/content/facts";
import { contactGroups } from "@/content/people";
import type { Dictionary, Locale } from "@/content/i18n";
import { formatFact, t, toTelHref } from "@/lib/format";
import { externalLinks } from "@/content/content";

/**
 * The content. Every scene's heading, copy and facts as semantic HTML,
 * server-rendered, visually hidden. The 3D world and the visual overlay are
 * decorative (aria-hidden); crawlers and screen readers read this.
 * Links are tabIndex -1 so sighted keyboard users never land on invisible
 * focus — they use the visible nav and CTAs; screen readers still follow them.
 * Section ids are the scene anchors (#om-oss …), so hash links resolve in the
 * server HTML of every tier; the visible layers scroll there in JS.
 */
export function SemanticMirror({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const s = dict.scenes;
  const [hero, omOss, produkter, verksamhet, kontakt] = scenes;

  return (
    <main id="innehall" className="sr-only">
      <section id={hero.anchor} aria-labelledby="m-hero">
        <p>{s.hero.eyebrow}</p>
        <h1 id="m-hero">{s.hero.heading}</h1>
        <p>{t(s.hero.subhead, locale)}</p>
        <a href={externalLinks.becomeCustomer.href} tabIndex={-1}>
          {dict.cta.primary}
        </a>
      </section>

      <section id={omOss.anchor} aria-labelledby="m-om">
        <p>{s.omOss.eyebrow}</p>
        <h2 id="m-om">{s.omOss.heading}</h2>
        <p>{t(s.omOss.lead, locale)}</p>
        {Object.entries(s.omOss.pillars).map(([id, pillar]) => (
          <div key={id}>
            <h3>{pillar.title}</h3>
            <p>{t(pillar.body, locale)}</p>
          </div>
        ))}
        <dl>
          <dt>{s.omOss.proof.yearsLabel}</dt>
          <dd>{formatFact("years_in_business", locale)}</dd>
          <dt>{s.omOss.proof.certifiedLabel}</dt>
          <dd>{facts.cert_iso9001.value}</dd>
          <dd>{facts.cert_iso14001.value}</dd>
          <dt>{s.omOss.proof.groupLabel}</dt>
          <dd>{facts.parent_group.value}</dd>
        </dl>
      </section>

      <section id={produkter.anchor} aria-labelledby="m-produkter">
        <p>{s.produkter.eyebrow}</p>
        <h2 id="m-produkter">{s.produkter.heading}</h2>
        <p>{s.produkter.lead}</p>
        {productFamilies.map((f) => (
          <div key={f.id}>
            <h3>{s.produkter.families[f.id].title}</h3>
            <p>{s.produkter.families[f.id].body}</p>
          </div>
        ))}
        <p>{s.produkter.more}</p>
      </section>

      <section id={verksamhet.anchor} aria-labelledby="m-verksamhet">
        <p>{s.verksamhet.eyebrow}</p>
        <h2 id="m-verksamhet">{s.verksamhet.heading}</h2>
        <p>{s.verksamhet.lead}</p>
        {areas.map((a) => (
          <div key={a.id}>
            <h3>{s.verksamhet.areas[a.id].title}</h3>
            <p>{s.verksamhet.areas[a.id].body}</p>
          </div>
        ))}
      </section>

      <section id={kontakt.anchor} aria-labelledby="m-kontakt">
        <p>{s.kontakt.eyebrow}</p>
        <h2 id="m-kontakt">{s.kontakt.heading}</h2>
        <p>{t(s.kontakt.lead, locale)}</p>
        <dl>
          <dt>{s.kontakt.labels.address}</dt>
          <dd>
            {facts.street.value}, {facts.postal_code.value} {facts.city.value}
          </dd>
          <dt>{s.kontakt.labels.phone}</dt>
          <dd>
            <a href={toTelHref(facts.phone_main.value)} tabIndex={-1}>
              {facts.phone_main.value}
            </a>
          </dd>
          <dt>{s.kontakt.labels.email}</dt>
          <dd>
            <a href={`mailto:${facts.email_info.value}`} tabIndex={-1}>
              {facts.email_info.value}
            </a>
          </dd>
          <dt>{s.kontakt.labels.orderEmail}</dt>
          <dd>
            <a href={`mailto:${facts.email_order.value}`} tabIndex={-1}>
              {facts.email_order.value}
            </a>
          </dd>
          <dt>{s.kontakt.labels.hours}</dt>
          <dd>
            {s.kontakt.labels.monThu} {facts.hours_mon_thu.value}
          </dd>
          <dd>
            {s.kontakt.labels.fri} {facts.hours_fri.value}
          </dd>
        </dl>
        {contactGroups.map((group) => (
          <div key={group.id}>
            <h3>{s.kontakt.groups[group.id]}</h3>
            <ul>
              {group.people.map((p) => (
                <li key={`${group.id}-${p.name}`}>
                  {p.name}, {dict.roles[p.role]},{" "}
                  <a href={toTelHref(p.phone)} tabIndex={-1}>
                    {p.phone}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
        <a href={externalLinks.becomeCustomer.href} tabIndex={-1}>
          {dict.cta.primary}
        </a>
      </section>

      <footer>
        <p>{t(dict.footer.legal, locale)}</p>
        <p>{t(dict.footer.group, locale)}</p>
      </footer>
    </main>
  );
}
