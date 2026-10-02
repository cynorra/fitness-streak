import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, RefreshControl } from 'react-native';
import { supabase } from '../lib/supabase';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTranslation } from '../lib/i18n/i18n';
import AdMobBanner from '../components/AdMobBanner';
import AppIcon from '../components/AppIcon';

export default function Leaderboard() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t, locale } = useTranslation();
  const [users, setUsers] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

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
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{t('leaderboard.title')}</Text>
        <View style={{ width: 44 }} />
      </View>

      <FlatList
        data={users}
        keyExtractor={(u) => u.id}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#10b981" />}
        ListFooterComponent={<AdMobBanner />}
        ListHeaderComponent={
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>{t('leaderboard.info')}</Text>
          </View>
        }
        renderItem={({ item: u, index }) => (
          <Animated.View
            entering={FadeInDown.delay(index * 50).springify()}
            style={styles.card}
          >
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
            <View style={styles.streakBox}>
              <AppIcon name="flame" color="#f97316" size={16} bare style={{ marginRight: 6 }} />
              <Text style={styles.streakCount}>{u.current_streak}</Text>
            </View>
          </Animated.View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 20 },
  backBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'flex-start' },
  backText: { color: '#fff', fontSize: 28 },
  title: { color: '#fff', fontSize: 18, fontWeight: '900', letterSpacing: 1 },
  content: { padding: 20, paddingBottom: 100 },
  infoBox: { backgroundColor: '#10b98120', padding: 16, borderRadius: 12, marginBottom: 20, borderWidth: 1, borderColor: '#10b98150' },
  infoText: { color: '#10b981', fontSize: 13, fontWeight: '800', lineHeight: 20 },
  
  card: {
    backgroundColor: '#111',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#222',
  },
  rankBadge: { width: 30, alignItems: 'center' },
  rankText: { color: '#888', fontSize: 16, fontWeight: '900' },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#10b981', justifyContent: 'center', alignItems: 'center', marginHorizontal: 12 },
  avatarText: { color: '#fff', fontSize: 20, fontWeight: '900' },
  userInfo: { flex: 1 },
  name: { color: '#fff', fontSize: 16, fontWeight: '800' },
  handle: { color: '#666', fontSize: 12, fontWeight: '600', marginTop: 2 },
  streakBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a1a1a', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: '#333' },
  streakIcon: { fontSize: 14, marginRight: 6 },
  streakCount: { color: '#fff', fontSize: 16, fontWeight: '900' },
});
