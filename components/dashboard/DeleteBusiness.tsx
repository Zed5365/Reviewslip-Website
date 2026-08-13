"use client";

import { useState, useTransition } from "react";

/**
 * Deleting a business.
 *
 * Behind a typed confirmation, not a dialog, because this is destructive twice
 * over and neither part is obvious from the button:
 *
 *   - review_events cascades with the row, so the entire review history and
 *     every rating goes with it;
 *   - the address returns to the pool, so a QR code already printed for this
 *     business could later point at somebody else's.
 *
 * Typing the address is the only confirmation that requires reading what is
 * about to happen. An "are you sure?" is clicked through.
 */
export default function DeleteBusiness({
  slug,
  destroy,
}: {
  slug: string;
  destroy: () => Promise<{ error?: string }>;
}) {
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [error, setError] = useState("");
  const [busy, startBusy] = useTransition();

  const matches = typed.trim().toLowerCase() === slug;

  if (!open) {
    return (
      <div style={frame}>
        <h2 style={heading}>Delete this business</h2>
        <p style={body}>
          Its reviews, ratings and settings go with it, and{" "}
          <strong>{slug}</strong> becomes available for someone else to claim —
          so any QR code already printed for it could end up pointing at another
          business.
        </p>
        <button type="button" className="btn btn-quiet" onClick={() => setOpen(true)}>
          Delete business
        </button>
      </div>
    );
  }

  return (
    <div style={frame}>
      <h2 style={heading}>Delete this business</h2>
      <p style={body}>
        This cannot be undone. Type <strong>{slug}</strong> to confirm.
      </p>

      <input
        value={typed}
        onChange={(e) => setTyped(e.target.value)}
        placeholder={slug}
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        aria-label={`Type ${slug} to confirm`}
        style={{
          width: "100%",
          maxWidth: "20rem",
          padding: "0.65rem 0.8rem",
          borderRadius: 10,
          border: "1px solid rgba(233,139,123,0.5)",
          background: "rgba(243,236,220,0.06)",
          color: "var(--paper)",
          font: "inherit",
          marginBottom: "0.9rem",
        }}
      />

      <p aria-live="polite" style={{ ...body, color: "#e98b7b", minHeight: "1.2rem" }}>
        {error}
      </p>

      <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
        <button
          type="button"
          className="btn btn-go"
          disabled={!matches || busy}
          onClick={() =>
            startBusy(async () => {
              setError("");
              // A success redirects, so nothing after this runs on the happy
              // path; only a failure comes back here.
              const result = await destroy().catch(() => ({
                error: "Could not delete it.",
              }));
              if (result?.error) setError(result.error);
            })
          }
        >
          {busy ? "Deleting…" : `Delete ${slug}`}
        </button>
        <button
          type="button"
          className="btn btn-quiet"
          disabled={busy}
          onClick={() => {
            setOpen(false);
            setTyped("");
            setError("");
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

const frame: React.CSSProperties = {
  marginTop: "3rem",
  padding: "1.4rem",
  border: "1px solid rgba(233,139,123,0.35)",
  borderRadius: 14,
  maxWidth: "34rem",
};

const heading: React.CSSProperties = {
  fontSize: "1.1rem",
  margin: "0 0 0.4rem",
  color: "#e98b7b",
};

const body: React.CSSProperties = {
  fontSize: "0.85rem",
  color: "var(--ink-soft)",
  margin: "0 0 0.9rem",
};
