import { tr, enUS, de, fr, it, es, pt, ru, uk, zhCN, ja, ko, hi, el } from 'date-fns/locale';

const localeMap: Record<string, any> = {
  tr: tr,
  en: enUS,
  de: de,
  fr: fr,
  it: it,
  es: es,
  pt: pt,
  ru: ru,
  uk: uk,
  zh: zhCN,
  ja: ja,
  ko: ko,
  hi: hi,
  el: el,
};

export function getDateLocale(localeCode: string) {
  return localeMap[localeCode] || tr; // fallback to Turkish if not found
}
