import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import GlassCard from '../components/GlassCard';
import {
  getNotificationSettings,
  saveNotificationSettings,
  sendInstantTestNotification,
  NotificationSettings,
} from '../lib/notifications';

const TIME_OPTIONS = [
  { label: '18:00', hour: 18, minute: 0 },
  { label: '19:00', hour: 19, minute: 0 },
  { label: '20:00', hour: 20, minute: 0 },
  { label: '21:00', hour: 21, minute: 0 },
  { label: '22:00', hour: 22, minute: 0 },
];

export default function NotificationSettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState<boolean>(true);
  const [testing, setTesting] = useState<boolean>(false);
  const [settings, setSettings] = useState<NotificationSettings>({
    streakEnabled: true,
    streakHour: 20,
    streakMinute: 0,
    waterEnabled: true,
    motivationEnabled: true,
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    const stored = await getNotificationSettings();
    setSettings(stored);
    setLoading(false);
  };

  const updateSetting = async (updated: Partial<NotificationSettings>) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newSettings = { ...settings, ...updated };
    setSettings(newSettings);
    await saveNotificationSettings(newSettings);
  };

  const handleSendTest = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setTesting(true);
    const success = await sendInstantTestNotification();
    setTesting(false);
    if (success) {
      Alert.alert(
        '⚡ Test Bildirimi Kuruldu!',
        'Uygulamayı hemen arkaplana alın veya telefon ekranınızı kilitleyin. Bildirim 2 saniye içinde kilit ekranınıza düşecektir.'
      );
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingCenter]}>
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#064e3b20', '#0a0a0a', '#0a0a0a']}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.back();
          }}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>BİLDİRİM & HATIRLATICI</Text>
          <Text style={styles.headerSubtitle}>Uygulama kapalıyken bile serini koru</Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
      >
        {/* Instant Test Banner Card */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)}>
          <GlassCard style={styles.testCard}>
            <View style={styles.testIconContainer}>
              <Text style={{ fontSize: 28 }}>⚡</Text>
            </View>
            <Text style={styles.testTitle}>Zamanlanmış Bildirim Testi</Text>
            <Text style={styles.testDesc}>
              Uygulama kapalıyken bildirimlerin çalışıp çalışmadığını hemen test edin.
            </Text>
            <TouchableOpacity
              style={[styles.testBtn, testing && { opacity: 0.6 }]}
              onPress={handleSendTest}
              disabled={testing}
            >
              <LinearGradient
                colors={['#10b981', '#059669']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.testBtnGradient}
              >
                <Ionicons name="notifications" size={18} color="#fff" />
                <Text style={styles.testBtnText}>
                  {testing ? 'Hazırlanıyor...' : '⚡ Test Bildirimi Gönder (2 sn)'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </GlassCard>
        </Animated.View>

        {/* 1. Daily Streak & Workout Reminder */}
        <Animated.View entering={FadeInDown.delay(200).duration(400)}>
          <View style={styles.sectionHeader}>
            <Ionicons name="flame" size={18} color="#f59e0b" />
            <Text style={styles.sectionTitle}>GÜNLÜK STREAK & ANTRENMAN</Text>
          </View>
          <GlassCard style={styles.settingCard}>
            <View style={styles.row}>
              <View style={styles.rowTextCol}>
                <Text style={styles.settingLabel}>Günlük Seri Hatırlatıcısı</Text>
                <Text style={styles.settingSub}>
                  Antrenmanını ve günlük aktiviteni kaydetmediğinde akşam vakti uyarır.
                </Text>
              </View>
              <Switch
                value={settings.streakEnabled}
                onValueChange={(val) => updateSetting({ streakEnabled: val })}
                trackColor={{ false: '#333', true: '#10b981' }}
                thumbColor="#fff"
              />
            </View>

            {settings.streakEnabled && (
              <View style={styles.timePickerContainer}>
                <Text style={styles.timePickerLabel}>HATIRLATMA SAATİ SEÇİN:</Text>
                <View style={styles.timeChipsRow}>
                  {TIME_OPTIONS.map((opt) => {
                    const isSelected =
                      settings.streakHour === opt.hour && settings.streakMinute === opt.minute;
                    return (
                      <TouchableOpacity
                        key={opt.label}
                        style={[styles.timeChip, isSelected && styles.timeChipSelected]}
                        onPress={() =>
                          updateSetting({ streakHour: opt.hour, streakMinute: opt.minute })
                        }
                      >
                        <Text
                          style={[styles.timeChipText, isSelected && styles.timeChipTextSelected]}
                        >
                          {opt.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}
          </GlassCard>
        </Animated.View>

        {/* 2. Water Hydration Reminders */}
        <Animated.View entering={FadeInDown.delay(300).duration(400)}>
          <View style={styles.sectionHeader}>
            <Ionicons name="water" size={18} color="#3b82f6" />
            <Text style={styles.sectionTitle}>SU TAKİBİ & HİDRASYON</Text>
          </View>
          <GlassCard style={styles.settingCard}>
            <View style={styles.row}>
              <View style={styles.rowTextCol}>
                <Text style={styles.settingLabel}>Gün İçi Su Hatırlatıcıları</Text>
                <Text style={styles.settingSub}>
                  Günde 4 kez (10:00, 14:00, 18:00, 21:00) su içmeni ve kaydetmeni hatırlatır.
                </Text>
              </View>
              <Switch
                value={settings.waterEnabled}
                onValueChange={(val) => updateSetting({ waterEnabled: val })}
                trackColor={{ false: '#333', true: '#3b82f6' }}
                thumbColor="#fff"
              />
            </View>
          </GlassCard>
        </Animated.View>

        {/* 3. Daily Motivation Push */}
        <Animated.View entering={FadeInDown.delay(400).duration(400)}>
          <View style={styles.sectionHeader}>
            <Ionicons name="flash" size={18} color="#ec4899" />
            <Text style={styles.sectionTitle}>GÜNLÜK MOTİVASYON</Text>
          </View>
          <GlassCard style={styles.settingCard}>
            <View style={styles.row}>
              <View style={styles.rowTextCol}>
                <Text style={styles.settingLabel}>Günlük Motivasyon Mesajları</Text>
                <Text style={styles.settingSub}>
                  Sabah (08:30), öğle (12:30) ve mesai sonrası (18:30) modunu yükseltecek ilham verici spor sözleri.
                </Text>
              </View>
              <Switch
                value={settings.motivationEnabled}
                onValueChange={(val) => updateSetting({ motivationEnabled: val })}
                trackColor={{ false: '#333', true: '#ec4899' }}
                thumbColor="#fff"
              />
            </View>
          </GlassCard>
        </Animated.View>

        {/* How it works info card */}
        <Animated.View entering={FadeInUp.delay(500).duration(400)}>
          <View style={styles.infoBox}>
            <Ionicons name="information-circle-outline" size={20} color="#888" />
            <Text style={styles.infoText}>
              Zamanlanmış bildirimler mobil cihazınızın işletim sistemi (iOS/Android) arkaplan
              zamanlayıcısı tarafından yönetilir. Uygulamayı tamamen kapatsanız bile bildirimler
              vaktinde kilit ekranınıza ulaşır.
            </Text>
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  loadingCenter: { justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
    gap: 16,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: { color: '#fff', fontSize: 16, fontWeight: '900', letterSpacing: 1.5 },
  headerSubtitle: { color: '#888', fontSize: 12, marginTop: 2 },
  content: { padding: 20 },

  testCard: {
    padding: 20,
    borderRadius: 20,
    marginBottom: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#10b98140',
  },
  testIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#10b98120',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  testTitle: { color: '#fff', fontSize: 16, fontWeight: '900', marginBottom: 6 },
  testDesc: { color: '#aaa', fontSize: 12, textAlign: 'center', lineHeight: 18, marginBottom: 16 },
  testBtn: { width: '100%', borderRadius: 14, overflow: 'hidden' },
  testBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  testBtnText: { color: '#fff', fontSize: 14, fontWeight: '800' },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    marginBottom: 10,
  },
  sectionTitle: { color: '#888', fontSize: 11, fontWeight: '900', letterSpacing: 1.5 },

  settingCard: {
    padding: 16,
    borderRadius: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#222',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  rowTextCol: { flex: 1 },
  settingLabel: { color: '#fff', fontSize: 15, fontWeight: '800' },
  settingSub: { color: '#888', fontSize: 12, marginTop: 4, lineHeight: 16 },

  timePickerContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#222',
  },
  timePickerLabel: { color: '#666', fontSize: 10, fontWeight: '900', letterSpacing: 1, marginBottom: 10 },
  timeChipsRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  timeChip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  timeChipSelected: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  timeChipText: { color: '#888', fontSize: 13, fontWeight: '800' },
  timeChipTextSelected: { color: '#fff' },

  infoBox: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: '#111',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#222',
    marginTop: 8,
  },
  infoText: { flex: 1, color: '#666', fontSize: 12, lineHeight: 18 },
});
