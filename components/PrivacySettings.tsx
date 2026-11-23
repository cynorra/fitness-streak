import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';
import { useTranslation } from '../lib/i18n/i18n';
import { hasHealthConsent, recordHealthConsent, revokeHealthConsent } from '../lib/consent';
import { friendlyError } from '../lib/useOnline';

/** Profile section: measurement units (kg/lb), health-data consent withdrawal, dietitian tool shortcuts. Additive only. */
export default function PrivacySettings() {
  const { profile, refreshProfile } = useAuth();
  const { t } = useTranslation();
  const router = useRouter();
  const [consent, setConsent] = useState<boolean | null>(null);
  const units: 'metric' | 'imperial' = profile?.units === 'imperial' ? 'imperial' : 'metric';

  useEffect(() => {
    if (profile) hasHealthConsent(profile.id).then(setConsent);
  }, [profile?.id]);

  if (!profile) return null;

  const setUnits = async (u: 'metric' | 'imperial') => {
    const { error } = await supabase.from('profiles').update({ units: u }).eq('id', profile.id);
    if (error) Alert.alert(t('common.error'), friendlyError(error.message, t));
    else refreshProfile();
  };

  const toggleConsent = () => {
    if (consent) {
      Alert.alert(t('platform.consent_revoke'), t('platform.consent_revoke_msg'), [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('platform.consent_revoke'),
          style: 'destructive',
          onPress: async () => setConsent(!(await revokeHealthConsent(profile.id))),
        },
      ]);
    } else {
      recordHealthConsent(profile.id).then((ok) => ok && setConsent(true));
    }
  };

  return (
    <View style={styles.box}>
      <Text style={styles.heading}>{t('platform.settings_title')}</Text>

      <Text style={styles.label}>{t('platform.units')}</Text>
      <View style={styles.row}>
        {(['metric', 'imperial'] as const).map((u) => (
          <TouchableOpacity key={u} style={[styles.pill, units === u && styles.pillOn]} onPress={() => setUnits(u)}>
            <Text style={[styles.pillText, units === u && { color: '#fff' }]}>{t(`platform.units_${u}`)}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>{t('platform.consent_title')}</Text>
      <Text style={styles.sub}>{consent ? t('platform.consent_on') : t('platform.consent_off')}</Text>
      <TouchableOpacity style={[styles.pill, { alignSelf: 'flex-start' }]} onPress={toggleConsent} disabled={consent === null}>
        <Text style={styles.pillText}>{consent ? t('platform.consent_revoke') : t('platform.consent_grant')}</Text>
      </TouchableOpacity>

      {profile.role === 'dietitian' && (
        <>
          <Text style={styles.label}>{t('platform.pro_tools')}</Text>
          <View style={styles.row}>
            <TouchableOpacity style={styles.pill} onPress={() => router.push('/dietitian/verification' as any)}>
              <Text style={styles.pillText}>{t('platform.vf_title')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.pill} onPress={() => router.push('/dietitian/availability' as any)}>
              <Text style={styles.pillText}>{t('platform.avail_title')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.pill} onPress={() => router.push('/dietitian/templates' as any)}>
              <Text style={styles.pillText}>{t('platform.tpl_title')}</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
      <Text style={styles.sub}>{t('platform.disclaimer')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { marginHorizontal: 20, marginTop: 16, padding: 16, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.09)' },
  heading: { color: '#fff', fontSize: 15, fontWeight: '900', marginBottom: 4 },
  label: { color: '#a1a1aa', fontSize: 12, fontWeight: '800', marginTop: 14, marginBottom: 6, textTransform: 'uppercase' },
  sub: { color: '#71717a', fontSize: 11, marginVertical: 4 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: { paddingVertical: 9, paddingHorizontal: 14, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.07)' },
  pillOn: { backgroundColor: '#10b981' },
  pillText: { color: '#d4d4d8', fontWeight: '800', fontSize: 12 },
});
