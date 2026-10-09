/**
 * The single place where facts, numbers and phone numbers become text.
 * Copy never formats a value itself; it interpolates through `t()`.
 */

import { facts, type Fact, type FactId } from "@/content/facts";
import type { Locale } from "@/content/i18n";

const intlLocale: Record<Locale, string> = { sv: "sv-SE" };

export function formatNumber(value: number, locale: Locale): string {
  return new Intl.NumberFormat(intlLocale[locale]).format(value);
}

/** "30+" for a qualified number, the bare value for text. Missing facts throw: they must never render. */
export function formatFact(id: FactId, locale: Locale, mode: "full" | "plain" = "full"): string {
  const fact: Fact = facts[id];
  switch (fact.kind) {
    case "number": {
      const n = formatNumber(fact.value, locale);
      return mode === "full" && fact.qualifier === "plus" ? `${n}+` : n;
    }
    case "text":
      return fact.value;
    case "missing":
      throw new Error(`Fact "${id}" is MISSING and must not be rendered.`);
  }
}

export function isFactAvailable(id: FactId): boolean {
  return facts[id].kind !== "missing";
}

const TOKEN = /\{(fact:)?([a-z0-9_]+)(\|plain)?\}/gi;

/**
 * Interpolates `{fact:id}`, `{fact:id|plain}` and named `{vars}`.
 * An unknown token is a build-time error, never silently left in the page.
 */
export function t(template: string, locale: Locale, vars: Record<string, string> = {}): string {
  return template.replace(TOKEN, (_match, isFact: string | undefined, key: string, plain: string | undefined) => {
    if (isFact) {
      if (!(key in facts)) throw new Error(`Unknown fact "${key}" in copy: "${template}"`);
      return formatFact(key as FactId, locale, plain ? "plain" : "full");
    }
    const value = vars[key];
    if (value === undefined) throw new Error(`Missing variable "${key}" in copy: "${template}"`);
    return value;
  });
}

/** "0767-60 07 19" → "+46767600719". Swedish numbers only, as published on awimex.se. */
export function toTelHref(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return `tel:+46${digits.replace(/^0/, "")}`;
}
