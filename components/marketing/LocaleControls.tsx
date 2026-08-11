"use client";

import { usePathname, useRouter } from "next/navigation";
import { LOCALES, type Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";
import { localizedPath, stripLocale } from "@/lib/i18n/routing";
import { COUNTRIES } from "@/lib/currency";
import { useCurrency } from "@/lib/CurrencyProvider";
import styles from "./LocaleControls.module.css";

interface Props {
  lang: Locale;
  selectors: Dictionary["selectors"];
  compact?: boolean;
}

export default function LocaleControls({ lang, selectors, compact }: Props) {
  const { countryCode, setCountry } = useCurrency();
  const pathname = usePathname();
  const router = useRouter();

  /**
   * Switching language is a real navigation to that language's URL, so the
   * translated page is server-rendered (and indexable) rather than swapped in
   * on the client. The cookie lets the proxy honour the choice on later visits
   * to the bare root.
   */
  const changeLanguage = (next: Locale) => {
    document.cookie = `rs_lang=${next}; path=/; max-age=31536000; samesite=lax`;
    router.push(localizedPath(next, stripLocale(pathname)));
  };

  return (
    <div className={`${styles.controls} ${compact ? styles.compact : ""}`}>
      <label className={styles.field}>
        <span className={styles.srOnly}>{selectors.country}</span>
        <select
          className={styles.select}
          value={countryCode}
          onChange={(e) => setCountry(e.target.value)}
          aria-label={selectors.country}
        >
          {COUNTRIES.map((c) => (
            <option key={c.code} value={c.code}>
              {c.flag} {c.currency}
            </option>
          ))}
        </select>
      </label>

      <label className={styles.field}>
        <span className={styles.srOnly}>{selectors.language}</span>
        <select
          className={styles.select}
          value={lang}
          onChange={(e) => changeLanguage(e.target.value as Locale)}
          aria-label={selectors.language}
        >
          {LOCALES.map((l) => (
            <option key={l.code} value={l.code}>
              {l.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
