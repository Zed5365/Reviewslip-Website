import type { Locale } from "@/lib/i18n/config";
import type { StaysText } from "@/lib/stays-text";

/**
 * Formatting for the marketplace pages: money, dates, counts, contact links,
 * and the stay a search defaults to. No server imports, so client components
 * use it too.
 */

/** `{name}` placeholders, filled. Unknown names are left visible, not blanked. */
export function fill(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (all, key) => (key in vars ? String(vars[key]) : all));
}

type Pair = "adult" | "child" | "room" | "night" | "review" | "place";

/** "1 night" or "3 nights", from the 1 / N pair in the strings. */
export function count(t: StaysText, pair: Pair, n: number): string {
  const key = `${pair}${n === 1 ? "1" : "N"}` as keyof StaysText;
  return fill(t[key], { n });
}

/**
 * Minor units as the guest's own currency format.
 *
 * Decimals only when the amount has them: Thai rates are whole baht, and
 * "฿1,200.00" on every card is noise.
 */
export function money(minor: number, currency: string, lang: Locale): string {
  const whole = minor % 100 === 0;
  try {
    return new Intl.NumberFormat(lang, {
      style: "currency",
      currency,
      minimumFractionDigits: whole ? 0 : 2,
      maximumFractionDigits: whole ? 0 : 2,
    }).format(minor / 100);
  } catch {
    return `${currency} ${(minor / 100).toLocaleString("en-US")}`;
  }
}

/** "Tue 20 Oct" in the guest's language. Dates are calendar days, read as UTC. */
export function day(iso: string, lang: Locale, withYear = false): string {
  const date = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat(lang, {
    timeZone: "UTC",
    weekday: "short",
    day: "numeric",
    month: "short",
    ...(withYear ? { year: "numeric" } : {}),
  }).format(date);
}

/** A calendar day, plus or minus some days. */
export function addDays(iso: string, days: number): string {
  const date = new Date(`${iso}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

/** Today in Thailand, where every venue is. */
export function todayInThailand(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export interface Stay {
  q: string;
  arrival: string;
  departure: string;
  adults: number;
  children: number;
  rooms: number;
}

type Params = Record<string, string | string[] | undefined>;

function one(params: Params, key: string): string {
  const value = params[key];
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function int(value: string, fallback: number, min: number, max: number): number {
  const n = Number(value);
  return Number.isInteger(n) && n >= min && n <= max ? n : fallback;
}

/**
 * The stay a page is showing, from its address.
 *
 * Missing or unreadable dates become tomorrow for one night — a results page
 * with prices on it is more use than one asking for dates first, and the bar
 * at the top changes them in one go. The server checks everything again.
 */
export function stayFromParams(params: Params): Stay {
  const today = todayInThailand();
  const iso = /^\d{4}-\d{2}-\d{2}$/;
  let arrival = one(params, "arrival");
  let departure = one(params, "departure");
  if (!iso.test(arrival) || arrival < today) arrival = addDays(today, 1);
  if (!iso.test(departure) || departure <= arrival) departure = addDays(arrival, 1);
  const rooms = int(one(params, "rooms"), 1, 1, 4);
  return {
    q: one(params, "q").trim().slice(0, 80),
    arrival,
    departure,
    adults: Math.max(rooms, int(one(params, "adults"), 2, 1, 16)),
    children: int(one(params, "children"), 0, 0, 10),
    rooms,
  };
}

export function stayQuery(stay: Stay, extra: Record<string, string | number | undefined> = {}): string {
  const params = new URLSearchParams();
  if (stay.q) params.set("q", stay.q);
  params.set("arrival", stay.arrival);
  params.set("departure", stay.departure);
  params.set("adults", String(stay.adults));
  params.set("children", String(stay.children));
  params.set("rooms", String(stay.rooms));
  for (const [key, value] of Object.entries(extra)) {
    if (value !== undefined && value !== "") params.set(key, String(value));
  }
  return params.toString();
}

export function nightsBetween(arrival: string, departure: string): number {
  return Math.round(
    (Date.parse(`${departure}T00:00:00Z`) - Date.parse(`${arrival}T00:00:00Z`)) / 86_400_000
  );
}

/* --------------------------------------------------------------- contact */

/** The links that open a phone's own apps, from what the venue typed. */
export function contactLinks(contact: { phone: string; email: string; line: string; whatsapp: string }) {
  const digits = (value: string) => value.replace(/[^\d+]/g, "");
  return {
    phone: contact.phone ? `tel:${digits(contact.phone)}` : null,
    email: contact.email ? `mailto:${contact.email}` : null,
    line: contact.line
      ? /^https:\/\//i.test(contact.line)
        ? contact.line
        : `https://line.me/R/ti/p/${encodeURIComponent(contact.line.startsWith("@") ? contact.line : `@${contact.line}`)}`
      : null,
    whatsapp: contact.whatsapp ? `https://wa.me/${digits(contact.whatsapp).replace(/^\+/, "")}` : null,
  };
}

/** Where a marketplace photo is fetched from, through this site. */
export function photoSrc(id: number): string {
  return `/api/stays/photo/${id}`;
}
