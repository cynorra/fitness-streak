import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://streak-fit.com';
  
  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/u/'],
      disallow: ['/auth/', '/login/', '/api/'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
