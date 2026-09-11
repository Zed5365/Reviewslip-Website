"use client";

import { useState } from "react";
import type { BookingGuest } from "@/lib/customer";

export interface GuestResult {
  error?: string;
}

const field: React.CSSProperties = {
  width: "100%",
  padding: "0.5rem 0.7rem",
  borderRadius: 8,
  border: "1px solid var(--jade-line)",
  background: "var(--shade-soft)",
  color: "var(--cream)",
  fontFamily: "inherit",
  fontSize: "0.9rem",
};

const label: React.CSSProperties = {
  display: "block",
  fontSize: "0.75rem",
  marginBottom: "0.2rem",
  color: "var(--admin-muted)",
};

/**
 * The people on a booking, for Thailand's TM30 notification.
 *
 * Separate from the booking's own guest name, which is whoever the reservation
 * is under — a family of four is one booking and four notifiable people, and a
 * company booking is under a name that never arrives.
 *
 * The passport number is write-only from here. What comes back is the last four
 * characters, which is enough to confirm the right document is in hand and
 * enough for nobody to do anything else with. Nothing in this component can ask
 * the server for the whole number; only the export can, and that is a file
 * download somebody deliberately asks for.
 */
export default function GuestList({
  guests,
  canStorePassports,
  add,
  remove,
}: {
  guests: BookingGuest[];
  /** False when the server has no encryption key — the field is disabled. */
  canStorePassports: boolean;
  add: (guest: Record<string, string>) => Promise<GuestResult>;
  remove: (id: number) => Promise<GuestResult>;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState("");

  const [familyName, setFamilyName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [nationality, setNationality] = useState("");
  const [passportNumber, setPassportNumber] = useState("");
  const [arrivedInThailand, setArrivedInThailand] = useState("");

  async function submit() {
    if (busy) return;
    setBusy(true);
    setProblem("");

    const result = await add({
      familyName,
      firstName,
      nationality,
      passportNumber,
      arrivedInThailand,
    });

    setBusy(false);
    if (result.error) {
      setProblem(result.error);
      return;
    }

    // Cleared on success only. A refusal keeps what was typed, because
    // re-entering a passport number from a document already back in somebody's
    // pocket is the worst kind of retry.
    setFamilyName("");
    setFirstName("");
    setNationality("");
    setPassportNumber("");
    setArrivedInThailand("");
    setOpen(false);
  }

  return (
    <div style={{ borderTop: "1px solid var(--jade-line)", paddingTop: "1rem" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          gap: "1rem",
          marginBottom: "0.6rem",
        }}
      >
        <h3 style={{ margin: 0, fontSize: "0.95rem" }}>
          Guests{" "}
          <span style={{ fontWeight: 400, color: "var(--admin-muted)" }}>
            for TM30
          </span>
        </h3>
        <button
          type="button"
          className="btn btn-quiet"
          onClick={() => setOpen((o) => !o)}
        >
          {open ? "Cancel" : "Add guest"}
        </button>
      </div>

      {guests.length === 0 ? (
        <p style={{ margin: "0 0 0.6rem", fontSize: "0.85rem", color: "var(--admin-muted)" }}>
          Nobody recorded. Foreign guests have to be notified to Immigration
          within 24 hours of arriving.
        </p>
      ) : (
        <ul style={{ listStyle: "none", margin: "0 0 0.6rem", padding: 0 }}>
          {guests.map((g) => (
            <li
              key={g.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "0.75rem",
                padding: "0.45rem 0",
                borderBottom: "1px solid rgba(130,180,155,0.12)",
              }}
            >
              <span style={{ minWidth: 0, fontSize: "0.88rem" }}>
                {g.firstName} {g.familyName}
                <span
                  style={{
                    display: "block",
                    fontSize: "0.76rem",
                    color: g.ready ? "var(--admin-muted)" : "var(--marigold)",
                  }}
                >
                  {g.nationality ?? "no nationality"}
                  {g.passportTail ? ` · passport ••••${g.passportTail}` : ""}
                  {!g.ready ? ` · needs ${g.missing.join(", ")}` : ""}
                  {g.notifiedAt ? " · notified" : ""}
                </span>
              </span>

              <button
                type="button"
                className="btn btn-quiet"
                disabled={busy}
                onClick={() => void remove(g.id)}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}

      {open ? (
        <div style={{ display: "grid", gap: "0.6rem" }}>
          <div
            style={{
              display: "grid",
              gap: "0.6rem",
              gridTemplateColumns: "repeat(auto-fit, minmax(8rem, 1fr))",
            }}
          >
            <div>
              <label htmlFor="g-first" style={label}>
                First name
              </label>
              <input
                id="g-first"
                value={firstName}
                disabled={busy}
                onChange={(e) => setFirstName(e.target.value)}
                style={field}
              />
            </div>
            <div>
              <label htmlFor="g-family" style={label}>
                Family name
              </label>
              <input
                id="g-family"
                value={familyName}
                disabled={busy}
                onChange={(e) => setFamilyName(e.target.value)}
                style={field}
              />
            </div>
            <div>
              <label htmlFor="g-nat" style={label}>
                Nationality
              </label>
              <input
                id="g-nat"
                value={nationality}
                disabled={busy}
                placeholder="GB"
                onChange={(e) => setNationality(e.target.value)}
                style={field}
              />
            </div>
            <div>
              <label htmlFor="g-passport" style={label}>
                Passport number
              </label>
              <input
                id="g-passport"
                value={passportNumber}
                disabled={busy || !canStorePassports}
                autoComplete="off"
                onChange={(e) => setPassportNumber(e.target.value)}
                style={field}
              />
            </div>
            <div>
              <label htmlFor="g-arrived" style={label}>
                Entered Thailand
              </label>
              <input
                id="g-arrived"
                type="date"
                value={arrivedInThailand}
                disabled={busy}
                onChange={(e) => setArrivedInThailand(e.target.value)}
                style={field}
              />
            </div>
          </div>

          {!canStorePassports ? (
            // Said before somebody types a passport number and loses it on
            // save, rather than after.
            <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--marigold)" }}>
              Passport numbers are turned off until SECRET_KEY is set on the
              server. Everything else here will save.
            </p>
          ) : (
            <p style={{ margin: 0, fontSize: "0.78rem", color: "var(--admin-muted)" }}>
              The number is encrypted and never shown again — only the last four
              digits, and the file you send to Immigration.
            </p>
          )}

          <div>
            <button
              type="button"
              className="btn btn-go"
              disabled={busy}
              onClick={() => void submit()}
            >
              {busy ? "Saving…" : "Add"}
            </button>
          </div>
        </div>
      ) : null}

      <p role="alert" style={{ margin: problem ? "0.6rem 0 0" : 0, fontSize: "0.85rem", color: "var(--marigold)" }}>
        {problem}
      </p>
    </div>
  );
}
