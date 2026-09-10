import type { Metadata } from "next";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import { notFound, redirect } from "next/navigation";

import RatesEditor from "@/components/dashboard/RatesEditor";
import {
  call,
  currentUser,
  sessionToken,
  type RateCalendar,
  type Room,
  type RoomGroup,
} from "@/lib/customer";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { localizedPath } from "@/lib/i18n/routing";

export const metadata: Metadata = {
  title: "Rates",
  robots: { index: false, follow: false },
};

const DAYS = 14;

/** Today at the property, not in UTC — see the calendar page. */
function todayAt(timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function shift(date: string, days: number): string {
  const t = Date.parse(`${date}T00:00:00Z`);
  return new Date(t + days * 86_400_000).toISOString().slice(0, 10);
}

export default async function RatesPage({
  params,
  searchParams,
}: PageProps<"/[lang]/dashboard/[slug]/rates">) {
  const { lang, slug } = await params;
  if (!isLocale(lang)) notFound();
  const locale: Locale = lang;

  const me = await currentUser();
  if (!me) redirect(localizedPath(lang, "/login"));

  const query = await searchParams;
  const asked = Array.isArray(query.start) ? query.start[0] : query.start;
  const start = /^\d{4}-\d{2}-\d{2}$/.test(String(asked ?? ""))
    ? String(asked)
    : todayAt("Asia/Bangkok");

  const token = await sessionToken();

  let calendar: RateCalendar;
  let rooms: { groups: RoomGroup[]; rooms: Room[] };
  try {
    [calendar, rooms] = await Promise.all([
      call<RateCalendar>(
        `/businesses/${slug}/rate-calendar?start=${start}&days=${DAYS}`,
        { token }
      ),
      call<{ groups: RoomGroup[]; rooms: Room[] }>(`/businesses/${slug}/rooms`, {
        token,
      }),
    ]);
  } catch (err) {
    if ((err as { status?: number }).status === 404) notFound();
    throw err;
  }

  const here = localizedPath(locale, `/dashboard/${slug}/rates`);

  async function createPlan(groupId: number, name: string, base: string) {
    "use server";

    const t = await sessionToken();
    if (!t) redirect(localizedPath(locale, "/login"));

    try {
      await call(`/businesses/${slug}/rates`, {
        method: "POST",
        body: { groupId, name, base },
        token: t,
      });
    } catch (err) {
      return {
        error: err instanceof Error ? err.message : "Could not add that rate.",
      };
    }

    revalidatePath(here);
    return {};
  }

  async function setRange(planId: number, patch: Record<string, unknown>) {
    "use server";

    const t = await sessionToken();
    if (!t) redirect(localizedPath(locale, "/login"));

    try {
      await call(`/businesses/${slug}/rates/${planId}/nights`, {
        method: "POST",
        body: patch,
        token: t,
      });
    } catch (err) {
      return {
        error: err instanceof Error ? err.message : "Could not apply that.",
      };
    }

    revalidatePath(here);
    return {};
  }

  return (
    <section className="section">
      <div className="wrap" style={{ maxWidth: "72rem" }}>
        <Link
          href={localizedPath(lang, `/dashboard/${slug}`)}
          style={{ color: "var(--jade)", fontSize: "0.9rem" }}
        >
          ← Back
        </Link>

        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            justifyContent: "space-between",
            gap: "1rem",
            flexWrap: "wrap",
            margin: "1.25rem 0 0.4rem",
          }}
        >
          <h1 style={{ margin: 0 }}>Rates</h1>
          <nav style={{ display: "flex", gap: "0.5rem" }}>
            <Link className="btn btn-quiet" href={`${here}?start=${shift(start, -DAYS)}`}>
              ← Earlier
            </Link>
            <Link className="btn btn-quiet" href={here}>
              Today
            </Link>
            <Link className="btn btn-quiet" href={`${here}?start=${shift(start, DAYS)}`}>
              Later →
            </Link>
          </nav>
        </div>

        <p className="lede" style={{ marginBottom: "2rem" }}>
          What a night costs, and when you are not selling.
        </p>

        <RatesEditor
          calendar={calendar}
          groups={rooms.groups}
          createPlan={createPlan}
          setRange={setRange}
        />
      </div>
    </section>
  );
}
