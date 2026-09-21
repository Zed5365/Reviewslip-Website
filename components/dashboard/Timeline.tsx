"use client";

import { Fragment, useRef, useState } from "react";
import { shift } from "@/lib/nights";
import type { Booking, CalendarWindow, Room, TakenNight } from "@/lib/customer";

export interface MoveResult {
  error?: string;
}

/** What a drag is doing to the stay under the pointer. */
type Mode = "move" | "start" | "end";

/** A stay, once, with the room it sits in. */
interface Stay {
  id: number;
  guestName: string;
  status: string;
  arrival: string;
  departure: string;
  roomId: number | null;
  source: string;
}

/** Where a stay has been dragged to, before the server has agreed. */
interface Ghost {
  id: number;
  roomId: number;
  arrival: string;
  departure: string;
}

const TONE: Record<string, string> = {
  confirmed: "confirmed",
  in_house: "in-house",
  checked_out: "out",
};

/**
 * Rooms down the side, a month of nights across, and stays you can drag.
 *
 * The grid answers the question the month cannot: *which room*. A month of
 * days tells you the 14th is busy; only this tells you that it is busy in
 * every bungalow and the suite is empty, which is the thing somebody moves a
 * booking about.
 *
 * Two layers, the same as the month view. Cells underneath take the clicks for
 * an empty night; stays sit on top as absolutely positioned bars, because a bar
 * that is a run of table cells cannot be dragged as one object, and dragging is
 * the point of this screen.
 *
 * Pointer events rather than HTML5 drag-and-drop. Drag-and-drop gives a drop
 * target and nothing else — no live position, so no preview — and it does not
 * fire under a finger at all, which rules out the tablet a front desk actually
 * runs on. Pointer events are one code path for mouse, pen and touch.
 */
