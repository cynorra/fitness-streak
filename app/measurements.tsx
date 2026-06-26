import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';
import { useRouter } from 'expo-router';
import { format, parseISO } from 'date-fns';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';

export default function Measurements() {
  const { profile } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const [weight, setWeight] = useState('');
  const [waist, setWaist] = useState('');
  const [hips, setHips] = useState('');
  const [neck, setNeck] = useState('');
  const [fat, setFat] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<any[]>([]);

  const todayStr = format(new Date(), 'yyyy-MM-dd');

  const loadLogs = async () => {
    if (!profile) return;
    const { data } = await supabase
      .from('body_measurements')
      .select('*')
      .eq('user_id', profile.id)
      .order('date', { ascending: false });
    
    if (data) setLogs(data);
  };

  useEffect(() => {
    loadLogs();
  }, [profile]);

  const handleSave = async () => {
    if (!weight) {
      Alert.alert('Hata', 'Lütfen en azından kilo bilgisini doldurun.');
      return;
    }

    setLoading(true);
    const { error } = await supabase.from('body_measurements').insert({
      user_id: profile?.id,
      date: todayStr,
      weight_kg: parseFloat(weight) || 0,
      waist_cm: parseFloat(waist) || null,
      hips_cm: parseFloat(hips) || null,
      neck_cm: parseFloat(neck) || null,
      body_fat_percentage: parseFloat(fat) || null,
    });

    setLoading(false);

    if (error) {
      Alert.alert('Hata', 'Kaydedilemedi. Lütfen tekrar dene.');
    } else {
      setWeight('');
      setWaist('');
      setHips('');
      setNeck('');
      setFat('');
      loadLogs();
    }
  };

  return (
    <KeyboardAvoidingView style={[styles.container, { paddingTop: insets.top }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Vücut Ölçüleri</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.formCard}>
          <Text style={styles.sectionTitle}>Yeni Ölçüm Ekle ({format(new Date(), 'dd MMM')})</Text>

          <View style={styles.row}>
            <TextInput style={[styles.input, styles.flex1]} placeholder="Kilo (kg)*" placeholderTextColor="#666" keyboardType="numeric" value={weight} onChangeText={setWeight} />
            <TextInput style={[styles.input, styles.flex1]} placeholder="Bel (cm)" placeholderTextColor="#666" keyboardType="numeric" value={waist} onChangeText={setWaist} />
          </View>
          <View style={styles.row}>
            <TextInput style={[styles.input, styles.flex1]} placeholder="Kalça (cm)" placeholderTextColor="#666" keyboardType="numeric" value={hips} onChangeText={setHips} />
            <TextInput style={[styles.input, styles.flex1]} placeholder="Boyun (cm)" placeholderTextColor="#666" keyboardType="numeric" value={neck} onChangeText={setNeck} />
          </View>
          <View style={styles.row}>
            <TextInput style={[styles.input, styles.flex1]} placeholder="Yağ Oranı (%)" placeholderTextColor="#666" keyboardType="numeric" value={fat} onChangeText={setFat} />
          </View>

          <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={loading}>
            <Text style={styles.saveBtnText}>{loading ? 'Kaydediliyor...' : 'Ölçümü Kaydet'}</Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.sectionTitle, { marginTop: 24, marginBottom: 16 }]}>Geçmiş Ölçümler</Text>
        {logs.length === 0 && <Text style={styles.emptyText}>Henüz ölçüm bulunmuyor.</Text>}
        {logs.map((log, index) => (
          <Animated.View key={log.id} entering={FadeInDown.delay(index * 100).springify()} style={styles.logCard}>
            <View style={styles.logHeader}>
              <Text style={styles.logDate}>{format(parseISO(log.date), 'dd MMM yyyy')}</Text>
              <Text style={styles.logWeight}>{log.weight_kg} kg</Text>
            </View>
            <View style={styles.macrosRow}>
              {log.waist_cm && <Text style={styles.macroText}>Bel: {log.waist_cm}cm</Text>}
              {log.hips_cm && <Text style={styles.macroText}>Kalça: {log.hips_cm}cm</Text>}
              {log.body_fat_percentage && <Text style={styles.macroText}>Yağ: %{log.body_fat_percentage}</Text>}
            </View>
          </Animated.View>
        ))}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 20 },
  backBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'flex-start' },
  backText: { color: '#fff', fontSize: 28 },
  title: { color: '#fff', fontSize: 18, fontWeight: '900', letterSpacing: 1 },
  content: { padding: 20, paddingBottom: 100 },
  formCard: { backgroundColor: '#111', padding: 20, borderRadius: 20, borderWidth: 1, borderColor: '#222' },
  sectionTitle: { color: '#fff', fontSize: 16, fontWeight: '800', marginBottom: 16 },
  row: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  input: { backgroundColor: '#0a0a0a', borderWidth: 1, borderColor: '#222', borderRadius: 12, padding: 16, color: '#fff' },
  flex1: { flex: 1 },
  saveBtn: { backgroundColor: '#10b981', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  saveBtnText: { color: '#fff', fontSize: 14, fontWeight: '900', letterSpacing: 1 },
  emptyText: { color: '#666', textAlign: 'center', marginTop: 24 },
  logCard: { backgroundColor: '#111', padding: 16, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: '#222' },
  logHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  logDate: { color: '#888', fontSize: 12, fontWeight: '800', letterSpacing: 1 },
  logWeight: { color: '#10b981', fontSize: 18, fontWeight: '900' },
  macrosRow: { flexDirection: 'row', gap: 16, flexWrap: 'wrap' },
  macroText: { color: '#aaa', fontSize: 12, fontWeight: '700' }
});
