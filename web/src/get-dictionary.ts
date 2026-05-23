import 'server-only';
import type { Locale } from './i18n';

const dictionaries = {
  en: () => import('./dictionaries/en.json').then((module) => module.default),
  tr: () => import('./dictionaries/tr.json').then((module) => module.default),
  es: () => import('./dictionaries/es.json').then((module) => module.default),
  pt: () => import('./dictionaries/pt.json').then((module) => module.default),
  ru: () => import('./dictionaries/ru.json').then((module) => module.default),
  zh: () => import('./dictionaries/zh.json').then((module) => module.default),
  ja: () => import('./dictionaries/ja.json').then((module) => module.default),
  ko: () => import('./dictionaries/ko.json').then((module) => module.default),
};

export const getDictionary = async (locale: Locale) => {
  if (!dictionaries[locale]) {
    return dictionaries['tr'](); // fallback
  }
  return dictionaries[locale]();
};
