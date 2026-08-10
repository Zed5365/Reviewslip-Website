"use client";

import Link from "next/link";
import DemoSlip from "@/components/marketing/DemoSlip";
import PricingCards from "@/components/marketing/PricingCards";
import Faq from "@/components/marketing/Faq";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import styles from "./home.module.css";

export default function HomePage() {
  const { t } = useLocale();
  const h = t.home;

  return (
    <>
      {/* Hero */}
      <section className={styles.hero}>
        <div className={`wrap ${styles.heroGrid}`}>
          <div className={styles.heroCopy}>
            <span className="eyebrow">{h.heroEyebrow}</span>
            <h1 className={styles.h1}>
              {h.heroTitleLead} <em>{h.heroTitleEm}</em>
            </h1>
            <p className="lede">{h.heroLede}</p>
            <div className={styles.heroActions}>
              <Link href="/contact" className="btn btn-go">
                {t.common.getInTouch}
              </Link>
              <Link href="/demo" className="btn btn-quiet">
                {t.common.tryDemo}
              </Link>
            </div>
            <p className={styles.heroNote}>{h.heroNote}</p>
          </div>

          <div className={styles.heroSlip}>
            <DemoSlip autoStart />
          </div>
        </div>
      </section>

      {/* Social proof */}
      <section className={styles.proof}>
        <div className={`wrap ${styles.proofRow}`}>
          <span className={styles.proofStars}>★★★★★</span>
          <span>{h.proofRating}</span>
          <span className={styles.proofDivider} />
          <span>{h.proofBuiltFor}</span>
        </div>
      </section>

      {/* How it works */}
      <section className="section">
        <div className="wrap">
          <div className={styles.sectionHead}>
            <span className="eyebrow">{h.howEyebrow}</span>
            <h2 className={styles.h2}>{h.howTitle}</h2>
          </div>
          <div className={styles.steps}>
            {h.steps.map((s, i) => (
              <div key={s.title} className={styles.step}>
                <span className={styles.stepNum}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className={styles.stepTitle}>{s.title}</h3>
                <p className={styles.stepBody}>{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="section" id="features">
        <div className="wrap">
          <div className={styles.sectionHead}>
            <span className="eyebrow">{h.featuresEyebrow}</span>
            <h2 className={styles.h2}>{h.featuresTitle}</h2>
          </div>
          <div className={styles.features}>
            {h.features.map((feat) => (
              <div key={feat.title} className={`panel ${styles.feature}`}>
                <h3 className={styles.featureTitle}>{feat.title}</h3>
                <p className={styles.featureBody}>{feat.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Metrics */}
      <section className={styles.metricsSection}>
        <div className={`wrap ${styles.metrics}`}>
          {h.metrics.map((m) => (
            <div key={m.label} className={styles.metric}>
              <span className={styles.metricValue}>{m.value}</span>
              <span className={styles.metricLabel}>{m.label}</span>
            </div>
          ))}
        </div>
        <p className={styles.metricsFootnote}>{h.metricsFootnote}</p>
      </section>

      {/* Pricing */}
      <section className="section" id="pricing">
        <div className="wrap">
          <div className={styles.sectionHead}>
            <span className="eyebrow">{h.pricingEyebrow}</span>
            <h2 className={styles.h2}>{h.pricingTitle}</h2>
          </div>
          <PricingCards />
          <p className={styles.pricingLink}>
            <Link href="/pricing" className={styles.textLink}>
              {h.pricingCompare}
            </Link>
          </p>
        </div>
      </section>

      {/* Compliance teaser */}
      <section className="section">
        <div className={`wrap ${styles.trust}`}>
          <span className="eyebrow">{h.trustEyebrow}</span>
          <h2 className={styles.h2}>{h.trustTitle}</h2>
          <p className="lede">{h.trustLede}</p>
          <Link href="/compliance" className="btn btn-quiet">
            {h.trustCta}
          </Link>
        </div>
      </section>

      {/* FAQ */}
      <section className="section">
        <div className="wrap">
          <div className={styles.sectionHead}>
            <span className="eyebrow">{h.faqEyebrow}</span>
            <h2 className={styles.h2}>{h.faqTitle}</h2>
          </div>
          <Faq items={h.faq} />
        </div>
      </section>

      {/* Final CTA */}
      <section className={styles.cta}>
        <div className={`wrap ${styles.ctaInner}`}>
          <h2 className={styles.ctaTitle}>{h.ctaTitle}</h2>
          <p className="lede">{h.ctaLede}</p>
          <Link href="/contact" className="btn btn-go">
            {t.common.getInTouch}
          </Link>
        </div>
      </section>
    </>
  );
}
