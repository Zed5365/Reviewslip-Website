import type { Metadata } from "next";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import { notFound, redirect } from "next/navigation";

import RateMonth from "@/components/dashboard/RateMonth";
import {
  call,
  currentUser,
  sessionToken,
  type RateCalendar,
  type Room,
  type RoomGroup,
} from "@/lib/customer";
import {
  addMonths,
  daysInMonth,
  monthLabel,
  monthStart,
  todayAt,
} from "@/lib/nights";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { localizedPath } from "@/lib/i18n/routing";

export const metadata: Metadata = {
  title: "Rates",
  robots: { index: false, follow: false },
};

export default async function RatesPage({
  params,
  searchParams,
}: PageProps<"/[lang]/dashboard/[slug]/bookings/rates">) {
  const { lang, slug } = await params;
  if (!isLocale(lang)) notFound();
  const locale: Locale = lang;

  const me = await currentUser();
  if (!me) redirect(localizedPath(lang, "/login"));

  const query = await searchParams;
  const asked = Array.isArray(query.start) ? query.start[0] : query.start;
  // Snapped to the 1st, so a hand-typed or stale date draws the whole month
  // rather than a ragged window running into the next one.
  const start =
    monthStart(String(asked ?? "")) ?? monthStart(todayAt("Asia/Bangkok"))!;
  const days = daysInMonth(start);

  const token = await sessionToken();

  let calendar: RateCalendar;
  let rooms: { groups: RoomGroup[]; rooms: Room[] };
  try {
    [calendar, rooms] = await Promise.all([
      call<RateCalendar>(
        `/businesses/${slug}/rate-calendar?start=${start}&days=${days}`,
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

  const here = localizedPath(locale, `/dashboard/${slug}/bookings/rates`);

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

  /**
   * The everyday price.
   *
   * The endpoint has existed since rates were built and nothing ever called it,
   * so a rate's price could be set once and never changed — which is most of
   * why the screen read as though prices had to be painted on night by night.
   *
   * An empty value clears it, and that is a real thing to want and a dangerous
   * one: with no everyday price, every night nobody has set by hand becomes
   * unquotable. The grid says so in marigold rather than this refusing it.
   */
  async function setBase(planId: number, base: string) {
    "use server";

    const t = await sessionToken();
    if (!t) redirect(localizedPath(locale, "/login"));

    try {
      await call(`/businesses/${slug}/rates/${planId}`, {
        method: "PATCH",
        body: { base },
        token: t,
      });
    } catch (err) {
      return {
        error: err instanceof Error ? err.message : "Could not save that price.",
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
    <>
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
      <h1 style={{ margin: 0 }}>{monthLabel(start, locale)}</h1>
      <nav style={{ display: "flex", gap: "0.5rem" }}>
        <Link className="btn btn-quiet" href={`${here}?start=${addMonths(start, -1)}`}>
          ←
        </Link>
        <Link className="btn btn-quiet" href={here}>
          This month
        </Link>
        <Link className="btn btn-quiet" href={`${here}?start=${addMonths(start, 1)}`}>
          →
        </Link>
      </nav>
    </div>

    <p className="lede" style={{ marginBottom: "2rem" }}>
      What a night costs, and when you are not selling.
    </p>

    <RateMonth
      calendar={calendar}
      groups={rooms.groups}
      monthName={monthLabel(start, locale)}
      createPlan={createPlan}
      setBase={setBase}
      setRange={setRange}
    />
  </>
  );
}
