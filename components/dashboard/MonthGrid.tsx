"use client";

import Link from "next/link";
import { weeksOf } from "@/lib/nights";
import type { Booking, CalendarWindow, TakenNight } from "@/lib/customer";

/** How many names fit in a day before the rest become a count. */
const NAMES = 3;

/** One stay, as a day cell needs it. */
interface Stay {
  id: number;
  guestName: string;
  status: string;
  arrival: string;
  departure: string;
  roomId: number | null;
  roomName: string | null;
  groupId: number;
  groupName: string | null;
  /** How this stay relates to the day it is being drawn in. */
  part: "in" | "out" | "stay" | "noroom";
}

interface Day {
  date: string;
  /** Rooms sold that night. */
  sold: number;
  arriving: number;
  leaving: number;
  stays: Stay[];
}

/** Arrivals first, then departures, then whoever is simply in. */
const ORDER: Record<Stay["part"], number> = {
  noroom: 0,
  in: 1,
  out: 2,
  stay: 3,
};

/**
 * A month, laid out as a month.
 *
 * Seven columns and a row per week — the shape everybody already reads a month
 * in, from a wall planner to the date picker on a phone. The room-by-night
 * timeline this replaces as the default answers a narrower question, *which
 * room*, which is the right one once somebody is assigning rooms and the wrong
 * one for "what does the month look like". The timeline is one tab away and is
 * still the only view a stay can be dragged across.
 *
 * Every figure here comes from the room-nights the window already sends, so
 * this costs no extra request and cannot disagree with the timeline: both read
 * the same rows.
 *
 * Nothing is dragged. On a grid of days a horizontal drag would mean moving
 * somebody's arrival, which the timeline refuses on purpose — dates change in
 * the panel, where it takes a deliberate edit and shows the new night count
 * before it saves.
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
  /** The desk, for the day numbers and the "+N more" link. */
  deskBase: string;
  onOpen: (booking: Booking | TakenNight) => void;
  onEmpty?: (prefill: { arrival: string; groupId?: number }) => void;
}) {
  const rooms =
    groupId === null ? data.rooms : data.rooms.filter((r) => r.groupId === groupId);
  const byRoom = new Map(data.rooms.map((r) => [r.id, r]));
  const roomIds = new Set(rooms.map((r) => r.id));
  const capacity = rooms.length;

  // Filtered by the room a stay sits in, not by the booking's own type: a stay
  // is wherever it was actually put.
  const nights =
    groupId === null ? data.taken : data.taken.filter((t) => roomIds.has(t.roomId));
  const unassigned =
    groupId === null
      ? data.unassigned
      : data.unassigned.filter((b) => b.groupId === groupId);

  const days = new Map<string, Day>(
    data.nights.map((date) => [
      date,
      { date, sold: 0, arriving: 0, leaving: 0, stays: [] },
    ])
  );

  /*
   * One pass over the room-nights.
   *
   * A stay holding four nights arrives here as four rows, so each booking is
   * counted once per day — otherwise one long stay would read as four guests
   * on the day it started.
   */
  const counted = new Map<string, Set<number>>();
  for (const t of nights) {
    const day = days.get(t.night);
    if (!day) continue;

    let already = counted.get(t.night);
    if (!already) {
      already = new Set();
      counted.set(t.night, already);
    }
    if (already.has(t.bookingId)) continue;
    already.add(t.bookingId);

    const room = byRoom.get(t.roomId) ?? null;
    day.sold += 1;
    if (t.arrival === t.night) day.arriving += 1;
    day.stays.push({
      id: t.bookingId,
      guestName: t.guestName,
      status: t.status,
      arrival: t.arrival,
      departure: t.departure,
      roomId: t.roomId,
      roomName: room?.name ?? null,
      groupId: room?.groupId ?? 0,
      groupName: room?.groupName ?? null,
      part: t.arrival === t.night ? "in" : "stay",
    });
  }

  /*
   * Departures, which are not in the night rows at all.
   *
   * A stay leaving on the 20th holds the night of the 19th and no part of the
   * 20th — that is the rule the whole module rests on. So the only place the
   * departure date exists is on the stay itself, and a month that did not do
   * this would show a busy Sunday as empty because everybody left.
   */
  const leaving = new Map<string, Set<number>>();
  for (const t of nights) {
    const day = days.get(t.departure);
    if (!day) continue;

    let already = leaving.get(t.departure);
    if (!already) {
      already = new Set();
      leaving.set(t.departure, already);
    }
    if (already.has(t.bookingId)) continue;
    already.add(t.bookingId);

    const room = byRoom.get(t.roomId) ?? null;
    day.leaving += 1;
    day.stays.push({
      id: t.bookingId,
      guestName: t.guestName,
      status: t.status,
      arrival: t.arrival,
      departure: t.departure,
      roomId: t.roomId,
      roomName: room?.name ?? null,
      groupId: room?.groupId ?? 0,
      groupName: room?.groupName ?? null,
      part: "out",
    });
  }

  // Stays with no room yet, on every night they cover. First in each cell,
  // because they are the only thing in a month somebody has to act on.
  for (const b of unassigned) {
    for (const [date, day] of days) {
      if (b.arrival > date || b.departure <= date) continue;
      day.stays.push({
        id: b.id,
        guestName: b.guestName,
        status: b.status,
        arrival: b.arrival,
        departure: b.departure,
        roomId: null,
        roomName: null,
        groupId: b.groupId,
        groupName: b.groupName,
        part: "noroom",
      });
      if (b.arrival === date) day.arriving += 1;
    }
  }

  for (const day of days.values()) {
    day.stays.sort(
      (a, b) => ORDER[a.part] - ORDER[b.part] || a.guestName.localeCompare(b.guestName)
    );
  }

  /** What the panel needs, from what a cell knows. */
  function asBooking(stay: Stay, night: string): TakenNight {
    return {
      roomId: stay.roomId as number,
      night,
      bookingId: stay.id,
      guestName: stay.guestName,
      status: stay.status as TakenNight["status"],
      arrival: stay.arrival,
      departure: stay.departure,
      source: "direct",
    };
  }

  return (
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
            const full = capacity > 0 ? Math.round((day.sold / capacity) * 100) : 0;
            const soldOut = capacity > 0 && day.sold >= capacity;
            const extra = day.stays.length - NAMES;

            const marks = [
              "mg-day",
              date === today ? "today" : "",
              soldOut ? "full" : "",
            ].filter(Boolean);

            return (
              <div className={marks.join(" ")} key={date}>
                <div className="mg-top">
                  {/* The day number is the way into that day's desk — the
                      screen that can actually check somebody in. */}
                  <Link className="mg-num" href={`${deskBase}?date=${date}`}>
                    {Number(date.slice(8, 10))}
                  </Link>
                  {/*
                    Only when something is sold. A month of empty days each
                    announcing "0%" is thirty pieces of information that are all
                    the same, and they crowd out the handful of days that are
                    not — which is the entire reason somebody is looking.
                  */}
                  {day.sold > 0 ? (
                    <span
                      className="mg-full"
                      title={`${day.sold} of ${capacity} room${capacity === 1 ? "" : "s"}`}
                    >
                      {full}%
                    </span>
                  ) : null}
                </div>

                {day.sold > 0 ? (
                  <div className="mg-bar" role="img" aria-label={`${full}% full`}>
                    <span style={{ width: `${Math.min(full, 100)}%` }} />
                  </div>
                ) : null}

                {day.arriving > 0 || day.leaving > 0 ? (
                  <p className="mg-move">
                    {day.arriving > 0 ? (
                      <span className="mg-in">↓ {day.arriving} in</span>
                    ) : null}
                    {day.leaving > 0 ? (
                      <span className="mg-out">↑ {day.leaving} out</span>
                    ) : null}
                  </p>
                ) : null}

                <ul className="mg-names">
                  {day.stays.slice(0, NAMES).map((stay) => (
                    <li key={`${stay.part}-${stay.id}`}>
                      <button
                        type="button"
                        className={`mg-chip mg-${stay.part}`}
                        title={`${stay.guestName} · ${stay.arrival} → ${stay.departure}${
                          stay.roomName
                            ? ` · ${stay.roomName}`
                            : stay.part === "noroom"
                              ? " · no room yet"
                              : ""
                        }`}
                        onClick={() => onOpen(asBooking(stay, date))}
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
  );
}
