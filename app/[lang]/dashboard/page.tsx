import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import PageHeader from "@/components/app-shell/PageHeader";
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
  limit?: number;
}) {
  // A missing limit used to crash the whole page on .toLocaleString(). One field
  // absent from an API response — a version skew between the two deploys, say —
  // should cost that meter its denominator, not the dashboard.
  const cap = Number.isFinite(limit) && (limit as number) > 0 ? (limit as number) : 0;
  const share = cap > 0 ? Math.min(used / cap, 1) : 0;

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
          {used.toLocaleString()}
          {cap > 0 ? ` / ${cap.toLocaleString()}` : ""}
        </span>
      </div>
      <div
        style={{
          height: 7,
          borderRadius: 999,
          background: "color-mix(in srgb, var(--ink) 12%, transparent)",
          overflow: "hidden",
        }}
        role="progressbar"
        aria-label={label}
        aria-valuenow={used}
        aria-valuemin={0}
        aria-valuemax={cap || undefined}
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
    <>
      {/* The second line is the plan's two meters in words: what this list is
          measured against. Refer a Business and Support are Sidebar entries, so
          the header carries the one action this screen has. */}
      <PageHeader
        title="Businesses"
        sub={`${me.usage.businesses} of ${businessLimit} on ${me.plan.name} · ${me.usage.reviewsThisMonth.toLocaleString()} of ${me.plan.reviewAllowance.toLocaleString()} reviews this month`}
      >
        {/* At the cap this still goes to the same page, which explains the
            limit and offers plans — better than a button that does nothing. */}
        <Link
          className="btn btn-go"
          href={localizedPath(lang, "/dashboard/businesses/new")}
        >
          Add a Business
        </Link>
      </PageHeader>
      <div className="page-body">

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
              gap: "0.75rem",
              gridTemplateColumns: "repeat(auto-fill, minmax(19rem, 1fr))",
            }}
          >
            {me.businesses.map((business) => (
              <div
                key={business.slug}
                style={{
                  background: "var(--paper)",
                  color: "var(--ink)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius)",
                  padding: "1rem",
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
                        ? "color-mix(in srgb, var(--success) 16%, transparent)"
                        : "color-mix(in srgb, var(--warning) 16%, transparent)",
                      color: business.ready ? "var(--success)" : "var(--warning)",
                    }}
                  >
                    {business.status !== "active"
                      ? business.status
                      : business.ready
                        ? "Live"
                        : "No Review Link"}
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

                {/* Against the per-business limit, not the account total: a
                    business metered against 15,000 would look idle at 1,400. */}
                <Meter
                  label="Reviews this month"
                  used={business.usage.reviews}
                  limit={me.plan.reviewsPerBusiness}
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
                  {/* Outlined, both: the screen's one primary is Add a Business,
                      and a filled button on every card would be one per row. */}
                  <Link
                    className="btn btn-quiet"
                    href={localizedPath(lang, `/dashboard/${business.slug}`)}
                  >
                    Open
                  </Link>
                  <Link
                    className="btn btn-quiet"
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
    </>
  );
}
