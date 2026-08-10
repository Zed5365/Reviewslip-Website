"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { type Locale, DEFAULT_LOCALE, isLocale } from "./config";
import { getDictionary } from "./dictionaries";
import type { Dictionary } from "./dictionaries/en";
import {
  type Country,
  DEFAULT_COUNTRY,
  getCountry,
  formatMoney,
} from "../currency";

const LANG_KEY = "rs_lang";
const COUNTRY_KEY = "rs_country";

interface LocaleContextValue {
  lang: Locale;
  setLang: (l: Locale) => void;
  countryCode: string;
  setCountry: (c: string) => void;
  country: Country;
  /** The active dictionary. Access copy as `t.home.heroLede`, etc. */
  t: Dictionary;
  /** Format a base-USD amount into the selected country's currency. */
  money: (usd: number) => string;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Locale>(DEFAULT_LOCALE);
  const [countryCode, setCountryState] = useState<string>(DEFAULT_COUNTRY);

  // Hydrate from localStorage after mount (keeps SSR output = default locale).
  useEffect(() => {
    const savedLang = localStorage.getItem(LANG_KEY);
    if (isLocale(savedLang)) setLangState(savedLang);
    const savedCountry = localStorage.getItem(COUNTRY_KEY);
    if (savedCountry) setCountryState(savedCountry);
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = (l: Locale) => {
    setLangState(l);
    try {
      localStorage.setItem(LANG_KEY, l);
    } catch {}
  };

  const setCountry = (c: string) => {
    setCountryState(c);
    try {
      localStorage.setItem(COUNTRY_KEY, c);
    } catch {}
  };

  const value = useMemo<LocaleContextValue>(() => {
    const country = getCountry(countryCode);
    return {
      lang,
      setLang,
      countryCode,
      setCountry,
      country,
      t: getDictionary(lang),
      money: (usd: number) => formatMoney(usd, country),
    };
  }, [lang, countryCode]);

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
}

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale must be used within LocaleProvider");
  return ctx;
}
