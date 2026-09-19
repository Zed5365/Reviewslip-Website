"use client";

import { Fragment, useState } from "react";
import type { Booking, CalendarWindow, Room, TakenNight } from "@/lib/customer";
import { isWeekStart } from "@/lib/nights";

/**
 * The diary: rooms down the side, nights across.
 *
 * Dragging a stay changes which room it is in, and nothing else. Not its dates
 * — a horizontal drag that silently moved somebody's arrival would be the most
 * expensive gesture in the product, and the easiest to make by accident. Dates
 * change in the panel, where it takes a deliberate edit and shows the new night
 * count before it saves.
 *
 * Drag is the quick path, not the only one. The panel has a room selector that
 * does the same thing, because HTML5 drag and drop does not work under a finger
 * and a front desk runs on a tablet as often as a laptop.
 */

export interface MoveResult {
  error?: string;
}

const TONE: Record<string, { fill: string; ink: string }> = {
  confirmed: { fill: "rgba(130,180,155,0.30)", ink: "var(--cream)" },
  in_house: { fill: "rgba(233,160,59,0.32)", ink: "var(--cream)" },
  checked_out: { fill: "rgba(243,236,220,0.10)", ink: "var(--admin-muted)" },
};

function head(night: string) {
  const d = new Date(`${night}T12:00:00Z`); // midday: no zone can shift the day
  return {
    day: d.getUTCDate(),
    weekday: ["S", "M", "T", "W", "T", "F", "S"][d.getUTCDay()],
    weekend: d.getUTCDay() === 0 || d.getUTCDay() === 6,
  };
}

/** Saturday or Sunday. Its own function because the body needs it too. */
function weekendOf(night: string) {
  const day = new Date(`${night}T12:00:00Z`).getUTCDay();
  return day === 0 || day === 6;
}

/** The nights a stay occupies. Departure day is not one. */
function nightsOf(arrival: string, departure: string): string[] {
  const a = Date.parse(`${arrival}T00:00:00Z`);
  const d = Date.parse(`${departure}T00:00:00Z`);
  if (!Number.isFinite(a) || !Number.isFinite(d) || d <= a) return [];
  const out: string[] = [];
  for (let t = a; t < d; t += 86_400_000) {
    out.push(new Date(t).toISOString().slice(0, 10));
  }
  return out;
}

