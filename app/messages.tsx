import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, ActivityIndicator,
} from 'react-native';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { useRouter } from 'expo-router';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

type Conversation = {
  id: string;
  updated_at: string;
  other_profile: {
    id: string;
    username: string;
    display_name: string | null;
  };
  last_message: string | null;
};

export default function MessagesList() {
  const { profile } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!profile) return;

    const { data: convs, error } = await supabase
      .from('conversations')
      .select(`
        id,
        updated_at,
        participant_1,
        participant_2
      `)
      .or(`participant_1.eq.${profile.id},participant_2.eq.${profile.id}`)
      .order('updated_at', { ascending: false });

    if (!convs) {
      setItems([]);
      setLoading(false);
      return;
    }

    const otherIds = convs.map(c => c.participant_1 === profile.id ? c.participant_2 : c.participant_1);
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, username, display_name')
      .in('id', otherIds);

    const { data: lastMessages } = await supabase
      .from('messages')
      .select('conversation_id, content, created_at')
      .in('conversation_id', convs.map(c => c.id))
      .order('created_at', { ascending: false });

    const rows: Conversation[] = convs.map(c => {
      const otherId = c.participant_1 === profile.id ? c.participant_2 : c.participant_1;
      const p = profiles?.find(x => x.id === otherId);
      const lastMsg = lastMessages?.find(m => m.conversation_id === c.id);
      return {
        id: c.id,
        updated_at: c.updated_at,
        other_profile: {
          id: otherId,
          username: p?.username || '?',
          display_name: p?.display_name || null,
        },
        last_message: lastMsg?.content || null,
      };
    });

    setItems(rows);
    setLoading(false);
  }, [profile]);

  useEffect(() => { load(); }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
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
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Mesajlar</Text>
      </View>

      <FlatList
        data={items}
        keyExtractor={i => i.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#ff6b35" />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>💬</Text>
            <Text style={styles.emptyText}>Henüz bir mesaj yok.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.card}
            onPress={() => router.push(`/chat/${item.id}` as any)}
          >
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {(item.other_profile.display_name || item.other_profile.username)[0].toUpperCase()}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.row}>
                <Text style={styles.name}>{item.other_profile.display_name || item.other_profile.username}</Text>
                <Text style={styles.date}>
                  {format(new Date(item.updated_at), 'HH:mm', { locale: tr })}
                </Text>
              </View>
              <Text style={styles.lastMsg} numberOfLines={1}>
                {item.last_message || 'Mesaj gönderilmedi.'}
              </Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0a0a0a' },
  header: { padding: 24, paddingTop: 60, flexDirection: 'row', alignItems: 'center', gap: 16 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#1a1a1a', justifyContent: 'center', alignItems: 'center' },
  backText: { color: '#fff', fontSize: 24, fontWeight: '900' },
  title: { color: '#fff', fontSize: 28, fontWeight: '900', letterSpacing: -1 },
  empty: { padding: 48, alignItems: 'center' },
  emptyEmoji: { fontSize: 56, marginBottom: 16, opacity: 0.2 },
  emptyText: { color: '#666', fontSize: 14, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2 },
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 16,
    marginHorizontal: 16, marginBottom: 8, padding: 16,
    backgroundColor: '#111', borderRadius: 24, borderWidth: 1, borderColor: '#222',
  },
  avatar: { width: 56, height: 56, borderRadius: 24, backgroundColor: '#222', justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#fff', fontSize: 20, fontWeight: '900' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { color: '#fff', fontSize: 16, fontWeight: '800' },
  date: { color: '#444', fontSize: 10, fontWeight: '900' },
  lastMsg: { color: '#888', fontSize: 13, marginTop: 4, fontWeight: '500' },
});
