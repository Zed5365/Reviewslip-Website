import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import BookingsWidget from "@/components/dashboard/BookingsWidget";
import ReviewsWidget from "@/components/dashboard/ReviewsWidget";
import SetupProgress from "@/components/dashboard/SetupProgress";
import {
  call,
  sessionToken,
  type BookingSummary,
  type BusinessDetail,
} from "@/lib/customer";
import { isLocale } from "@/lib/i18n/config";
import { localizedPath } from "@/lib/i18n/routing";
import { todayAt } from "@/lib/nights";

export const metadata: Metadata = {
  title: "Business",
  robots: { index: false, follow: false },
};

/**
 * One venue, and the two ways in.
 *
 * The hub. Everything worth knowing at a glance across the top, then bookings
 * and reviews side by side, each as a summary with its own screen behind it.
 *
 * It no longer carries the review list. Forty reviews in a column beside a bar
 * chart is a scroll inside a scroll, and the numbers people open this page for
 * were underneath it. It also means one fewer round trip on the page opened
 * most often.
 */
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
   * Tonight's rooms, for the widget — its own call, and its own failure.
   *
   * A venue not using the reservations module at all, or a review app deployed
   * a few minutes behind this one, should still get the page. Null renders the
   * widget's "nothing set up yet" and nothing else notices.
   *
   * Today is worked out here rather than asked for, because the API would
   * answer in UTC — which in Bangkok is still yesterday until seven in the
   * morning. An occupancy figure for the wrong night is worse than no figure.
   */
  let summary: BookingSummary | null = null;
  try {
    summary = await call<BookingSummary>(
      `/businesses/${slug}/summary?today=${todayAt("Asia/Bangkok")}`,
      { token }
    );
  } catch (err) {
    // Left null — the widget has something to say about that. Logged, because
    // a venue that does have rooms and shows the setup prompt is a bug, and
    // this line is the only place it would ever be visible.
    console.error(`Could not load the bookings summary for ${slug}:`, err);
  }

  const { business, stats } = data;

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

        {/* Above the doors, and gone once it is finished. An unfinished
            venue has one thing worth doing and it is not reading occupancy. */}
        {data.setup ? (
          <SetupProgress
            setup={data.setup}
            settings={localizedPath(lang, `/dashboard/${business.slug}/settings`)}
          />
        ) : null}

        {/* The two doors. Side by side on a laptop, stacked on a phone — and in
            this order because the morning question is who is arriving, not what
            somebody wrote last night. */}
        <div className="hub">
          <BookingsWidget
            summary={summary}
            base={localizedPath(lang, `/dashboard/${business.slug}/bookings`)}
          />
          <ReviewsWidget
            stats={stats}
            base={localizedPath(lang, `/dashboard/${business.slug}/reviews`)}
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
            href={localizedPath(lang, `/dashboard/${business.slug}/poster`)}
          >
            Table card
          </Link>
        </div>
      </div>
    </section>
  );
}
