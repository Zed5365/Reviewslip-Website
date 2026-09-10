import type { Metadata } from "next";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import { notFound, redirect } from "next/navigation";

import Calendar from "@/components/dashboard/Calendar";
import NewBooking, { type BookingState } from "@/components/dashboard/NewBooking";
import { call, currentUser, sessionToken, type CalendarWindow } from "@/lib/customer";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { localizedPath } from "@/lib/i18n/routing";

export const metadata: Metadata = {
  title: "Calendar",
  robots: { index: false, follow: false },
};

const DAYS = 14;

/**
 * Today, as a calendar date, in the property's timezone.
 *
 * Not `new Date().toISOString()`, which is UTC and therefore yesterday in
 * Bangkok until 07:00 — the exact off-by-one this whole module is built to
 * avoid, and it would land on the default view of the busiest page.
 *
 * `en-CA` because its short date format is already YYYY-MM-DD; the alternative
 * is assembling the parts by hand from formatToParts.
 */
function todayAt(timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

/** Shift a YYYY-MM-DD by whole days without going near a local timezone. */
function shift(date: string, days: number): string {
  const t = Date.parse(`${date}T00:00:00Z`);
  return new Date(t + days * 86_400_000).toISOString().slice(0, 10);
}

export default async function CalendarPage({
  params,
  searchParams,
}: PageProps<"/[lang]/dashboard/[slug]/calendar">) {
  const { lang, slug } = await params;
  if (!isLocale(lang)) notFound();
  const locale: Locale = lang;

  const me = await currentUser();
  if (!me) redirect(localizedPath(lang, "/login"));

  const query = await searchParams;
  const asked = Array.isArray(query.start) ? query.start[0] : query.start;

  // TODO: read the venue's own timezone once the settings page exposes it. The
  // column exists; until it is editable, the market this is built for is the
  // right default and is better than UTC by seven hours.
  const start = /^\d{4}-\d{2}-\d{2}$/.test(String(asked ?? ""))
    ? String(asked)
    : todayAt("Asia/Bangkok");

  const token = await sessionToken();

  let data: CalendarWindow;
  try {
    data = await call<CalendarWindow>(
      `/businesses/${slug}/calendar?start=${start}&days=${DAYS}`,
      { token }
    );
  } catch (err) {
    if ((err as { status?: number }).status === 404) notFound();
    throw err;
  }

  const here = localizedPath(locale, `/dashboard/${slug}/calendar`);

  async function book(
    _prev: BookingState,
    formData: FormData
  ): Promise<BookingState> {
    "use server";

    const t = await sessionToken();
    if (!t) redirect(localizedPath(locale, "/login"));

    const values = {
      guestName: String(formData.get("guestName") ?? "").trim(),
      arrival: String(formData.get("arrival") ?? ""),
      departure: String(formData.get("departure") ?? ""),
    };

    try {
      await call(`/businesses/${slug}/bookings`, {
        method: "POST",
        body: {
          ...values,
          groupId: Number(formData.get("groupId")),
          roomId: formData.get("roomId") ? Number(formData.get("roomId")) : null,
          adults: Number(formData.get("adults") ?? 1),
          guestEmail: String(formData.get("guestEmail") ?? "").trim() || null,
        },
        token: t,
      });
    } catch (err) {
      return {
        // The review app owns the rules — the dates, the capacity, and the
        // clash — and its wording is the accurate one.
        error: err instanceof Error ? err.message : "Could not take that booking.",
        values,
      };
    }

    revalidatePath(here);
    return { ok: true };
  }

  const groups = Array.from(
    new Map(data.rooms.map((r) => [r.groupId, r.groupName ?? ""])).entries()
  ).map(([id, name]) => ({ id, name }));

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
            margin: "1.25rem 0 2rem",
          }}
        >
          <h1 style={{ margin: 0 }}>Calendar</h1>

          <nav style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
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

        <Calendar data={data} slug={slug} lang={lang} />

        {groups.length > 0 ? (
          <div style={{ marginTop: "2.5rem" }}>
            <h2 style={{ fontSize: "1.1rem", marginBottom: "0.3rem" }}>
              Take a booking
            </h2>
            <p className="admin-sub" style={{ marginBottom: "1rem" }}>
              Leave the room blank and it sits unassigned until you pick one.
            </p>
            <NewBooking action={book} groups={groups} rooms={data.rooms} />
          </div>
        ) : (
          <p style={{ marginTop: "2rem" }}>
            <Link
              className="btn btn-go"
              href={localizedPath(lang, `/dashboard/${slug}/rooms`)}
            >
              Set up rooms
            </Link>
          </p>
        )}
      </div>
    </section>
  );
}
