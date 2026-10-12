import type { MetadataRoute } from "next";
import { site } from "@/content/content";
import { locales } from "@/content/i18n";
import { localePath } from "@/seo/metadata";

export default function sitemap(): MetadataRoute.Sitemap {
  return locales.map((locale) => ({
    url: new URL(localePath(locale), site.url).toString(),
    changeFrequency: "monthly",
    priority: 1,
    alternates: {
      languages: Object.fromEntries(locales.map((l) => [l, new URL(localePath(l), site.url).toString()])),
    },
  }));
}
