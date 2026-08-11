"use client";

import Link from "next/link";
import { useState } from "react";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import LocaleControls from "./LocaleControls";
import styles from "./Nav.module.css";

export default function Nav() {
  const [open, setOpen] = useState(false);
  const { t } = useLocale();

  const links = [
    { href: "/how-it-works", label: t.nav.howItWorks },
    { href: "/#features", label: t.nav.features },
    { href: "/pricing", label: t.nav.pricing },
    { href: "/compliance", label: t.nav.trust },
    { href: "/demo", label: t.nav.demo },
    { href: "/contact", label: t.nav.contact },
  ];

  return (
    <header className={styles.header}>
      <div className={`wrap ${styles.bar}`}>
        <Link href="/" className={styles.brand} onClick={() => setOpen(false)}>
          Reviewslip
        </Link>

        <nav className={styles.desktopNav} aria-label="Primary">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className={styles.link}>
              {l.label}
            </Link>
          ))}
        </nav>

        <div className={styles.actions}>
          <LocaleControls />
          {/* Signing in is a server-side fact and this is a client component,
              so the link is always "Sign in" — /login sends anyone who already
              has a session straight on to their dashboard. */}
          <Link href="/login" className={styles.link}>
            Sign in
          </Link>
          <Link href="/signup" className="btn btn-go">
            Get started
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
              key={l.href}
              href={l.href}
              className={styles.mobileLink}
              onClick={() => setOpen(false)}
            >
              {l.label}
            </Link>
          ))}
          <Link
            href="/login"
            className={styles.mobileLink}
            onClick={() => setOpen(false)}
          >
            Sign in
          </Link>
          <div className={styles.mobileControls}>
            <LocaleControls compact />
          </div>
          <Link
            href="/signup"
            className="btn btn-go"
            onClick={() => setOpen(false)}
          >
            Get started
          </Link>
        </nav>
      )}
    </header>
  );
}
