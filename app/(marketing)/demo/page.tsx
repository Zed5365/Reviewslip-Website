"use client";

import Link from "next/link";
import DemoSlip from "@/components/marketing/DemoSlip";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import inner from "../inner.module.css";

export default function DemoPage() {
  const { t } = useLocale();

  return (
    <>
      <header className={inner.header}>
        <div className={`wrap ${inner.headerInner}`}>
          <span className="eyebrow">{t.demo.eyebrow}</span>
          <h1 className={inner.h1}>{t.demo.title}</h1>
          <p className="lede">{t.demo.lede}</p>
        </div>
      </header>

      <section className="section">
        <div className={`wrap ${inner.demoWrap}`}>
          <DemoSlip venue="The Riverside Café" />
          <p className={inner.demoNote}>{t.demo.note}</p>
          <Link href="/contact" className="btn btn-go">
            {t.demo.cta}
          </Link>
        </div>
      </section>
    </>
  );
}
