import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase, WORKOUT_TYPES } from '../../lib/supabase';
import { useAuth } from '../../lib/auth';

export default function LogWorkout() {
  const { profile, refreshProfile } = useAuth();
  const router = useRouter();
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [duration, setDuration] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!selectedType) {
      Alert.alert('Eksik', 'Bir antrenman tipi seç');
      return;
    }
    const minutes = parseInt(duration);
    if (!minutes || minutes < 1 || minutes > 600) {
      Alert.alert('Eksik', 'Geçerli bir süre gir (dakika)');
      return;
    }
    if (!profile) return;

    setLoading(true);
    const typeLabel = WORKOUT_TYPES.find(t => t.id === selectedType)?.label || selectedType;

    const { error } = await supabase.from('workouts').insert({
      user_id: profile.id,
      workout_type: typeLabel,
      duration_minutes: minutes,
      note: note || null,
      logical_date: new Date().toISOString().split('T')[0], // trigger düzeltecek
    });

    setLoading(false);

    if (error) {
      Alert.alert('Hata', error.message);
      return;
    }

    await refreshProfile();
    setSelectedType(null);
    setDuration('');
    setNote('');
    Alert.alert('🔥', 'Antrenman kaydedildi! Streak güncellendi.', [
      { text: 'Tamam', onPress: () => router.push('/') },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Antrenman Logla</Text>
      <Text style={styles.subtitle}>Ne yaptın bugün?</Text>

      <View style={styles.typeGrid}>
        {WORKOUT_TYPES.map(t => (
          <TouchableOpacity
            key={t.id}
            style={[
              styles.typeCard,
              selectedType === t.id && styles.typeCardSelected,
            ]}
            onPress={() => setSelectedType(t.id)}
          >
            <Text style={styles.typeEmoji}>{t.emoji}</Text>
            <Text style={[
              styles.typeLabel,
              selectedType === t.id && styles.typeLabelSelected,
            ]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Süre (dakika)</Text>
      <TextInput
        style={styles.input}
        placeholder="30"
        placeholderTextColor="#666"
        value={duration}
        onChangeText={setDuration}
        keyboardType="number-pad"
      />

      <Text style={styles.label}>Not (opsiyonel)</Text>
      <TextInput
        style={[styles.input, styles.textarea]}
        placeholder="Bugün kendimi iyi hissettim..."
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
          {loading ? '...' : '🔥 STREAK\'I BÜYÜT'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  content: { padding: 24, paddingTop: 60 },
  title: { color: '#fff', fontSize: 28, fontWeight: '900', letterSpacing: -1 },
  subtitle: { color: '#888', fontSize: 14, marginTop: 4, marginBottom: 24 },
  typeGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24,
  },
  typeCard: {
    width: '23.5%', aspectRatio: 1, backgroundColor: '#1a1a1a',
    borderRadius: 12, justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: '#2a2a2a',
  },
  typeCardSelected: { backgroundColor: '#ff6b35', borderColor: '#ff6b35' },
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
    backgroundColor: '#ff6b35', padding: 20, borderRadius: 12,
    alignItems: 'center', marginTop: 16,
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: {
    color: '#fff', fontSize: 16, fontWeight: '900', letterSpacing: 1.5,
  },
});
