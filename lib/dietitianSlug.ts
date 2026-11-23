const SITE = process.env.EXPO_PUBLIC_SITE_URL || 'https://vitatribe.com';

/** Shareable public profile link; the web page /d/<slug> should call rpc get_dietitian_public(slug). */
export const dietitianLink = (slugOrId: string) => `${SITE}/d/${encodeURIComponent(slugOrId)}`;

export const makeSlug = (name: string, id: string) =>
  `${
    name
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[^\w\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .slice(0, 30) || 'dietitian'
  }-${id.slice(0, 6)}`;
