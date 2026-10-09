import { Fragment, type ReactNode } from "react";
import type { Locale } from "@/content/i18n";
import { t } from "./format";

/**
 * Like t(), but lets chosen tokens render as elements, e.g. a fact as a link:
 *   rich(dict.bridge.orCall, locale, { "fact:phone_main": (v) => <a href=…>{v}</a> })
 * Tokens without a renderer are interpolated as text.
 */
export function rich(
  template: string,
  locale: Locale,
  renderers: Record<string, (value: string) => ReactNode>,
  vars: Record<string, string> = {},
): ReactNode {
  const parts = template.split(/(\{[^}]+\})/g);
  return parts.map((part, i) => {
    const key = part.startsWith("{") ? part.slice(1, -1).replace(/\|plain$/, "") : null;
    const value = part.startsWith("{") ? t(part, locale, vars) : part;
    const render = key ? renderers[key] : undefined;
    return <Fragment key={i}>{render ? render(value) : value}</Fragment>;
  });
}
