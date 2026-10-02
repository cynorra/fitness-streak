import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';
import { useRouter } from 'expo-router';
import { format, parseISO } from 'date-fns';
import { getDateLocale } from '../lib/i18n/dateUtils';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTranslation } from '../lib/i18n/i18n';
import AmbientBackground from '../components/AmbientBackground';
import { Ionicons } from '@expo/vector-icons';

export default function Measurements() {
  const { profile } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t, locale } = useTranslation();
  
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
      Alert.alert(t('common.error'), t('measurements.fill_weight'));
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
      Alert.alert(t('common.error'), t('measurements.save_failed'));
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
      <AmbientBackground />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>{t('measurements.title')}</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.formCard}>
          <Text style={styles.sectionTitle}>{t('measurements.new')} ({format(new Date(), 'dd MMM', { locale: getDateLocale(locale) })})</Text>

          <View style={styles.row}>
            <TextInput style={[styles.input, styles.flex1]} placeholder={t('measurements.weight')} placeholderTextColor="#666" keyboardType="numeric" value={weight} onChangeText={setWeight} />
            <TextInput style={[styles.input, styles.flex1]} placeholder={t('measurements.waist')} placeholderTextColor="#666" keyboardType="numeric" value={waist} onChangeText={setWaist} />
          </View>
          <View style={styles.row}>
            <TextInput style={[styles.input, styles.flex1]} placeholder={t('measurements.hips')} placeholderTextColor="#666" keyboardType="numeric" value={hips} onChangeText={setHips} />
            <TextInput style={[styles.input, styles.flex1]} placeholder={t('measurements.neck')} placeholderTextColor="#666" keyboardType="numeric" value={neck} onChangeText={setNeck} />
          </View>
          <View style={styles.row}>
            <TextInput style={[styles.input, styles.flex1]} placeholder={t('measurements.fat')} placeholderTextColor="#666" keyboardType="numeric" value={fat} onChangeText={setFat} />
          </View>

          <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={loading}>
            <Text style={styles.saveBtnText}>{loading ? t('measurements.saving') : t('measurements.save')}</Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.sectionTitle, { marginTop: 24, marginBottom: 16 }]}>{t('measurements.history')}</Text>
        {logs.length === 0 && <Text style={styles.emptyText}>{t('measurements.empty')}</Text>}
        {logs.map((log, index) => (
          <Animated.View key={log.id} entering={FadeInDown.delay(index * 100).springify()} style={styles.logCard}>
            <View style={styles.logHeader}>
              <Text style={styles.logDate}>{format(parseISO(log.date), 'dd MMM yyyy', { locale: getDateLocale(locale) })}</Text>
              <Text style={styles.logWeight}>{log.weight_kg} kg</Text>
            </View>
            <View style={styles.macrosRow}>
              {log.waist_cm && <Text style={styles.macroText}>{t('measurements.waist_l')}: {log.waist_cm}cm</Text>}
              {log.hips_cm && <Text style={styles.macroText}>{t('measurements.hips_l')}: {log.hips_cm}cm</Text>}
              {log.body_fat_percentage && <Text style={styles.macroText}>{t('measurements.fat_l')}: %{log.body_fat_percentage}</Text>}
            </View>
          </Animated.View>
        ))}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050607' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 20 },
  backBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'flex-start' },
  backText: { color: '#fff', fontSize: 28 },
  title: { color: '#fff', fontSize: 18, fontWeight: '900', letterSpacing: 1 },
  content: { padding: 20, paddingBottom: 100 },
  formCard: { backgroundColor: 'rgba(255,255,255,0.05)', padding: 20, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.09)' },
  sectionTitle: { color: '#fff', fontSize: 16, fontWeight: '800', marginBottom: 16 },
  row: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  input: { backgroundColor: '#0a0a0a', borderWidth: 1, borderColor: 'rgba(255,255,255,0.09)', borderRadius: 12, padding: 16, color: '#fff' },
  flex1: { flex: 1 },
  saveBtn: { backgroundColor: '#10b981', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  saveBtnText: { color: '#fff', fontSize: 14, fontWeight: '900', letterSpacing: 1 },
  emptyText: { color: '#666', textAlign: 'center', marginTop: 24 },
  logCard: { backgroundColor: 'rgba(255,255,255,0.05)', padding: 16, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.09)' },
  logHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  logDate: { color: '#888', fontSize: 12, fontWeight: '800', letterSpacing: 1 },
  logWeight: { color: '#10b981', fontSize: 18, fontWeight: '900' },
  macrosRow: { flexDirection: 'row', gap: 16, flexWrap: 'wrap' },
  macroText: { color: '#aaa', fontSize: 12, fontWeight: '700' }
});
