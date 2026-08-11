import Link from "next/link";
import { notFound } from "next/navigation";

import { Meter, Stat } from "@/components/dash/Meter";
import styles from "@/components/dash/dash.module.css";
import { call, type VenueDetail } from "@/lib/api";
import { sessionToken } from "@/lib/session";

/** Params are async in this version of Next — they must be awaited. */
export default async function VenuePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const token = await sessionToken();
  if (!token) notFound();

  let data: VenueDetail;
  try {
    data = await call<VenueDetail>(`/venues/${slug}`, { token });
  } catch (err) {
    // The API answers 404 for a venue that belongs to someone else as well as
    // for one that does not exist — deliberately, and it stays that way here.
    if ((err as { status?: number }).status === 404) notFound();
    throw err;
  }

  const { venue, stats } = data;
  const peak = Math.max(...stats.daily.map((d) => d.reviews), 1);

  return (
    <>
      <Link className={styles.back} href="/dashboard">
        <span aria-hidden="true">←</span> All venues
      </Link>

      <div className={styles.head}>
        <h1 className={styles.title}>{venue.name}</h1>
        <p className={styles.sub}>
          <a href={venue.url} target="_blank" rel="noreferrer">
            {venue.url}
          </a>
        </p>
      </div>

      <div className={styles.stats}>
        <Stat
          value={stats.month.reviews.toLocaleString()}
          label="Reviews this month"
        />
        <Stat
          value={stats.lifetime.reviews.toLocaleString()}
          label="Reviews all time"
        />
        <Stat
          value={`${Math.round((stats.month.tokens / stats.month.tokenLimit) * 100)}%`}
          label="Of this month's tokens"
        />
        <Stat
          value={
            stats.lifetime.lastAt
              ? new Date(stats.lifetime.lastAt).toLocaleDateString()
              : "—"
          }
          label="Last review"
        />
      </div>

      <div className={styles.grid}>
        <div className={styles.card}>
          <h2 className={styles.cardName}>Last 30 days</h2>
          <div className={styles.chart}>
            {stats.daily.map((day) => (
              <div
                key={day.day}
                className={`${styles.chartBar} ${day.reviews === 0 ? styles.chartBarEmpty : ""}`}
                style={{ height: `${Math.max((day.reviews / peak) * 100, 2)}%` }}
                title={`${day.day}: ${day.reviews} review${day.reviews === 1 ? "" : "s"}`}
              />
            ))}
          </div>
        </div>

        <div className={styles.card}>
          <h2 className={styles.cardName}>Usage</h2>
          <div className={styles.meters}>
            <Meter
              label="Tokens this month"
              used={stats.month.tokens}
              limit={stats.month.tokenLimit}
            />
          </div>

          <h3 className={styles.cardSub}>What guests pick</h3>
          {stats.byCategory.length === 0 ? (
            <p className={styles.cardHint}>Nothing yet this month.</p>
          ) : (
            <ul className={styles.list}>
              {stats.byCategory.map((row) => (
                <li key={row.category} className={styles.listRow}>
                  <span>{row.category}</span>
                  <span className={styles.listCount}>
                    {row.reviews.toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <p className={styles.actions} style={{ marginTop: "2rem" }}>
        <Link className="btn btn-go" href={`/dashboard/${venue.slug}/settings`}>
          Settings
        </Link>
      </p>
    </>
  );
}
