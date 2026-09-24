import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import PrintPoster from "@/components/dashboard/PrintPoster";
import {
  call,
  sessionToken,
  type BusinessDetail,
  type Derived,
} from "@/lib/customer";
import { isLocale } from "@/lib/i18n/config";
import { localizedPath } from "@/lib/i18n/routing";
import { cardLanguages, cardText, DEFAULT_SECOND } from "@/lib/card-text";
import { qrCode } from "@/lib/qr";

import styles from "./poster.module.css";

/**
 * The card's four themed properties, as an inline style.
 *
 * Only the `--card-*` ones. The review app derives them against white rather
 * than against the theme's own paper, so a business whose brand colour is pale
 * still gets a legible card — see theme.js.
 */
const pick: React.CSSProperties = {
  font: "inherit",
  fontSize: "0.85rem",
  padding: "0.3rem 0.45rem",
  borderRadius: 8,
  border: "1px solid rgba(243,236,220,0.22)",
  background: "rgba(243,236,220,0.06)",
  color: "inherit",
};

function cardVars(derived: Derived): React.CSSProperties {
  const vars: Record<string, string> = {};
  for (const name of ["--card-ink", "--card-frame", "--card-rule", "--card-muted", "--card-brand"]) {
    if (derived[name]) vars[name] = derived[name];
  }
  return vars as React.CSSProperties;
}

export const metadata: Metadata = {
  title: "Table card",
  robots: { index: false, follow: false },
};

