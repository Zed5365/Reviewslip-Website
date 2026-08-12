"use client";

import { useState, useTransition } from "react";

export interface ReviewRow {
  id: number;
  review_text: string;
  category_id: string | null;
  liked: boolean | null;
  created_at: string;
}

/**
 * The latest reviews, with a thumb on each.
 *
 * Rating is optimistic: the thumb moves immediately and reverts if the server
 * refuses. Waiting on a round trip to acknowledge a button press makes working
 * through twenty of them feel broken, and the failure case is rare and
 * recoverable — the row simply goes back to how it was.
 */
export default function ReviewList({
  reviews,
  rate,
}: {
  reviews: ReviewRow[];
  rate: (id: number, liked: boolean) => Promise<{ ok: boolean }>;
}) {
  const [ratings, setRatings] = useState<Record<number, boolean | null>>(() =>
    Object.fromEntries(reviews.map((r) => [r.id, r.liked]))
  );
  const [, startTransition] = useTransition();

  function onRate(id: number, liked: boolean) {
    const before = ratings[id] ?? null;
    // Tapping the thumb that is already set clears it — a rating you cannot
    // undo is one people are reluctant to give.
    const next = before === liked ? null : liked;

    setRatings((cur) => ({ ...cur, [id]: next }));

    startTransition(async () => {
      // Clearing is not a state the API has, so a second tap re-sends the
      // opposite of nothing: send the value only when there is one.
      if (next === null) return;
      const result = await rate(id, next).catch(() => ({ ok: false }));
      if (!result?.ok) setRatings((cur) => ({ ...cur, [id]: before }));
    });
  }

  if (reviews.length === 0) {
    return (
      <div style={card}>
        <h2 style={heading}>Latest reviews</h2>
        <p style={{ fontSize: "0.85rem", color: "var(--ink-soft)" }}>
          Nothing yet. Reviews appear here as guests generate them.
        </p>
      </div>
    );
  }

  return (
    <div style={card}>
      <h2 style={heading}>Latest reviews</h2>
      <p style={{ fontSize: "0.8rem", color: "var(--ink-soft)", margin: "0 0 1rem" }}>
        Rate these and the ones you like become examples the writer follows for
        this business.
      </p>

      <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: "0.9rem" }}>
        {reviews.map((review) => {
          const liked = ratings[review.id] ?? null;

          return (
            <li key={review.id} style={row}>
              <p style={{ fontSize: "0.9rem", lineHeight: 1.5, margin: 0 }}>
                {review.review_text}
              </p>
              <div style={meta}>
                <span style={{ fontSize: "0.75rem", color: "var(--ink-soft)" }}>
                  {review.category_id ?? "any"} ·{" "}
                  {new Date(review.created_at).toLocaleDateString()}
                </span>
                <span style={{ display: "flex", gap: "0.35rem" }}>
                  <button
                    type="button"
                    aria-label="Good review"
                    aria-pressed={liked === true}
                    onClick={() => onRate(review.id, true)}
                    style={thumb(liked === true, "#2f5f4c", "rgba(130,180,155,0.3)")}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    aria-label="Bad review"
                    aria-pressed={liked === false}
                    onClick={() => onRate(review.id, false)}
                    style={thumb(liked === false, "#8a3a2c", "rgba(233,139,123,0.3)")}
                  >
                    ↓
                  </button>
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

const card: React.CSSProperties = {
  background: "var(--paper)",
  color: "var(--ink)",
  borderRadius: 14,
  padding: "1.4rem",
};

const heading: React.CSSProperties = {
  fontSize: "1.2rem",
  margin: "0 0 0.2rem",
};

const row: React.CSSProperties = {
  borderTop: "1px solid rgba(27,42,35,0.12)",
  paddingTop: "0.9rem",
};

const meta: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "0.75rem",
  marginTop: "0.5rem",
};

function thumb(
  active: boolean,
  ink: string,
  fill: string
): React.CSSProperties {
  return {
    width: "1.9rem",
    height: "1.9rem",
    borderRadius: 999,
    cursor: "pointer",
    fontSize: "0.95rem",
    lineHeight: 1,
    border: `1px solid ${active ? ink : "rgba(27,42,35,0.18)"}`,
    background: active ? fill : "transparent",
    color: active ? ink : "var(--ink-soft)",
  };
}
