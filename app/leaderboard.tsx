import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, RefreshControl } from 'react-native';
import { supabase } from '../lib/supabase';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTranslation } from '../lib/i18n/i18n';
import AdMobBanner from '../components/AdMobBanner';
import AppIcon from '../components/AppIcon';
import AmbientBackground from '../components/AmbientBackground';
import { Ionicons } from '@expo/vector-icons';
import { fetchDietitianScores, trustColor } from '../lib/dietitianScores';

export default function Leaderboard() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t, locale } = useTranslation();
  const [users, setUsers] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState<'streak' | 'dietitians'>('streak');
  const [dietitians, setDietitians] = useState<any[]>([]);

  const loadLeaderboard = async () => {
    // Fetch users ordered by current streak
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, display_name, current_streak, longest_streak')
      .order('current_streak', { ascending: false })
      .limit(50);
      
    if (!error && data) {
      setUsers(data);
    }

    // Dietitians ranked by trust score (ratings + client count + profile completeness).
    const [{ data: dts }, scores] = await Promise.all([
      supabase.from('profiles').select('id, username, display_name, specialty').eq('role', 'dietitian').limit(100),
      fetchDietitianScores(),
    ]);
    setDietitians(
      ((dts || []) as any[])
        .map((d) => ({ ...d, score: scores.get(d.id) }))
        .sort((a, b) => (b.score?.trust_score || 0) - (a.score?.trust_score || 0))
        .slice(0, 50)
    );
  };

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadLeaderboard();
    setRefreshing(false);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <AmbientBackground />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>{t('leaderboard.title')}</Text>
        <View style={{ width: 44 }} />
      </View>

      <View style={styles.tabs}>
        {(['streak', 'dietitians'] as const).map((k) => (
          <TouchableOpacity key={k} style={[styles.tabBtn, tab === k && styles.tabBtnActive]} onPress={() => setTab(k)}>
            <Text style={[styles.tabText, tab === k && styles.tabTextActive]}>{t(`leaderboard.tab_${k}`)}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={tab === 'streak' ? users : dietitians}
        keyExtractor={(u) => u.id}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#10b981" />}
        ListFooterComponent={<AdMobBanner />}
        ListHeaderComponent={
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>{t(tab === 'streak' ? 'leaderboard.info' : 'leaderboard.dt_info')}</Text>
          </View>
        }
        renderItem={({ item: u, index }) => (
          <Animated.View entering={FadeInDown.delay(index * 50).springify()}>
          <TouchableOpacity activeOpacity={0.8} style={styles.card} onPress={() => router.push(`/user/${u.id}` as any)}>
            <View style={styles.rankBadge}>
              <Text style={styles.rankText}>{index + 1}</Text>
            </View>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {(u.display_name || u.username || '?')[0].toUpperCase()}
              </Text>
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.name}>{u.display_name || u.username}</Text>
              <Text style={styles.handle}>@{u.username}</Text>
            </View>
            {tab === 'streak' ? (
              <View style={styles.streakBox}>
                <AppIcon name="flame" color="#f97316" size={16} bare style={{ marginRight: 6 }} />
                <Text style={styles.streakCount}>{u.current_streak}</Text>
              </View>
            ) : (
              <View style={[styles.streakBox, { borderColor: trustColor(u.score?.trust_score || 0) }]}>
                <Ionicons name="shield-checkmark" size={16} color={trustColor(u.score?.trust_score || 0)} style={{ marginRight: 6 }} />
                <Text style={styles.streakCount}>{u.score?.trust_score ?? '-'}</Text>
              </View>
            )}
          </TouchableOpacity>
          </Animated.View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050607' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 20 },
  backBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'flex-start' },
  backText: { color: '#fff', fontSize: 28 },
  title: { color: '#fff', fontSize: 18, fontWeight: '900', letterSpacing: 1 },
  tabs: { flexDirection: 'row', marginHorizontal: 20, marginBottom: 16, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 14, padding: 4 },
  tabBtn: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 11 },
  tabBtnActive: { backgroundColor: '#10b981' },
  tabText: { color: '#8b93a1', fontSize: 13, fontWeight: '800' },
  tabTextActive: { color: '#fff' },
  content: { padding: 20, paddingBottom: 100 },
  infoBox: { backgroundColor: '#10b98120', padding: 16, borderRadius: 12, marginBottom: 20, borderWidth: 1, borderColor: '#10b98150' },
  infoText: { color: '#10b981', fontSize: 13, fontWeight: '800', lineHeight: 20 },
  
  card: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.09)',
  },
  rankBadge: { width: 30, alignItems: 'center' },
  rankText: { color: '#888', fontSize: 16, fontWeight: '900' },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#10b981', justifyContent: 'center', alignItems: 'center', marginHorizontal: 12 },
  avatarText: { color: '#fff', fontSize: 20, fontWeight: '900' },
  userInfo: { flex: 1 },
  name: { color: '#fff', fontSize: 16, fontWeight: '800' },
  handle: { color: '#666', fontSize: 12, fontWeight: '600', marginTop: 2 },
  streakBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: '#333' },
  streakIcon: { fontSize: 14, marginRight: 6 },
  streakCount: { color: '#fff', fontSize: 16, fontWeight: '900' },
});
