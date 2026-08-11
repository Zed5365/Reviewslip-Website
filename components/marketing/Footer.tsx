"use client";

import Link from "next/link";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import styles from "./Footer.module.css";

import LocaleControls from "./LocaleControls";

export default function Footer() {
  const { t } = useLocale();

  const columns = [
    {
      title: t.footer.colProduct,
      links: [
        { href: "/how-it-works", label: t.nav.howItWorks },
        { href: "/#features", label: t.nav.features },
        { href: "/pricing", label: t.nav.pricing },
        { href: "/demo", label: t.nav.demo },
      ],
    },
    {
      title: t.footer.colCompany,
      links: [
        { href: "/compliance", label: t.footer.complianceTrust },
        { href: "/contact", label: t.nav.contact },
        { href: "/legal/privacy", label: t.footer.privacy },
        { href: "/legal/terms", label: t.footer.terms },
      ],
    },
  ];

  const year = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={`wrap ${styles.grid}`}>
        <div className={styles.brandCol}>
          <div className={styles.brand}>Reviewslip</div>
          <p className={styles.blurb}>{t.footer.blurb}</p>
        </div>

        {columns.map((col) => (
          <div key={col.title} className={styles.col}>
            <h4 className={styles.colTitle}>{col.title}</h4>
            {col.links.map((l) => (
              <Link key={l.href} href={l.href} className={styles.link}>
                {l.label}
              </Link>
            ))}
          </div>
        ))}

        <div className={styles.col}>
          <h4 className={styles.colTitle}>{t.footer.colGetStarted}</h4>
          <Link href="/contact" className="btn btn-go">
            {t.common.getInTouch}
          </Link>
        </div>
      </div>

      <div className={`wrap ${styles.legal}`}>
        <span>{t.footer.rights.replace("{year}", String(year))}</span>
        {/* Currency and language are preferences, not navigation. They belong
            down here with the other settings-shaped things, not competing with
            the links and the call to action at the top of every page. */}
        <LocaleControls compact />
        <span className={styles.note}>{t.common.brandNote}</span>
      </div>
    </footer>
  );
}
