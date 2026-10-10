"use client";

import { useState } from "react";
import { scenes } from "@/content/scenes";
import { useI18n } from "@/lib/i18n-context";
import { BliKundButton } from "./BliKundButton";
import { Wordmark } from "./Wordmark";

/**
 * Persistent navigation with the primary action reachable from every scene.
 * `onNavigate` lets the 3D experience translate a scene into a camera jump;
 * the static story passes nothing and the anchors scroll natively.
 */
export function Nav({ onNavigate, activeScene }: { onNavigate?: (index: number) => void; activeScene?: number }) {
  const { dict } = useI18n();
  const [menuOpen, setMenuOpen] = useState(false);
  const links = scenes.slice(1);

  const go = (index: number) => (e: React.MouseEvent) => {
    setMenuOpen(false);
    if (!onNavigate) return;
    e.preventDefault();
    onNavigate(index);
  };

  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-40">
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-asphalt/90 to-transparent"
      />
      <div className="pointer-events-auto relative mx-auto flex max-w-[1600px] items-center justify-between gap-6 px-5 py-5 sm:px-10">
        <a href="#start" onClick={go(0)} className="block text-offwhite" aria-label={`Awimex — ${dict.nav.home}`}>
          <Wordmark className="h-4 w-auto sm:h-5" />
        </a>

        <nav aria-label={dict.a11y.mainNav} className="hidden lg:block">
          <ul className="flex items-center gap-8">
            {links.map((scene, i) => (
              <li key={scene.id}>
                <a
                  href={`#${scene.anchor}`}
                  onClick={go(i + 1)}
                  aria-current={activeScene === i + 1 ? "true" : undefined}
                  className="label text-mist transition-colors hover:text-offwhite aria-[current=true]:text-amber"
                >
                  {dict.nav[scene.nav]}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-3">
          <BliKundButton id="nav" />
          <button
            type="button"
            className="label rounded-full border border-white/20 px-4 py-3 text-offwhite lg:hidden"
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            onClick={() => setMenuOpen((v) => !v)}
          >
            <span className="sr-only">{menuOpen ? dict.a11y.closeMenu : dict.a11y.openMenu}</span>
            <svg aria-hidden="true" viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
              {menuOpen ? <path d="M3 3l10 10M13 3 3 13" /> : <path d="M2 4h12M2 8h12M2 12h12" />}
            </svg>
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav id="mobile-menu" aria-label={dict.a11y.mainNav} className="pointer-events-auto relative bg-asphalt/95 px-5 pb-8 lg:hidden">
          <ul className="space-y-1">
            {links.map((scene, i) => (
              <li key={scene.id}>
                <a href={`#${scene.anchor}`} onClick={go(i + 1)} className="display block py-3 text-3xl font-bold text-offwhite">
                  {dict.nav[scene.nav]}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}
