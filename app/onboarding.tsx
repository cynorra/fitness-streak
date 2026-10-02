import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { redeemReferral } from '../lib/referral';
import Animated, { FadeInDown, FadeInUp, SlideInRight } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useTranslation } from '../lib/i18n/i18n';
import AppIcon from '../components/AppIcon';

const SLIDE_KEYS = [
  { key: 's1', icon: '🔥' },
  { key: 's2', icon: '🏆' },
  { key: 's3', icon: '📊' },
];

export default function Onboarding() {
  const [step, setStep] = useState(0);
  const [selectedRole, setSelectedRole] = useState<'user' | 'dietitian'>('user');
  const [loading, setLoading] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const { session, refreshProfile } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const SLIDES = SLIDE_KEYS.map((k) => ({ icon: k.icon, title: t(`onboarding.${k.key}_title`), description: t(`onboarding.${k.key}_desc`) }));

  const handleNext = () => {
    Haptics.selectionAsync();
    if (step < SLIDES.length) {
      setStep(step + 1);
    }
  };

  const handleFinish = async () => {
    if (!session?.user) return;
    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const patch = { role: selectedRole, onboarding_completed: true };
      const { data, error } = await supabase
        .from('profiles')
        .update(patch)
        .eq('id', session.user.id)
        .select('id');

      if (error) throw error;

      // Google ile ilk girişte profil satırı yoksa update 0 satır etkiler; oluştur.
      if (!data || data.length === 0) {
        const meta: any = session.user.user_metadata ?? {};
        const base = String(
          meta.username || (session.user.email ?? '').split('@')[0] || 'user'
        ).replace(/[^a-zA-Z0-9_]/g, '');
        const username = `${base.slice(0, 11) || 'user'}_${session.user.id.slice(0, 6)}`;
        const { error: insertError } = await supabase.from('profiles').insert({
          id: session.user.id,
          username,
          display_name: meta.full_name || meta.name || meta.display_name || base || 'New User',
          avatar_url: meta.avatar_url || meta.picture || null,
          ...patch,
        });
        if (insertError) throw insertError;
      }

      // Optional invite code: never blocks onboarding, a bad code is simply ignored.
      if (inviteCode.trim()) {
        redeemReferral(inviteCode).catch(() => {});
      }

      await refreshProfile();
      router.replace('/(tabs)');
    } catch (err: any) {
      console.error('Onboarding update error:', err);
      alert(`${t('onboarding.error')}: ${err?.message ?? t('onboarding.unknown_error')}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {step < SLIDES.length ? (
        <Animated.View key={step} entering={SlideInRight.duration(400)} style={styles.slide}>
          <Text style={styles.icon}>{SLIDES[step].icon}</Text>
          <Animated.Text entering={FadeInDown.delay(200)} style={styles.title}>
            {SLIDES[step].title}
          </Animated.Text>
          <Animated.Text entering={FadeInUp.delay(300)} style={styles.description}>
            {SLIDES[step].description}
          </Animated.Text>

          <TouchableOpacity style={[styles.button, { bottom: insets.bottom + 48 }]} onPress={handleNext}>
            <Text style={styles.buttonText}>{t('onboarding.next')}</Text>
          </TouchableOpacity>
        </Animated.View>
      ) : (
        <Animated.View entering={SlideInRight.duration(400)} style={styles.slide}>
          <AppIcon name="locate" color="#ef4444" size={88} style={{ marginBottom: 24 }} />
          <Text style={styles.title}>{t('onboarding.who_title')}</Text>
          <Text style={styles.description}>
            {t('onboarding.who_desc')}
          </Text>

          <View style={styles.roleContainer}>
            <TouchableOpacity
              style={[styles.roleCard, selectedRole === 'user' && styles.roleCardActive]}
              onPress={() => setSelectedRole('user')}
            >
              <AppIcon name="fitness" color="#10b981" size={56} style={{ marginBottom: 12 }} />
              <Text style={styles.roleTitle}>{t('onboarding.role_user')}</Text>
              <Text style={styles.roleDesc}>{t('onboarding.role_user_desc')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.roleCard, selectedRole === 'dietitian' && styles.roleCardActive]}
              onPress={() => setSelectedRole('dietitian')}
            >
              <AppIcon name="medkit" color="#10b981" size={56} style={{ marginBottom: 12 }} />
              <Text style={styles.roleTitle}>{t('onboarding.role_dietitian')}</Text>
              <Text style={styles.roleDesc}>{t('onboarding.role_dietitian_desc')}</Text>
            </TouchableOpacity>
          </View>

          <TextInput
            style={styles.inviteInput}
            value={inviteCode}
            onChangeText={(v) => setInviteCode(v.toUpperCase())}
            placeholder={t('referral.enter_ph')}
            placeholderTextColor="#555"
            autoCapitalize="characters"
            autoCorrect={false}
            maxLength={12}
          />

          <TouchableOpacity style={[styles.button, { bottom: insets.bottom + 48 }, loading && styles.buttonDisabled]} onPress={handleFinish} disabled={loading}>
            <Text style={styles.buttonText}>{loading ? t('onboarding.waiting') : t('onboarding.start')}</Text>
          </TouchableOpacity>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  inviteInput: {
    marginTop: 20,
    width: '100%',
    backgroundColor: '#111',
    borderWidth: 1,
    borderColor: '#222',
    borderRadius: 12,
    padding: 14,
    color: '#fff',
    textAlign: 'center',
    letterSpacing: 2,
    fontWeight: '800',
  },
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    justifyContent: 'center',
  },
  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  icon: {
    fontSize: 80,
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: -1,
  },
  description: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 48,
  },
  button: {
    backgroundColor: '#10b981',
    paddingVertical: 18,
    paddingHorizontal: 48,
    borderRadius: 30,
    width: '100%',
    alignItems: 'center',
    position: 'absolute',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 1,
  },
  roleContainer: {
    width: '100%',
    gap: 16,
    marginBottom: 48,
  },
  roleCard: {
    backgroundColor: '#1a1a1a',
    borderWidth: 2,
    borderColor: '#2a2a2a',
    padding: 24,
    borderRadius: 20,
    alignItems: 'center',
  },
  roleCardActive: {
    borderColor: '#10b981',
    backgroundColor: '#10b98120',
  },
  roleIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  roleTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 8,
  },
  roleDesc: {
    color: '#888',
    fontSize: 14,
    textAlign: 'center',
  },
});