export default function Timeline({
  data,
  groupId = null,
  today = "",
  move,
  onOpen,
  onEmpty,
}: {
  data: CalendarWindow;
  /** Show only this room type, or every one. Display only — see below. */
  groupId?: number | null;
  today?: string;
  /**
   * Where a stay ended up: its room, and its dates.
   *
   * One call rather than one for the room and another for the dates, because a
   * drag changes both at once and two calls means a state where it landed in
   * the right room on the wrong nights.
   */
  move: (
    bookingId: number,
    to: { roomId: number; arrival: string; departure: string }
  ) => Promise<MoveResult>;
  onOpen: (booking: Booking | TakenNight) => void;
  onEmpty?: (prefill: { roomId: number; groupId: number; arrival: string }) => void;
}) {
  const { nights } = data;

  const rooms =
    groupId === null ? data.rooms : data.rooms.filter((r) => r.groupId === groupId);

  /** Rooms in drawing order, so a drag can step between them by index. */
  const ordered = [...rooms].sort(
    (a, b) =>
      (a.groupName ?? "").localeCompare(b.groupName ?? "") ||
      a.name.localeCompare(b.name, undefined, { numeric: true })
  );
  const rowOf = new Map(ordered.map((r, i) => [r.id, i]));

  /**
   * How far down each room's row starts, in rows and group headings.
   *
   * Arithmetic rather than measurement, because it has to be known during
   * render to place a bar, and a measured height is only known after one.
   * The two heights are CSS variables so the sums here and the layout there
   * cannot disagree.
   */
  const offsetOf = new Map<number, { rows: number; heads: number }>();
  {
    let heads = 0;
    ordered.forEach((room, i) => {
      if (i === 0 || ordered[i - 1].groupName !== room.groupName) heads += 1;
      offsetOf.set(room.id, { rows: i, heads });
    });
  }

  const [problem, setProblem] = useState("");
  const [busy, setBusy] = useState(false);
  /*
   * Where the stay is being dragged to, in two places on purpose.
   *
   * The state is what renders. The ref is what `finish` reads, because an
   * event handler closes over the state as it was at its render — and pointerup
   * can land before React has re-rendered from the last pointermove. Reading
   * the state there is how a drag silently posts the position the stay started
   * from, or decides nothing changed and posts nothing at all.
   */
  const [ghost, setGhostState] = useState<Ghost | null>(null);
  const ghostRef = useRef<Ghost | null>(null);

  function setGhost(next: Ghost | null) {
    ghostRef.current = next;
    setGhostState(next);
  }

  const track = useRef<HTMLDivElement>(null);
  const drag = useRef<{
    stay: Stay;
    mode: Mode;
    x: number;
    /**
     * Where the bar was when it was grabbed — not where the server has it.
     *
     * Those differ for as long as a saved change is in flight: the ghost is
     * left in place on success so the stay does not flash back to its old
     * nights, which means a second drag started in that moment would otherwise
     * measure from dates nobody can see. A drag has to move the thing that is
     * under the pointer.
     */
    origin: { roomId: number; arrival: string; departure: string };
  } | null>(null);

  /* ------------------------------------------------------------ the stays */

  const stays = new Map<number, Stay>();
  for (const t of data.taken) {
    if (!stays.has(t.bookingId)) {
      stays.set(t.bookingId, {
        id: t.bookingId,
        guestName: t.guestName,
        status: t.status,
        arrival: t.arrival,
        departure: t.departure,
        roomId: t.roomId,
        source: t.source,
      });
    }
  }

  /*
   * Re-seed when the server sends a different window, or a saved change.
   *
   * Only the rendered ghost is cleared here, not the ref: touching a ref during
   * render is the thing the lint rule is about, and there is nothing to clear
   * anyway — a drag that is still in progress has its own truth in the ref, and
   * one that has finished set it to null already.
   */
  const [seen, setSeen] = useState(data);
  if (data !== seen) {
    setSeen(data);
    setGhostState(null);
    setProblem("");
  }

  const index = (night: string) => nights.indexOf(night);

  /**
   * Would this stay clash where it is being dropped?
   *
   * Checked against every room-night on screen except the stay's own, so an
   * impossible drop refuses instantly rather than after a round trip. The
   * server checks again — this is the courtesy, not the rule.
   */
  function clashes(id: number, roomId: number, from: string, to: string) {
    return data.taken.some(
      (t) =>
        t.roomId === roomId &&
        t.bookingId !== id &&
        t.night >= from &&
        t.night < to
    );
  }

  /* ----------------------------------------------------------- the drag */

  function begin(e: React.PointerEvent, stay: Stay, mode: Mode) {
    const from = place(stay);
    if (busy || from.roomId === null) return;
    e.preventDefault();
    e.stopPropagation();
    // Capture so the drag survives the pointer leaving the bar — which it does
    // immediately, because the bar is what is moving. Guarded because a pointer
    // id the browser has already released throws here, and a throw would end
    // the drag before it started rather than degrade it.
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {
      // Without capture the drag still works while the pointer is over the
      // grid, which is where it is.
    }

    drag.current = {
      stay,
      mode,
      x: e.clientX,
      origin: {
        roomId: from.roomId,
        arrival: from.arrival,
        departure: from.departure,
      },
    };
    setGhost({
      id: stay.id,
      roomId: from.roomId,
      arrival: from.arrival,
      departure: from.departure,
    });
    setProblem("");
  }

  function during(e: React.PointerEvent) {
    const d = drag.current;
    if (!d || !track.current) return;

    const width = track.current.getBoundingClientRect().width / nights.length;
    const days = Math.round((e.clientX - d.x) / width);

    // Which room row the pointer is over. Read from the rows themselves rather
    // than from arithmetic, because a group heading makes the rows unevenly
    // spaced and a computed row index would drift past the first one.
    let roomId = d.origin.roomId;
    if (d.mode === "move") {
      const under = document
        .elementsFromPoint(e.clientX, e.clientY)
        .find((el) => el instanceof HTMLElement && el.dataset.room);
      const found = Number((under as HTMLElement | undefined)?.dataset.room);
      if (Number.isSafeInteger(found) && rowOf.has(found)) roomId = found;
    }

    let arrival = d.origin.arrival;
    let departure = d.origin.departure;

    if (d.mode === "move") {
      arrival = shift(d.origin.arrival, days);
      departure = shift(d.origin.departure, days);
    } else if (d.mode === "start") {
      arrival = shift(d.origin.arrival, days);
      // A stay is at least one night; the database says so too.
      if (arrival >= departure) arrival = shift(departure, -1);
    } else {
      departure = shift(d.origin.departure, days);
      if (departure <= arrival) departure = shift(arrival, 1);
    }

    setGhost({ id: d.stay.id, roomId, arrival, departure });
  }

  async function finish() {
    const d = drag.current;
    const g = ghostRef.current;
    drag.current = null;
    if (!d || !g) return;

    const unchanged =
      g.roomId === d.origin.roomId &&
      g.arrival === d.origin.arrival &&
      g.departure === d.origin.departure;
    if (unchanged) {
      setGhost(null);
      return;
    }

    if (clashes(d.stay.id, g.roomId, g.arrival, g.departure)) {
      setGhost(null);
      setProblem(
        `${d.stay.guestName} cannot go there — the room is taken on one of those nights.`
      );
      return;
    }

    setBusy(true);
    try {
      const result = await move(d.stay.id, {
        roomId: g.roomId,
        arrival: g.arrival,
        departure: g.departure,
      });
      // Left in place on success: the page revalidates and the new window
      // replaces the ghost. Clearing it here would flash the stay back to
      // where it started for the length of the round trip.
      if (result.error) {
        setGhost(null);
        setProblem(result.error);
      }
    } catch {
      setGhost(null);
      setProblem("Could not reach the server. Reload the page and try again.");
    } finally {
      setBusy(false);
    }
  }

  /** Where a stay sits now — dragged, or as the server has it. */
  function place(stay: Stay) {
    const g = ghost?.id === stay.id ? ghost : null;
    const roomId = g ? g.roomId : (stay.roomId as number);
    const arrival = g ? g.arrival : stay.arrival;
    const departure = g ? g.departure : stay.departure;

    // Clipped to the window, so a stay running in from last month still draws.
    const from = Math.max(0, index(arrival) === -1 && arrival < nights[0] ? 0 : index(arrival));
    const lastNight = shift(departure, -1);
    const to =
      index(lastNight) === -1 && lastNight > nights[nights.length - 1]
        ? nights.length - 1
        : index(lastNight);

    return { roomId, from, to, arrival, departure, dragging: Boolean(g) };
  }

  return (
    <>
      {problem ? (
        <p className="cal-problem" role="alert">
          {problem}
        </p>
      ) : null}

      <div className="admin-scroll">
        <div
          className="tl"
          style={
            {
              "--tl-day": nights.length > 16 ? "2.1rem" : "3rem",
              "--tl-room": "10rem",
              "--tl-cols": nights.length,
            } as React.CSSProperties
          }
          onPointerMove={during}
          onPointerUp={() => void finish()}
          onPointerCancel={() => {
            drag.current = null;
            setGhost(null);
          }}
        >
          <div className="tl-head">
            <div className="tl-room tl-corner">Room</div>
            <div className="tl-days" ref={track}>
              {nights.map((night) => {
                const d = new Date(`${night}T12:00:00Z`);
                const weekend = d.getUTCDay() === 0 || d.getUTCDay() === 6;
                return (
                  <div
                    key={night}
                    className={`tl-day${weekend ? " weekend" : ""}${
                      night === today ? " today" : ""
                    }`}
                  >
                    <span>{["S", "M", "T", "W", "T", "F", "S"][d.getUTCDay()]}</span>
                    <b>{d.getUTCDate()}</b>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="tl-body">
            {ordered.map((room: Room, at) => {
              const opensGroup =
                at === 0 || ordered[at - 1].groupName !== room.groupName;

              return (
                <Fragment key={room.id}>
                  {opensGroup ? (
                    <div className="tl-group">
                      <div className="tl-room">{room.groupName}</div>
                      <div className="tl-groupfill" />
                    </div>
                  ) : null}

                  <div className="tl-row">
                    <div className="tl-room">{room.name}</div>
                    <div className="tl-track" data-room={room.id}>
                      {nights.map((night) => {
                        const d = new Date(`${night}T12:00:00Z`);
                        const weekend = d.getUTCDay() === 0 || d.getUTCDay() === 6;
                        return (
                          <button
                            key={night}
                            type="button"
                            data-room={room.id}
                            className={`tl-cell${weekend ? " weekend" : ""}${
                              night === today ? " today" : ""
                            }`}
                            title={`${room.name} · ${night}`}
                            onClick={() =>
                              onEmpty?.({
                                roomId: room.id,
                                groupId: room.groupId,
                                arrival: night,
                              })
                            }
                          />
                        );
                      })}
                    </div>
                  </div>
                </Fragment>
              );
            })}

            {/*
              Every stay in one layer, over the rows rather than inside them.

              This is not tidiness. A bar rendered inside its room's row is a
              different DOM node the moment the drag moves it to another room —
              React takes it out of one parent and builds it in the next — and
              the node the pointer was captured on no longer exists. The drag
              dies halfway, silently, exactly when it crosses a row, which is
              most of what dragging here is for. In one layer the room is a
              `top` and nothing is ever re-parented.
            */}
            <div className="tl-stays">
              {[...stays.values()].map((stay) => {
                const p = place(stay);
                if (p.to < 0 || p.from > nights.length - 1) return null;

                const at = offsetOf.get(p.roomId);
                if (!at) return null;

                const span = Math.max(1, p.to - p.from + 1);
                return (
                  <div
                    key={stay.id}
                    className={`tl-stay ${TONE[stay.status] ?? "confirmed"}${
                      p.dragging ? " dragging" : ""
                    }`}
                    style={{
                      left: `calc(${p.from} * var(--tl-day))`,
                      width: `calc(${span} * var(--tl-day))`,
                      top: `calc(${at.rows} * var(--tl-row-h) + ${at.heads} * var(--tl-group-h) + 2px)`,
                    }}
                    title={`${stay.guestName} · ${p.arrival} → ${p.departure}`}
                    onPointerDown={(e) => begin(e, stay, "move")}
                  >
                    <span
                      className="tl-grip start"
                      onPointerDown={(e) => begin(e, stay, "start")}
                      aria-hidden="true"
                    />
                    <button
                      type="button"
                      className="tl-who"
                      onClick={() =>
                        onOpen({
                          roomId: stay.roomId as number,
                          night: p.arrival,
                          bookingId: stay.id,
                          guestName: stay.guestName,
                          status: stay.status as TakenNight["status"],
                          arrival: p.arrival,
                          departure: p.departure,
                          source: stay.source,
                        })
                      }
                    >
                      {stay.guestName}
                    </button>
                    <span
                      className="tl-grip end"
                      onPointerDown={(e) => begin(e, stay, "end")}
                      aria-hidden="true"
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <p className="tl-hint">
        Drag a stay to move it — sideways for dates, up and down for rooms — or
        pull either end to make it longer or shorter. Click an empty night to
        take a booking in that room.
      </p>
    </>
  );
}
