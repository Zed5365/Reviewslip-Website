"use client";

import Link from "next/link";
import { weeksOf } from "@/lib/nights";
import type { Booking, CalendarWindow, TakenNight } from "@/lib/customer";

/** Names in a day before the rest become a count. */
const NAMES = 3;

/** One arrival, as a day cell needs it. */
interface Arrival {
  id: number;
  guestName: string;
  status: string;
  arrival: string;
  departure: string;
  roomId: number | null;
  roomName: string | null;
  /** A stay with no room yet is the one thing in a month somebody must fix. */
  noRoom: boolean;
}

interface Day {
  date: string;
  /** Rooms sold that night. */
  sold: number;
  leaving: number;
  arrivals: Arrival[];
}

/**
 * A month, laid out as a month.
 *
 * Seven columns and a row per week, which is how everybody already reads a
 * month. What it shows in each day is deliberately much less than it could.
 *
 * It lists arrivals and nothing else. A property that is full has twenty people
 * in house and nothing to do about any of them; putting all twenty names in the
 * square buries the two who are turning up, and on a busy week made every cell
 * look the same. Who is in house is a question about a *day*, and the desk
 * answers it — the day number links there.
 *
 * Occupancy is the cell's own shade rather than a bar and a number both. One
 * reading, not two of the same thing, and shading means the shape of the month
 * is visible without reading anything at all: a glance finds the busy week.
 *
 * Every figure comes from the room-nights the window already sends, so this
 * costs no extra request.
 */
