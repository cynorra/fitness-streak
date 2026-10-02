import { useCallback, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput,
  KeyboardAvoidingView, Platform, Alert, ActivityIndicator, RefreshControl,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { addDays, format, subDays } from 'date-fns';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../lib/auth';
import { supabase } from '../../lib/supabase';
import { useTranslation } from '../../lib/i18n/i18n';
import { getDateLocale } from '../../lib/i18n/dateUtils';
import { friendlyError } from '../../lib/useOnline';
import AmbientBackground from '../../components/AmbientBackground';

type MealLog = {
  id: string;
  meal_type: string;
  content: string;
  calories: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
};

const QUICK_REACTIONS = ['👍', '🔥', '🥗', '💧', '⚠️', '👏'];

type Feedback = { id: string; log_id: string; message: string; created_at: string };

export default function ClientMeals() {
  const { clientId, name } = useLocalSearchParams<{ clientId?: string; name?: string }>();
  const { profile } = useAuth();
  const { t, locale } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [day, setDay] = useState(new Date());
  const [logs, setLogs] = useState<MealLog[]>([]);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [weekAvg, setWeekAvg] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [failed, setFailed] = useState(false);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [sendingId, setSendingId] = useState<string | null>(null);

  const dayStr = format(day, 'yyyy-MM-dd');
  const isToday = dayStr === format(new Date(), 'yyyy-MM-dd');

  const load = useCallback(async () => {
    if (!clientId) return;
    const weekStart = format(subDays(day, 6), 'yyyy-MM-dd');

    const [dayRes, weekRes] = await Promise.all([
      supabase
        .from('daily_nutrition_logs')
        .select('id, meal_type, content, calories, protein_g, carbs_g, fat_g')
        .eq('user_id', clientId)
        .eq('log_date', dayStr)
        .order('created_at', { ascending: true }),
      supabase
        .from('daily_nutrition_logs')
        .select('log_date, calories')
        .eq('user_id', clientId)
        .gte('log_date', weekStart)
        .lte('log_date', dayStr),
    ]);

    if (dayRes.error || weekRes.error) {
      setFailed(true);
      setLoading(false);
      return;
    }
    setFailed(false);

    const dayLogs = (dayRes.data || []) as MealLog[];
    setLogs(dayLogs);

    // Average over the days that actually have entries, so a skipped day does not drag the number down.
    const perDay = new Map<string, number>();
    (weekRes.data || []).forEach((r: any) => perDay.set(r.log_date, (perDay.get(r.log_date) || 0) + (r.calories || 0)));
    setWeekAvg(perDay.size ? Math.round([...perDay.values()].reduce((a, b) => a + b, 0) / perDay.size) : null);

    if (dayLogs.length) {
      const { data: fb } = await supabase
        .from('meal_feedback')
        .select('id, log_id, message, created_at')
        .in('log_id', dayLogs.map((l) => l.id))
        .order('created_at', { ascending: true });
      setFeedback((fb || []) as Feedback[]);
    } else {
      setFeedback([]);
    }
    setLoading(false);
  }, [clientId, dayStr]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const sendRecommendation = async (log: MealLog, quick?: string) => {
    const message = (quick ?? drafts[log.id] ?? '').trim();
    if (!message || !profile || !clientId) return;
    setSendingId(log.id);
    const { error } = await supabase.from('meal_feedback').insert({
      log_id: log.id,
      dietitian_id: profile.id,
      client_id: clientId,
      message,
    });
    setSendingId(null);
    if (error) {
      Alert.alert(t('common.error'), friendlyError(error.message, t) || t('dietitianCare.rec_failed'));
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (quick === undefined) setDrafts((d) => ({ ...d, [log.id]: '' }));
    load();
  };

  const sum = (key: 'calories' | 'protein_g' | 'carbs_g' | 'fat_g') =>
    Math.round(logs.reduce((acc, l) => acc + (Number(l[key]) || 0), 0));

  return (
    <KeyboardAvoidingView style={[styles.container, { paddingTop: insets.top }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <AmbientBackground />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{t('dietitianCare.cm_title')}</Text>
          <Text style={styles.subtitle} numberOfLines={1}>{name}</Text>
        </View>
      </View>

      <View style={styles.dateRow}>
        <TouchableOpacity onPress={() => setDay((d) => subDays(d, 1))} style={styles.iconBtn}>
          <Ionicons name="chevron-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.dateText}>
          {isToday ? t('dietitianCare.today') + ' · ' : ''}
          {format(day, 'd MMMM yyyy', { locale: getDateLocale(locale) })}
        </Text>
        <TouchableOpacity
          onPress={() => setDay((d) => addDays(d, 1))}
          disabled={isToday}
          style={[styles.iconBtn, isToday && { opacity: 0.3 }]}
        >
          <Ionicons name="chevron-forward" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 100 }}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#10b981" />}
      >
        {loading ? (
          <ActivityIndicator color="#10b981" style={{ marginTop: 40 }} />
        ) : failed ? (
          <Text style={styles.empty}>{t('dietitianCare.loading_failed')}</Text>
        ) : (
          <>
            <View style={styles.summary}>
              <Text style={styles.summaryLabel}>{t('dietitianCare.total_cals')}</Text>
              <Text style={styles.summaryValue}>{sum('calories')} kcal</Text>
              <Text style={styles.summaryMacros}>
                {t('nutritionLog.p')} {sum('protein_g')}g · {t('nutritionLog.c')} {sum('carbs_g')}g · {t('nutritionLog.f')} {sum('fat_g')}g
              </Text>
              {weekAvg !== null && (
                <Text style={styles.summaryAvg}>{t('dietitianCare.week_avg')}: {weekAvg} kcal</Text>
              )}
            </View>

            {logs.length === 0 && <Text style={styles.empty}>{t('dietitianCare.no_logs')}</Text>}

            {logs.map((log) => {
              const notes = feedback.filter((f) => f.log_id === log.id);
              return (
                <View key={log.id} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.mealType}>{t(`nutritionLog.${log.meal_type}`)}</Text>
                    <Text style={styles.kcal}>{log.calories ?? 0} kcal</Text>
                  </View>
                  <Text style={styles.content}>{log.content}</Text>
                  <Text style={styles.macros}>
                    {t('nutritionLog.p')}: {log.protein_g ?? 0}g · {t('nutritionLog.c')}: {log.carbs_g ?? 0}g · {t('nutritionLog.f')}: {log.fat_g ?? 0}g
                  </Text>

                  {notes.map((n) => (
                    <View key={n.id} style={styles.note}>
                      <Text style={styles.noteLabel}>{t('dietitianCare.rec_title')}</Text>
                      <Text style={styles.noteText}>{n.message}</Text>
                    </View>
                  ))}

                  <View style={styles.reactRow}>
                    {QUICK_REACTIONS.map((emoji) => (
                      <TouchableOpacity
                        key={emoji}
                        style={styles.reactChip}
                        disabled={sendingId === log.id}
                        onPress={() => sendRecommendation(log, emoji)}
                      >
                        <Text style={styles.reactEmoji}>{emoji}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <View style={styles.composer}>
                    <TextInput
                      style={styles.composerInput}
                      placeholder={t('dietitianCare.rec_ph')}
                      placeholderTextColor="#666"
                      value={drafts[log.id] || ''}
                      onChangeText={(v) => setDrafts((d) => ({ ...d, [log.id]: v }))}
                      multiline
                      maxLength={1000}
                    />
                    <TouchableOpacity
                      style={[styles.sendBtn, (!(drafts[log.id] || '').trim() || sendingId === log.id) && { opacity: 0.4 }]}
                      disabled={!(drafts[log.id] || '').trim() || sendingId === log.id}
                      onPress={() => sendRecommendation(log)}
                    >
                      {sendingId === log.id ? (
                        <ActivityIndicator color="#fff" size="small" />
                      ) : (
                        <Text style={styles.sendText}>{t('dietitianCare.rec_send')}</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </>
        )}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        <TouchableOpacity
          style={styles.planBtn}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push({ pathname: '/dietitian/create-plan' as any, params: { clientId } });
          }}
        >
          <Ionicons name="document-text-outline" size={18} color="#fff" />
          <Text style={styles.planBtnText}>{t('dietitianCare.write_plan')}</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050607' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingBottom: 8 },
  iconBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  title: { color: '#fff', fontSize: 17, fontWeight: '900', letterSpacing: 0.5 },
  subtitle: { color: '#10b981', fontSize: 13, fontWeight: '700', marginTop: 2 },
  dateRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12 },
  dateText: { color: '#fff', fontSize: 14, fontWeight: '800' },
  summary: { backgroundColor: '#10b98118', borderWidth: 1, borderColor: '#10b98150', borderRadius: 18, padding: 18, alignItems: 'center', marginBottom: 16 },
  summaryLabel: { color: '#10b981', fontSize: 11, fontWeight: '900', letterSpacing: 1, textTransform: 'uppercase' },
  summaryValue: { color: '#fff', fontSize: 32, fontWeight: '900', marginTop: 4 },
  summaryMacros: { color: '#aaa', fontSize: 12, fontWeight: '700', marginTop: 4 },
  summaryAvg: { color: '#888', fontSize: 11, marginTop: 6 },
  empty: { color: '#888', textAlign: 'center', marginTop: 30, fontSize: 14 },
  card: { backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.09)', borderRadius: 16, padding: 16, marginBottom: 14 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  mealType: { color: '#f59e0b', fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
  kcal: { color: '#10b981', fontSize: 14, fontWeight: '900' },
  content: { color: '#fff', fontSize: 14, marginBottom: 6 },
  macros: { color: '#777', fontSize: 11, fontWeight: '700', marginBottom: 10 },
  note: { backgroundColor: '#8b5cf61a', borderLeftWidth: 3, borderLeftColor: '#8b5cf6', borderRadius: 8, padding: 10, marginBottom: 8 },
  noteLabel: { color: '#a78bfa', fontSize: 10, fontWeight: '900', letterSpacing: 0.5, textTransform: 'uppercase' },
  noteText: { color: '#fff', fontSize: 13, marginTop: 2 },
  reactRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  reactChip: { backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.09)', borderRadius: 999, paddingVertical: 6, paddingHorizontal: 12 },
  reactEmoji: { fontSize: 18 },
  composer: { flexDirection: 'row', gap: 8, alignItems: 'flex-end', marginTop: 4 },
  composerInput: { flex: 1, backgroundColor: '#0a0a0a', borderWidth: 1, borderColor: 'rgba(255,255,255,0.09)', borderRadius: 12, padding: 10, color: '#fff', minHeight: 44, maxHeight: 100 },
  sendBtn: { backgroundColor: '#8b5cf6', borderRadius: 12, paddingHorizontal: 14, height: 44, justifyContent: 'center' },
  sendText: { color: '#fff', fontWeight: '900', fontSize: 13 },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 20, paddingTop: 10, backgroundColor: '#0a0a0aee' },
  planBtn: { flexDirection: 'row', gap: 8, backgroundColor: '#10b981', borderRadius: 14, paddingVertical: 14, alignItems: 'center', justifyContent: 'center' },
  planBtnText: { color: '#fff', fontSize: 14, fontWeight: '900', letterSpacing: 0.5 },
});
