import Link from "next/link";
import { redirect } from "next/navigation";

import { choosePlan } from "@/app/actions/venues";
import { Meter } from "@/components/dash/Meter";
import styles from "@/components/dash/dash.module.css";
import { PLANS, planById, priceFor } from "@/lib/plans";
import { currentUser } from "@/lib/session";

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ changed?: string }>;
}) {
  const me = await currentUser();
  if (!me) redirect("/login");

  const { changed } = await searchParams;
  const current = planById(me.account.plan);

  return (
    <>
      <Link className={styles.back} href="/dashboard">
        <span aria-hidden="true">←</span> All venues
      </Link>

      <div className={styles.head}>
        <h1 className={styles.title}>Billing</h1>
        <p className={styles.sub}>
          You are on {current?.name ?? me.plan.name}.
        </p>
      </div>

      {/* Said plainly and up front. Someone switching plans here needs to know
          nothing is being taken, and needs to know it before they click. */}
      <div className={styles.banner}>
        <strong>No payment is connected yet.</strong> Switching plan changes your
        limits immediately and charges nothing. When card payments are turned on,
        anything you owe starts from that point — never backdated.
      </div>

      {changed && (
        <p className={`${styles.notice} ${styles.noticeOk}`}>
          Moved to {planById(changed)?.name ?? changed}.
        </p>
      )}

      <div className={styles.card} style={{ marginBottom: "2rem" }}>
        <h2 className={styles.cardName}>This month</h2>
        <p className={styles.cardHint}>
          {me.usage.venues} venue{me.usage.venues === 1 ? "" : "s"} ·{" "}
          {me.account.email}
        </p>
        <div className={styles.meters} style={{ marginTop: "1rem" }}>
          <Meter
            label="Reviews across all venues"
            used={me.usage.reviewsThisMonth}
            limit={me.plan.reviewAllowance}
          />
          {me.plan.venues !== null && (
            <Meter
              label="Venues"
              used={me.usage.venues}
              limit={me.plan.venues}
            />
          )}
        </div>
      </div>

      <h2 className={styles.sectionTitle}>Plans</h2>

      <div className={styles.planGrid}>
        {PLANS.map((plan) => {
          const price = priceFor(plan, "monthly");
          const mine = plan.id === me.account.plan;
          const switchTo = choosePlan.bind(null, plan.id);

          return (
            <div
              key={plan.id}
              className={`${styles.card} ${mine ? styles.cardCurrent : ""}`}
            >
              <div className={styles.cardHead}>
                <h3 className={styles.cardName}>{plan.name}</h3>
                {mine && (
                  <span className={`${styles.pill} ${styles.pillActive}`}>
                    current
                  </span>
                )}
              </div>

              <p className={styles.planPrice}>
                {"prefix" in price && price.prefix ? `${price.prefix} ` : ""}
                {price.amount}
                <span className={styles.planPer}>{price.suffix}</span>
              </p>

              <ul className={styles.list} style={{ marginBottom: "1.1rem" }}>
                <li className={styles.listRow}>
                  <span>Venues</span>
                  <span className={styles.listCount}>
                    {plan.limits.venues === "unlimited"
                      ? "unlimited"
                      : plan.limits.venues}
                  </span>
                </li>
                <li className={styles.listRow}>
                  <span>Reviews a month</span>
                  <span className={styles.listCount}>
                    {plan.limits.reviewsPerMonth.toLocaleString()}
                    {plan.limits.reviewsArePerVenue ? " / venue" : ""}
                  </span>
                </li>
                <li className={styles.listRow}>
                  <span>Support</span>
                  <span className={styles.listCount}>{plan.support}</span>
                </li>
              </ul>

              {mine ? (
                <button className="btn btn-quiet-ink" type="button" disabled>
                  Your plan
                </button>
              ) : (
                <form action={switchTo}>
                  <button className="btn btn-go" type="submit">
                    Switch to {plan.name}
                  </button>
                </form>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
