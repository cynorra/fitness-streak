import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { translations, TranslationType } from './translations';

const LANGUAGE_KEY = '@app_language';

export const supportedLanguages = [
  { code: 'tr', name: 'Türkçe 🇹🇷' },
  { code: 'en', name: 'English 🇺🇸' },
  { code: 'ar', name: 'العربية 🇸🇦' },
  { code: 'de', name: 'Deutsch 🇩🇪' },
  { code: 'fr', name: 'Français 🇫🇷' },
  { code: 'es', name: 'Español 🇪🇸' },
  { code: 'pt', name: 'Português 🇧🇷' },
  { code: 'it', name: 'Italiano 🇮🇹' },
  { code: 'ru', name: 'Русский 🇷🇺' },
  { code: 'uk', name: 'Українська 🇺🇦' },
  { code: 'zh', name: '简体中文 🇨🇳' },
  { code: 'ja', name: '日本語 🇯🇵' },
  { code: 'ko', name: '한국어 🇰🇷' },
  { code: 'hi', name: 'हिन्दी 🇮🇳' },
  { code: 'el', name: 'Ελληνικά 🇬🇷' },
  { code: 'nl', name: 'Nederlands 🇳🇱' },
];

type I18nContextType = {
  locale: string;
  t: (key: string) => string;
  changeLanguage: (code: string) => Promise<void>;
};

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<string>('tr');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadLanguage() {
      try {
        const savedLanguage = await AsyncStorage.getItem(LANGUAGE_KEY);
        if (savedLanguage && translations[savedLanguage]) {
          setLocale(savedLanguage);
        } else {
          // Detect system language
          const systemLocales = Localization.getLocales();
          if (systemLocales && systemLocales.length > 0) {
            const systemLang = systemLocales[0].languageCode;
            if (systemLang && translations[systemLang]) {
              setLocale(systemLang);
            } else {
              setLocale('tr'); // Default fallback
            }
          } else {
            setLocale('tr');
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
    if (translations[code]) {
      setLocale(code);
      try {
        await AsyncStorage.setItem(LANGUAGE_KEY, code);
      } catch (e) {
        console.warn('Error saving language', e);
      }
    }
  };

  const t = (keyPath: string): string => {
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
        return typeof fallback === 'string' ? fallback : keyPath;
      }
    }

    return typeof current === 'string' ? current : keyPath;
  };

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
