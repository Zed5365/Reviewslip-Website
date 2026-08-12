import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { call, sessionToken, type VenueDetail } from "@/lib/customer";
import { isLocale } from "@/lib/i18n/config";
import { localizedPath } from "@/lib/i18n/routing";

export const metadata: Metadata = {
  title: "Venue",
  robots: { index: false, follow: false },
};

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div
      style={{
        background: "var(--paper)",
        color: "var(--ink)",
        borderRadius: 12,
        padding: "1rem 1.1rem",
      }}
    >
      <div
        style={{
          fontFamily: "var(--display)",
          fontSize: "1.8rem",
          lineHeight: 1.1,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {value}
      </div>
      <div style={{ fontSize: "0.8rem", color: "var(--ink-soft)", marginTop: "0.15rem" }}>
        {label}
      </div>
    </div>
  );
}

export default async function VenuePage({
  params,
}: PageProps<"/[lang]/dashboard/[slug]">) {
  const { lang, slug } = await params;
  if (!isLocale(lang)) notFound();

  const token = await sessionToken();
  if (!token) redirect(localizedPath(lang, "/login"));

  let data: VenueDetail;
  try {
    data = await call<VenueDetail>(`/venues/${slug}`, { token });
  } catch (err) {
    // The API answers 404 for a venue belonging to someone else as well as one
    // that does not exist — deliberately, and it stays that way here.
    if ((err as { status?: number }).status === 404) notFound();
    throw err;
  }

  const { venue, stats } = data;
  const peak = Math.max(...stats.daily.map((d) => d.reviews), 1);
  const tokenShare = Math.round((stats.month.tokens / stats.month.tokenLimit) * 100);

  return (
    <section className="section">
      <div className="wrap">
        <Link
          href={localizedPath(lang, "/dashboard")}
          style={{ color: "var(--jade)", fontSize: "0.9rem" }}
        >
          ← All venues
        </Link>

        <h1 style={{ margin: "1.25rem 0 0.4rem" }}>{venue.name}</h1>
        <p className="lede" style={{ marginBottom: "2.5rem" }}>
          <a href={venue.url} target="_blank" rel="noreferrer">
            {venue.url}
          </a>
        </p>

        <div
          style={{
            display: "grid",
            gap: "1rem",
            gridTemplateColumns: "repeat(auto-fit, minmax(11rem, 1fr))",
            marginBottom: "2rem",
          }}
        >
          <Stat value={stats.month.reviews.toLocaleString()} label="Reviews this month" />
          <Stat value={stats.lifetime.reviews.toLocaleString()} label="Reviews all time" />
          <Stat value={`${tokenShare}%`} label="Of this month's tokens" />
          <Stat
            value={
              stats.lifetime.lastAt
                ? new Date(stats.lifetime.lastAt).toLocaleDateString()
                : "—"
            }
            label="Last review"
          />
        </div>

        <div
          style={{
            background: "var(--paper)",
            color: "var(--ink)",
            borderRadius: 14,
            padding: "1.4rem",
            marginBottom: "2rem",
          }}
        >
          <h2 style={{ fontSize: "1.2rem", margin: 0 }}>Last 30 days</h2>
          {/* min-width:0 on each column, or thirty flex items refuse to shrink
              below their content and push the card past its container. */}
          <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height: 90, marginTop: "0.75rem" }}>
            {stats.daily.map((day) => (
              <div
                key={day.day}
                title={`${day.day}: ${day.reviews} review${day.reviews === 1 ? "" : "s"}`}
                style={{
                  flex: "1 1 0",
                  minWidth: 0,
                  height: `${Math.max((day.reviews / peak) * 100, 2)}%`,
                  borderRadius: "2px 2px 0 0",
                  background: day.reviews === 0 ? "rgba(27,42,35,0.12)" : "var(--jade)",
                }}
              />
            ))}
          </div>

          <h3 style={{ fontSize: "0.85rem", color: "var(--ink-soft)", margin: "1.4rem 0 0.5rem" }}>
            What guests pick
          </h3>
          {stats.byCategory.length === 0 ? (
            <p style={{ fontSize: "0.85rem", color: "var(--ink-soft)" }}>
              Nothing yet this month.
            </p>
          ) : (
            <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: "0.4rem" }}>
              {stats.byCategory.map((row) => (
                <li key={row.category} style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>{row.category}</span>
                  <span style={{ fontVariantNumeric: "tabular-nums", color: "var(--ink-soft)" }}>
                    {row.reviews.toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <Link
          className="btn btn-go"
          href={localizedPath(lang, `/dashboard/${venue.slug}/settings`)}
        >
          Settings
        </Link>
      </div>
    </section>
  );
}
