"use client";

import { useActionState, useState } from "react";
import type { Room } from "@/lib/customer";

export interface BookingState {
  error?: string;
  ok?: boolean;
  values?: { guestName?: string; arrival?: string; departure?: string };
}

const EMPTY: BookingState = {};

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
  fontSize: "0.82rem",
  marginBottom: "0.3rem",
  color: "var(--cream)",
};

/** Nights between two YYYY-MM-DD dates. Departure day is not a night. */
function nightsBetween(arrival: string, departure: string): number {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(arrival)) return 0;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(departure)) return 0;
  const a = Date.parse(`${arrival}T00:00:00Z`);
  const d = Date.parse(`${departure}T00:00:00Z`);
  if (!Number.isFinite(a) || !Number.isFinite(d) || d <= a) return 0;
  return Math.round((d - a) / 86_400_000);
}

/**
 * Take a booking by hand.
 *
 * The night count is echoed back live, because "3rd to the 5th" reads as three
 * days to most people and is two nights. Saying which it is at the moment the
 * dates are picked is cheaper than correcting it afterwards, and it is the same
 * rule the server enforces — this is the explanation, not the check.
 *
 * The room list narrows to the chosen type: a room only exists inside one, and
 * offering all of them would let somebody pick a combination the API refuses.
 */
export default function NewBooking({
  action,
  groups,
  rooms,
}: {
  action: (state: BookingState, formData: FormData) => Promise<BookingState>;
  groups: { id: number; name: string }[];
  rooms: Room[];
}) {
  const [state, formAction, pending] = useActionState(action, EMPTY);
  const [groupId, setGroupId] = useState<number>(groups[0]?.id ?? 0);
  const [guestName, setGuestName] = useState("");
  const [arrival, setArrival] = useState("");
  const [departure, setDeparture] = useState("");

  /**
   * Put back what was typed when the server refuses.
   *
   * Adjusted during render rather than in an effect. React resets an
   * uncontrolled form once its action resolves, so the values have to be
   * restored — but doing that in an effect means rendering the cleared form,
   * then setting state, then rendering again, which is a visible flash of empty
   * fields and the cascade the lint rule is there to prevent. Comparing against
   * the last state seen and correcting before the paint is the documented way
   * to derive state from something that changed.
   */
  const [seen, setSeen] = useState(state);
  if (state !== seen) {
    setSeen(state);
    if (state.error && state.values) {
      setGuestName(state.values.guestName ?? "");
      setArrival(state.values.arrival ?? "");
      setDeparture(state.values.departure ?? "");
    } else if (state.ok) {
      // Cleared on success, so the next booking starts from nothing rather
      // than from the last guest's name.
      setGuestName("");
      setArrival("");
      setDeparture("");
    }
  }

  const count = nightsBetween(arrival, departure);
  const forGroup = rooms.filter((r) => r.groupId === groupId);

  return (
    <form action={formAction} style={{ display: "grid", gap: "1rem", maxWidth: "42rem" }}>
      <div
        style={{
          display: "grid",
          gap: "1rem",
          gridTemplateColumns: "repeat(auto-fit, minmax(12rem, 1fr))",
        }}
      >
        <div>
          <label htmlFor="b-guest" style={label}>
            Guest
          </label>
          <input
            id="b-guest"
            name="guestName"
            required
            maxLength={120}
            disabled={pending}
            value={guestName}
            onChange={(e) => setGuestName(e.target.value)}
            placeholder="Name on the booking"
            style={field}
          />
        </div>

        <div>
          <label htmlFor="b-email" style={label}>
            Email <span style={{ color: "var(--admin-muted)" }}>(optional)</span>
          </label>
          <input
            id="b-email"
            name="guestEmail"
            type="email"
            disabled={pending}
            placeholder="them@example.com"
            style={field}
          />
        </div>

        <div>
          <label htmlFor="b-arrival" style={label}>
            Arrival
          </label>
          <input
            id="b-arrival"
            name="arrival"
            type="date"
            required
            disabled={pending}
            value={arrival}
            onChange={(e) => setArrival(e.target.value)}
            style={field}
          />
        </div>

        <div>
          <label htmlFor="b-departure" style={label}>
            Departure
          </label>
          <input
            id="b-departure"
            name="departure"
            type="date"
            required
            disabled={pending}
            value={departure}
            onChange={(e) => setDeparture(e.target.value)}
            style={field}
          />
        </div>

        <div>
          <label htmlFor="b-group" style={label}>
            Room type
          </label>
          <select
            id="b-group"
            name="groupId"
            disabled={pending}
            value={groupId}
            onChange={(e) => setGroupId(Number(e.target.value))}
            style={{ ...field, appearance: "auto" }}
          >
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="b-room" style={label}>
            Room <span style={{ color: "var(--admin-muted)" }}>(optional)</span>
          </label>
          <select
            id="b-room"
            name="roomId"
            disabled={pending}
            style={{ ...field, appearance: "auto" }}
          >
            <option value="">Decide later</option>
            {forGroup.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="b-adults" style={label}>
            Adults
          </label>
          <input
            id="b-adults"
            name="adults"
            type="number"
            min={1}
            max={20}
            defaultValue={2}
            disabled={pending}
            style={field}
          />
        </div>
      </div>

      <div style={{ display: "flex", gap: "1rem", alignItems: "center", flexWrap: "wrap" }}>
        <button type="submit" className="btn btn-go" disabled={pending}>
          {pending ? "Saving…" : "Take booking"}
        </button>
        <span style={{ fontSize: "0.9rem", color: "var(--admin-muted)" }}>
          {count > 0
            ? `${count} night${count === 1 ? "" : "s"}`
            : arrival && departure
              ? "Departure has to be after arrival"
              : ""}
        </span>
      </div>

      <p
        role="status"
        style={{ margin: 0, fontSize: "0.9rem", color: "var(--marigold)" }}
      >
        {state.error ?? ""}
      </p>
    </form>
  );
}
