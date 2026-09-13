import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import BookingsNav from "@/components/dashboard/BookingsNav";
import { currentUser } from "@/lib/customer";
import { isLocale } from "@/lib/i18n/config";
import { localizedPath } from "@/lib/i18n/routing";

export const metadata: Metadata = {
  title: "Bookings",
  robots: { index: false, follow: false },
};

/**
 * The reservations module.
 *
 * One shell for the five pages that run the rooms — today's desk, the diary,
 * the rooms, the rates, and the Immigration notification. They used to hang off
 * the venue page as five more buttons beside Settings and Table card, which
 * made a row of seven and implied they were all the same kind of thing. They
 * are not: the others configure how reviews get written, and these are a
 * different job done by a different person at a different time of day.
 *
 * The venue name is in the header rather than on each page, because somebody
 * with two properties open in two tabs needs to know which one they are about
 * to check a guest into, and the page titles are all generic.
 *
 * Auth is here rather than repeated per page: a page added to this module later
 * and given no check of its own would otherwise be a hole, and the whole point
 * of a module is that its pages share what is true about all of them.
 */
export default async function BookingsLayout({
  children,
  params,
}: LayoutProps<"/[lang]/dashboard/[slug]/bookings">) {
  const { lang, slug } = await params;
  if (!isLocale(lang)) notFound();

  const me = await currentUser();
  if (!me) redirect(localizedPath(lang, "/login"));

  const venue = me.businesses.find((b) => b.slug === slug);
  // A slug this account does not own is not found, rather than forbidden —
  // the same answer the API gives, and for the same reason.
  if (!venue) notFound();

  const base = localizedPath(lang, `/dashboard/${slug}/bookings`);

  return (
    <section className="section">
      <div className="wrap" style={{ maxWidth: "72rem" }}>
        <header
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "1rem 1.5rem",
            flexWrap: "wrap",
            marginBottom: "2rem",
            paddingBottom: "1rem",
            borderBottom: "1px solid var(--jade-line)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "1.25rem",
              flexWrap: "wrap",
            }}
          >
            <Link
              href={localizedPath(lang, `/dashboard/${slug}`)}
              style={{
                fontFamily: "var(--display)",
                fontSize: "1.15rem",
                color: "var(--cream)",
              }}
            >
              {venue.name}{" "}
              <span style={{ color: "var(--jade)" }}>bookings</span>
            </Link>
            <BookingsNav base={base} />
          </div>

          <Link
            href={localizedPath(lang, `/dashboard/${slug}`)}
            style={{ color: "var(--jade)", fontSize: "0.9rem" }}
          >
            ← Back to venue
          </Link>
        </header>

        {children}
      </div>
    </section>
  );
}
