import { MetadataRoute } from 'next';
import { createClient } from '@/utils/supabase/server';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://vitatribe.com';

  // Fetch all usernames for sitemap (limited to 1000 for safety)
  const supabase = await createClient();
  const { data: profiles } = await supabase
    .from('profiles')
    .select('username')
    .limit(1000);

  const profileUrls = (profiles || []).map((profile) => ({
    url: `${baseUrl}/u/${profile.username}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: 0.8,
  }));

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    ...profileUrls,
  ];
}
