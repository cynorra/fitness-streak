import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

const PING_URL = process.env.EXPO_PUBLIC_SUPABASE_URL
  ? `${process.env.EXPO_PUBLIC_SUPABASE_URL}/auth/v1/health`
  : 'https://clients3.google.com/generate_204';
const INTERVAL_MS = 15000;

// Any HTTP response (even 401) proves the network works; only a rejected fetch means offline.
async function checkOnline(): Promise<boolean> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 6000);
  try {
    await fetch(PING_URL, { method: 'GET', signal: controller.signal });
    return true;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

export function isNetworkError(message?: string | null): boolean {
  return !!message && /network request failed|failed to fetch|network error|timeout|timed out|aborted/i.test(message);
}

export function useOnline(): boolean {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      const ok = await checkOnline();
      if (mounted) setOnline(ok);
    };
    run();
    const id = setInterval(run, INTERVAL_MS);
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') run();
    });
    return () => {
      mounted = false;
      clearInterval(id);
      sub.remove();
    };
  }, []);

  return online;
}

// Turns raw transport errors ("Network request failed") into a readable, translated message.
export function friendlyError(message: string | null | undefined, t: (key: string) => string): string {
  if (isNetworkError(message)) return t('net.offline_msg');
  return message ?? '';
}
