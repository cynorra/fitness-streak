import { supabase } from './supabase';

export const HEALTH_CONSENT_VERSION = '2026-11-23';

export async function recordHealthConsent(userId: string): Promise<boolean> {
  const { error } = await supabase.from('user_consents').insert({ user_id: userId, kind: 'health_data', version: HEALTH_CONSENT_VERSION });
  return !error;
}

export async function revokeHealthConsent(userId: string): Promise<boolean> {
  const { error } = await supabase
    .from('user_consents')
    .update({ revoked_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('kind', 'health_data')
    .is('revoked_at', null);
  return !error;
}

export async function hasHealthConsent(userId: string): Promise<boolean> {
  const { data } = await supabase.from('user_consents').select('id').eq('user_id', userId).eq('kind', 'health_data').is('revoked_at', null).limit(1);
  return !!data?.length;
}
