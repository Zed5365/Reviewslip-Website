import Link from "next/link";
import type { BookingSummary } from "@/lib/customer";

/**
 * Today's rooms, on the venue page.
 *
 * A summary, not a screen. It answers one question — is anything on fire — and
 * everything it shows has a page behind it, so nothing here is the only place
 * to find a number.
 *
 * Occupancy leads because it is the number an owner opens the dashboard for.
 * The rest is movement: who is due in, who is due out, and the three things
 * that need somebody to act.
 */

/** A thing needing attention, or null when it does not. */
function Needs({
  count,
  singular,
  plural,
  href,
}: {
  count: number;
  singular: string;
  plural: string;
  href: string;
}) {
  if (count === 0) return null;
  return (
    <Link href={href} className="bw-needs">
      {count} {count === 1 ? singular : plural}
    </Link>
  );
}

export default function BookingsWidget({
  summary,
  base,
}: {
  summary: BookingSummary | null;
  /** The module's root, so every link here goes into it. */
  base: string;
}) {
  // Null when the venue has no rooms yet, or the call failed. Either way the
  // widget invites the setup rather than showing a row of confident zeroes,
  // which would read as "nothing booked" when the truth is "nothing set up".
  if (!summary || summary.rooms === 0) {
    return (
      <div className="bw">
        <div className="bw-head">
          <h2>Bookings</h2>
        </div>
        <p className="bw-empty">
          No rooms set up yet.{" "}
          <Link href={`${base}/rooms`}>Add your room types</Link> and the
          calendar, rates and check-in all follow from them.
        </p>
      </div>
    );
  }

  return (
    <div className="bw">
      <div className="bw-head">
        <h2>Bookings</h2>
        <Link href={base} className="bw-open">
          Open bookings →
        </Link>
      </div>

      <div className="bw-figures">
        <div className="bw-figure">
          <span className="bw-value">{summary.occupancy}%</span>
          <span className="bw-label">
            full tonight · {summary.staying} of {summary.rooms}
          </span>
        </div>

        <div className="bw-figure">
          <span className="bw-value">{summary.arrivals}</span>
          <span className="bw-label">
            arriving
            {summary.toCheckIn > 0 ? ` · ${summary.toCheckIn} to check in` : " · all in"}
          </span>
        </div>

        <div className="bw-figure">
          <span className="bw-value">{summary.departures}</span>
          <span className="bw-label">
            leaving
            {summary.toCheckOut > 0
              ? ` · ${summary.toCheckOut} to check out`
              : " · all out"}
          </span>
        </div>
      </div>

      {/* Only rendered when something actually needs doing. A row that is
          always present, usually saying nothing, is a row the eye learns to
          skip — and then misses on the morning it matters. */}
      {summary.unassigned + summary.dirty + summary.tm30Pending > 0 ? (
        <div className="bw-attention">
          <Needs
            count={summary.unassigned}
            singular="stay with no room"
            plural="stays with no room"
            href={`${base}/calendar`}
          />
          <Needs
            count={summary.dirty}
            singular="room to clean"
            plural="rooms to clean"
            href={base}
          />
          <Needs
            count={summary.tm30Pending}
            singular="guest to notify"
            plural="guests to notify"
            href={`${base}/tm30`}
          />
        </div>
      ) : null}
    </div>
  );
}