export default function Calendar({
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
  /**
   * Today at the property, as the server worked it out.
   *
   * Passed rather than read from the browser's clock: the two disagree for
   * seven hours a day in Bangkok, and a column highlighted on the server and
   * not in the browser is a hydration mismatch that throws the grid away and
   * repaints it.
   */
  today?: string;
  /** Server action: put a booking in a room, or null to unassign. */
  move: (bookingId: number, roomId: number | null) => Promise<MoveResult>;
  onOpen: (booking: Booking | TakenNight) => void;
  /** An empty cell: the offer to take a booking in that room, that night. */
  onEmpty?: (prefill: { roomId: number; groupId: number; arrival: string }) => void;
}) {
  const { nights } = data;

  /*
   * The filter hides rows; it does not narrow the data.
   *
   * `taken` stays whole on purpose, so `clashes()` below still sees nights in
   * rooms that are currently off screen. Filtering the source instead would
   * make a drop look free because the stay blocking it happens to be in a room
   * type nobody is looking at — a double-booking created by a view setting.
   */
  const rooms = groupId === null
    ? data.rooms
    : data.rooms.filter((r) => r.groupId === groupId);

  /** Rooms in the order they are drawn, with a heading before each new type. */
  const ordered = [...rooms].sort(
    (a, b) =>
      (a.groupName ?? "").localeCompare(b.groupName ?? "") ||
      a.name.localeCompare(b.name, undefined, { numeric: true })
  );

  // Narrow columns once a month is on screen: 31 × 3rem plus the room column
  // is most of a second screen's worth of scrolling.
  const dense = nights.length > 16;

  // The grid is held locally so a drop can land before the round trip. The
  // server is still the truth: a refusal puts it back and says why.
  const [taken, setTaken] = useState<TakenNight[]>(data.taken);
  const [unassigned, setUnassigned] = useState<Booking[]>(data.unassigned);
  const [dragging, setDragging] = useState<number | null>(null);
  const [over, setOver] = useState<number | null>(null);
  const [problem, setProblem] = useState<string>("");
  const [busy, setBusy] = useState(false);

  // Re-seed when the server sends a new window (paging, or a revalidate).
  const [seen, setSeen] = useState(data);
  if (data !== seen) {
    setSeen(data);
    setTaken(data.taken);
    setUnassigned(data.unassigned);
    setProblem("");
  }

  const byRoom = new Map<number, Map<string, TakenNight>>();
  for (const t of taken) {
    let row = byRoom.get(t.roomId);
    if (!row) {
      row = new Map();
      byRoom.set(t.roomId, row);
    }
    row.set(t.night, t);
  }

  /** Everything known about the stay being dragged, from either source. */
  function stayOf(bookingId: number) {
    const night = taken.find((t) => t.bookingId === bookingId);
    if (night) {
      return {
        id: bookingId,
        guestName: night.guestName,
        arrival: night.arrival,
        departure: night.departure,
        status: night.status,
        source: night.source,
      };
    }
    const pending = unassigned.find((b) => b.id === bookingId);
    return pending
      ? {
          id: bookingId,
          guestName: pending.guestName,
          arrival: pending.arrival,
          departure: pending.departure,
          status: pending.status,
          source: pending.source,
        }
      : null;
  }

  /**
   * Would this stay clash in that room?
   *
   * Checked here so an impossible drop refuses instantly instead of after a
   * round trip. It is not the enforcement — the unique index on (room_id,
   * night) is, and it sees nights outside this window that the browser has
   * never been sent.
   */
  function clashes(bookingId: number, roomId: number, wanted: string[]) {
    const row = byRoom.get(roomId);
    if (!row) return false;
    return wanted.some((n) => {
      const held = row.get(n);
      return held !== undefined && held.bookingId !== bookingId;
    });
  }

  async function drop(roomId: number | null) {
    const bookingId = dragging;
    setDragging(null);
    setOver(null);
    if (bookingId === null || busy) return;

    const stay = stayOf(bookingId);
    if (!stay) return;

    const wanted = nightsOf(stay.arrival, stay.departure);

    if (roomId !== null && clashes(bookingId, roomId, wanted)) {
      setProblem(
        `${stay.guestName} cannot go there — the room is taken on one of those nights.`
      );
      return;
    }

    // Snapshot before touching anything, so a refusal restores exactly what was
    // on screen rather than something reconstructed from the new state.
    const before = { taken, unassigned };
    setProblem("");
    setBusy(true);

    const withoutIt = taken.filter((t) => t.bookingId !== bookingId);
    if (roomId === null) {
      setTaken(withoutIt);
      setUnassigned([...unassigned.filter((b) => b.id !== bookingId), {
        ...(unassigned.find((b) => b.id === bookingId) ?? ({} as Booking)),
        id: bookingId,
        guestName: stay.guestName,
        arrival: stay.arrival,
        departure: stay.departure,
      } as Booking]);
    } else {
      setTaken([
        ...withoutIt,
        ...wanted
          .filter((n) => nights.includes(n))
          .map((night) => ({
            roomId,
            night,
            bookingId,
            guestName: stay.guestName,
            status: stay.status,
            arrival: stay.arrival,
            departure: stay.departure,
            source: stay.source,
          })),
      ]);
      setUnassigned(unassigned.filter((b) => b.id !== bookingId));
    }

    const result = await move(bookingId, roomId);
    setBusy(false);

    if (result.error) {
      // Put it back where it was, visibly, and say why. Reverting silently
      // would leave somebody believing the move worked.
      setTaken(before.taken);
      setUnassigned(before.unassigned);
      setProblem(result.error);
    }
  }

  if (rooms.length === 0) return null;

  return (
    <>
      {problem ? (
        <p className="cal-problem" role="alert">
          {problem}
        </p>
      ) : null}

      {/* --------------------------------------------------- unassigned strip */}

      <div
        className={`cal-tray${over === -1 ? " over" : ""}`}
        onDragOver={(e) => {
          if (dragging === null) return;
          e.preventDefault();
          setOver(-1);
        }}
        onDragLeave={() => setOver((o) => (o === -1 ? null : o))}
        onDrop={(e) => {
          e.preventDefault();
          void drop(null);
        }}
      >
        <h2 className="cal-tray-title">
          Not in a room{unassigned.length ? ` (${unassigned.length})` : ""}
        </h2>

        {unassigned.length === 0 ? (
          <p className="cal-tray-empty">
            Everything has a room. Drag a stay here to take it out of one.
          </p>
        ) : (
          <ul className="cal-tray-list">
            {unassigned.map((b) => (
              <li key={b.id}>
                <button
                  type="button"
                  draggable={!busy}
                  onDragStart={() => setDragging(b.id)}
                  onDragEnd={() => {
                    setDragging(null);
                    setOver(null);
                  }}
                  onClick={() => onOpen(b)}
                  className={`cal-chip${dragging === b.id ? " dragging" : ""}`}
                >
                  <strong>{b.guestName}</strong>
                  <span>
                    {b.groupName} · {b.arrival} → {b.departure}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* ---------------------------------------------------------- the grid */}

      <div className="admin-scroll">
        <table
          className="cal"
          style={
            {
              "--cal-night-w": dense ? "2rem" : "3rem",
              "--cal-room-w": dense ? "9rem" : "11rem",
            } as React.CSSProperties
          }
        >
          <thead>
            <tr>
              <th className="cal-room">Room</th>
              {nights.map((night) => {
                const h = head(night);
                const marks = [
                  "cal-night",
                  h.weekend ? "weekend" : "",
                  // A heavier line where the week turns. Reading "is that the
                  // second or third Friday" off thirty-one identical columns is
                  // the thing a month view is otherwise worse at than a
                  // fortnight.
                  isWeekStart(night) ? "week-start" : "",
                  night === today ? "today" : "",
                ].filter(Boolean);
                return (
                  <th key={night} className={marks.join(" ")}>
                    <span className="cal-weekday">{h.weekday}</span>
                    <span className="cal-day">{h.day}</span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {ordered.map((room: Room, at) => {
              const row = byRoom.get(room.id);
              const target = over === room.id;
              // A heading row when the type changes, so the filter reads as a
              // zoom into something rather than a hiding of everything else.
              const opensGroup =
                at === 0 || ordered[at - 1].groupName !== room.groupName;

              return (
                <Fragment key={`g${room.id}`}>
                {opensGroup ? (
                  <tr className="cal-group-row">
                    {/* The sticky cell is never the spanned one: a cell that is
                        both `colspan` and `position: sticky; left: 0` is where
                        sticky tables come apart. */}
                    <th scope="rowgroup" className="cal-room cal-group">
                      {room.groupName}
                    </th>
                    <td className="cal-group-fill" colSpan={nights.length} />
                  </tr>
                ) : null}
                <tr
                  className={target ? "cal-row over" : "cal-row"}
                  onDragOver={(e) => {
                    if (dragging === null) return;
                    e.preventDefault();
                    setOver(room.id);
                  }}
                  onDragLeave={() => setOver((o) => (o === room.id ? null : o))}
                  onDrop={(e) => {
                    e.preventDefault();
                    void drop(room.id);
                  }}
                >
                  <th scope="row" className="cal-room">
                    {room.name}
                  </th>

                  {nights.map((night) => {
                    const stay = row?.get(night);
                    // Every cell carries the column's own marks, so the grid
                    // reads top to bottom as well as left to right. Putting
                    // them on the header alone is what made this a row of
                    // floating bars rather than a table somebody can count.
                    const edge = [
                      isWeekStart(night) ? "week-start" : "",
                      weekendOf(night) ? "weekend" : "",
                      night === today ? "today" : "",
                    ]
                      .filter(Boolean)
                      .map((c) => ` ${c}`)
                      .join("");

                    if (!stay) {
                      // An empty cell is an offer. One tap on the night and the
                      // room somebody is already looking at beats a form that
                      // asks them to type both back in.
                      return onEmpty ? (
                        <td key={night} className={`cal-cell empty${edge}`}>
                          <button
                            type="button"
                            className="cal-take"
                            disabled={busy}
                            title={`Take a booking · ${room.name} · ${night}`}
                            onClick={() =>
                              onEmpty({
                                roomId: room.id,
                                groupId: room.groupId,
                                arrival: night,
                              })
                            }
                          >
                            <span aria-hidden="true">+</span>
                            <span className="visually-hidden">
                              Take a booking in {room.name} on {night}
                            </span>
                          </button>
                        </td>
                      ) : (
                        <td key={night} className={`cal-cell${edge}`} />
                      );
                    }

                    const tone = TONE[stay.status] ?? TONE.confirmed;
                    const first =
                      stay.night === stay.arrival || stay.night === nights[0];

                    return (
                      <td
                        key={night}
                        className={`cal-cell taken${edge}`}
                        style={{ background: tone.fill, color: tone.ink }}
                      >
                        {first ? (
                          <button
                            type="button"
                            draggable={!busy}
                            onDragStart={() => setDragging(stay.bookingId)}
                            onDragEnd={() => {
                              setDragging(null);
                              setOver(null);
                            }}
                            onClick={() => onOpen(stay)}
                            className={`cal-guest${
                              dragging === stay.bookingId ? " dragging" : ""
                            }`}
                            title={`${stay.guestName} · ${stay.arrival} → ${stay.departure}`}
                          >
                            {stay.guestName}
                          </button>
                        ) : null}
                      </td>
                    );
                  })}
                </tr>
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
