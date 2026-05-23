import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { useAuth } from '../../lib/auth';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { supabase, Workout } from '../../lib/supabase';
import { format, parseISO, subDays } from 'date-fns';
import { tr } from 'date-fns/locale';

export default function StreakHome() {
  const { profile, refreshProfile } = useAuth();
  const router = useRouter();
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
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#10b981" />}
    >
      <View style={styles.header}>
        <View style={styles.logoRow}>
          <View style={{flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1}}>
            <View style={styles.logoBox}>
              <Text style={styles.logoLetter}>S</Text>
            </View>
            <Text style={styles.logoText}>VITA<Text style={{color: '#10b981'}}>TRIBE</Text></Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/messages' as any)} style={styles.msgBtn}>
            <Text style={styles.msgIcon}>💬</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.hello}>SELAM, {profile?.display_name?.toUpperCase() || profile?.username?.toUpperCase()}</Text>
      </View>

      <View style={styles.streakCard}>
        <View style={styles.flameContainer}>
          <Text style={styles.flame}>🌱</Text>
          <View style={styles.flameGlow} />
        </View>
        <Text style={styles.streakNumber}>{streak}</Text>
        <Text style={styles.streakLabel}>
          {streak === 1 ? 'GÜN' : 'GÜNLÜK STREAK'}
        </Text>
        <View style={styles.greetingBox}>
          <Text style={styles.greeting}>{greeting.toUpperCase()}</Text>
        </View>
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
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>SON ANTRENMANLAR</Text>
          <TouchableOpacity onPress={() => router.push('/history' as any)}>
            <Text style={styles.seeAllText}>TÜMÜNÜ GÖR</Text>
          </TouchableOpacity>
        </View>
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

      {/* Floating Log Button */}
      <TouchableOpacity 
        style={styles.fab} 
        onPress={() => router.push('/log' as any)}
      >
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  header: { padding: 24, paddingTop: 60, gap: 12 },
  logoRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  msgBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#111', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#222' },
  msgIcon: { fontSize: 20 },
  logoBox: { width: 32, height: 32, backgroundColor: '#10b981', borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  logoLetter: { color: '#fff', fontWeight: '900', fontSize: 18 },
  logoText: { color: '#fff', fontSize: 24, fontWeight: '900', letterSpacing: -1.5 },
  hello: { color: '#666', fontSize: 11, fontWeight: '900', letterSpacing: 2 },
  streakCard: {
    backgroundColor: '#111', margin: 16, padding: 40,
    borderRadius: 40, alignItems: 'center',
    borderWidth: 1, borderColor: '#222',
    shadowColor: '#10b981', shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.1, shadowRadius: 40,
  },
  flameContainer: { position: 'relative', marginBottom: 8 },
  flame: { fontSize: 80, zIndex: 1 },
  flameGlow: { 
    position: 'absolute', top: -10, left: -10, 
    width: 60, height: 60, backgroundColor: '#10b981', 
    borderRadius: 30, opacity: 0.2 
  },
  streakNumber: {
    fontSize: 120, fontWeight: '900', color: '#10b981',
    letterSpacing: -6, lineHeight: 120,
  },
  streakLabel: {
    color: '#666', fontSize: 11, fontWeight: '900',
    letterSpacing: 3, marginTop: -4,
  },
  greetingBox: { 
    marginTop: 24, paddingVertical: 8, paddingHorizontal: 16, 
    backgroundColor: '#1a1a1a', borderRadius: 12, borderWidth: 1, borderColor: '#2a2a2a' 
  },
  greeting: { color: '#fff', fontSize: 10, fontWeight: '900', letterSpacing: 1, textAlign: 'center' },
  weekStrip: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingHorizontal: 16, marginBottom: 24,
  },
  dayCol: { alignItems: 'center', flex: 1 },
  dayLabel: { color: '#444', fontSize: 10, fontWeight: '900', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 },
  dayDot: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: '#111', borderWidth: 1, borderColor: '#222',
    justifyContent: 'center', alignItems: 'center',
  },
  dayDotActive: { backgroundColor: '#10b981', borderColor: '#10b981', shadowColor: '#10b981', shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } },
  checkmark: { color: '#fff', fontWeight: '900', fontSize: 18 },
  dayNum: { color: '#666', fontSize: 10, fontWeight: '900', marginTop: 6 },
  statsRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 12, marginBottom: 32 },
  statCard: {
    flex: 1, backgroundColor: '#111', padding: 24,
    borderRadius: 24, borderWidth: 1, borderColor: '#222',
  },
  statValue: { color: '#fff', fontSize: 36, fontWeight: '900', letterSpacing: -2 },
  statLabel: { color: '#444', fontSize: 9, fontWeight: '900', marginTop: 4, textTransform: 'uppercase', letterSpacing: 1.5 },
  recentSection: { paddingHorizontal: 16, paddingBottom: 40 },
  sectionHeader: { 
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', 
    marginBottom: 16 
  },
  sectionTitle: {
    color: '#666', fontSize: 10, fontWeight: '900',
    letterSpacing: 3, textTransform: 'uppercase',
  },
  seeAllText: { color: '#10b981', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  workoutRow: {
    backgroundColor: '#111', padding: 20, borderRadius: 20,
    marginBottom: 12, flexDirection: 'row',
    justifyContent: 'space-between', alignItems: 'center',
    borderWidth: 1, borderColor: '#222',
  },
  workoutType: { color: '#fff', fontSize: 15, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  workoutDate: { color: '#444', fontSize: 11, fontWeight: '700', marginTop: 2 },
  workoutDuration: { color: '#10b981', fontSize: 18, fontWeight: '900', letterSpacing: -0.5 },
  fab: {
    position: 'absolute', bottom: 32, right: 24,
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: '#10b981', justifyContent: 'center', alignItems: 'center',
    shadowColor: '#10b981', shadowOpacity: 0.5, shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 }, elevation: 8,
  },
  fabIcon: { color: '#fff', fontSize: 32, fontWeight: '900', marginTop: -2 },
});
