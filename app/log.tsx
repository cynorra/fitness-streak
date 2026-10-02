import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase, WORKOUT_TYPES } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { loadInterstitialAd, showInterstitialAd } from '../lib/admob';
import { useEffect } from 'react';
import { useTranslation } from '../lib/i18n/i18n';
import { markWorkoutLoggedToday } from '../lib/notifications';
import { isNetworkError } from '../lib/useOnline';
import AppIcon from '../components/AppIcon';

export default function LogWorkout() {
  const { profile, refreshProfile } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t, locale } = useTranslation();
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [duration, setDuration] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadInterstitialAd();
  }, []);

  const submit = async () => {
    if (!selectedType) {
      Alert.alert(t('log.missing'), t('log.pick_type'));
      return;
    }
    const minutes = parseInt(duration);
    if (!minutes || minutes < 1 || minutes > 600) {
      Alert.alert(t('log.missing'), t('log.pick_duration'));
      return;
    }
    if (!profile) return;

    setLoading(true);
    const typeLabel = selectedType;

    const { error } = await supabase.from('workouts').insert({
      user_id: profile.id,
      workout_type: typeLabel,
      duration_minutes: minutes,
      note: note || null,
      logical_date: new Date().toISOString().split('T')[0], // trigger düzeltecek
    });

    setLoading(false);

    if (error) {
      Alert.alert(t('common.error'), isNetworkError(error.message) ? t('net.offline_msg') : error.message);
      return;
    }

    markWorkoutLoggedToday().catch(() => {});
    await refreshProfile();
    setSelectedType(null);
    setDuration('');
    setNote('');

    // AdMob Interstitial Reklam Göster
    showInterstitialAd();

    Alert.alert(t('common.success'), t('log.saved'), [
      { text: t('log.ok'), onPress: () => router.push('/') },
    ]);
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 32 }]}>
      <View style={styles.header}>
        <View style={styles.logoRow}>
          <View style={{flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1}}>
            <View style={styles.logoBox}>
              <Text style={styles.logoLetter}>S</Text>
            </View>
            <Text style={styles.logoText}>STREAK<Text style={{color: '#10b981'}}>FIT</Text></Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/messages' as any)} style={styles.msgBtn}>
            <AppIcon name="paper-plane-outline" color="#10b981" size={20} bare />
          </TouchableOpacity>
        </View>
        <Text style={styles.title}>{t('log.title')}</Text>
        <Text style={styles.subtitle}>{t('log.subtitle')}</Text>
      </View>

      <View style={styles.typeGrid}>
        {WORKOUT_TYPES.map(wt => (
          <TouchableOpacity
            key={wt.id}
            style={[
              styles.typeCard,
              selectedType === wt.id && styles.typeCardSelected,
            ]}
            onPress={() => setSelectedType(wt.id)}
          >
            <Text style={styles.typeEmoji}>{wt.emoji}</Text>
            <Text style={[
              styles.typeLabel,
              selectedType === wt.id && styles.typeLabelSelected,
            ]}>{t(`workoutTypes.${wt.id}`)}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>{t('log.duration')}</Text>
      <TextInput
        style={styles.input}
        placeholder="30"
        placeholderTextColor="#666"
        value={duration}
        onChangeText={setDuration}
        keyboardType="number-pad"
      />

      <Text style={styles.label}>{t('log.note')}</Text>
      <TextInput
        style={[styles.input, styles.textarea]}
        placeholder={t('log.note_placeholder')}
        placeholderTextColor="#666"
        value={note}
        onChangeText={setNote}
        multiline
        numberOfLines={3}
      />

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={submit}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? '...' : t('log.grow')}
        </Text>
      </TouchableOpacity>
    </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  content: { padding: 24 },
  header: { gap: 12, marginBottom: 32 },
  logoRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  msgBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#111', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#222' },
  msgIcon: { fontSize: 20 },
  logoBox: { width: 32, height: 32, backgroundColor: '#10b981', borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  logoLetter: { color: '#fff', fontWeight: '900', fontSize: 18 },
  logoText: { color: '#fff', fontSize: 24, fontWeight: '900', letterSpacing: -1.5 },
  title: { color: '#fff', fontSize: 32, fontWeight: '900', letterSpacing: -1.5 },
  subtitle: { color: '#666', fontSize: 10, fontWeight: '900', letterSpacing: 3, textTransform: 'uppercase' },
  typeGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24,
  },
  typeCard: {
    width: '23.5%', aspectRatio: 1, backgroundColor: '#1a1a1a',
    borderRadius: 12, justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: '#2a2a2a',
  },
  typeCardSelected: { backgroundColor: '#10b981', borderColor: '#10b981' },
  typeEmoji: { fontSize: 28 },
  typeLabel: { color: '#888', fontSize: 10, marginTop: 4, textAlign: 'center' },
  typeLabelSelected: { color: '#fff', fontWeight: '700' },
  label: {
    color: '#888', fontSize: 11, fontWeight: '700',
    letterSpacing: 1.5, marginBottom: 8, marginTop: 8,
  },
  input: {
    backgroundColor: '#1a1a1a', borderWidth: 1, borderColor: '#2a2a2a',
    borderRadius: 12, padding: 16, color: '#fff', fontSize: 16,
    marginBottom: 16,
  },
  textarea: { minHeight: 80, textAlignVertical: 'top' },
  button: {
    backgroundColor: '#10b981', padding: 20, borderRadius: 12,
    alignItems: 'center', marginTop: 16,
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: {
    color: '#fff', fontSize: 16, fontWeight: '900', letterSpacing: 1.5,
  },
});
