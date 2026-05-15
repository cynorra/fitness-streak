import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  FlatList, Alert, ActivityIndicator,
} from 'react-native';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'expo-router';
import { useAuth } from '../../lib/auth';

type FriendRow = {
  id: string;
  username: string;
  display_name: string | null;
  current_streak: number;
  status: 'friend' | 'incoming' | 'outgoing';
  friendship_id: string;
};

export default function Friends() {
  const { profile } = useAuth();
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [friends, setFriends] = useState<FriendRow[]>([]);
  const [loading, setLoading] = useState(true);

  const loadFriends = useCallback(async () => {
    if (!profile) return;

    const { data: rels } = await supabase
      .from('friendships')
      .select('*')
      .or(`requester_id.eq.${profile.id},addressee_id.eq.${profile.id}`);

    if (!rels || rels.length === 0) {
      setFriends([]);
      setLoading(false);
      return;
    }

    const otherIds = rels.map(r =>
      r.requester_id === profile.id ? r.addressee_id : r.requester_id
    );
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, username, display_name, current_streak')
      .in('id', otherIds);

    const rows: FriendRow[] = rels.map(r => {
      const otherId = r.requester_id === profile.id ? r.addressee_id : r.requester_id;
      const p = profiles?.find(x => x.id === otherId);
      let status: FriendRow['status'];
      if (r.status === 'accepted') status = 'friend';
      else if (r.addressee_id === profile.id) status = 'incoming';
      else status = 'outgoing';
      return {
        id: otherId,
        username: p?.username || '?',
        display_name: p?.display_name || null,
        current_streak: p?.current_streak ?? 0,
        status,
        friendship_id: r.id,
      };
    });

    setFriends(rows);
    setLoading(false);
  }, [profile]);

  useEffect(() => { loadFriends(); }, [loadFriends]);

  const doSearch = async (q: string) => {
    setQuery(q);
    if (!q || q.length < 2) {
      setSearchResults([]);
      return;
    }
    const { data } = await supabase
      .from('profiles')
      .select('id, username, display_name, current_streak')
      .ilike('username', `%${q}%`)
      .neq('id', profile?.id || '')
      .limit(10);
    setSearchResults(data || []);
  };

  const sendRequest = async (userId: string) => {
    if (!profile) return;
    const { error } = await supabase.from('friendships').insert({
      requester_id: profile.id,
      addressee_id: userId,
      status: 'pending',
    });
    if (error) {
      Alert.alert('Hata', error.message);
      return;
    }
    setQuery('');
    setSearchResults([]);
    loadFriends();
  };

  const respondRequest = async (friendshipId: string, accept: boolean) => {
    if (accept) {
      await supabase.from('friendships').update({ status: 'accepted' }).eq('id', friendshipId);
    } else {
      await supabase.from('friendships').delete().eq('id', friendshipId);
    }
    loadFriends();
  };

  const incoming = friends.filter(f => f.status === 'incoming');
  const accepted = friends.filter(f => f.status === 'friend');
  const outgoing = friends.filter(f => f.status === 'outgoing');

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
        <Text style={styles.title}>ARKADAŞLAR</Text>
      </View>

      <TextInput
        style={styles.searchInput}
        placeholder="Kullanıcı adı ara..."
        placeholderTextColor="#666"
        value={query}
        onChangeText={doSearch}
        autoCapitalize="none"
      />

      <FlatList
        data={searchResults.length > 0 ? searchResults : []}
        keyExtractor={i => i.id}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <View style={styles.avatar}><Text style={styles.avatarText}>{item.username[0].toUpperCase()}</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{item.display_name || item.username}</Text>
              <Text style={styles.handle}>@{item.username} • 🔥 {item.current_streak}</Text>
            </View>
            <TouchableOpacity style={styles.addBtn} onPress={() => sendRequest(item.id)}>
              <Text style={styles.addBtnText}>+ Ekle</Text>
            </TouchableOpacity>
          </View>
        )}
        ListFooterComponent={
          searchResults.length === 0 ? (
            <View>
              {incoming.length > 0 && (
                <View>
                  <Text style={styles.section}>GELEN İSTEKLER</Text>
                  {incoming.map(f => (
                    <View key={f.friendship_id} style={styles.row}>
                      <View style={styles.avatar}><Text style={styles.avatarText}>{f.username[0].toUpperCase()}</Text></View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.name}>{f.display_name || f.username}</Text>
                        <Text style={styles.handle}>@{f.username}</Text>
                      </View>
                      <TouchableOpacity style={styles.acceptBtn} onPress={() => respondRequest(f.friendship_id, true)}>
                        <Text style={styles.acceptBtnText}>Kabul</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.rejectBtn} onPress={() => respondRequest(f.friendship_id, false)}>
                        <Text style={styles.rejectBtnText}>✕</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}

              <Text style={styles.section}>ARKADAŞLAR ({accepted.length})</Text>
              {accepted.length === 0 ? (
                <Text style={styles.emptyHint}>
                  Arkadaşın yok henüz. Yukarıdan ara, ekle.
                </Text>
              ) : (
                accepted.map(f => (
                  <View key={f.friendship_id} style={styles.row}>
                    <View style={styles.avatar}><Text style={styles.avatarText}>{f.username[0].toUpperCase()}</Text></View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.name}>{f.display_name || f.username}</Text>
                      <Text style={styles.handle}>@{f.username} • 🔥 {f.current_streak}</Text>
                    </View>
                  </View>
                ))
              )}

              {outgoing.length > 0 && (
                <View>
                  <Text style={styles.section}>BEKLEYEN İSTEKLER</Text>
                  {outgoing.map(f => (
                    <View key={f.friendship_id} style={styles.row}>
                      <View style={styles.avatar}><Text style={styles.avatarText}>{f.username[0].toUpperCase()}</Text></View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.name}>{f.display_name || f.username}</Text>
                        <Text style={styles.handle}>@{f.username} • bekliyor...</Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          ) : null
        }
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
  searchInput: {
    backgroundColor: '#1a1a1a', marginHorizontal: 16, marginBottom: 16,
    padding: 14, borderRadius: 12, color: '#fff', fontSize: 15,
    borderWidth: 1, borderColor: '#2a2a2a',
  },
  section: {
    color: '#666', fontSize: 11, fontWeight: '700',
    letterSpacing: 2, paddingHorizontal: 16, marginTop: 16, marginBottom: 8,
  },
  row: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 16, marginBottom: 8, padding: 12,
    backgroundColor: '#1a1a1a', borderRadius: 12, gap: 12,
  },
  avatar: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#ff6b35',
    justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { color: '#fff', fontWeight: '900' },
  name: { color: '#fff', fontSize: 15, fontWeight: '600' },
  handle: { color: '#888', fontSize: 12, marginTop: 2 },
  addBtn: { backgroundColor: '#ff6b35', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 8 },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  acceptBtn: { backgroundColor: '#ff6b35', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 8 },
  acceptBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  rejectBtn: { backgroundColor: '#2a2a2a', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8 },
  rejectBtnText: { color: '#fff', fontWeight: '700' },
  emptyHint: { color: '#666', fontSize: 13, paddingHorizontal: 16, fontStyle: 'italic' },
});
