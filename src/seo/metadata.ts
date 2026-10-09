import type { Metadata } from "next";
import { facts } from "@/content/facts";
import { site } from "@/content/content";
import { getDictionary, locales, defaultLocale, type Locale } from "@/content/i18n";
import { isFactAvailable, t, toTelHref } from "@/lib/format";

export function localePath(locale: Locale, path = "/"): string {
  return locale === defaultLocale ? path : `/${locale}${path === "/" ? "" : path}`;
}

export function buildMetadata(locale: Locale): Metadata {
  const dict = getDictionary(locale);
  const title = t(dict.meta.title, locale);
  const description = t(dict.meta.description, locale);
  const languages = Object.fromEntries(locales.map((l) => [l, localePath(l)]));

  return {
    metadataBase: new URL(site.url),
    title,
    description,
    alternates: {
      canonical: localePath(locale),
      languages: { ...languages, "x-default": localePath(defaultLocale) },
    },
    openGraph: {
      type: "website",
      locale: "sv_SE",
      url: localePath(locale),
      siteName: facts.legal_name.value,
      title,
      description,
    },
    twitter: { card: "summary_large_image", title, description },
    robots: { index: true, follow: true },
  };
}

/** Organization JSON-LD; every value comes from facts.ts. foundingDate only when the fact is supplied. */
export function organizationJsonLd(locale: Locale) {
  const founded = facts.founded as { kind: string; value?: number };
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Awimex",
    legalName: facts.legal_name.value,
    url: new URL(localePath(locale), site.url).toString(),
    logo: new URL("/brand/awimex-wordmark.svg", site.url).toString(),
    taxID: facts.org_nr.value,
    telephone: toTelHref(facts.phone_main.value).replace("tel:", ""),
    email: facts.email_info.value,
    address: {
      "@type": "PostalAddress",
      streetAddress: facts.street.value,
      postalCode: facts.postal_code.value,
      addressLocality: facts.city.value,
      addressCountry: "SE",
    },
    parentOrganization: { "@type": "Organization", name: facts.parent_group.value },
    ...(isFactAvailable("founded") && founded.value ? { foundingDate: String(founded.value) } : {}),
  };
}