export default function MonthGrid({
  data,
  groupId = null,
  today = "",
  deskBase,
  onOpen,
  onEmpty,
}: {
  data: CalendarWindow;
  /** Show only this room type, or every one. */
  groupId?: number | null;
  /** Today at the property, as the server worked it out. */
  today?: string;
  /** The desk, for the day numbers to link into. */
  deskBase: string;
  onOpen: (booking: Booking | TakenNight) => void;
  onEmpty?: (prefill: { arrival: string; groupId?: number }) => void;
}) {
  const rooms =
    groupId === null ? data.rooms : data.rooms.filter((r) => r.groupId === groupId);
  const byRoom = new Map(data.rooms.map((r) => [r.id, r]));
  const roomIds = new Set(rooms.map((r) => r.id));
  const capacity = rooms.length;

  // Filtered by the room a stay sits in, not the booking's own type: a stay is
  // wherever it was actually put.
  const nights =
    groupId === null ? data.taken : data.taken.filter((t) => roomIds.has(t.roomId));
  const unassigned =
    groupId === null
      ? data.unassigned
      : data.unassigned.filter((b) => b.groupId === groupId);

  const days = new Map<string, Day>(
    data.nights.map((date) => [date, { date, sold: 0, leaving: 0, arrivals: [] }])
  );

  /*
   * One pass over the room-nights.
   *
   * A stay holding four nights arrives as four rows, so each booking counts
   * once per day — otherwise one long stay would read as four rooms sold.
   */
  const counted = new Map<string, Set<number>>();
  const departed = new Map<string, Set<number>>();
  const once = (map: Map<string, Set<number>>, date: string, id: number) => {
    let set = map.get(date);
    if (!set) {
      set = new Set();
      map.set(date, set);
    }
    if (set.has(id)) return false;
    set.add(id);
    return true;
  };

  for (const t of nights) {
    const day = days.get(t.night);
    if (day && once(counted, t.night, t.bookingId)) {
      day.sold += 1;
      if (t.arrival === t.night) {
        const room = byRoom.get(t.roomId) ?? null;
        day.arrivals.push({
          id: t.bookingId,
          guestName: t.guestName,
          status: t.status,
          arrival: t.arrival,
          departure: t.departure,
          roomId: t.roomId,
          roomName: room?.name ?? null,
          noRoom: false,
        });
      }
    }

    /*
     * Departures are in no night row at all.
     *
     * A stay leaving on the 20th holds the night of the 19th and no part of the
     * 20th — the rule the whole module rests on. Counted from the stay itself,
     * because that is the only place the date exists.
     */
    const out = days.get(t.departure);
    if (out && once(departed, t.departure, t.bookingId)) out.leaving += 1;
  }

  // Stays with no room, on the day they arrive. Not on every night they cover:
  // the job is to give them a room, and that job belongs to the day they turn
  // up, not to each of the four squares after it.
  for (const b of unassigned) {
    const day = days.get(b.arrival);
    if (!day) continue;
    day.arrivals.push({
      id: b.id,
      guestName: b.guestName,
      status: b.status,
      arrival: b.arrival,
      departure: b.departure,
      roomId: null,
      roomName: null,
      noRoom: true,
    });
  }

  for (const day of days.values()) {
    day.arrivals.sort(
      (a, b) =>
        Number(b.noRoom) - Number(a.noRoom) || a.guestName.localeCompare(b.guestName)
    );
  }

  /** What the panel needs, from what a cell knows. */
  function asBooking(stay: Arrival): TakenNight {
    return {
      roomId: stay.roomId as number,
      night: stay.arrival,
      bookingId: stay.id,
      guestName: stay.guestName,
      status: stay.status as TakenNight["status"],
      arrival: stay.arrival,
      departure: stay.departure,
      source: "direct",
    };
  }

  const homeless = unassigned.length;

  return (
    <>
      {/*
        The tray the timeline used to carry, reduced to its one useful state.
        A stay with no room is the only thing on this screen that is wrong, and
        it was previously findable only by scrolling a grid — so it says itself,
        above everything, and only when there is one.
      */}
      {homeless > 0 ? (
        <p className="mg-alert">
          <strong>
            {homeless} {homeless === 1 ? "stay has" : "stays have"} no room yet
          </strong>{" "}
          — open one below and pick a room, or it holds nothing.
        </p>
      ) : null}

      <div className="mg">
        <div className="mg-weekdays" aria-hidden="true">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <span key={d}>{d}</span>
          ))}
        </div>

        {weeksOf(data.nights).map((week, w) => (
          <div className="mg-week" key={w}>
            {week.map((date, i) => {
              if (date === null) return <div className="mg-blank" key={`b${i}`} />;

              const day = days.get(date)!;
              const full =
                capacity > 0 ? Math.round((day.sold / capacity) * 100) : 0;
              const extra = day.arrivals.length - NAMES;

              const marks = [
                "mg-day",
                date === today ? "today" : "",
                capacity > 0 && day.sold >= capacity ? "full" : "",
              ].filter(Boolean);

              return (
                <div
                  className={marks.join(" ")}
                  key={date}
                  /*
                   * Occupancy as the cell's own shade. A month of thirty
                   * squares shows its shape before anything is read — the busy
                   * week is the dark one — which no amount of small print in
                   * each square can do.
                   */
                  style={
                    day.sold > 0
                      ? ({ "--mg-heat": full / 100 } as React.CSSProperties)
                      : undefined
                  }
                >
                  <div className="mg-top">
                    {/* The way into that day's desk: the screen that can check
                        somebody in, and the one that lists who is in house. */}
                    <Link className="mg-num" href={`${deskBase}?date=${date}`}>
                      {Number(date.slice(8, 10))}
                    </Link>

                    {day.sold > 0 ? (
                      <span
                        className="mg-full"
                        title={`${day.sold} of ${capacity} room${capacity === 1 ? "" : "s"} sold`}
                      >
                        {full}%
                      </span>
                    ) : null}
                  </div>

                  {day.arrivals.length > 0 || day.leaving > 0 ? (
                    <p className="mg-move">
                      {day.arrivals.length > 0 ? (
                        <span
                          className="mg-in"
                          title={`${day.arrivals.length} arriving`}
                        >
                          ↓{day.arrivals.length}
                        </span>
                      ) : null}
                      {day.leaving > 0 ? (
                        <span className="mg-out" title={`${day.leaving} leaving`}>
                          ↑{day.leaving}
                        </span>
                      ) : null}
                    </p>
                  ) : null}

                  <ul className="mg-names">
                    {day.arrivals.slice(0, NAMES).map((stay) => (
                      <li key={stay.id}>
                        <button
                          type="button"
                          className={`mg-chip${stay.noRoom ? " mg-noroom" : " mg-in"}`}
                          title={`${stay.guestName} · ${stay.arrival} → ${stay.departure}${
                            stay.roomName ? ` · ${stay.roomName}` : " · no room yet"
                          }`}
                          onClick={() => onOpen(asBooking(stay))}
                        >
                          {stay.guestName}
                        </button>
                      </li>
                    ))}
                  </ul>

                  {extra > 0 ? (
                    <Link className="mg-more" href={`${deskBase}?date=${date}`}>
                      +{extra} more
                    </Link>
                  ) : null}

                  {onEmpty ? (
                    <button
                      type="button"
                      className="mg-take"
                      title={`Take a booking arriving ${date}`}
                      onClick={() =>
                        onEmpty({ arrival: date, groupId: groupId ?? undefined })
                      }
                    >
                      <span aria-hidden="true">+</span>
                      <span className="visually-hidden">
                        Take a booking arriving {date}
                      </span>
                    </button>
                  ) : null}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </>
  );
}
