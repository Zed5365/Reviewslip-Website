"use client";

import { useEffect, useRef, useState } from "react";
import GuestList from "./GuestList";
import type { Booking, BookingGuest, Room } from "@/lib/customer";

export interface EditResult {
  error?: string;
}

const field: React.CSSProperties = {
  width: "100%",
  padding: "0.6rem 0.8rem",
  borderRadius: 10,
  border: "1px solid var(--jade-line)",
  background: "var(--shade-soft)",
  color: "var(--cream)",
  fontFamily: "inherit",
  fontSize: "0.95rem",
};

const label: React.CSSProperties = {
  display: "block",
  fontSize: "0.8rem",
  marginBottom: "0.3rem",
  color: "var(--cream)",
};

function nightsBetween(arrival: string, departure: string): number {
  const a = Date.parse(`${arrival}T00:00:00Z`);
  const d = Date.parse(`${departure}T00:00:00Z`);
  if (!Number.isFinite(a) || !Number.isFinite(d) || d <= a) return 0;
  return Math.round((d - a) / 86_400_000);
}

const STATUS: { id: Booking["status"]; label: string }[] = [
  { id: "confirmed", label: "Confirmed" },
  { id: "in_house", label: "Checked in" },
  { id: "checked_out", label: "Checked out" },
  { id: "no_show", label: "No show" },
  { id: "cancelled", label: "Cancelled" },
];

/**
 * One booking, open for correction.
 *
 * A dialog rather than a page, because the thing somebody wants after changing
 * a stay is to look at the calendar again and see where it went. A round trip
 * through another screen puts a navigation between the change and its effect.
 *
 * Cancelling is here and not on the grid deliberately: it gives the nights back
 * at once, and a gesture that empties a room should take more than one click on
 * a crowded screen.
 */
