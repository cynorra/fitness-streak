import { supabase } from './supabase';

export type ReferralStats = { code: string; invited: number; active: number; referred: boolean };
export type RedeemResult = 'ok' | 'invalid' | 'self' | 'already' | 'error';

// Same package id as app.json; a Play Store link works on every Android device.
const STORE_URL = 'https://play.google.com/store/apps/details?id=com.vitatribe.fitness.spor.diyet.diyetisyen';

export async function fetchReferralStats(): Promise<ReferralStats | null> {
  const { data, error } = await supabase.rpc('my_referral_stats');
  const row = Array.isArray(data) ? data[0] : data;
  if (error || !row) return null;
  return {
    code: row.code || '',
    invited: Number(row.invited) || 0,
    active: Number(row.active) || 0,
    referred: !!row.referred,
  };
}

export async function redeemReferral(code: string): Promise<RedeemResult> {
  const clean = code.trim().toUpperCase();
  if (!clean) return 'invalid';
  const { data, error } = await supabase.rpc('redeem_referral', { p_code: clean });
  if (error) return 'error';
  return (['ok', 'invalid', 'self', 'already'].includes(data) ? data : 'error') as RedeemResult;
}

export function buildInviteMessage(code: string, locale: string, isDietitian: boolean): string {
  if (locale === 'tr') {
    return isDietitian
      ? `VitaTribe'de danışanlarımı takip ediyorum: beslenme planı, günlük takip ve motivasyon tek uygulamada. Katılırken davet kodumu gir: ${code}\n${STORE_URL}`
      : `VitaTribe ile seri tutuyorum! Antrenman, beslenme ve diyetisyen desteği tek uygulamada. Katılırken davet kodumu gir: ${code}\n${STORE_URL}`;
  }
  return isDietitian
    ? `I track my clients with VitaTribe: meal plans, daily tracking and motivation in one app. Use my invite code when you join: ${code}\n${STORE_URL}`
    : `I'm keeping my streak with VitaTribe! Workouts, nutrition and dietitian support in one app. Use my invite code when you join: ${code}\n${STORE_URL}`;
}
