import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl } from 'react-native';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';

export default function Challenges() {
  const { profile } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const [challenges, setChallenges] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadChallenges = async () => {
    if (!profile) return;
    
    // Fetch all active challenges
    const { data: allChallenges, error: challengesError } = await supabase
      .from('challenges')
      .select('*')
      .order('end_date', { ascending: true });
      
    if (challengesError) return;

    // Fetch user progress
    const { data: userProgress, error: progressError } = await supabase
      .from('user_challenges')
      .select('*')
      .eq('user_id', profile.id);

    if (progressError) return;

    const merged = allChallenges.map(c => {
      const progress = userProgress?.find(up => up.challenge_id === c.id);
      return {
        ...c,
        userProgress: progress || null
      };
    });

    setChallenges(merged);
  };

  useEffect(() => {
    loadChallenges();
  }, [profile]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadChallenges();
    setRefreshing(false);
  };

  const handleJoin = async (challengeId: string) => {
    if (!profile) return;
    const { error } = await supabase.from('user_challenges').insert({
      user_id: profile.id,
      challenge_id: challengeId,
      progress: 0,
      completed: false
    });
    if (!error) loadChallenges();
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Görevler</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#10b981" />}
      >
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>🎯 Görevlere katıl, hedefleri tamamla ve motivasyonunu artır!</Text>
        </View>

        {challenges.length === 0 && (
          <Text style={styles.emptyText}>Şu an aktif bir görev bulunmuyor.</Text>
        )}

        {challenges.map((c, index) => {
          const isJoined = !!c.userProgress;
          const isCompleted = c.userProgress?.completed;
          const progressPercent = isJoined 
            ? Math.min(100, (c.userProgress.progress / c.target_value) * 100) 
            : 0;

          return (
            <Animated.View 
              key={c.id} 
              entering={FadeInDown.delay(index * 100).springify()}
              style={styles.card}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.challengeTitle}>{c.title}</Text>
                {isCompleted && <Text style={styles.badgeCompleted}>✓ Tamamlandı</Text>}
              </View>
              
              <Text style={styles.challengeDesc}>{c.description}</Text>

              {isJoined ? (
                <View style={styles.progressContainer}>
                  <View style={styles.progressHeader}>
                    <Text style={styles.progressText}>İlerleme: {c.userProgress.progress} / {c.target_value}</Text>
                    <Text style={styles.progressPercent}>{Math.round(progressPercent)}%</Text>
                  </View>
                  <View style={styles.progressBarBg}>
                    <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
                  </View>
                </View>
              ) : (
                <TouchableOpacity style={styles.joinBtn} onPress={() => handleJoin(c.id)}>
                  <Text style={styles.joinBtnText}>Göreve Katıl</Text>
                </TouchableOpacity>
              )}
            </Animated.View>
          );
        })}
      </ScrollView>
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
  emptyText: { color: '#666', textAlign: 'center', marginTop: 40 },
  
  card: { backgroundColor: '#111', padding: 20, borderRadius: 16, marginBottom: 16, borderWidth: 1, borderColor: '#222' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  challengeTitle: { color: '#fff', fontSize: 16, fontWeight: '900', flex: 1 },
  badgeCompleted: { color: '#10b981', fontSize: 10, fontWeight: '900', textTransform: 'uppercase', backgroundColor: '#10b98120', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  challengeDesc: { color: '#888', fontSize: 14, lineHeight: 20, marginBottom: 16 },
  
  joinBtn: { backgroundColor: '#1a1a1a', padding: 16, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#2a2a2a' },
  joinBtnText: { color: '#10b981', fontSize: 14, fontWeight: '900', letterSpacing: 1 },
  
  progressContainer: { marginTop: 8 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  progressText: { color: '#aaa', fontSize: 12, fontWeight: '700' },
  progressPercent: { color: '#10b981', fontSize: 12, fontWeight: '900' },
  progressBarBg: { height: 8, backgroundColor: '#222', borderRadius: 4, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#10b981', borderRadius: 4 },
});
