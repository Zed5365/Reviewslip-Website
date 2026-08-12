"use client";

import Link from "next/link";
import { useState } from "react";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";
import { localizedPath } from "@/lib/i18n/routing";
import LanguageSelect from "./LanguageSelect";
import styles from "./Nav.module.css";

interface Props {
  lang: Locale;
  nav: Dictionary["nav"];
  ctaLabel: string;
  selectors: Dictionary["selectors"];
}

export default function Nav({ lang, nav, ctaLabel, selectors }: Props) {
  const [open, setOpen] = useState(false);

  const links = [
    { route: "/how-it-works", label: nav.howItWorks },
    { route: "/#features", label: nav.features },
    { route: "/pricing", label: nav.pricing },
    { route: "/compliance", label: nav.trust },
    { route: "/demo", label: nav.demo },
    { route: "/faq", label: nav.faq },
    { route: "/contact", label: nav.contact },
  ].map((l) => ({
    ...l,
    // "/#features" is an anchor on the home page — localize the page part only.
    href: l.route.startsWith("/#")
      ? `${localizedPath(lang, "/")}${l.route.slice(1)}`.replace("//", "/")
      : localizedPath(lang, l.route),
  }));

  return (
    <header className={styles.header}>
      <div className={`wrap ${styles.bar}`}>
        <Link
          href={localizedPath(lang, "/")}
          className={styles.brand}
          onClick={() => setOpen(false)}
        >
          Reviewslip
        </Link>

        <nav className={styles.desktopNav} aria-label="Primary">
          {links.map((l) => (
            <Link key={l.route} href={l.href} className={styles.link}>
              {l.label}
            </Link>
          ))}
        </nav>

        <div className={styles.actions}>
          <LanguageSelect lang={lang} label={selectors.language} />
          <Link href={localizedPath(lang, "/login")} className={styles.signin}>
            {nav.login}
          </Link>
          <Link
            href={localizedPath(lang, "/signup")}
            className="btn btn-quiet"
          >
            {nav.signup}
          </Link>
          <Link href={localizedPath(lang, "/contact")} className="btn btn-go">
            {ctaLabel}
          </Link>
        </div>

        <button
          className={styles.burger}
          aria-label="Menu"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <span data-open={open} />
        </button>
      </div>

      {open && (
        <nav className={styles.mobileNav} aria-label="Mobile">
          {links.map((l) => (
            <Link
              key={l.route}
              href={l.href}
              className={styles.mobileLink}
              onClick={() => setOpen(false)}
            >
              {l.label}
            </Link>
          ))}
          <Link
            href={localizedPath(lang, "/login")}
            className={styles.mobileLink}
            onClick={() => setOpen(false)}
          >
            {nav.login}
          </Link>
          <div className={styles.mobileControls}>
            <LanguageSelect lang={lang} label={selectors.language} />
          </div>
          <Link
            href={localizedPath(lang, "/signup")}
            className="btn btn-quiet"
            onClick={() => setOpen(false)}
          >
            {nav.signup}
          </Link>
          <Link
            href={localizedPath(lang, "/contact")}
            className="btn btn-go"
            onClick={() => setOpen(false)}
          >
            {ctaLabel}
          </Link>
        </nav>
      )}
    </header>
  );
}
