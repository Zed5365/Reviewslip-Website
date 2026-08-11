import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { Trirong, Bai_Jamjuree } from "next/font/google";
import { LOCALE_CODES, isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { alternateLanguages, localizedUrl } from "@/lib/i18n/routing";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import { CurrencyProvider } from "@/lib/CurrencyProvider";
import Nav from "@/components/marketing/Nav";
import Footer from "@/components/marketing/Footer";
import TermsGate from "@/components/TermsGate";
import "../globals.css";

// `thai` is included so Thai copy renders in the brand fonts rather than a
// fallback. CJK (zh/ja/ko) has no Google-font subset here and intentionally
// falls back to the system UI font, which ships proper CJK glyphs.
const trirong = Trirong({
  variable: "--font-display",
  subsets: ["latin", "thai"],
  weight: ["300", "400"],
  style: ["normal", "italic"],
  display: "swap",
});

const baiJamjuree = Bai_Jamjuree({
  variable: "--font-ui",
  subsets: ["latin", "thai"],
  weight: ["400", "500", "600"],
  display: "swap",
});

/** Prerender every language at build time. */
export function generateStaticParams() {
  return LOCALE_CODES.map((lang) => ({ lang }));
}

export async function generateMetadata({
  params,
}: LayoutProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const t = getDictionary(lang);

  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: t.seo.home.title,
      template: `%s · ${SITE_NAME}`,
    },
    description: t.seo.home.description,
    alternates: {
      canonical: localizedUrl(lang, "/"),
      languages: alternateLanguages("/"),
    },
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      locale: lang,
      url: localizedUrl(lang, "/"),
      title: t.seo.home.title,
      description: t.seo.home.description,
    },
    twitter: {
      card: "summary_large_image",
      title: t.seo.home.title,
      description: t.seo.home.description,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true },
    },
  };
}

export const viewport: Viewport = {
  themeColor: "#0c1f19",
};

export default async function RootLayout({
  children,
  params,
}: LayoutProps<"/[lang]">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  const t = getDictionary(lang);

  return (
    <html
      lang={lang}
      className={`${trirong.variable} ${baiJamjuree.variable}`}
    >
      <body suppressHydrationWarning>
        <CurrencyProvider>
          <Nav
            lang={lang}
            nav={t.nav}
            ctaLabel={t.common.getInTouch}
            selectors={t.selectors}
          />
          <main>{children}</main>
          <Footer lang={lang} t={t} />
          <TermsGate lang={lang} />
        </CurrencyProvider>
      </body>
    </html>
  );
}
