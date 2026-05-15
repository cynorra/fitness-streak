import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'expo-router';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, ActivityIndicator,
} from 'react-native';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/auth';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

type Notification = {
  id: string;
  type: 'like' | 'comment' | 'message' | 'dietitian_request' | 'dietitian_approved' | 'repost';
  is_read: boolean;
  created_at: string;
  actor: {
    display_name: string | null;
    username: string;
  };
  post_id?: string;
};

export default function Notifications() {
  const { profile } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!profile) return;

    const { data, error } = await supabase
      .from('notifications')
      .select(`
        id,
        type,
        is_read,
        created_at,
        post_id,
        actor:actor_id(display_name, username)
      `)
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (data) setItems(data as any);
    setLoading(false);

    // Mark as read
    if (data && data.some(n => !n.is_read)) {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', profile.id)
        .eq('is_read', false);
    }
  }, [profile]);

  useEffect(() => { load(); }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const getEmoji = (type: string) => {
    switch (type) {
      case 'like': return '❤️';
      case 'comment': return '💬';
      case 'dietitian_request': return '🤝';
      case 'dietitian_approved': return '✅';
      case 'repost': return '🔄';
      default: return '🔔';
    }
  };

  const getMessage = (notif: Notification) => {
    const name = notif.actor.display_name || notif.actor.username;
    switch (notif.type) {
      case 'like': return `${name} paylaşımını beğendi.`;
      case 'comment': return `${name} paylaşımına yorum yaptı.`;
      case 'dietitian_request': return `${name} seninle çalışmak istiyor!`;
      case 'dietitian_approved': return `${name} talebini onayladı.`;
      case 'repost': return `${name} paylaşımını repostladı.`;
      default: return `${name} bir işlem yaptı.`;
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#ff6b35" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
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
        <Text style={styles.title}>BİLDİRİMLER</Text>
      </View>

      <FlatList
        data={items}
        keyExtractor={i => i.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#ff6b35" />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>📭</Text>
            <Text style={styles.emptyText}>Henüz bir bildirim yok.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={[styles.card, !item.is_read && styles.cardUnread]}>
            <View style={[styles.iconBox, { backgroundColor: item.type === 'like' ? '#fff1f2' : '#fff7ed' }]}>
              <Text style={styles.icon}>{getEmoji(item.type)}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.message}>{getMessage(item)}</Text>
              <Text style={styles.date}>
                {format(new Date(item.created_at), 'd MMM HH:mm', { locale: tr }).toUpperCase()}
              </Text>
            </View>
          </View>
        )}
      />
    </View>
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
  emptyEmoji: { fontSize: 56, marginBottom: 16, opacity: 0.2 },
  emptyText: { color: '#666', fontSize: 14, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2 },
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 16,
    marginHorizontal: 16, marginBottom: 8, padding: 16,
    backgroundColor: '#111', borderRadius: 24, borderWidth: 1, borderColor: '#222',
  },
  cardUnread: { borderColor: '#ff6b3533', backgroundColor: '#1a1a1a' },
  iconBox: { width: 48, height: 48, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  icon: { fontSize: 20 },
  message: { color: '#fff', fontSize: 14, fontWeight: '700', lineHeight: 20 },
  date: { color: '#444', fontSize: 10, fontWeight: '900', letterSpacing: 1.5, marginTop: 4 },
});
