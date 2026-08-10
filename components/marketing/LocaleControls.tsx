"use client";

import { LOCALES, type Locale } from "@/lib/i18n/config";
import { COUNTRIES } from "@/lib/currency";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import styles from "./LocaleControls.module.css";

export default function LocaleControls({
  compact = false,
}: {
  compact?: boolean;
}) {
  const { lang, setLang, countryCode, setCountry, t } = useLocale();

  return (
    <div className={`${styles.controls} ${compact ? styles.compact : ""}`}>
      <label className={styles.field}>
        <span className={styles.srOnly}>{t.selectors.country}</span>
        <select
          className={styles.select}
          value={countryCode}
          onChange={(e) => setCountry(e.target.value)}
          aria-label={t.selectors.country}
        >
          {COUNTRIES.map((c) => (
            <option key={c.code} value={c.code}>
              {c.flag} {c.currency}
            </option>
          ))}
        </select>
      </label>

      <label className={styles.field}>
        <span className={styles.srOnly}>{t.selectors.language}</span>
        <select
          className={styles.select}
          value={lang}
          onChange={(e) => setLang(e.target.value as Locale)}
          aria-label={t.selectors.language}
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
