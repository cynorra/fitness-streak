import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { translations as baseTranslations } from './translations';
import { screenStrings } from './screens';

import { syncNotificationSchedules } from '../notifications';
import { setModerationLocale } from '../profanityFilter';

const LANGUAGE_KEY = '@app_language';

// Only Turkish and English are fully translated; other locales are intentionally disabled.
const translations: Record<string, any> = {
  tr: { ...baseTranslations.tr, ...screenStrings.tr },
  en: { ...baseTranslations.en, ...screenStrings.en },
};

export const supportedLanguages = [
  { code: 'tr', name: 'Türkçe 🇹🇷' },
  { code: 'en', name: 'English 🇺🇸' },
];

const SUPPORTED_CODES = supportedLanguages.map((l) => l.code);

type I18nContextType = {
  locale: string;
  t: (key: string, vars?: Record<string, string | number>) => string;
  changeLanguage: (code: string) => Promise<void>;
};

function interpolate(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template;
  return template.replace(/\{\{(\w+)\}\}/g, (match, name) =>
    name in vars ? String(vars[name]) : match
  );
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<string>('tr');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadLanguage() {
      try {
        const savedLanguage = await AsyncStorage.getItem(LANGUAGE_KEY);
        if (savedLanguage && SUPPORTED_CODES.includes(savedLanguage)) {
          setLocale(savedLanguage);
        } else {
          // Detect system language
          const systemLocales = Localization.getLocales();
          if (systemLocales && systemLocales.length > 0) {
            const systemLang = systemLocales[0].languageCode;
            // Turkish devices get Turkish; everything else gets English.
            setLocale(systemLang === 'tr' ? 'tr' : 'en');
          } else {
            setLocale('en');
          }
        }
      } catch (e) {
        console.warn('Error loading language', e);
        setLocale('tr');
      } finally {
        setLoading(false);
      }
    }
    loadLanguage();
  }, []);

  const changeLanguage = async (code: string) => {
    if (SUPPORTED_CODES.includes(code)) {
      setLocale(code);
      try {
        await AsyncStorage.setItem(LANGUAGE_KEY, code);
        syncNotificationSchedules();
      } catch (e) {
        console.warn('Error saving language', e);
      }
    }
  };

  const t = (keyPath: string, vars?: Record<string, string | number>): string => {
    const keys = keyPath.split('.');
    let current: any = translations[locale] || translations['tr'];

    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        // Fallback to English if translation is missing in selected locale
        let fallback: any = translations['en'];
        for (const fallbackKey of keys) {
          if (fallback && typeof fallback === 'object' && fallbackKey in fallback) {
            fallback = fallback[fallbackKey];
          } else {
            return keyPath; // Return path if not found in fallback either
          }
        }
        return typeof fallback === 'string' ? interpolate(fallback, vars) : keyPath;
      }
    }

    return typeof current === 'string' ? interpolate(current, vars) : keyPath;
  };

  useEffect(() => {
    setModerationLocale(locale);
  }, [locale]);

  if (loading) {
    return null; // Prevent UI rendering until language is determined
  }

  return (
    <I18nContext.Provider value={{ locale, t, changeLanguage }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useTranslation must be used within an I18nProvider');
  }
  return context;
}
