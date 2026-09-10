import Link from "next/link";
import type { CalendarWindow, TakenNight } from "@/lib/customer";

/**
 * The diary: rooms down the side, nights across the top.
 *
 * Server-rendered and read-only for now. Dragging a booking between rooms is
 * the next slice; the API call it will make (`/bookings/:id/assign`) already
 * exists and is already transactional, so that slice is a client component and
 * no schema change.
 *
 * The grid is built here from the flat list of room-nights the API sends. It
 * arrives flat on purpose: one row per room-night, so a booking's details are
 * sent once rather than once per night it covers.
 */

/** Day-of-month and a one-letter weekday, which is all a column header fits. */
function head(night: string) {
  const d = new Date(`${night}T12:00:00Z`); // midday, so no zone can shift the day
  return {
    day: d.getUTCDate(),
    weekday: ["S", "M", "T", "W", "T", "F", "S"][d.getUTCDay()],
    weekend: d.getUTCDay() === 0 || d.getUTCDay() === 6,
  };
}

/** How a stay's own nights read on the grid. */
const TONE: Record<string, { fill: string; ink: string }> = {
  confirmed: { fill: "rgba(130,180,155,0.30)", ink: "var(--cream)" },
  in_house: { fill: "rgba(233,160,59,0.32)", ink: "var(--cream)" },
  checked_out: { fill: "rgba(243,236,220,0.10)", ink: "var(--admin-muted)" },
};

export default function Calendar({
  data,
  slug,
  lang,
}: {
  data: CalendarWindow;
  slug: string;
  lang: string;
}) {
  const { nights, rooms, taken, unassigned } = data;

  // room id -> night -> what is in it. Built once; the grid then reads each
  // cell in constant time rather than scanning the list per cell, which at
  // fifty rooms across a fortnight would be seven hundred scans of it.
  const byRoom = new Map<number, Map<string, TakenNight>>();
  for (const t of taken) {
    let row = byRoom.get(t.roomId);
    if (!row) {
      row = new Map();
      byRoom.set(t.roomId, row);
    }
    row.set(t.night, t);
  }

  if (rooms.length === 0) {
    return (
      <p className="admin-empty">
        No rooms yet.{" "}
        <Link href={`/${lang}/dashboard/${slug}/rooms`} style={{ color: "var(--jade)" }}>
          Set up room types and rooms
        </Link>{" "}
        and the calendar will draw itself.
      </p>
    );
  }

  return (
    <>
      {unassigned.length > 0 ? (
        <div
          className="admin-card"
          style={{
            borderColor: "rgba(233,160,59,0.4)",
            borderLeftWidth: 3,
            background: "rgba(233,160,59,0.08)",
          }}
        >
          <h2 style={{ marginBottom: "0.5rem" }}>
            {unassigned.length} booking{unassigned.length === 1 ? "" : "s"} with no
            room
          </h2>
          <p style={{ margin: "0 0 0.9rem", fontSize: "0.9rem", color: "var(--admin-muted)" }}>
            These hold no room yet, so they are not on the grid below and nothing
            is stopping the room being sold twice.
          </p>
          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: "0.5rem" }}>
            {unassigned.map((b) => (
              <li key={b.id} style={{ fontSize: "0.9rem" }}>
                <strong style={{ color: "var(--cream)" }}>{b.guestName}</strong>
                <span style={{ color: "var(--admin-muted)" }}>
                  {" "}
                  · {b.groupName} · {b.arrival} → {b.departure} ({b.nights} night
                  {b.nights === 1 ? "" : "s"})
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="admin-scroll">
        <table className="cal">
          <thead>
            <tr>
              <th className="cal-room">Room</th>
              {nights.map((night) => {
                const h = head(night);
                return (
                  <th key={night} className={h.weekend ? "cal-night weekend" : "cal-night"}>
                    <span className="cal-weekday">{h.weekday}</span>
                    <span className="cal-day">{h.day}</span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {rooms.map((room) => {
              const row = byRoom.get(room.id);
              return (
                <tr key={room.id}>
                  <th scope="row" className="cal-room">
                    {room.name}
                    <span className="cal-type">{room.groupName}</span>
                  </th>

                  {nights.map((night) => {
                    const stay = row?.get(night);
                    if (!stay) {
                      return <td key={night} className="cal-cell" />;
                    }

                    const tone = TONE[stay.status] ?? TONE.confirmed;
                    // The name goes on the first night of the stay that is
                    // visible in this window — so a stay running in from before
                    // the window still says whose it is, rather than showing a
                    // week of unlabelled colour.
                    const first =
                      stay.night === stay.arrival || stay.night === nights[0];

                    return (
                      <td
                        key={night}
                        className="cal-cell taken"
                        style={{ background: tone.fill, color: tone.ink }}
                        title={`${stay.guestName} · ${stay.arrival} → ${stay.departure}`}
                      >
                        {first ? (
                          <span className="cal-guest">{stay.guestName}</span>
                        ) : null}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
