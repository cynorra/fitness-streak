import { MetadataRoute } from 'next';
import { createClient } from '@/utils/supabase/server';

const LOCALES = ['tr', 'en', 'es', 'pt', 'ru', 'zh', 'ja', 'ko'];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://vitatribe.com';

  // Static locale homepage entries
  const localeHomeUrls: MetadataRoute.Sitemap = LOCALES.map((locale) => ({
    url: `${baseUrl}/${locale}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: locale === 'tr' ? 1 : 0.9,
    alternates: {
      languages: Object.fromEntries(
        LOCALES.map((l) => [l, `${baseUrl}/${l}`])
      ),
    },
  }));

  // Fetch all usernames for sitemap (limited to 1000 for safety)
  const supabase = await createClient();
  const { data: profiles } = await supabase
    .from('profiles')
    .select('username')
    .limit(1000);

  // Generate locale-aware profile URLs
  const profileUrls: MetadataRoute.Sitemap = (profiles || []).flatMap((profile) =>
    LOCALES.map((locale) => ({
      url: `${baseUrl}/${locale}/u/${profile.username}`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.7,
      alternates: {
        languages: Object.fromEntries(
          LOCALES.map((l) => [l, `${baseUrl}/${l}/u/${profile.username}`])
        ),
      },
    }))
  );

  // Static pages (explore, contact, privacy, terms)
  const staticPages = ['explore', 'contact', 'privacy', 'terms'];
  const staticUrls: MetadataRoute.Sitemap = LOCALES.flatMap((locale) =>
    staticPages.map((page) => ({
      url: `${baseUrl}/${locale}/${page}`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    }))
  );

  return [
    ...localeHomeUrls,
    ...profileUrls,
    ...staticUrls,
  ];
}
