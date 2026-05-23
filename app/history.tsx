import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { supabase, Workout } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { format, parseISO } from 'date-fns';
import { tr } from 'date-fns/locale';

export default function WorkoutHistory() {
  const { profile } = useAuth();
  const router = useRouter();
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadHistory = useCallback(async () => {
    if (!profile) return;
    const { data } = await supabase
      .from('workouts')
      .select('*')
      .eq('user_id', profile.id)
      .order('logged_at', { ascending: false });
    setWorkouts((data as Workout[]) || []);
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
    const month = format(parseISO(workout.logged_at), 'MMMM yyyy', { locale: tr });
    if (!groups[month]) groups[month] = [];
    groups[month].push(workout);
    return groups;
  }, {});

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>ANTRENMAN GEÇMİŞİ</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView 
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#10b981" />}
      >
        {Object.entries(groupedWorkouts).map(([month, items]) => (
          <View key={month} style={styles.monthSection}>
            <Text style={styles.monthTitle}>{month.toUpperCase()}</Text>
            {items.map((w) => (
              <View key={w.id} style={styles.workoutRow}>
                <View style={styles.workoutInfo}>
                  <Text style={styles.workoutType}>{w.workout_type}</Text>
                  <Text style={styles.workoutDate}>
                    {format(parseISO(w.logged_at), 'd MMMM EEEE', { locale: tr })}
                  </Text>
                </View>
                <Text style={styles.workoutDuration}>{w.duration_minutes}dk</Text>
              </View>
            ))}
          </View>
        ))}

        {workouts.length === 0 && (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Henüz antrenman kaydı yok.</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  header: { 
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 60, paddingHorizontal: 20, paddingBottom: 20,
    backgroundColor: '#0a0a0a', borderBottomWidth: 1, borderBottomColor: '#1a1a1a'
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  backText: { color: '#fff', fontSize: 24, fontWeight: '900' },
  title: { color: '#fff', fontSize: 16, fontWeight: '900', letterSpacing: 2 },
  content: { padding: 20 },
  monthSection: { marginBottom: 32 },
  monthTitle: { color: '#444', fontSize: 10, fontWeight: '900', letterSpacing: 3, marginBottom: 16 },
  workoutRow: {
    backgroundColor: '#111', padding: 20, borderRadius: 20,
    marginBottom: 12, flexDirection: 'row',
    justifyContent: 'space-between', alignItems: 'center',
    borderWidth: 1, borderColor: '#222',
  },
  workoutInfo: { flex: 1 },
  workoutType: { color: '#fff', fontSize: 15, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  workoutDate: { color: '#444', fontSize: 11, fontWeight: '700', marginTop: 2 },
  workoutDuration: { color: '#10b981', fontSize: 18, fontWeight: '900', letterSpacing: -0.5 },
  empty: { paddingTop: 100, alignItems: 'center' },
  emptyText: { color: '#444', fontSize: 12, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2 },
});
