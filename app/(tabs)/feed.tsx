import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, ActivityIndicator,
} from 'react-native';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/auth';
import { format, parseISO } from 'date-fns';
import { useRouter } from 'expo-router';
import { tr } from 'date-fns/locale';

type FeedItem = {
  id: string;
  workout_type: string;
  duration_minutes: number;
  note: string | null;
  logged_at: string;
  user_id: string;
  profile: {
    username: string;
    display_name: string | null;
    current_streak: number;
  };
  kudos_count: number;
  user_gave_kudos: boolean;
};

export default function Feed() {
  const { profile } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!profile) return;

    // RLS sayesinde sadece kendimin + arkadaşlarımın antrenmanları gelir
    const { data: workouts } = await supabase
      .from('workouts')
      .select('id, workout_type, duration_minutes, note, logged_at, user_id')
      .order('logged_at', { ascending: false })
      .limit(50);

    if (!workouts || workouts.length === 0) {
      setItems([]);
      setLoading(false);
      return;
    }

    const userIds = [...new Set(workouts.map(w => w.user_id))];
    const workoutIds = workouts.map(w => w.id);

    const [{ data: profiles }, { data: kudosData }] = await Promise.all([
      supabase
        .from('profiles')
        .select('id, username, display_name, current_streak')
        .in('id', userIds),
      supabase
        .from('kudos')
        .select('workout_id, giver_id')
        .in('workout_id', workoutIds),
    ]);

    const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
    const kudosByWorkout = new Map<string, { count: number; gaveKudos: boolean }>();
    (kudosData || []).forEach(k => {
      const curr = kudosByWorkout.get(k.workout_id) || { count: 0, gaveKudos: false };
      kudosByWorkout.set(k.workout_id, {
        count: curr.count + 1,
        gaveKudos: curr.gaveKudos || k.giver_id === profile.id,
      });
    });

    const feed: FeedItem[] = workouts.map(w => ({
      ...w,
      profile: profileMap.get(w.user_id) as any,
      kudos_count: kudosByWorkout.get(w.id)?.count || 0,
      user_gave_kudos: kudosByWorkout.get(w.id)?.gaveKudos || false,
    }));

    setItems(feed);
    setLoading(false);
  }, [profile]);

  useEffect(() => { load(); }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const toggleKudos = async (item: FeedItem) => {
    if (!profile || item.user_id === profile.id) return;

    if (item.user_gave_kudos) {
      // şimdilik kaldırma yok, sadece optimist UI
      return;
    }

    setItems(curr => curr.map(i =>
      i.id === item.id
        ? { ...i, user_gave_kudos: true, kudos_count: i.kudos_count + 1 }
        : i
    ));

    await supabase.from('kudos').insert({
      giver_id: profile.id,
      receiver_id: item.user_id,
      workout_id: item.id,
    });
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#ff6b35" />
      </View>
    );
  }

  return (
    <FlatList
      style={styles.container}
      data={items}
      keyExtractor={i => i.id}
      ListHeaderComponent={
        <View style={styles.header}>
          <View style={styles.logoRow}>
            <View style={{flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1}}>
              <View style={styles.logoBox}>
                <Text style={styles.logoLetter}>S</Text>
              </View>
              <Text style={styles.logoText}>STREAK<Text style={{color: '#ff6b35'}}>FIT</Text></Text>
            </View>
            <TouchableOpacity onPress={() => router.push('/messages' as any)} style={styles.msgBtn}>
              <Text style={styles.msgIcon}>💬</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.title}>TOPLULUK AKIŞI</Text>
        </View>
      }
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#ff6b35" />}
      ListEmptyComponent={
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>👥</Text>
          <Text style={styles.emptyText}>
            Henüz akışta bir şey yok.{'\n'}
            Arkadaş ekle, antrenmanlarını gör.
          </Text>
        </View>
      }
      renderItem={({ item }) => (
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {(item.profile?.display_name || item.profile?.username || '?')[0].toUpperCase()}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.userName}>
                {item.profile?.display_name || item.profile?.username}
              </Text>
              <Text style={styles.userMeta}>
                🔥 {item.profile?.current_streak ?? 0} • {format(parseISO(item.logged_at), 'd MMM HH:mm', { locale: tr })}
              </Text>
            </View>
          </View>

          <View style={styles.workoutBox}>
            <Text style={styles.workoutType}>{item.workout_type}</Text>
            <Text style={styles.workoutDuration}>{item.duration_minutes} dakika</Text>
          </View>

          {item.note && <Text style={styles.note}>"{item.note}"</Text>}

          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.kudosBtn}
              onPress={() => toggleKudos(item)}
              disabled={item.user_id === profile?.id}
            >
              <Text style={styles.kudosEmoji}>
                {item.user_gave_kudos ? '👏' : '👋'}
              </Text>
              <Text style={[
                styles.kudosCount,
                item.user_gave_kudos && styles.kudosCountActive,
              ]}>
                {item.kudos_count} alkış
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0a0a0a' },
  header: { padding: 24, paddingTop: 60, gap: 12 },
  logoRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  msgBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#111', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#222' },
  msgIcon: { fontSize: 20 },
  logoBox: { width: 32, height: 32, backgroundColor: '#ff6b35', borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  logoLetter: { color: '#fff', fontWeight: '900', fontSize: 18 },
  logoText: { color: '#fff', fontSize: 24, fontWeight: '900', letterSpacing: -1.5 },
  title: { color: '#666', fontSize: 11, fontWeight: '900', letterSpacing: 2, textTransform: 'uppercase' },
  empty: { padding: 48, alignItems: 'center' },
  emptyEmoji: { fontSize: 56, marginBottom: 16 },
  emptyText: { color: '#888', fontSize: 14, textAlign: 'center', lineHeight: 22 },
  card: {
    backgroundColor: '#1a1a1a', marginHorizontal: 16, marginBottom: 12,
    padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#2a2a2a',
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  avatar: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#ff6b35',
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  avatarText: { color: '#fff', fontWeight: '900', fontSize: 16 },
  userName: { color: '#fff', fontSize: 15, fontWeight: '700' },
  userMeta: { color: '#888', fontSize: 12, marginTop: 2 },
  workoutBox: {
    backgroundColor: '#0a0a0a', padding: 14, borderRadius: 10,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  workoutType: { color: '#fff', fontSize: 16, fontWeight: '700' },
  workoutDuration: { color: '#ff6b35', fontSize: 15, fontWeight: '700' },
  note: { color: '#aaa', fontSize: 13, marginTop: 10, fontStyle: 'italic' },
  actions: { marginTop: 12, flexDirection: 'row' },
  kudosBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: 6, paddingHorizontal: 10,
    backgroundColor: '#0a0a0a', borderRadius: 8,
  },
  kudosEmoji: { fontSize: 16 },
  kudosCount: { color: '#888', fontSize: 13, fontWeight: '600' },
  kudosCountActive: { color: '#ff6b35' },
});
