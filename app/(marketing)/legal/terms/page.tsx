"use client";

import Link from "next/link";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import inner from "../../inner.module.css";

export default function TermsPage() {
  const { t } = useLocale();
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
            <Link href="/compliance">{tm.p1Link}</Link>
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
