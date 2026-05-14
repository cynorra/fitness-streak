import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useAuth } from '../../lib/auth';
import { useEffect, useState, useCallback } from 'react';
import { supabase, Workout } from '../../lib/supabase';
import { format, parseISO, subDays } from 'date-fns';
import { tr } from 'date-fns/locale';

export default function StreakHome() {
  const { profile, refreshProfile } = useAuth();
  const [weekWorkouts, setWeekWorkouts] = useState<Workout[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadWeek = useCallback(async () => {
    if (!profile) return;
    const since = subDays(new Date(), 7).toISOString();
    const { data } = await supabase
      .from('workouts')
      .select('*')
      .eq('user_id', profile.id)
      .gte('logged_at', since)
      .order('logged_at', { ascending: false });
    setWeekWorkouts((data as Workout[]) || []);
  }, [profile]);

  useEffect(() => { loadWeek(); }, [loadWeek]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refreshProfile(), loadWeek()]);
    setRefreshing(false);
  };

  // Son 7 gün için işaretleme
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), 6 - i);
    const dateStr = format(date, 'yyyy-MM-dd');
    const hasWorkout = weekWorkouts.some(w => w.logical_date === dateStr);
    return { date, dateStr, hasWorkout };
  });

  const streak = profile?.current_streak ?? 0;
  const greeting = streak === 0
    ? 'Hadi başla, ilk antrenmanını logla.'
    : streak < 7
    ? 'İyi gidiyorsun, devam!'
    : streak < 30
    ? 'Sen ciddi bir adamsın artık.'
    : 'Efsanesin. Bu streak korkutucu.';

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#ff6b35" />}
    >
      <View style={styles.header}>
        <Text style={styles.hello}>Selam, {profile?.display_name || profile?.username}</Text>
      </View>

      <View style={styles.streakCard}>
        <Text style={styles.flame}>🔥</Text>
        <Text style={styles.streakNumber}>{streak}</Text>
        <Text style={styles.streakLabel}>
          {streak === 1 ? 'GÜN' : 'GÜNLÜK STREAK'}
        </Text>
        <Text style={styles.greeting}>{greeting}</Text>
      </View>

      <View style={styles.weekStrip}>
        {last7Days.map(({ date, dateStr, hasWorkout }) => (
          <View key={dateStr} style={styles.dayCol}>
            <Text style={styles.dayLabel}>
              {format(date, 'EEEEE', { locale: tr })}
            </Text>
            <View style={[styles.dayDot, hasWorkout && styles.dayDotActive]}>
              {hasWorkout && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={styles.dayNum}>{format(date, 'd')}</Text>
          </View>
        ))}
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{profile?.longest_streak ?? 0}</Text>
          <Text style={styles.statLabel}>En uzun streak</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{weekWorkouts.length}</Text>
          <Text style={styles.statLabel}>Bu hafta antrenman</Text>
        </View>
      </View>

      {weekWorkouts.length > 0 && (
        <View style={styles.recentSection}>
          <Text style={styles.sectionTitle}>SON ANTRENMANLAR</Text>
          {weekWorkouts.slice(0, 5).map(w => (
            <View key={w.id} style={styles.workoutRow}>
              <View>
                <Text style={styles.workoutType}>{w.workout_type}</Text>
                <Text style={styles.workoutDate}>
                  {format(parseISO(w.logged_at), 'd MMM • HH:mm', { locale: tr })}
                </Text>
              </View>
              <Text style={styles.workoutDuration}>{w.duration_minutes} dk</Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  header: { padding: 24, paddingTop: 60 },
  hello: { color: '#888', fontSize: 14 },
  streakCard: {
    backgroundColor: '#1a1a1a', margin: 16, padding: 32,
    borderRadius: 24, alignItems: 'center',
    borderWidth: 1, borderColor: '#2a2a2a',
  },
  flame: { fontSize: 72, marginBottom: 8 },
  streakNumber: {
    fontSize: 96, fontWeight: '900', color: '#ff6b35',
    letterSpacing: -4, lineHeight: 100,
  },
  streakLabel: {
    color: '#888', fontSize: 12, fontWeight: '700',
    letterSpacing: 2, marginTop: 4,
  },
  greeting: { color: '#fff', fontSize: 14, marginTop: 16, textAlign: 'center' },
  weekStrip: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingHorizontal: 16, marginBottom: 24,
  },
  dayCol: { alignItems: 'center', flex: 1 },
  dayLabel: { color: '#666', fontSize: 11, marginBottom: 8, textTransform: 'uppercase' },
  dayDot: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#1a1a1a', borderWidth: 1, borderColor: '#2a2a2a',
    justifyContent: 'center', alignItems: 'center',
  },
  dayDotActive: { backgroundColor: '#ff6b35', borderColor: '#ff6b35' },
  checkmark: { color: '#fff', fontWeight: '900', fontSize: 16 },
  dayNum: { color: '#888', fontSize: 11, marginTop: 6 },
  statsRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 12, marginBottom: 24 },
  statCard: {
    flex: 1, backgroundColor: '#1a1a1a', padding: 20,
    borderRadius: 16, borderWidth: 1, borderColor: '#2a2a2a',
  },
  statValue: { color: '#fff', fontSize: 32, fontWeight: '900' },
  statLabel: { color: '#888', fontSize: 12, marginTop: 4 },
  recentSection: { paddingHorizontal: 16, paddingBottom: 32 },
  sectionTitle: {
    color: '#666', fontSize: 11, fontWeight: '700',
    letterSpacing: 2, marginBottom: 12,
  },
  workoutRow: {
    backgroundColor: '#1a1a1a', padding: 16, borderRadius: 12,
    marginBottom: 8, flexDirection: 'row',
    justifyContent: 'space-between', alignItems: 'center',
  },
  workoutType: { color: '#fff', fontSize: 15, fontWeight: '600' },
  workoutDate: { color: '#888', fontSize: 12, marginTop: 2 },
  workoutDuration: { color: '#ff6b35', fontSize: 16, fontWeight: '700' },
});
