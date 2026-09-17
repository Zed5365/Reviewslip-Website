import Link from "next/link";
import type { BusinessDetail } from "@/lib/customer";

/**
 * Reviews, on the venue page.
 *
 * The other half of the hub, beside the bookings widget and deliberately the
 * same shape: a few figures, a row that appears only when something needs
 * doing, and a way in. The list itself lives on its own page now.
 *
 * The thirty-day chart comes with it. It is the one thing here that is worth
 * looking at rather than reading — whether the line is going anywhere — and it
 * loses nothing by being small.
 */
export default function ReviewsWidget({
  stats,
  notTaken,
  base,
}: {
  stats: BusinessDetail["stats"];
  /**
   * Guests who reached the review page and did not leave one.
   *
   * Optional on the wire: the review app deploys separately and a dashboard
   * running ahead of it gets no count rather than an error.
   */
  notTaken?: number;
  /** The reviews page. */
  base: string;
}) {
  const peak = Math.max(...stats.daily.map((d) => d.reviews), 1);
  const share = Math.round((stats.month.tokens / stats.month.tokenLimit) * 100);

  return (
    <div className="bw">
      <div className="bw-head">
        <h2>Reviews</h2>
        <Link href={base} className="bw-open">
          Open reviews →
        </Link>
      </div>

      <div className="bw-figures">
        <div className="bw-figure">
          <span className="bw-value">{stats.month.reviews.toLocaleString()}</span>
          <span className="bw-label">this month · {share}% of tokens</span>
        </div>

        <div className="bw-figure">
          <span className="bw-value">{stats.lifetime.reviews.toLocaleString()}</span>
          <span className="bw-label">all time</span>
        </div>

        <div className="bw-figure">
          <span className="bw-value">
            {stats.lifetime.lastAt ? stamp(stats.lifetime.lastAt) : "—"}
          </span>
          <span className="bw-label">last one</span>
        </div>
      </div>

      {/* min-width:0 on each column, or thirty flex items refuse to shrink
          below their content and push the card past its container. */}
      <div className="rw-spark" aria-hidden="true">
        {stats.daily.map((day) => (
          <div
            key={day.day}
            title={`${day.day}: ${day.reviews} review${day.reviews === 1 ? "" : "s"}`}
            style={{
              flex: "1 1 0",
              minWidth: 0,
              height: `${Math.max((day.reviews / peak) * 100, 2)}%`,
              borderRadius: "2px 2px 0 0",
              background:
                day.reviews === 0 ? "rgba(243,236,220,0.12)" : "var(--jade)",
            }}
          />
        ))}
      </div>
      <p className="rw-caption">Last 30 days</p>

      {stats.byCategory.length > 0 ? (
        <p className="rw-topics">
          <span className="rw-topics-label">What guests pick</span>
          {stats.byCategory.slice(0, 3).map((row) => (
            <span key={row.category} className="rw-topic">
              {row.category} <b>{row.reviews.toLocaleString()}</b>
            </span>
          ))}
        </p>
      ) : null}

      {/* Only when there is something to say. A row that is always there,
          usually saying nothing, is a row the eye learns to skip. */}
      {notTaken && notTaken > 0 ? (
        <div className="bw-attention">
          <Link href={base} className="bw-needs">
            {notTaken} {notTaken === 1 ? "guest" : "guests"} left without writing
            one
          </Link>
        </div>
      ) : null}
    </div>
  );
}

/**
 * A fixed UTC date.
 *
 * Not the reader's locale, because this renders on the server and again in the
 * browser, and a date that formats differently in the two is a hydration
 * mismatch — React throws away the server's HTML and the page flickers.
 */
function stamp(when: string): string {
  const d = new Date(when);
  return `${d.getUTCDate()} ${
    [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ][d.getUTCMonth()]
  }`;
}
