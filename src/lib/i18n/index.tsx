"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import zhCN from "./zh-CN";
import en from "./en";

export type Locale = "zh-CN" | "en";

const dictionaries: Record<Locale, Record<string, string>> = {
  "zh-CN": zhCN,
  en: en,
};

const LOCALE_KEY = "clawtouch-locale";

function readLocale(): Locale {
  try {
    const stored = localStorage.getItem(LOCALE_KEY);
    if (stored === "en" || stored === "zh-CN") return stored;
  } catch { /* SSR or private browsing */ }
  return "zh-CN";
}

function saveLocale(locale: Locale) {
  try { localStorage.setItem(LOCALE_KEY, locale); } catch { /* ignore */ }
}

/** Read locale (safe for both SSR and client) */
export function getLocale(): Locale {
  if (typeof window === "undefined") return "zh-CN";
  return readLocale();
}

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  // Always start with "zh-CN" to match SSR output, then sync in useEffect
  const [locale, setLocaleState] = useState<Locale>("zh-CN");

  // Sync from localStorage after hydration
  useEffect(() => {
    const stored = readLocale();
    if (stored !== "zh-CN") setLocaleState(stored);
    document.documentElement.lang = stored;
  }, []);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    saveLocale(newLocale);
    document.documentElement.lang = newLocale;
  }, []);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      let text = dictionaries[locale][key] ?? key;
      if (params) {
        for (const [k, v] of Object.entries(params)) {
          text = text.replace(`{${k}}`, String(v));
        }
      }
      return text;
    },
    [locale]
  );

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useT() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useT must be used within I18nProvider");
  return ctx;
}
