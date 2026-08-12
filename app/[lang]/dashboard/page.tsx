import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { currentUser } from "@/lib/customer";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { localizedPath } from "@/lib/i18n/routing";

export const metadata: Metadata = {
  title: "Dashboard",
  // A signed-in page has nothing to offer an index and every reason to stay out
  // of one.
  robots: { index: false, follow: false },
};

/** A usage bar. Amber at 80%, because a meter only helps while there is time. */
function Meter({
  label,
  used,
  limit,
}: {
  label: string;
  used: number;
  limit: number;
}) {
  const share = limit > 0 ? Math.min(used / limit, 1) : 0;

  return (
    <div style={{ marginBottom: "0.85rem" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: "0.85rem",
          marginBottom: "0.3rem",
        }}
      >
        <span style={{ color: "var(--ink-soft)" }}>{label}</span>
        <span style={{ fontVariantNumeric: "tabular-nums" }}>
          {used.toLocaleString()} / {limit.toLocaleString()}
        </span>
      </div>
      <div
        style={{
          height: 7,
          borderRadius: 999,
          background: "rgba(27,42,35,0.12)",
          overflow: "hidden",
        }}
        role="progressbar"
        aria-label={label}
        aria-valuenow={used}
        aria-valuemin={0}
        aria-valuemax={limit}
      >
        <div
          style={{
            height: "100%",
            borderRadius: 999,
            width: `${Math.max(share * 100, used > 0 ? 2 : 0)}%`,
            background: share >= 0.8 ? "var(--marigold)" : "var(--jade)",
          }}
        />
      </div>
    </div>
  );
}

export default async function DashboardPage({
  params,
}: PageProps<"/[lang]/dashboard">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  const me = await currentUser();
  if (!me) redirect(localizedPath(lang, "/login"));

  const t = getDictionary(lang);
  const businessLimit = me.plan.businesses === null ? "unlimited" : me.plan.businesses;

  return (
    <section className="section">
      <div className="wrap">
        <span className="eyebrow">{me.account.email}</span>
        <h1 style={{ marginBottom: "0.4rem" }}>Your businesses</h1>
        <p className="lede" style={{ marginBottom: "2.5rem" }}>
          {me.usage.businesses} of {businessLimit} on {me.plan.name} ·{" "}
          {me.usage.reviewsThisMonth.toLocaleString()} of{" "}
          {me.plan.reviewAllowance.toLocaleString()} reviews this month
        </p>

        <p style={{ marginBottom: "2rem" }}>
          {/* At the cap this still goes to the same page, which explains the
              limit and offers plans — better than a button that does nothing. */}
          <Link
            className="btn btn-go"
            href={localizedPath(lang, "/dashboard/businesses/new")}
          >
            Add a business
          </Link>
        </p>

        {me.businesses.length === 0 ? (
          <p>
            No businesses yet. {t.common.getInTouch} —{" "}
            <Link href={localizedPath(lang, "/contact")}>get in touch</Link> and
            we will set the first one up.
          </p>
        ) : (
          <div
            style={{
              display: "grid",
              gap: "1.25rem",
              gridTemplateColumns: "repeat(auto-fit, minmax(19rem, 1fr))",
            }}
          >
            {me.businesses.map((business) => (
              <div
                key={business.slug}
                style={{
                  background: "var(--paper)",
                  color: "var(--ink)",
                  borderRadius: 14,
                  padding: "1.4rem",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "baseline",
                    gap: "0.75rem",
                  }}
                >
                  <h2 style={{ fontSize: "1.3rem", margin: 0 }}>{business.name}</h2>
                  <span
                    style={{
                      borderRadius: 999,
                      padding: "0.15rem 0.6rem",
                      fontSize: "0.75rem",
                      whiteSpace: "nowrap",
                      background: business.ready
                        ? "rgba(130,180,155,0.22)"
                        : "rgba(233,160,59,0.22)",
                      color: business.ready ? "#2f5f4c" : "#8a5a12",
                    }}
                  >
                    {business.status !== "active"
                      ? business.status
                      : business.ready
                        ? "live"
                        : "no review link"}
                  </span>
                </div>

                <p
                  style={{
                    fontSize: "0.85rem",
                    color: "var(--ink-soft)",
                    wordBreak: "break-all",
                    margin: "0.2rem 0 1.1rem",
                  }}
                >
                  {business.url}
                </p>

                <Meter
                  label="Reviews this month"
                  used={business.usage.reviews}
                  limit={me.plan.reviewAllowance}
                />
                <Meter
                  label="Tokens this month"
                  used={business.usage.tokens}
                  limit={business.usage.tokenLimit}
                />

                <div
                  style={{
                    display: "flex",
                    gap: "0.6rem",
                    flexWrap: "wrap",
                    marginTop: "0.5rem",
                  }}
                >
                  <Link
                    className="btn btn-go"
                    href={localizedPath(lang, `/dashboard/${business.slug}`)}
                  >
                    Open
                  </Link>
                  {/* -ink, not -quiet: the quiet button is outlined for the dark
                      canvas and renders as an empty box on this cream card. */}
                  <Link
                    className="btn btn-quiet-ink"
                    href={localizedPath(lang, `/dashboard/${business.slug}/settings`)}
                  >
                    Settings
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
