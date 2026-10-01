import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import Animated, { FadeInDown, FadeInUp, SlideInRight } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

const SLIDES = [
  {
    title: 'Hoş Geldin! 🌱',
    description: 'VitaTribe ile her gün yeni bir başlangıç. Kendi serini oluştur ve motivasyonunu yüksek tut.',
    icon: '🔥',
  },
  {
    title: 'Arkadaşlarınla Büyü 🤝',
    description: 'Arkadaşlarını ekle, onların antrenmanlarını gör ve birbirinize alkış (Kudos) göndererek destek olun.',
    icon: '🏆',
  },
  {
    title: 'Beslenme & Hedefler 🍎',
    description: 'Gelişmiş beslenme takibi ve diyetisyen desteği ile hedeflerine çok daha hızlı ulaş.',
    icon: '📊',
  },
];

export default function Onboarding() {
  const [step, setStep] = useState(0);
  const [selectedRole, setSelectedRole] = useState<'user' | 'dietitian'>('user');
  const [loading, setLoading] = useState(false);
  const { session, refreshProfile } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

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
          display_name: meta.full_name || meta.name || meta.display_name || base || 'Yeni Kullanıcı',
          avatar_url: meta.avatar_url || meta.picture || null,
          ...patch,
        });
        if (insertError) throw insertError;
      }

      await refreshProfile();
      router.replace('/(tabs)');
    } catch (err: any) {
      console.error('Onboarding update error:', err);
      alert(`Bir hata oluştu: ${err?.message ?? 'bilinmeyen hata'}`);
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
            <Text style={styles.buttonText}>Devam Et</Text>
          </TouchableOpacity>
        </Animated.View>
      ) : (
        <Animated.View entering={SlideInRight.duration(400)} style={styles.slide}>
          <Text style={styles.icon}>🎯</Text>
          <Text style={styles.title}>Sen Kimsin?</Text>
          <Text style={styles.description}>
            Lütfen uygulamayı hangi amaçla kullanacağını seç. Rolüne göre farklı özellikler açılacaktır.
          </Text>

          <View style={styles.roleContainer}>
            <TouchableOpacity
              style={[styles.roleCard, selectedRole === 'user' && styles.roleCardActive]}
              onPress={() => setSelectedRole('user')}
            >
              <Text style={styles.roleIcon}>💪</Text>
              <Text style={styles.roleTitle}>Kullanıcı</Text>
              <Text style={styles.roleDesc}>Antrenman ve beslenmemi takip etmek istiyorum.</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.roleCard, selectedRole === 'dietitian' && styles.roleCardActive]}
              onPress={() => setSelectedRole('dietitian')}
            >
              <Text style={styles.roleIcon}>🩺</Text>
              <Text style={styles.roleTitle}>Diyetisyen</Text>
              <Text style={styles.roleDesc}>Danışanlarımı takip edip planlar oluşturmak istiyorum.</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={[styles.button, { bottom: insets.bottom + 48 }, loading && styles.buttonDisabled]} onPress={handleFinish} disabled={loading}>
            <Text style={styles.buttonText}>{loading ? 'Bekleniyor...' : 'Başla'}</Text>
          </TouchableOpacity>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
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
