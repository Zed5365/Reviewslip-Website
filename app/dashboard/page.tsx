import Link from "next/link";

import { Meter } from "@/components/dash/Meter";
import styles from "@/components/dash/dash.module.css";
import { currentUser } from "@/lib/session";

export default async function DashboardPage() {
  // The layout has already redirected anyone without a session; this is the
  // same request, so it is served from the same call.
  const me = await currentUser();
  if (!me) return null;

  const venueLimit = me.plan.venues === null ? "unlimited" : me.plan.venues;

  return (
    <>
      <div className={styles.head}>
        <h1 className={styles.title}>Your venues</h1>
        <p className={styles.sub}>
          {me.usage.venues} of {venueLimit} on {me.plan.name} ·{" "}
          {me.usage.reviewsThisMonth.toLocaleString()} of{" "}
          {me.plan.reviewAllowance.toLocaleString()} reviews this month
        </p>
      </div>

      {me.venues.length === 0 ? (
        <div className={styles.empty}>
          <p>No venues yet.</p>
          <p>
            Venues are created for you at the moment — get in touch and we will
            set the first one up.
          </p>
        </div>
      ) : (
        <div className={styles.grid}>
          {me.venues.map((venue) => (
            <div key={venue.slug} className={styles.card}>
              <div className={styles.cardHead}>
                <h2 className={styles.cardName}>{venue.name}</h2>
                <span
                  className={`${styles.pill} ${
                    venue.status !== "active"
                      ? styles.pillOff
                      : venue.ready
                        ? styles.pillActive
                        : styles.pillWarn
                  }`}
                >
                  {venue.status !== "active"
                    ? venue.status
                    : venue.ready
                      ? "live"
                      : "no review link"}
                </span>
              </div>

              <p className={styles.address}>{venue.url}</p>

              <div className={styles.meters}>
                <Meter
                  label="Reviews this month"
                  used={venue.usage.reviews}
                  limit={me.plan.reviewAllowance}
                />
                <Meter
                  label="Tokens this month"
                  used={venue.usage.tokens}
                  limit={venue.usage.tokenLimit}
                />
              </div>

              <div className={styles.actions}>
                <Link className="btn btn-go" href={`/dashboard/${venue.slug}`}>
                  Open
                </Link>
                {/* -ink, not -quiet: the card is cream, and the plain quiet
                    button is outlined for the dark canvas — it renders as an
                    empty box here. */}
                <Link
                  className="btn btn-quiet-ink"
                  href={`/dashboard/${venue.slug}/settings`}
                >
                  Settings
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
