"use client";

import { useEffect, useRef } from "react";
import { externalLinks } from "@/content/content";
import { facts } from "@/content/facts";
import { useI18n } from "@/lib/i18n-context";
import { toTelHref } from "@/lib/format";
import { rich } from "@/lib/rich";
import { track } from "@/lib/analytics";
import { pauseScroll, resumeScroll } from "@/engine/scroll/handle";
import { useUi } from "./ui-store";

/**
 * The branded bridge between the cinematic site and the legacy customer form
 * on awimex.se (Phase 2, D1 = a). Native <dialog>: focus trap, Esc and
 * inert background come from the platform.
 */
export function BridgeModal() {
  const { dict, locale } = useI18n();
  const open = useUi((s) => s.bridgeOpen);
  const close = useUi((s) => s.closeBridge);
  const ref = useRef<HTMLDialogElement>(null);
  const b = dict.bridge;

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      pauseScroll();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby="bridge-title"
      onClose={() => {
        resumeScroll();
        close();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
      className="m-auto w-[min(92vw,34rem)] rounded-2xl border border-white/10 bg-graphite p-0 text-offwhite shadow-2xl"
    >
      <div className="p-8 sm:p-10">
        <div className="mb-6 h-1 w-14 bg-amber" aria-hidden="true" />
        <h2 id="bridge-title" className="display text-3xl font-extrabold sm:text-4xl">
          {b.title}
        </h2>
        <p className="mt-4 text-base leading-relaxed text-mist">{b.body}</p>

        <h3 className="label mt-8 text-rim">{b.needsHeading}</h3>
        <ul className="mt-3 space-y-2 text-sm text-offwhite">
          {Object.values(b.needs).map((need) => (
            <li key={need} className="flex gap-3">
              <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber" />
              {need}
            </li>
          ))}
        </ul>

        <div className="mt-10 flex flex-wrap items-center gap-4">
          <a
            href={externalLinks.becomeCustomer.href}
            target="_blank"
            rel="noopener"
            onClick={() => {
              track({ name: "cta_click", id: "bridge_continue" });
              close();
            }}
            className="label inline-flex items-center gap-3 rounded-full bg-amber px-7 py-4 text-sm text-asphalt transition-colors hover:bg-offwhite"
          >
            {b.continue}
            <span className="sr-only">({dict.a11y.newTab})</span>
            <svg aria-hidden="true" viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 3h8v8M13 3 3 13" />
            </svg>
          </a>
          <button type="button" onClick={close} className="label px-3 py-4 text-mist transition-colors hover:text-offwhite">
            {b.cancel}
          </button>
        </div>

        <p className="mt-8 border-t border-white/10 pt-6 text-sm text-mist">
          {rich(b.orCall, locale, {
            "fact:phone_main": (value) => (
              <a href={toTelHref(facts.phone_main.value)} className="text-offwhite underline decoration-amber underline-offset-4">
                {value}
              </a>
            ),
          })}
        </p>
      </div>
    </dialog>
  );
}
