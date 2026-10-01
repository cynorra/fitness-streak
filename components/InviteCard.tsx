import { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Share, Alert } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTranslation } from '../lib/i18n/i18n';
import { buildInviteMessage, fetchReferralStats, redeemReferral, ReferralStats } from '../lib/referral';

export default function InviteCard({ isDietitian }: { isDietitian: boolean }) {
  const { t, locale } = useTranslation();
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [enterCode, setEnterCode] = useState('');
  const [applying, setApplying] = useState(false);

  const load = () => {
    fetchReferralStats().then(setStats).catch(() => {});
  };

  useEffect(load, []);

  // Hidden until the migration has run (no code to show).
  if (!stats || !stats.code) return null;

  const share = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await Share.share({ message: buildInviteMessage(stats.code, locale, isDietitian) }).catch(() => {});
  };

  const apply = async () => {
    setApplying(true);
    const result = await redeemReferral(enterCode);
    setApplying(false);
    Alert.alert(result === 'ok' ? '🤝' : t('common.error'), t(`referral.${result}`));
    if (result === 'ok') {
      setEnterCode('');
      load();
    }
  };

  return (
    <View style={styles.card}>
      <Text style={styles.title}>🤝 {t('referral.title')}</Text>

      <Text style={styles.label}>{t('referral.code_label')}</Text>
      <Text style={styles.code} selectable>{stats.code}</Text>
      <Text style={styles.hint}>{t('referral.copy_hint')}</Text>

      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{stats.invited}</Text>
          <Text style={styles.statLabel}>{t('referral.invited')}</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{stats.active}</Text>
          <Text style={styles.statLabel}>{t('referral.active')}</Text>
        </View>
      </View>

      <Text style={styles.reward}>{t(isDietitian ? 'referral.reward_dietitian' : 'referral.reward_member')}</Text>

      <TouchableOpacity style={styles.shareBtn} onPress={share}>
        <Text style={styles.shareText}>{t('referral.share')}</Text>
      </TouchableOpacity>

      {!stats.referred && (
        <View style={styles.enterBox}>
          <Text style={styles.label}>{t('referral.enter_title')}</Text>
          <View style={styles.enterRow}>
            <TextInput
              style={styles.input}
              value={enterCode}
              onChangeText={(v) => setEnterCode(v.toUpperCase())}
              placeholder={t('referral.enter_ph')}
              placeholderTextColor="#555"
              autoCapitalize="characters"
              autoCorrect={false}
              maxLength={12}
            />
            <TouchableOpacity style={[styles.applyBtn, (!enterCode.trim() || applying) && { opacity: 0.4 }]} disabled={!enterCode.trim() || applying} onPress={apply}>
              <Text style={styles.applyText}>{t('referral.enter_apply')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#111', borderWidth: 1, borderColor: '#10b98140', borderRadius: 20, padding: 18, marginBottom: 20 },
  title: { color: '#fff', fontSize: 16, fontWeight: '900', marginBottom: 12 },
  label: { color: '#94a3b8', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  code: { color: '#10b981', fontSize: 30, fontWeight: '900', letterSpacing: 4, marginTop: 4 },
  hint: { color: '#71717a', fontSize: 11, marginTop: 2 },
  statsRow: { flexDirection: 'row', gap: 10, marginTop: 14 },
  stat: { flex: 1, backgroundColor: '#0a0a0a', borderRadius: 12, paddingVertical: 10, alignItems: 'center' },
  statValue: { color: '#fff', fontSize: 20, fontWeight: '900' },
  statLabel: { color: '#71717a', fontSize: 10, fontWeight: '700', marginTop: 2 },
  reward: { color: '#a1a1aa', fontSize: 12, marginTop: 12, lineHeight: 18 },
  shareBtn: { backgroundColor: '#10b981', borderRadius: 12, paddingVertical: 13, alignItems: 'center', marginTop: 14 },
  shareText: { color: '#fff', fontSize: 14, fontWeight: '900' },
  enterBox: { marginTop: 18, borderTopWidth: 1, borderTopColor: '#222', paddingTop: 14 },
  enterRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  input: { flex: 1, backgroundColor: '#0a0a0a', borderWidth: 1, borderColor: '#222', borderRadius: 10, padding: 10, color: '#fff', letterSpacing: 2, fontWeight: '800' },
  applyBtn: { backgroundColor: '#8b5cf6', borderRadius: 10, paddingHorizontal: 16, justifyContent: 'center' },
  applyText: { color: '#fff', fontWeight: '900', fontSize: 13 },
});
