"use client";

/**
 * After the journey ends at dawn, the page continues as ordinary scrolling
 * content over the (now still) world: contact details, the full staff
 * directory, the legal footer. Real, focusable links.
 */

import { useI18n } from "@/lib/i18n-context";
import { ContactDetails, PeopleDirectory } from "./blocks";

export function ContactSection() {
  const { dict, tr } = useI18n();
  return (
    <section id="kontakt-uppgifter" className="relative z-20 bg-[linear-gradient(to_bottom,transparent,var(--color-asphalt)_10rem)] pt-40">
      <div className="mx-auto max-w-[1600px] px-5 pb-16 sm:px-10">
        <ContactDetails />
        <div className="mt-16 border-t border-white/10 pt-12">
          <PeopleDirectory />
        </div>
        <footer aria-hidden="true" className="mt-20 flex flex-wrap justify-between gap-4 border-t border-white/10 pt-6 text-xs text-mist">
          <span>{tr(dict.footer.legal)}</span>
          <span>{tr(dict.footer.group)}</span>
        </footer>
      </div>
    </section>
  );
}
