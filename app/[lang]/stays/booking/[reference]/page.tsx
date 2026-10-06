import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Check, Mail, MessageCircle, Phone } from "lucide-react";

import styles from "@/components/stays/stays.module.css";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { localizedPath } from "@/lib/i18n/routing";
import { market, type BookingView } from "@/lib/market";
import { contactLinks, count, day, fill, money } from "@/lib/stays-format";
import { staysText } from "@/lib/stays-text";

export async function generateMetadata({ params }: PageProps<"/[lang]/stays/booking/[reference]">): Promise<Metadata> {
  const { lang, reference } = await params;
  // The reference, not "confirmed": the same page shows a cancelled booking.
  return {
    title: isLocale(lang) ? `${staysText(lang).reference} ${reference.toUpperCase().slice(0, 12)}` : undefined,
    robots: { index: false, follow: false },
  };
}

/**
 * A booking, confirmed — where checkout lands, and where the email's link
 * goes. Opened by reference and key; without the right key it is the same
 * not-found as a reference that does not exist.
 *
 * Inside the free-cancellation window it also cancels: a button that opens a
 * second, deliberate one, so a stray tap on a phone does not give a room away.
 * Plain HTML <details> and a server action, so it works without JavaScript.
 */
export default async function BookingPage({ params, searchParams }: PageProps<"/[lang]/stays/booking/[reference]">) {
  const { lang, reference } = await params;
  if (!isLocale(lang)) notFound();
  const locale: Locale = lang;
  const t = staysText(lang);
  const query = (await searchParams) ?? {};
  const key = String(query.k ?? "");
  const failed = typeof query.error === "string" ? query.error.slice(0, 200) : null;
  const here = localizedPath(locale, `/stays/booking/${reference}?k=${encodeURIComponent(key)}`);

  async function cancel() {
    "use server";
    try {
      await market(`/bookings/${encodeURIComponent(reference)}/cancel`, { method: "POST", body: { k: key } });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong.";
      redirect(`${here}&error=${encodeURIComponent(message)}`);
    }
    redirect(here);
  }

  let booking: BookingView | null = null;
  try {
    booking = await market<BookingView>(`/bookings/${encodeURIComponent(reference)}?k=${encodeURIComponent(key)}`);
  } catch (err) {
    if ((err as { status?: number }).status !== 404) throw err;
  }

  if (!booking) {
    return (
      <div className={`wrap ${styles.page}`}>
        <p className={styles.empty}>{t.bookingMissing}</p>
      </div>
    );
  }

  const links = contactLinks(booking.venue.contact);
  const cancelled = booking.status === "cancelled";

  return (
    <div className={`wrap ${styles.page}`}>
      <div className={styles.confirmed}>
        <div className={styles.confirmedHead}>
          {!cancelled && (
            <span className={styles.tick}>
              <Check size={22} aria-hidden />
            </span>
          )}
          <h1 className={styles.h1}>{cancelled ? t.cancelled : t.confirmedTitle}</h1>
          {!cancelled && <p className={styles.muted} style={{ margin: 0 }}>{fill(t.confirmedLede, { email: booking.guestEmail })}</p>}
          {cancelled && (
            <p className={styles.muted} style={{ margin: 0 }}>
              {booking.cancelledBy === "venue" ? fill(t.cancelledByVenue, { venue: booking.venue.name }) : t.cancelledByYou}
            </p>
          )}
          <span className={styles.muted} style={{ fontSize: "0.85rem", marginTop: "0.5rem" }}>{t.reference}</span>
          <span className={styles.reference}>{booking.reference}</span>
        </div>

        <div className={styles.box}>
          <h2 className={styles.boxTitle}>{booking.venue.name}</h2>
          <dl className={styles.lines}>
            <div><dt>{t.rooms}</dt><dd>{booking.roomName}{booking.rooms > 1 ? ` × ${booking.rooms}` : ""}{booking.planName ? ` · ${booking.planName}` : ""}</dd></div>
            <div><dt>{t.checkIn}</dt><dd>{day(booking.arrival, lang, true)} · {booking.checkIn}</dd></div>
            <div><dt>{t.checkOut}</dt><dd>{day(booking.departure, lang, true)} · {booking.checkOut}</dd></div>
            <div><dt>{t.guests}</dt><dd>{count(t, "adult", booking.adults)}{booking.children ? `, ${count(t, "child", booking.children)}` : ""} · {count(t, "night", booking.nights)}</dd></div>
            <div><dt>{t.fullName}</dt><dd>{booking.guestName}</dd></div>
          </dl>
          <ul className={styles.policy}>
            <li>{booking.breakfast ? t.breakfastIncluded : t.roomOnly}</li>
            <li>{booking.freeCancelUntil ? fill(t.freeCancelUntil, { date: day(booking.freeCancelUntil, lang) }) : t.nonRefundable}</li>
          </ul>
          {booking.totalMinor !== null && (
            <dl className={`${styles.lines} ${styles.totalLine}`}>
              <div><dt>{t.total}</dt><dd>{money(booking.totalMinor, booking.currency, lang)}</dd></div>
              <div><dt>{t.dueAtProperty}</dt><dd>{money(booking.totalMinor, booking.currency, lang)}</dd></div>
            </dl>
          )}
        </div>

        {Object.values(links).some(Boolean) && (
          <div className={styles.box} style={{ marginTop: "1rem" }}>
            <h2 className={styles.boxTitle}>{fill(t.contactTitle, { venue: booking.venue.name })}</h2>
            <div className={styles.contactButtons}>
              {links.phone && <a className="btn btn-quiet" href={links.phone}><Phone size={15} aria-hidden /> {t.call}</a>}
              {links.line && <a className="btn btn-quiet" href={links.line} target="_blank" rel="noopener noreferrer"><MessageCircle size={15} aria-hidden /> {t.line}</a>}
              {links.whatsapp && <a className="btn btn-quiet" href={links.whatsapp} target="_blank" rel="noopener noreferrer"><MessageCircle size={15} aria-hidden /> {t.whatsapp}</a>}
              {links.email && <a className="btn btn-quiet" href={links.email}><Mail size={15} aria-hidden /> {t.email}</a>}
            </div>
          </div>
        )}

        {failed && (
          <p className={styles.error} role="alert" style={{ marginTop: "1rem" }}>
            {failed}
          </p>
        )}

        {!cancelled && booking.cancellable && (
          <details className={styles.box} style={{ marginTop: "1rem" }}>
            <summary className={styles.cancelSummary}>{t.cancelBooking}</summary>
            <p className={styles.muted} style={{ margin: 0, fontSize: "0.9rem" }}>
              {booking.freeCancelUntil ? `${fill(t.freeCancelUntil, { date: day(booking.freeCancelUntil, lang) })}. ` : ""}
              {t.cancelWarning}
            </p>
            <form action={cancel}>
              <button type="submit" className={`btn ${styles.danger}`}>{t.cancelYes}</button>
            </form>
          </details>
        )}

        {!cancelled && !booking.cancellable && (
          <p className={styles.note} style={{ marginTop: "1rem", textAlign: "center" }}>
            {fill(t.cannotCancel, { venue: booking.venue.name })}
          </p>
        )}

        <p style={{ textAlign: "center", marginTop: "1.5rem" }}>
          <Link className="btn btn-quiet" href={localizedPath(lang, "/stays")}>{t.anotherStay}</Link>
        </p>
      </div>
    </div>
  );
}
