"use client";

import { useState, useTransition } from "react";

import { PLATFORMS } from "@/lib/platforms.data";

export interface ReviewRow {
  id: number;
  review_text: string;
  category_id: string | null;
  rating: number | null;
  created_at: string;
  /** What the writer was working from. Absent on rows written before this. */
  language?: string | null;
  length?: string | null;
  /**
   * Which listing the guest took it to, by platform id.
   *
   * Optional, and null on rows from before it was recorded — those were
   * backfilled as proceeded because they predate the distinction, so there is
   * no answer to give for them rather than a wrong one.
   */
  proceeded_to?: string | null;
}

/** Codes to names, mirroring config.js in the review app. */
const LANGUAGES: Record<string, string> = {
  en: "English", th: "Thai", zh: "Chinese", ja: "Japanese", ko: "Korean",
  es: "Spanish", fr: "French", de: "German", it: "Italian", pt: "Portuguese",
  nl: "Dutch",
};

const LENGTHS: Record<string, string> = {
  any: "any length",
  short: "short",
  detailed: "detailed",
};

/**
 * What this review was generated from, in words.
 *
 * A rating is only actionable if you can see what produced the thing you are
 * rating: two stars on a review is a shrug, two stars on "the welcome, detailed,
 * in Thai" is a lead. The stored `category_id` is topic ids joined with "+",
 * which is the shape the meter groups on, so it has to be unpicked here.
 *
 * Every part is optional. Rows written before these columns existed have none
 * of it, and a review missing its context is still one worth rating.
 */
function contextNote(review: ReviewRow): string {
  const topics = (review.category_id ?? "")
    .split("+")
    .map((id) => id.trim())
    .filter(Boolean)
    .map((id) => id.replace(/-/g, " "));

  const parts = [topics.length ? topics.join(", ") : "no topic picked"];

  // "any" and English are the defaults, so saying them adds a word and no
  // information. What is worth surfacing is when a guest chose otherwise.
  if (review.length && review.length !== "any") {
    parts.push(LENGTHS[review.length] ?? review.length);
  }
  if (review.language && review.language !== "en") {
    parts.push(`in ${LANGUAGES[review.language] ?? review.language}`);
  }

  // Where it went. Last in the line because it is the outcome rather than the
  // input, and it is the thing an owner scans for: a review that reached Google
  // is worth more to them than one that reached anywhere else.
  const platform = PLATFORMS.find((p) => p.id === review.proceeded_to);
  if (platform) parts.push(`to ${platform.label}`);

  return parts.join(" · ");
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/**
 * The date, formatted the same on both sides of hydration.
 *
 * `toLocaleDateString()` was rendering 17/08/2026 on the server, whose Node
 * process is en-GB, and 8/17/2026 in a browser set to en-US — a mismatch React
 * reports as a hydration failure and recovers from by throwing away the server
 * HTML for the whole list. Fixed parts in UTC agree everywhere, and a written
 * month has the side benefit of being unambiguous to both audiences rather than
 * wrong for one of them.
 */
function stamp(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

/**
 * One star.
 *
 * Inline SVG rather than the ★ character: that renders as whatever the platform
 * decides, at a different weight and size per OS, and it cannot inherit the
 * button's colour — so the filled state could not be drawn in the ink colour.
 */
function Star({ filled }: { filled: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="17"
      height="17"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={filled ? 0 : 1.6}
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      style={{ display: "block" }}
    >
      <path d="M12 2.5l2.9 5.9 6.5.95-4.7 4.58 1.11 6.47L12 17.35l-5.81 3.05 1.11-6.47-4.7-4.58 6.5-.95L12 2.5z" />
    </svg>
  );
}

/**
 * The latest reviews, with a rating and its context on each.
 *
 * Rating is optimistic: the stars move immediately and revert if the server
 * refuses. Waiting on a round trip to acknowledge a button press makes working
 * through twenty of them feel broken, and the failure case is rare and
 * recoverable — the row simply goes back to how it was.
 */
export default function ReviewList({
  reviews,
  rate,
}: {
  reviews: ReviewRow[];
  rate: (id: number, rating: number | null) => Promise<{ ok: boolean }>;
}) {
  const [ratings, setRatings] = useState<Record<number, number | null>>(() =>
    Object.fromEntries(reviews.map((r) => [r.id, r.rating]))
  );
  const [, startTransition] = useTransition();

  function onRate(id: number, stars: number) {
    const before = ratings[id] ?? null;
    // Tapping the star that is already the rating clears it. A rating you
    // cannot undo is one people are reluctant to give in the first place —
    // which matters most for five, the one that changes what gets written.
    const next = before === stars ? null : stars;

    setRatings((cur) => ({ ...cur, [id]: next }));

    startTransition(async () => {
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
        Five stars means you would be glad to see it on your listing — those are
        kept and shown to the writer on every review it writes from then on. One
        and two are shown to it as things to avoid. Three and four are recorded
        and not fed back: they are the ones that were merely fine, and teaching
        it to aim at fine is how everything ends up fine.
      </p>

      {/* Fixed frame: twenty reviews would otherwise push the stats card and
          everything below it far off the page. The list scrolls inside itself. */}
      <ul
        style={{
          listStyle: "none",
          margin: 0,
          padding: "0 0.5rem 0 0",
          display: "grid",
          gap: "0.9rem",
          maxHeight: "26rem",
          overflowY: "auto",
          overscrollBehavior: "contain",
        }}
      >
        {reviews.map((review) => {
          const rating = ratings[review.id] ?? null;

          return (
            <li key={review.id} style={row}>
              <p style={{ fontSize: "0.9rem", lineHeight: 1.5, margin: 0 }}>
                {review.review_text}
              </p>
              <div style={meta}>
                <span style={{ fontSize: "0.75rem", color: "var(--ink-soft)" }}>
                  {contextNote(review)} ·{" "}
                  {stamp(review.created_at)}
                </span>
                <span
                  style={{ display: "flex", gap: "0.1rem" }}
                  role="radiogroup"
                  aria-label="Rating"
                >
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      role="radio"
                      aria-checked={rating === n}
                      aria-label={n === 1 ? "1 star" : n + " stars"}
                      title={
                        n === 5
                          ? "Five stars — the writer keeps this one and follows it"
                          : n + " stars"
                      }
                      onClick={() => onRate(review.id, n)}
                      style={star(rating !== null && n <= rating, rating === 5)}
                    >
                      <Star filled={rating !== null && n <= rating} />
                    </button>
                  ))}
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
  flexWrap: "wrap",
};

/**
 * One star in the row.
 *
 * Borderless, unlike the two thumbs it replaces: five bordered pills read as
 * five separate switches, and a rating is one control. A full five keeps a
 * warmer colour than the rest, so the state that actually changes what gets
 * written is the one that stands out on the page.
 */
function star(filled: boolean, top: boolean): React.CSSProperties {
  return {
    width: "1.55rem",
    height: "1.9rem",
    cursor: "pointer",
    display: "grid",
    placeItems: "center",
    padding: 0,
    border: 0,
    background: "transparent",
    color: filled ? (top ? "#c07d17" : "#2f5f4c") : "rgba(27,42,35,0.28)",
  };
}
