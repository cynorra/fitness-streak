export const i18n = {
  defaultLocale: 'tr',
  locales: ['en', 'es', 'pt', 'ru', 'tr', 'zh', 'ja', 'ko'],
} as const;

export type Locale = typeof i18n['locales'][number];
