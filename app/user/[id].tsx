import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/auth';
import { useTranslation } from '../../lib/i18n/i18n';
import { friendlyError } from '../../lib/useOnline';

type PublicProfile = {
  id: string;
  username: string;
  display_name: string | null;
  bio: string | null;
  specialty: string | null;
  role: string | null;
  current_streak: number | null;
  longest_streak: number | null;
};

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { profile: me } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const [user, setUser] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [opening, setOpening] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id, username, display_name, bio, specialty, role, current_streak, longest_streak')
        .eq('id', id)
        .maybeSingle();
      setUser((data as PublicProfile) || null);
      setLoading(false);
    })();
  }, [id]);

  // The chat route expects a conversation id: find the existing one or create it.
  const openChat = async () => {
    if (!me || !user || opening) return;
    setOpening(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const { data: existing } = await supabase
        .from('conversations')
        .select('id')
        .or(
          `and(participant_1.eq.${me.id},participant_2.eq.${user.id}),and(participant_1.eq.${user.id},participant_2.eq.${me.id})`
        )
        .limit(1);
      let conversationId = existing?.[0]?.id;
      if (!conversationId) {
        const { data: created, error } = await supabase
          .from('conversations')
          .insert({ participant_1: me.id, participant_2: user.id })
          .select('id')
          .single();
        if (error) throw error;
        conversationId = created.id;
      }
      router.push(`/chat/${conversationId}` as any);
    } catch (err: any) {
      Alert.alert(t('common.error'), friendlyError(err?.message, t) || t('userProfile.chat_failed'));
    } finally {
      setOpening(false);
    }
  };

  const name = user?.display_name || user?.username || '?';
  const isMe = !!me && user?.id === me.id;

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('userProfile.title')}</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator color="#10b981" /></View>
      ) : !user ? (
        <View style={styles.center}><Text style={styles.muted}>{t('userProfile.not_found')}</Text></View>
      ) : (
        <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{name[0].toUpperCase()}</Text>
          </View>
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.handle}>@{user.username}</Text>
          {user.role === 'dietitian' && (
            <View style={styles.badge}>
              <Ionicons name="medkit" size={12} color="#10b981" />
              <Text style={styles.badgeText}>{t('feed2.badge_dietitian')}</Text>
            </View>
          )}
          {!!user.specialty && <Text style={styles.specialty}>{user.specialty}</Text>}
          {!!user.bio && <Text style={styles.bio}>{user.bio}</Text>}

          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Ionicons name="flame" size={22} color="#f97316" />
              <Text style={styles.statVal}>{user.current_streak || 0}</Text>
              <Text style={styles.statLbl}>{t('userProfile.current_streak')}</Text>
            </View>
            <View style={styles.stat}>
              <Ionicons name="trophy" size={22} color="#eab308" />
              <Text style={styles.statVal}>{user.longest_streak || 0}</Text>
              <Text style={styles.statLbl}>{t('userProfile.longest_streak')}</Text>
            </View>
          </View>

          {!isMe && (
            <TouchableOpacity style={[styles.dmBtn, opening && { opacity: 0.6 }]} onPress={openChat} disabled={opening}>
              <Ionicons name="paper-plane" size={18} color="#fff" />
              <Text style={styles.dmText}>{t('userProfile.message')}</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  muted: { color: '#888', fontSize: 15 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 12 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#161616', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: 1 },
  content: { alignItems: 'center', padding: 24, gap: 8 },
  avatar: { width: 96, height: 96, borderRadius: 48, backgroundColor: '#10b98122', borderWidth: 2, borderColor: '#10b981', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  avatarText: { color: '#10b981', fontSize: 40, fontWeight: '900' },
  name: { color: '#fff', fontSize: 24, fontWeight: '800' },
  handle: { color: '#888', fontSize: 14 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#10b98118', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, marginTop: 4 },
  badgeText: { color: '#10b981', fontSize: 12, fontWeight: '700' },
  specialty: { color: '#aaa', fontSize: 14, marginTop: 4 },
  bio: { color: '#ccc', fontSize: 15, textAlign: 'center', marginTop: 8, lineHeight: 22 },
  statsRow: { flexDirection: 'row', gap: 12, marginTop: 20, alignSelf: 'stretch' },
  stat: { flex: 1, backgroundColor: '#141414', borderRadius: 16, padding: 16, alignItems: 'center', gap: 4, borderWidth: 1, borderColor: '#222' },
  statVal: { color: '#fff', fontSize: 26, fontWeight: '900' },
  statLbl: { color: '#777', fontSize: 11, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase' },
  dmBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: '#10b981', borderRadius: 16, paddingVertical: 14, alignSelf: 'stretch', marginTop: 20 },
  dmText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});
