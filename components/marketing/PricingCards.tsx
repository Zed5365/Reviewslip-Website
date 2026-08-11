"use client";

import Link from "next/link";
import { useState } from "react";
import { PLANS, PLACEHOLDER_PRICING } from "@/lib/plans";
import type { Plan, PlanId, BillingCycle } from "@/lib/plans";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import styles from "./PricingCards.module.css";

export default function PricingCards() {
  const { t, money } = useLocale();
  const [cycle, setCycle] = useState<BillingCycle>("monthly");

  const f = t.plans.features;

  // Plan names and the copy in lib/plans.ts are the source of truth. The
  // dictionaries only cover the three tiers that existed before Enterprise was
  // renamed and Agency added, so anything missing here falls back to English
  // rather than rendering a key that does not exist.
  const translated: Partial<
    Record<PlanId, { tagline: string; features: string[] }>
  > = {
    starter: {
      tagline: t.plans.starterTagline,
      features: [f.venues1, f.qr, f.drafts, f.oneTap, f.branding],
    },
    pro: {
      tagline: t.plans.proTagline,
      features: [f.venues3, f.qr, f.drafts, f.oneTap, f.branding],
    },
    enterprise: {
      tagline: t.plans.businessTagline,
      features: [f.venues10, f.qr, f.drafts, f.oneTap, f.branding],
    },
  };

  function display(plan: Plan) {
    // Agency is billed per venue, so the monthly/yearly toggle does not apply
    // to it — the sentence reads the same either way.
    if (plan.pricePerVenueMonthly !== undefined) {
      return {
        amount: money(plan.pricePerVenueMonthly),
        suffix: `/venue${t.pricing.perMonth}`,
        from: true,
      };
    }

    const value = cycle === "yearly" ? plan.priceYearly : plan.priceMonthly;
    if (value === null) return { amount: t.pricing.custom, suffix: "" };
    if (value === 0) return { amount: t.pricing.free, suffix: "" };
    return {
      amount: money(value),
      suffix: cycle === "yearly" ? t.pricing.perYear : t.pricing.perMonth,
    };
  }

  return (
    <div>
      <div className={styles.toggle} role="group" aria-label="Billing period">
        <button
          type="button"
          className={styles.toggleBtn}
          aria-pressed={cycle === "monthly"}
          onClick={() => setCycle("monthly")}
        >
          {t.pricing.monthly}
        </button>
        <button
          type="button"
          className={styles.toggleBtn}
          aria-pressed={cycle === "yearly"}
          onClick={() => setCycle("yearly")}
        >
          {t.pricing.yearly}
          <span className={styles.save}>{t.pricing.savings}</span>
        </button>
      </div>

      {PLACEHOLDER_PRICING && (
        <p className={styles.disclaimer}>{t.pricing.disclaimer}</p>
      )}

      <div className={styles.grid}>
        {PLANS.map((plan) => {
          const price = display(plan);
          const m = translated[plan.id];
          const tagline = m?.tagline ?? plan.tagline;
          const features = m?.features ?? plan.features;
          return (
            <div
              key={plan.id}
              className={`${styles.card} ${
                plan.recommended ? styles.recommended : ""
              }`}
            >
              {plan.recommended && (
                <span className={styles.badge}>{t.pricing.mostPopular}</span>
              )}
              <h3 className={styles.name}>{plan.name}</h3>
              <p className={styles.tagline}>{tagline}</p>

              <div className={styles.priceRow}>
                {"from" in price && price.from && (
                  <span className={styles.per}>from</span>
                )}
                <span className={styles.price}>{price.amount}</span>
                {price.suffix && (
                  <span className={styles.per}>{price.suffix}</span>
                )}
              </div>
              <p className={styles.billNote}>
                {cycle === "yearly" && plan.pricePerVenueMonthly === undefined
                  ? t.pricing.billedAnnually
                  : " "}
              </p>

              <Link
                href={plan.ctaHref}
                className={`btn ${plan.recommended ? "btn-go" : "btn-quiet"} ${
                  styles.cta
                }`}
              >
                {plan.cta}
              </Link>

              <ul className={styles.features}>
                {[...features, plan.support].map((feat) => (
                  <li key={feat}>
                    <span className={styles.check} aria-hidden="true">
                      ✓
                    </span>
                    {feat}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
