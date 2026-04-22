import { createContext, useContext, useState, useCallback, ReactNode, useMemo } from "react";

import en from "@/i18n/en.json";
import hi from "@/i18n/hi.json";
import ta from "@/i18n/ta.json";
import bn from "@/i18n/bn.json";
import te from "@/i18n/te.json";

export type Language = "en" | "hi" | "ta" | "bn" | "te";

export const languageNames: Record<Language, string> = {
  en: "English",
  hi: "हिन्दी",
  ta: "தமிழ்",
  bn: "বাংলা",
  te: "తెలుగు",
};

const translations: Record<Language, Record<string, string>> = { en, hi, ta, bn, te };

interface I18nContextValue {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, replacements?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextValue>({
  language: "en",
  setLanguage: () => {},
  t: (key) => key,
});

const LANG_KEY = "rakshasetu_lang";

export const I18nProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLang] = useState<Language>(() => {
    const saved = globalThis.localStorage?.getItem(LANG_KEY);
    return (saved as Language) || "en";
  });

  const setLanguage = useCallback((lang: Language) => {
    setLang(lang);
    globalThis.localStorage?.setItem(LANG_KEY, lang);
  }, []);

  const t = useCallback(
    (key: string, replacements?: Record<string, string | number>) => {
      let text = translations[language]?.[key] || translations.en[key] || key;
      if (replacements) {
        Object.entries(replacements).forEach(([k, v]) => {
          text = text.replace(`{{${k}}}`, String(v));
        });
      }
      return text;
    },
    [language]
  );

  const value = useMemo(() => ({ language, setLanguage, t }), [language, setLanguage, t]);

  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = () => useContext(I18nContext);
