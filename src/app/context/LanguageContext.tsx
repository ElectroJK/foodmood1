import React, { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import en from "../../locales/en";
import ru from "../../locales/ru";
import kz from "../../locales/Kz";

export type Language = "en" | "ru" | "kz";

export const supportedLanguages: Language[] = ["en", "ru", "kz"];

type Dictionary = Record<string, any>;

type LanguageContextValue = {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, fallback?: string) => string;
};

const translations: Record<Language, Dictionary> = { en, ru, kz };

const LanguageContext = createContext<LanguageContextValue | null>(null);

const STORAGE_KEY = "foodmood-language";

function getByPath(source: Dictionary, path: string): string | undefined {
  const value = path.split(".").reduce<any>((acc, key) => (acc ? acc[key] : undefined), source);
  return typeof value === "string" ? value : undefined;
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    const savedLanguage = localStorage.getItem(STORAGE_KEY) as Language | null;
    if (supportedLanguages.includes(savedLanguage as Language)) {
      return savedLanguage;
    }
    return "en";
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, language);
    document.documentElement.lang = language;
  }, [language]);

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      t: (key: string, fallback = key) =>
        getByPath(translations[language], key) ??
        getByPath(translations.en, key) ??
        getByPath(translations.kz, key) ??
        fallback,
    }),
    [language]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return context;
}
