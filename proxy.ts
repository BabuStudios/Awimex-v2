import { NextResponse, type NextRequest } from "next/server";
import { defaultLocale, locales } from "@/content/i18n";

/**
 * Locale routing. Swedish is served at "/" with no prefix: requests are
 * rewritten to /sv internally, and an explicit /sv URL redirects to the
 * unprefixed canonical. Additional locales would be served under /<locale>.
 */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const first = pathname.split("/")[1] ?? "";

  if (first === defaultLocale) {
    const rest = pathname.slice(defaultLocale.length + 1) || "/";
    return NextResponse.redirect(new URL(`${rest}${search}`, request.url), 308);
  }

  if ((locales as readonly string[]).includes(first)) return NextResponse.next();

  const url = request.nextUrl.clone();
  url.pathname = `/${defaultLocale}${pathname === "/" ? "" : pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: ["/((?!_next/|api/|posters/|brand/|models/|fonts/|favicon|icon|apple-icon|robots.txt|sitemap.xml|.*opengraph-image|.*\\.[a-z0-9]+$).*)"],
};
