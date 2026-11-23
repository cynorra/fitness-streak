import { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../lib/auth';
import { supabase } from '../../lib/supabase';
import { useTranslation } from '../../lib/i18n/i18n';
import { friendlyError } from '../../lib/useOnline';
import AmbientBackground from '../../components/AmbientBackground';

type Row = { id: string; weekday: number; start_time: string; end_time: string; slot_minutes: number };
const DAYS = [1, 2, 3, 4, 5, 6, 0]; // Monday first; 0 = Sunday (matches the SQL weekday)
const hhmm = (v: string) => v.slice(0, 5);
const validTime = (v: string) => /^([01]\d|2[0-3]):[0-5]\d$/.test(v);

export default function Availability() {
  const { profile } = useAuth();
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [weekday, setWeekday] = useState(1);
  const [start, setStart] = useState('09:00');
  const [end, setEnd] = useState('17:00');
  const [mins, setMins] = useState('45');
  const [tz, setTz] = useState<string>('');

  const load = useCallback(async () => {
    if (!profile) return;
    const [a, d] = await Promise.all([
      supabase.from('dietitian_availability').select('id, weekday, start_time, end_time, slot_minutes').eq('dietitian_id', profile.id).order('weekday').order('start_time'),
      supabase.from('dietitian_profiles').select('timezone').eq('id', profile.id).maybeSingle(),
    ]);
    setRows((a.data || []) as Row[]);
    setTz(d.data?.timezone || '');
    setLoading(false);
  }, [profile]);

  useEffect(() => {
    load();
  }, [load]);

  const add = async () => {
    if (!profile) return;
    const m = parseInt(mins, 10);
    if (!validTime(start) || !validTime(end) || end <= start || !(m >= 15 && m <= 180)) {
      Alert.alert(t('common.error'), t('platform.avail_invalid'));
      return;
    }
    const { error } = await supabase.from('dietitian_availability').insert({
      dietitian_id: profile.id, weekday, start_time: start, end_time: end, slot_minutes: m,
    });
    if (error) {
      Alert.alert(t('common.error'), friendlyError(error.message, t));
      return;
    }
    load();
  };

  const remove = async (id: string) => {
    await supabase.from('dietitian_availability').delete().eq('id', id);
    load();
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <AmbientBackground />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>{t('platform.avail_title')}</Text>
      </View>
      {loading ? (
        <ActivityIndicator color="#10b981" style={{ marginTop: 40 }} />
      ) : (
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 40 }} keyboardShouldPersistTaps="handled">
          <Text style={styles.note}>{t('platform.avail_tz', { tz: tz || '-' })}</Text>

          <View style={styles.dayRow}>
            {DAYS.map((d) => (
              <TouchableOpacity key={d} style={[styles.day, weekday === d && styles.dayActive]} onPress={() => setWeekday(d)}>
                <Text style={[styles.dayText, weekday === d && { color: '#fff' }]}>{t(`platform.day_${d}`)}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.formRow}>
            <TextInput style={styles.input} value={start} onChangeText={setStart} placeholder="09:00" placeholderTextColor="#666" maxLength={5} />
            <TextInput style={styles.input} value={end} onChangeText={setEnd} placeholder="17:00" placeholderTextColor="#666" maxLength={5} />
            <TextInput style={styles.input} value={mins} onChangeText={setMins} placeholder="45" placeholderTextColor="#666" keyboardType="number-pad" maxLength={3} />
          </View>
          <Text style={styles.note}>{t('platform.avail_hint')}</Text>
          <TouchableOpacity style={styles.addBtn} onPress={add}>
            <Text style={styles.addText}>{t('platform.avail_add')}</Text>
          </TouchableOpacity>

          {rows.length === 0 && <Text style={styles.note}>{t('platform.avail_empty')}</Text>}
          {rows.map((r) => (
            <View key={r.id} style={styles.card}>
              <Text style={styles.cardText}>
                {t(`platform.day_${r.weekday}`)}  {hhmm(r.start_time)} - {hhmm(r.end_time)}  ({r.slot_minutes} min)
              </Text>
              <TouchableOpacity onPress={() => remove(r.id)} style={styles.del}>
                <Ionicons name="trash-outline" size={18} color="#ef4444" />
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050607' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingBottom: 8 },
  backBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  title: { color: '#fff', fontSize: 18, fontWeight: '900' },
  note: { color: '#71717a', fontSize: 12, marginVertical: 8 },
  dayRow: { flexDirection: 'row', gap: 6, marginTop: 8 },
  day: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.06)' },
  dayActive: { backgroundColor: '#10b981' },
  dayText: { color: '#a1a1aa', fontWeight: '800', fontSize: 12 },
  formRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  input: { flex: 1, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.09)', borderRadius: 12, padding: 12, color: '#fff', textAlign: 'center' },
  addBtn: { backgroundColor: '#10b981', borderRadius: 12, paddingVertical: 13, alignItems: 'center', marginBottom: 16 },
  addText: { color: '#fff', fontWeight: '900' },
  card: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 14, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.09)' },
  cardText: { color: '#fff', fontWeight: '700' },
  del: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
});