export default function BookingPanel({
  booking,
  rooms,
  slug,
  onClose,
  save,
  assign,
  setStatus,
}: {
  booking: Booking | null;
  rooms: Room[];
  /** Which venue, for the guest endpoint. */
  slug: string;
  onClose: () => void;
  save: (id: number, patch: Record<string, unknown>) => Promise<EditResult>;
  /** Separate from `save` because it rewrites the night ledger, not a column. */
  assign: (id: number, roomId: number | null) => Promise<EditResult>;
  setStatus: (id: number, status: string) => Promise<EditResult>;
}) {
  const dialog = useRef<HTMLDialogElement>(null);

  const [guestName, setGuestName] = useState("");
  const [arrival, setArrival] = useState("");
  const [departure, setDeparture] = useState("");
  const [roomId, setRoomId] = useState<string>("");
  const [problem, setProblem] = useState("");
  const [busy, setBusy] = useState(false);

  // Guests load when a booking opens, not with the page. A calendar listing
  // fifty stays would otherwise fetch fifty guest lists to show none of them.
  const [guests, setGuests] = useState<BookingGuest[]>([]);
  const [canStorePassports, setCanStorePassports] = useState(true);

  async function loadGuests(id: number) {
    try {
      const res = await fetch(`/api/guests/${slug}/${id}`, { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      setGuests(data.guests ?? []);
      setCanStorePassports(data.canStorePassports !== false);
    } catch {
      // A guest list that will not load must not stop somebody changing the
      // dates. The section renders empty and everything else on the panel works.
    }
  }

  async function addGuest(guest: Record<string, string>) {
    if (!booking) return { error: "No booking." };
    const res = await fetch(`/api/guests/${slug}/${booking.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(guest),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { error: data.error ?? "Could not add that guest." };
    await loadGuests(booking.id);
    return {};
  }

  async function updateGuest(id: number, patch: Record<string, unknown>) {
    if (!booking) return { error: "No booking." };
    const res = await fetch(`/api/guests/${slug}/${booking.id}?guestId=${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { error: data.error ?? "Could not save that guest." };
    // Reloaded rather than patched in place: `reportable`, `ready` and
    // `missing` are all worked out on the server, and guessing at them here
    // would mean two answers to "does this guest need notifying".
    await loadGuests(booking.id);
    return {};
  }

  async function removeGuest(id: number) {
    if (!booking) return { error: "No booking." };
    const res = await fetch(`/api/guests/${slug}/${booking.id}?guestId=${id}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return { error: data.error ?? "Could not remove that guest." };
    }
    await loadGuests(booking.id);
    return {};
  }

  // Re-seed the fields when a different booking is opened. Adjusted during
  // render rather than in an effect, so the panel never paints last booking's
  // guest under this one's title.
  const [seen, setSeen] = useState<Booking | null>(null);
  if (booking !== seen) {
    setSeen(booking);
    setProblem("");
    setGuests([]);
    if (booking) {
      setGuestName(booking.guestName);
      setArrival(booking.arrival);
      setDeparture(booking.departure);
      setRoomId(booking.roomId ? String(booking.roomId) : "");
      // Fired from render deliberately — it sets no state synchronously, and
      // an effect would mean the panel paints once with the previous booking's
      // guests before clearing them.
      void loadGuests(booking.id);
    }
  }

  // showModal is imperative — there is no prop for "open" that also traps focus
  // and lights the backdrop, so opening and closing has to be done to the node.
  useEffect(() => {
    const node = dialog.current;
    if (!node) return;
    if (booking && !node.open) node.showModal();
    if (!booking && node.open) node.close();
  }, [booking]);

  if (!booking) {
    return <dialog ref={dialog} className="editor" aria-label="Booking" />;
  }

  const count = nightsBetween(arrival, departure);
  const forGroup = rooms.filter((r) => r.groupId === booking.groupId);

  async function commit() {
    if (busy) return;
    setBusy(true);
    setProblem("");

    const result = await save(booking!.id, {
      guestName,
      arrival,
      departure,
    });

    // The room moves through its own call, because on the server it is a
    // different operation: it rewrites the night ledger rather than setting a
    // column. Folding it into the patch would also hide which of the two
    // failed, and "the dates saved but the room did not" is exactly the thing
    // somebody needs told.
    const wanted = roomId ? Number(roomId) : null;
    const roomResult: EditResult =
      !result.error && wanted !== booking!.roomId
        ? await assign(booking!.id, wanted)
        : {};

    setBusy(false);

    const err = result.error || roomResult.error;
    if (err) {
      setProblem(err);
      return;
    }
    onClose();
  }

  async function mark(status: string) {
    if (busy) return;
    setBusy(true);
    setProblem("");
    const result = await setStatus(booking!.id, status);
    setBusy(false);
    if (result.error) setProblem(result.error);
    else onClose();
  }

  return (
    <dialog
      ref={dialog}
      className="editor"
      aria-labelledby="booking-title"
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === dialog.current) onClose();
      }}
    >
      <div style={{ display: "grid", gap: "1rem", padding: "1.25rem" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: "1rem",
            alignItems: "flex-start",
          }}
        >
          <div style={{ minWidth: 0 }}>
            <h2
              id="booking-title"
              style={{
                margin: 0,
                fontFamily: "var(--display)",
                fontWeight: 400,
                fontSize: "1.3rem",
                color: "var(--cream)",
              }}
            >
              {booking.guestName}
            </h2>
            <span style={{ fontSize: "0.85rem", color: "var(--admin-muted)" }}>
              {booking.groupName}
              {booking.roomName ? ` · ${booking.roomName}` : " · no room yet"} ·{" "}
              {booking.source}
            </span>
          </div>
          <button type="button" className="btn btn-quiet" onClick={onClose}>
            Close
          </button>
        </div>

        <div
          style={{
            display: "grid",
            gap: "0.9rem",
            gridTemplateColumns: "repeat(auto-fit, minmax(10rem, 1fr))",
          }}
        >
          <div style={{ gridColumn: "1 / -1" }}>
            <label htmlFor="p-guest" style={label}>
              Guest
            </label>
            <input
              id="p-guest"
              value={guestName}
              disabled={busy}
              maxLength={120}
              onChange={(e) => setGuestName(e.target.value)}
              style={field}
            />
          </div>

          <div>
            <label htmlFor="p-arrival" style={label}>
              Arrival
            </label>
            <input
              id="p-arrival"
              type="date"
              value={arrival}
              disabled={busy}
              onChange={(e) => setArrival(e.target.value)}
              style={field}
            />
          </div>

          <div>
            <label htmlFor="p-departure" style={label}>
              Departure
            </label>
            <input
              id="p-departure"
              type="date"
              value={departure}
              disabled={busy}
              onChange={(e) => setDeparture(e.target.value)}
              style={field}
            />
          </div>

          <div>
            <label htmlFor="p-room" style={label}>
              Room
            </label>
            <select
              id="p-room"
              value={roomId}
              disabled={busy}
              onChange={(e) => setRoomId(e.target.value)}
              style={{ ...field, appearance: "auto" }}
            >
              <option value="">Not in a room</option>
              {forGroup.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--admin-muted)" }}>
          {count > 0
            ? `${count} night${count === 1 ? "" : "s"}`
            : "Departure has to be after arrival"}
        </p>

        <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
          <button
            type="button"
            className="btn btn-go"
            disabled={busy || count === 0}
            onClick={() => void commit()}
          >
            {busy ? "Saving…" : "Save"}
          </button>

          {STATUS.filter((s) => s.id !== booking.status).map((s) => (
            <button
              key={s.id}
              type="button"
              className="btn btn-quiet"
              disabled={busy}
              onClick={() => void mark(s.id)}
            >
              {s.label}
            </button>
          ))}
        </div>

        <p role="alert" style={{ margin: 0, fontSize: "0.9rem", color: "var(--marigold)" }}>
          {problem}
        </p>

        <GuestList
          guests={guests}
          canStorePassports={canStorePassports}
          add={addGuest}
          update={updateGuest}
          remove={removeGuest}
        />
      </div>
    </dialog>
  );
}
