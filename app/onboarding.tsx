import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import Animated, { FadeInDown, FadeInUp, SlideInRight } from 'react-native-reanimated';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

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
      const { error } = await supabase
        .from('profiles')
        .update({ 
          role: selectedRole, 
          onboarding_completed: true 
        })
        .eq('id', session.user.id);
      
      if (error) throw error;
      await refreshProfile();
      router.replace('/(tabs)');
    } catch (err: any) {
      console.error('Onboarding update error:', err);
      alert('Bir hata oluştu. Lütfen tekrar dene.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {step < SLIDES.length ? (
        <Animated.View key={step} entering={SlideInRight.duration(400)} style={styles.slide}>
          <Text style={styles.icon}>{SLIDES[step].icon}</Text>
          <Animated.Text entering={FadeInDown.delay(200)} style={styles.title}>
            {SLIDES[step].title}
          </Animated.Text>
          <Animated.Text entering={FadeInUp.delay(300)} style={styles.description}>
            {SLIDES[step].description}
          </Animated.Text>
          
          <TouchableOpacity style={styles.button} onPress={handleNext}>
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

          <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]} onPress={handleFinish} disabled={loading}>
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
    bottom: 48,
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
