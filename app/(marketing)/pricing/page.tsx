"use client";

import PricingCards from "@/components/marketing/PricingCards";
import Faq from "@/components/marketing/Faq";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import inner from "../inner.module.css";

export default function PricingPage() {
  const { t } = useLocale();

  return (
    <>
      <header className={inner.header}>
        <div className={`wrap ${inner.headerInner}`}>
          <span className="eyebrow">{t.pricing.eyebrow}</span>
          <h1 className={inner.h1}>{t.pricing.title}</h1>
          <p className="lede">{t.pricing.lede}</p>
        </div>
      </header>

      <section className="section">
        <div className="wrap">
          <PricingCards />
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <h2
            style={{
              textAlign: "center",
              marginBottom: "2.5rem",
              fontSize: "clamp(1.9rem, 4.5vw, 2.5rem)",
            }}
          >
            {t.pricing.faqTitle}
          </h2>
          <Faq items={t.pricing.faq} />
        </div>
      </section>
    </>
  );
}
