"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

/**
 * Calendar or list, over the same bookings.
 *
 * Two answers to two different questions. The calendar answers "what does that
 * week look like" — which rooms are free, where a stay could go. The list
 * answers "where is that booking" — the one under a name, the ones cancelled,
 * the ones still without a room. Neither is a worse version of the other, so
 * this is a toggle rather than a default with an escape hatch.
 *
 * The room-type filter travels between them; the month and the cursor do not.
 * A month means a window of nights to one view and a date range to the other,
 * and a cursor from a list is meaningless on a grid — carrying either across
 * would land somebody somewhere they did not ask to be.
 */
export default function ViewToggle({
  calendar,
  list,
  here,
  shape = "month",
}: {
  calendar: string;
  list: string;
  here: "calendar" | "list";
  /**
   * Which calendar is showing, when one is.
   *
   * Three tabs rather than two, because the month and the timeline answer
   * different questions — "what is happening that week" and "which room can
   * this go in" — and neither is a worse version of the other. Hiding the
   * timeline behind the month would take away the only view a stay can be
   * dragged across.
   */
  shape?: "month" | "timeline";
}) {
  const params = useSearchParams();
  const type = params.get("type");
  const carry = type ? `?type=${encodeURIComponent(type)}` : "";

  return (
    <nav className="view-toggle" aria-label="How to show bookings">
      <Link
        href={`${calendar}${carry}`}
        className="view-tab"
        aria-current={here === "calendar" && shape === "month" ? "page" : undefined}
      >
        Month
      </Link>
      <Link
        href={`${calendar}${carry ? `${carry}&` : "?"}shape=timeline`}
        className="view-tab"
        aria-current={here === "calendar" && shape === "timeline" ? "page" : undefined}
      >
        Rooms
      </Link>
      <Link
        href={`${list}${carry}`}
        className="view-tab"
        aria-current={here === "list" ? "page" : undefined}
      >
        List
      </Link>
    </nav>
  );
}
