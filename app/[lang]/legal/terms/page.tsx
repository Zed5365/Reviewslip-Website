import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { buildPageMetadata } from "@/lib/i18n/metadata";
import { localizedPath } from "@/lib/i18n/routing";
import inner from "../../inner.module.css";

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/legal/terms">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  return buildPageMetadata(
    lang,
    "/legal/terms",
    getDictionary(lang).seo.terms
  );
}

export default async function TermsPage({
  params,
}: PageProps<"/[lang]/legal/terms">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  const t = getDictionary(lang);
  const tm = t.legal.terms;

  return (
    <>
      <header className={inner.header}>
        <div className={`wrap ${inner.headerInner}`}>
          <span className="eyebrow">{tm.eyebrow}</span>
          <h1 className={inner.h1}>{tm.title}</h1>
          <p className={inner.small}>{t.legal.lastUpdated}</p>
        </div>
      </header>

      <section className="section">
        <div className={`wrap ${inner.prose}`}>
          <div className={inner.callout}>
            <strong>{t.legal.placeholderLead}</strong> {t.legal.placeholder}
          </div>

          <h2>{tm.s1}</h2>
          <p>
            {tm.p1Lead}
            <Link href={localizedPath(lang, "/compliance")}>{tm.p1Link}</Link>
            {tm.p1End}
          </p>

          <h2>{tm.s2}</h2>
          <ul>
            {tm.list2.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <p>{tm.p2}</p>

          <h2>{tm.s3}</h2>
          <p>{tm.p3}</p>

          <h2>{tm.s4}</h2>
          <p>{tm.p4}</p>

          <h2>{tm.s5}</h2>
          <p>{tm.p5}</p>

          <h2>{tm.s6}</h2>
          <p>{tm.p6}</p>
        </div>
      </section>
    </>
  );
}
