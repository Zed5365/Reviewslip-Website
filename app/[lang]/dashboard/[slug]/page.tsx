import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import BookingsWidget from "@/components/dashboard/BookingsWidget";
import ReviewList, { type ReviewRow } from "@/components/dashboard/ReviewList";
import {
  call,
  sessionToken,
  type BookingSummary,
  type BusinessDetail,
} from "@/lib/customer";
import { isLocale } from "@/lib/i18n/config";
import { localizedPath } from "@/lib/i18n/routing";

export const metadata: Metadata = {
  title: "Business",
  robots: { index: false, follow: false },
};

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div
      style={{
        background: "var(--paper)",
        color: "var(--ink)",
        borderRadius: 12,
        padding: "1rem 1.1rem",
      }}
    >
      <div
        style={{
          fontFamily: "var(--display)",
          fontSize: "1.8rem",
          lineHeight: 1.1,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {value}
      </div>
      <div style={{ fontSize: "0.8rem", color: "var(--ink-soft)", marginTop: "0.15rem" }}>
        {label}
      </div>
    </div>
  );
}

export default async function BusinessPage({
  params,
}: PageProps<"/[lang]/dashboard/[slug]">) {
  const { lang, slug } = await params;
  if (!isLocale(lang)) notFound();

  const token = await sessionToken();
  if (!token) redirect(localizedPath(lang, "/login"));

  let data: BusinessDetail;
  try {
    data = await call<BusinessDetail>(`/businesses/${slug}`, { token });
  } catch (err) {
    // The API answers 404 for a business belonging to someone else as well as one
    // that does not exist — deliberately, and it stays that way here.
    if ((err as { status?: number }).status === 404) notFound();
    throw err;
  }

  /*
   * Tonight's rooms, for the widget — and on the same reasoning as the reviews
   * below: its own call, its own failure. A venue not using the reservations
   * module at all, or a review app deployed a few minutes behind this one,
   * should still get the page. Null renders the widget's "nothing set up yet"
   * and nothing else notices.
   *
   * Today is worked out here rather than asked for, because the API would
   * answer in UTC — which in Bangkok is still yesterday until seven in the
   * morning. An occupancy figure for the wrong night is worse than no figure.
   */
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

  let summary: BookingSummary | null = null;
  try {
    summary = await call<BookingSummary>(
      `/businesses/${slug}/summary?today=${today}`,
      { token }
    );
  } catch (err) {
    // Left null — the widget has something to say about that. Logged, because
    // a venue that does have rooms and shows the setup prompt is a bug, and
    // this line is the only place it would ever be visible.
    console.error(`Could not load the bookings summary for ${slug}:`, err);
  }

  // A separate call so a slow or failed review list cannot take the stats page
  // down with it — the numbers are the point of this page, the list is beside it.
  let reviews: ReviewRow[] = [];
  let notTaken = 0;
  let reviewsFailed = false;
  try {
    const answer = await call<{ reviews: ReviewRow[]; notTaken?: number }>(
      `/businesses/${slug}/reviews`,
      { token }
    );
    reviews = answer.reviews;
    // Optional: the review app deploys separately, and a dashboard running
    // ahead of it gets a list and no count rather than falling over.
    notTaken = answer.notTaken ?? 0;
  } catch (err) {
    // Kept apart from an empty list, because they are different facts and this
    // page used to tell the same story for both. A broken query behind this
    // call rendered "Nothing yet. Reviews appear here as guests generate them."
    // to an owner with forty-seven of them — which reads as a product that is
    // not working rather than one that is broken, and sends them looking in
    // entirely the wrong place.
    reviewsFailed = true;
    console.error(`Could not load reviews for ${slug}:`, err);
  }

  /**
   * Records the owner's judgement. Called straight from the list's stars.
   *
   * `null` clears the rating, which is what a second tap on the star already
   * set means. The review app treats that as a distinct value rather than a
   * missing one, so it is sent as null rather than omitted.
   */
  async function rate(id: number, rating: number | null): Promise<{ ok: boolean }> {
    "use server";

    const current = await sessionToken();
    if (!current) return { ok: false };

    try {
      await call(`/businesses/${slug}/reviews/${id}/feedback`, {
        method: "POST",
        body: { rating },
        token: current,
      });
      return { ok: true };
    } catch {
      return { ok: false };
    }
  }

  const { business, stats } = data;
  const peak = Math.max(...stats.daily.map((d) => d.reviews), 1);
  const tokenShare = Math.round((stats.month.tokens / stats.month.tokenLimit) * 100);

  return (
    <section className="section">
      <div className="wrap">
        <Link
          href={localizedPath(lang, "/dashboard")}
          style={{ color: "var(--jade)", fontSize: "0.9rem" }}
        >
          ← All businesses
        </Link>

        <h1 style={{ margin: "1.25rem 0 0.4rem" }}>{business.name}</h1>
        <p className="lede" style={{ marginBottom: "2.5rem" }}>
          <a href={business.url} target="_blank" rel="noreferrer">
            {business.url}
          </a>
        </p>

        <div
          style={{
            display: "grid",
            gap: "1rem",
            gridTemplateColumns: "repeat(auto-fit, minmax(11rem, 1fr))",
            marginBottom: "2rem",
          }}
        >
          <Stat value={stats.month.reviews.toLocaleString()} label="Reviews this month" />
          <Stat value={stats.lifetime.reviews.toLocaleString()} label="Reviews all time" />
          <Stat value={`${tokenShare}%`} label="Of this month's tokens" />
          <Stat
            value={
              stats.lifetime.lastAt
                ? new Date(stats.lifetime.lastAt).toLocaleDateString()
                : "—"
            }
            label="Last review"
          />
        </div>

        <BookingsWidget
          summary={summary}
          base={localizedPath(lang, `/dashboard/${business.slug}/bookings`)}
        />

        <div
          style={{
            display: "grid",
            gap: "1.25rem",
            gridTemplateColumns: "repeat(auto-fit, minmax(20rem, 1fr))",
            marginBottom: "2rem",
          }}
        >
        <div
          style={{
            background: "var(--paper)",
            color: "var(--ink)",
            borderRadius: 14,
            padding: "1.4rem",
          }}
        >
          <h2 style={{ fontSize: "1.2rem", margin: 0 }}>Last 30 days</h2>
          {/* min-width:0 on each column, or thirty flex items refuse to shrink
              below their content and push the card past its container. */}
          <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height: 90, marginTop: "0.75rem" }}>
            {stats.daily.map((day) => (
              <div
                key={day.day}
                title={`${day.day}: ${day.reviews} review${day.reviews === 1 ? "" : "s"}`}
                style={{
                  flex: "1 1 0",
                  minWidth: 0,
                  height: `${Math.max((day.reviews / peak) * 100, 2)}%`,
                  borderRadius: "2px 2px 0 0",
                  background: day.reviews === 0 ? "rgba(27,42,35,0.12)" : "var(--jade)",
                }}
              />
            ))}
          </div>

          <h3 style={{ fontSize: "0.85rem", color: "var(--ink-soft)", margin: "1.4rem 0 0.5rem" }}>
            What guests pick
          </h3>
          {stats.byCategory.length === 0 ? (
            <p style={{ fontSize: "0.85rem", color: "var(--ink-soft)" }}>
              Nothing yet this month.
            </p>
          ) : (
            <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: "0.4rem" }}>
              {stats.byCategory.map((row) => (
                <li key={row.category} style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>{row.category}</span>
                  <span style={{ fontVariantNumeric: "tabular-nums", color: "var(--ink-soft)" }}>
                    {row.reviews.toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <ReviewList
            reviews={reviews}
            notTaken={notTaken}
            failed={reviewsFailed}
            rate={rate}
          />
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
          <Link
            className="btn btn-go"
            href={localizedPath(lang, `/dashboard/${business.slug}/settings`)}
          >
            Settings
          </Link>
          <Link
            className="btn btn-quiet"
            href={localizedPath(lang, `/dashboard/${business.slug}/bookings`)}
          >
            Bookings
          </Link>
          <Link
            className="btn btn-quiet"
            href={localizedPath(lang, `/dashboard/${business.slug}/poster`)}
          >
            Table card
          </Link>
        </div>
      </div>
    </section>
  );
}
