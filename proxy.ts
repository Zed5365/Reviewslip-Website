import { NextResponse, type NextRequest } from "next/server";
import { LOCALE_CODES, DEFAULT_LOCALE, isLocale } from "@/lib/i18n/config";

/**
 * Locale routing (Next 16 renamed `middleware` to `proxy`).
 *
 * URL contract — exactly one canonical URL per page per language:
 *   /pricing      -> rewritten internally to /en/pricing  (English lives at root)
 *   /en/pricing   -> redirected to /pricing               (kills the duplicate)
 *   /es/pricing   -> served as-is
 *   /             -> language-negotiated for humans, English for everyone else
 *
 * Only the bare root negotiates language. Every explicit locale URL is served
 * directly with no redirect, so crawlers can reach all translations.
 */

const LANG_COOKIE = "rs_lang";

/** Best supported locale from an Accept-Language header, or null. */
function preferredLocale(header: string | null): string | null {
  if (!header) return null;

  const ranked = header
    .split(",")
    .map((part) => {
      const [tag, ...params] = part.trim().split(";");
      const q = params.find((p) => p.trim().startsWith("q="));
      return {
        tag: tag.trim().toLowerCase(),
        q: q ? parseFloat(q.split("=")[1]) || 0 : 1,
      };
    })
    .sort((a, b) => b.q - a.q);

  for (const { tag } of ranked) {
    // Exact match, then the base language ("pt-BR" -> "pt").
    if ((LOCALE_CODES as string[]).includes(tag)) return tag;
    const base = tag.split("-")[0];
    if ((LOCALE_CODES as string[]).includes(base)) return base;
  }
  return null;
}

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const segments = pathname.split("/").filter(Boolean);
  const first = segments[0];

  // /en/... is not canonical — redirect to the unprefixed form.
  if (first === DEFAULT_LOCALE) {
    const rest = "/" + segments.slice(1).join("/");
    const url = request.nextUrl.clone();
    url.pathname = rest === "/" ? "/" : rest;
    return NextResponse.redirect(url, 308);
  }

  // Already a supported non-default locale: serve it untouched.
  if (first && isLocale(first)) {
    return NextResponse.next();
  }

  // Bare root: honour a saved choice, else negotiate from Accept-Language.
  if (pathname === "/") {
    const cookie = request.cookies.get(LANG_COOKIE)?.value;
    const chosen =
      (cookie && isLocale(cookie) && cookie) ||
      preferredLocale(request.headers.get("accept-language"));

    if (chosen && chosen !== DEFAULT_LOCALE) {
      const url = request.nextUrl.clone();
      url.pathname = `/${chosen}`;
      return NextResponse.redirect(url, 307);
    }
  }

  // Unprefixed path: rewrite onto the default locale segment. The URL the
  // visitor sees stays clean; Next renders app/[lang]/... with lang="en".
  const url = request.nextUrl.clone();
  url.pathname = `/${DEFAULT_LOCALE}${pathname}`;
  url.search = search;
  return NextResponse.rewrite(url);
}

export const config = {
  /**
   * Skip Next internals and anything that looks like a file, plus the metadata
   * routes that must stay at the domain root.
   */
  matcher: [
    "/((?!_next|api|favicon.ico|robots.txt|sitemap.xml|.*\\..*).*)",
  ],
};
