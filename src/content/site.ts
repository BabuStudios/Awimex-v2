/** Site origin, external links and analytics — light enough for the first paint. */

/* ── Site, links, analytics ──────────────────────────────────────────── */
export const site = {
  /** ⚑ ASSUMED domain. Override with NEXT_PUBLIC_SITE_URL. */
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.awimex.se",
  /** ⚑ ASSUMED deploy target. */
  deploy: "vercel",
} as const;

export const externalLinks = {
  /** D1 = a: a branded bridge modal, then the existing form on awimex.se. */
  becomeCustomer: {
    href: "https://www.awimex.se/bli-kund-hos-oss/",
    bridge: true,
  },
} as const;

export const analytics = {
  /** No provider supplied: events are built and consent-gated, then dropped. */
  provider: null as "plausible" | "vercel" | null,
  consentTool: null as string | null,
} as const;