export default async function PosterPage({
  params,
  searchParams,
}: PageProps<"/[lang]/dashboard/[slug]/poster">) {
  const { lang, slug } = await params;
  if (!isLocale(lang)) notFound();

  /*
   * The guest's language, alongside the dashboard's English.
   *
   * In the address rather than stored against the venue: a card is printed
   * once and pinned to a table, and a setting somebody has to find, change and
   * change back is more machinery than a link with `?with=th` on it.
   */
  const asked = String((await searchParams)?.with ?? DEFAULT_SECOND);
  const second = asked === "none" || asked === "en" ? null : cardText(asked);

  const token = await sessionToken();
  if (!token) redirect(localizedPath(lang, "/login"));

  let data: BusinessDetail;
  try {
    data = await call<BusinessDetail>(`/businesses/${slug}`, { token });
  } catch (err) {
    // 404 covers "someone else's business" as well as "no such business", the
    // same way it does on the business page.
    if ((err as { status?: number }).status === 404) notFound();
    throw err;
  }

  const { business } = data;
  const code = qrCode(business.url);

  /*
   * Whether the name is printed under the mark.
   *
   * The review app decides it — theme.js — so the card, the guest page and
   * the settings preview cannot answer it three different ways. Defaulting to
   * true here covers a review app that has not been deployed with the field
   * yet, which is a card that looks exactly as it did before.
   */
  const showsName = data.settings.theme.showName ?? true;

  // The scheme is noise on a printed card — nobody types it, and it costs a line
  // of width that a long slug needs more.
  const printedUrl = business.url.replace(/^https?:\/\//, "").replace(/\/$/, "");

  return (
    <>
      <section className={`section ${styles.page}`}>
        <div className="wrap">
          <Link
            href={localizedPath(lang, `/dashboard/${business.slug}`)}
            style={{ color: "var(--jade)", fontSize: "0.9rem" }}
          >
            ← {business.name}
          </Link>

          <h1 style={{ margin: "1.25rem 0 0.4rem" }}>Table card</h1>
          <p className="lede">
            An A5 card with the QR code for {business.name}. Guests scan it and land
            on the review page.
          </p>

          <form method="get" className={styles.actions} style={{ marginBottom: "0.4rem" }}>
            <label style={{ fontSize: "0.85rem", display: "flex", gap: "0.5rem", alignItems: "center" }}>
              Second language
              <select name="with" defaultValue={asked} style={pick}>
                <option value="none">None — English only</option>
                {cardLanguages().filter((l) => l.code !== "en").map((l) => (
                  <option key={l.code} value={l.code}>{l.name}</option>
                ))}
              </select>
            </label>
            <button type="submit" className="btn btn-quiet">Change</button>
          </form>

          <div className={styles.actions}>
            <PrintPoster />
            <a
              href={business.url}
              target="_blank"
              rel="noreferrer"
              style={{ color: "var(--jade)", fontSize: "0.9rem" }}
            >
              Open the review page
            </a>
          </div>

          <p className={styles.note}>
            Choose <strong>Save as PDF</strong> in the print dialog for a file, or
            print it straight away. The card is already A5 — set paper size to A5
            and scale to 100%, and pick borderless if your printer offers it.
          </p>

          {second && (
            <p className={styles.note}>
              The second line is written plainly and literally rather than
              cleverly. Have somebody who speaks it read the card once before
              you print a boxful — it is four words, and it is the line half
              your guests will actually be reading.
            </p>
          )}
        </div>
      </section>

      {/* The business's palette, scoped to the sheet. Only the card properties
          are set: the stock stays white and the QR stays pure black, both for
          reasons in poster.module.css that a theme does not get to override.
          Falling back to the shipped values when there is no theme is the
          module's own job — every rule carries them as var() fallbacks. */}
      <div className={styles.sheet} style={cardVars(data.settings.theme.derived)}>
        <div className={styles.frame}>
          {/* Four corner marks, sitting across both rules of the frame. Empty
              spans because they are drawn with their own borders — two sides
              each — and there is nothing to read here. */}
          <div className={styles.corners} aria-hidden="true">
            <span />
            <span />
            <span />
            <span />
          </div>

          {/* Above the name, not instead of it: a mark alone leaves a guest who
              scanned the wrong card with no way to tell. A stored data URI, so
              printing does not depend on the customer's server being up.
              eslint-disable because next/image cannot optimise a data URI and
              this is print output, not a page to score. */}
          {data.settings.theme.value.logo && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              className={styles.logo}
              src={data.settings.theme.value.logo}
              /*
               * The mark carries the name when the name is not printed under
               * it. Empty otherwise, because saying it twice to a screen
               * reader is noise rather than access.
               */
              alt={showsName ? "" : business.name}
            />
          )}
          {/*
            Most logos are a wordmark. Printing the name under one says it
            twice, on a card the size of a postcard, and it is the first thing
            anybody notices. A venue whose mark is a symbol turns the name back
            on from Settings.
          */}
          {showsName && <h2 className={styles.name}>{business.name}</h2>}
          <div className={styles.rule} aria-hidden="true">
            <span className={styles.lozenge} />
          </div>
          <p className={styles.headline}>Scan to leave us a review</p>
          {second && (
            <p className={styles.second} lang={asked}>
              {second.scan}
            </p>
          )}

          <div className={styles.qr}>
            {/* Ticks at the four corners of the code. Decoration that does a
                job — on a table card "point here" is the one instruction that
                matters — and outside the code's own quiet zone, so a scanner
                never sees them. */}
            <div className={styles.ticks} aria-hidden="true">
              <span />
              <span />
              <span />
              <span />
            </div>
            {/* The quiet zone is four modules of the code itself, inside the
                viewBox — so it scales with the card instead of being a padding
                value that stops being four modules the moment the code grows a
                version. Without it, scanners struggle. */}
            <svg
              viewBox={`-4 -4 ${code.count + 8} ${code.count + 8}`}
              role="img"
              aria-label={`QR code for ${printedUrl}`}
            >
              <rect
                x={-4}
                y={-4}
                width={code.count + 8}
                height={code.count + 8}
                fill="#fff"
              />
              <path d={code.path} fill="#000" />
            </svg>
          </div>

          <p className={styles.url}>{printedUrl}</p>
          <p className={styles.hint}>Takes about a minute</p>
          {second && (
            <p className={styles.secondHint} lang={asked}>
              {second.minute}
            </p>
          )}
          <p className={styles.brand}>Reviewslip</p>
        </div>
      </div>
    </>
  );
}
