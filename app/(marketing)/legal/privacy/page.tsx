"use client";

import { useLocale } from "@/lib/i18n/LocaleProvider";
import inner from "../../inner.module.css";

export default function PrivacyPage() {
  const { t } = useLocale();
  const p = t.legal.privacy;

  return (
    <>
      <header className={inner.header}>
        <div className={`wrap ${inner.headerInner}`}>
          <span className="eyebrow">{p.eyebrow}</span>
          <h1 className={inner.h1}>{p.title}</h1>
          <p className={inner.small}>{t.legal.lastUpdated}</p>
        </div>
      </header>

      <section className="section">
        <div className={`wrap ${inner.prose}`}>
          <div className={inner.callout}>
            <strong>{t.legal.placeholderLead}</strong> {t.legal.placeholder}
          </div>

          <h2>{p.s1}</h2>
          <p>{p.p1}</p>

          <h2>{p.s2}</h2>
          <ul>
            {p.list2.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>

          <h2>{p.s3}</h2>
          <p>{p.p3}</p>

          <h2>{p.s4}</h2>
          <p>{p.p4}</p>

          <h2>{p.s5}</h2>
          <p>{p.p5}</p>

          <h2>{p.s6}</h2>
          <p>{p.p6}</p>
        </div>
      </section>
    </>
  );
}
