"use client";

import Link from "next/link";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import inner from "../inner.module.css";

export default function CompliancePage() {
  const { t } = useLocale();
  const c = t.compliance;

  return (
    <>
      <header className={inner.header}>
        <div className={`wrap ${inner.headerInner}`}>
          <span className="eyebrow">{c.eyebrow}</span>
          <h1 className={inner.h1}>{c.title}</h1>
          <p className="lede">{c.lede}</p>
        </div>
      </header>

      <section className="section">
        <div className={`wrap ${inner.prose}`}>
          <div className={inner.callout}>
            <strong>{c.calloutLead}</strong> {c.callout}
          </div>

          <h2>{c.h1}</h2>
          <p>{c.p1}</p>

          <h2>{c.h2}</h2>
          <ul>
            {c.list.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>

          <h2>{c.h3}</h2>
          <p>{c.p3}</p>

          <h2>{c.h4}</h2>
          <p>
            {c.p4Lead}
            <Link href="/legal/terms">{c.p4Link}</Link>
            {c.p4End}
          </p>

          <p className={inner.small}>{c.disclaimer}</p>
        </div>
      </section>
    </>
  );
}
