"use client";

import { createContext, useContext } from "react";
import type { Dictionary, Locale } from "@/content/i18n";
import { t } from "./format";

type I18n = {
  locale: Locale;
  dict: Dictionary;
  tr: (template: string, vars?: Record<string, string>) => string;
};

const I18nContext = createContext<I18n | null>(null);

export function I18nProvider({ locale, dict, children }: { locale: Locale; dict: Dictionary; children: React.ReactNode }) {
  const value: I18n = { locale, dict, tr: (template, vars) => t(template, locale, vars) };
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18n {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside <I18nProvider>.");
  return ctx;
}
