import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Discover content comes straight from the public YouTube RSS feed of each channel
 * (no API key needed), so new videos show up as soon as the channels publish them.
 * Results are cached for a few hours; if the network fails the last cached list is used.
 * There is no bundled placeholder content.
 */
export interface DiscoverVideo {
  id: string;
  title: string;
  thumbnail: string;
  publishedAt: string;
  channel: string;
}

export interface DiscoverCategory {
  id: 'hiit' | 'yoga' | 'strength';
  titleKey: 'hiit' | 'yoga' | 'strength';
  videos: DiscoverVideo[];
}

// Channel ids were resolved from the channel pages and each feed was checked to be live.
const CHANNELS: Record<DiscoverCategory['id'], { id: string; name: string }[]> = {
  hiit: [
    { id: 'UCpQ34afVgk8cRQBjSJ1xuJQ', name: 'MadFit' },
    { id: 'UCsLF0qPTpkYKq81HsjgzhwQ', name: 'growingannanas' },
  ],
  yoga: [{ id: 'UCFKE7WVJfvaHW5q283SxchA', name: 'Yoga With Adriene' }],
  strength: [
    { id: 'UCiP6wD_tYlYLYh3agzbByWQ', name: 'FitnessBlender' },
    { id: 'UCVsZJ0fCmso7Q3kIlbnVtng', name: 'KaisaFit' },
  ],
};

const CACHE_KEY = 'discover_cache_v1';
const CACHE_TTL_MS = 3 * 60 * 60 * 1000; // 3 hours
const PER_CATEGORY = 8;

interface CacheShape {
  at: number;
  data: DiscoverCategory[];
}

function decode(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'");
}

function parseFeed(xml: string, channel: string): DiscoverVideo[] {
  const out: DiscoverVideo[] = [];
  const entries = xml.split('<entry>').slice(1);
  for (const e of entries) {
    const id = /<yt:videoId>([^<]+)<\/yt:videoId>/.exec(e)?.[1];
    const title = /<title>([^<]*)<\/title>/.exec(e)?.[1];
    const published = /<published>([^<]+)<\/published>/.exec(e)?.[1];
    if (!id || !title || !published) continue;
    out.push({
      id,
      title: decode(title),
      thumbnail: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
      publishedAt: published,
      channel,
    });
  }
  return out;
}

async function fetchChannel(id: string, name: string): Promise<DiscoverVideo[]> {
  const res = await fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${id}`);
  if (!res.ok) throw new Error(`feed ${id}: ${res.status}`);
  return parseFeed(await res.text(), name);
}

async function readCache(): Promise<CacheShape | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    return raw ? (JSON.parse(raw) as CacheShape) : null;
  } catch {
    return null;
  }
}

/** Returns categories with the newest videos first. `force` skips the freshness check. */
export async function loadDiscover(force = false): Promise<DiscoverCategory[]> {
  const cached = await readCache();
  if (!force && cached && Date.now() - cached.at < CACHE_TTL_MS) return cached.data;

  const categories: DiscoverCategory[] = [];
  let anyOk = false;
  for (const key of Object.keys(CHANNELS) as DiscoverCategory['id'][]) {
    const results = await Promise.allSettled(CHANNELS[key].map((c) => fetchChannel(c.id, c.name)));
    const videos = results
      .flatMap((r) => (r.status === 'fulfilled' ? r.value : []))
      .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
      .slice(0, PER_CATEGORY);
    if (videos.length) anyOk = true;
    categories.push({ id: key, titleKey: key, videos });
  }

  if (!anyOk) {
    // Offline or blocked: show the last good list rather than nothing.
    if (cached) return cached.data;
    return categories;
  }
  AsyncStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), data: categories } satisfies CacheShape)).catch(() => {});
  return categories;
}

/** "3h ago" style label in the given language ('tr' or anything else = English). */
export function timeAgo(iso: string, lang: string): string {
  const diff = Math.max(0, Date.now() - new Date(iso).getTime());
  const min = Math.floor(diff / 60000);
  const h = Math.floor(min / 60);
  const d = Math.floor(h / 24);
  const tr = lang.startsWith('tr');
  if (d >= 30) return tr ? `${Math.floor(d / 30)} ay önce` : `${Math.floor(d / 30)}mo ago`;
  if (d >= 1) return tr ? `${d} gün önce` : `${d}d ago`;
  if (h >= 1) return tr ? `${h} sa önce` : `${h}h ago`;
  return tr ? 'Az önce' : 'Just now';
}
