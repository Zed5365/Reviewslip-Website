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
import { qrCode } from "@/lib/qr";

import styles from "./poster.module.css";

/**
 * The card's four themed properties, as an inline style.
 *
 * Only the `--card-*` ones. The review app derives them against white rather
 * than against the theme's own paper, so a business whose brand colour is pale
 * still gets a legible card — see theme.js.
 */
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
}: PageProps<"/[lang]/dashboard/[slug]/poster">) {
  const { lang, slug } = await params;
  if (!isLocale(lang)) notFound();

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
        </div>
      </section>

      {/* The business's palette, scoped to the sheet. Only the card properties
          are set: the stock stays white and the QR stays pure black, both for
          reasons in poster.module.css that a theme does not get to override.
          Falling back to the shipped values when there is no theme is the
          module's own job — every rule carries them as var() fallbacks. */}
      <div className={styles.sheet} style={cardVars(data.settings.theme.derived)}>
        <div className={styles.frame}>
          <h2 className={styles.name}>{business.name}</h2>
          <div className={styles.rule} />
          <p className={styles.headline}>Scan to leave us a review</p>

          <div className={styles.qr}>
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
          <p className={styles.hint}>
            Takes about a minute. The words are yours to change.
          </p>
          <p className={styles.brand}>Reviewslip</p>
        </div>
      </div>
    </>
  );
}
