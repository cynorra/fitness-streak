import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { supabase, Workout } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { format, parseISO } from 'date-fns';
import { getDateLocale } from '../lib/i18n/dateUtils';
import { displayWorkoutType } from '../lib/workoutTypes';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from '../lib/i18n/i18n';
import AdMobBanner from '../components/AdMobBanner';
import AmbientBackground from '../components/AmbientBackground';
import { Ionicons } from '@expo/vector-icons';

export default function WorkoutHistory() {
  const { profile } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t, locale } = useTranslation();
  const dateLocale = getDateLocale(locale);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadHistory = useCallback(async () => {
    if (!profile) return;
    const { data, error } = await supabase
      .from('workouts')
      .select('*')
      .eq('user_id', profile.id)
      .order('logged_at', { ascending: false });
    if (!error) setWorkouts((data as Workout[]) || []);
  }, [profile]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadHistory();
    setRefreshing(false);
  };

  const groupedWorkouts = workouts.reduce((groups: { [key: string]: Workout[] }, workout) => {
    const month = format(parseISO(workout.logged_at), 'MMMM yyyy', { locale: dateLocale });
    if (!groups[month]) groups[month] = [];
    groups[month].push(workout);
    return groups;
  }, {});

  return (
    <View style={styles.container}>
      <AmbientBackground />
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>{t('history.title')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#10b981" />}
      >
        {Object.entries(groupedWorkouts).map(([month, items]) => (
          <View key={month} style={styles.monthSection}>
            <Text style={styles.monthTitle}>{month.toUpperCase()}</Text>
            {items.map((w) => (
              <View key={w.id} style={styles.workoutRow}>
                <View style={styles.workoutInfo}>
                  <Text style={styles.workoutType}>{displayWorkoutType(w.workout_type, t)}</Text>
                  <Text style={styles.workoutDate}>
                    {format(parseISO(w.logged_at), 'd MMMM EEEE', { locale: dateLocale })}
                  </Text>
                </View>
                <Text style={styles.workoutDuration}>{w.duration_minutes}{t('common.minutes_abbr')}</Text>
              </View>
            ))}
          </View>
        ))}

        <AdMobBanner />

        {workouts.length === 0 && (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>{t('history.empty')}</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050607' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingBottom: 20,
    backgroundColor: 'transparent', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  backText: { color: '#fff', fontSize: 24, fontWeight: '900' },
  title: { color: '#fff', fontSize: 16, fontWeight: '900', letterSpacing: 2 },
  content: { padding: 20 },
  monthSection: { marginBottom: 32 },
  monthTitle: { color: '#444', fontSize: 10, fontWeight: '900', letterSpacing: 3, marginBottom: 16 },
  workoutRow: {
    backgroundColor: 'rgba(255,255,255,0.05)', padding: 20, borderRadius: 20,
    marginBottom: 12, flexDirection: 'row',
    justifyContent: 'space-between', alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.09)',
  },
  workoutInfo: { flex: 1 },
  workoutType: { color: '#fff', fontSize: 15, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  workoutDate: { color: '#444', fontSize: 11, fontWeight: '700', marginTop: 2 },
  workoutDuration: { color: '#10b981', fontSize: 18, fontWeight: '900', letterSpacing: -0.5 },
  empty: { paddingTop: 100, alignItems: 'center' },
  emptyText: { color: '#444', fontSize: 12, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2 },
});
