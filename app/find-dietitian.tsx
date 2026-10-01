import { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, TextInput, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';
import { useTranslation } from '../lib/i18n/i18n';
import { friendlyError } from '../lib/useOnline';

type Dietitian = { id: string; username: string; display_name: string | null; bio: string | null; specialty: string | null };
type Status = 'pending' | 'approved' | 'rejected';

export default function FindDietitian() {
  const { profile } = useAuth();
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [dietitians, setDietitians] = useState<Dietitian[]>([]);
  const [statusById, setStatusById] = useState<Record<string, Status>>({});
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!profile) return;
    const [list, mine] = await Promise.all([
      supabase
        .from('profiles')
        .select('id, username, display_name, bio, specialty')
        .eq('role', 'dietitian')
        .neq('id', profile.id)
        .limit(100),
      supabase.from('dietitian_clients').select('dietitian_id, status').eq('client_id', profile.id),
    ]);
    setDietitians((list.data || []) as Dietitian[]);
    setStatusById(Object.fromEntries((mine.data || []).map((r: any) => [r.dietitian_id, r.status as Status])));
    setLoading(false);
  }, [profile]);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const sendRequest = async (d: Dietitian) => {
    if (!profile) return;
    setBusyId(d.id);
    const { error } = await supabase
      .from('dietitian_clients')
      .insert({ dietitian_id: d.id, client_id: profile.id, status: 'pending' });
    setBusyId(null);

    // 23505 = a request already exists (unique dietitian/client pair): just reflect it.
    if (error && error.code !== '23505') {
      Alert.alert(t('common.error'), friendlyError(error.message, t));
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setStatusById((s) => ({ ...s, [d.id]: s[d.id] || 'pending' }));
    if (!error) Alert.alert(t('dietitianCare.request_sent'), t('dietitianCare.request_sent_msg'));
  };

  const q = search.trim().toLowerCase();
  const filtered = dietitians.filter((d) =>
    !q || `${d.display_name || ''} ${d.username} ${d.specialty || ''}`.toLowerCase().includes(q)
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>{t('dietitianCare.find_title')}</Text>
      </View>

      <TextInput
        style={styles.search}
        placeholder={t('dietitianCare.find_search')}
        placeholderTextColor="#666"
        value={search}
        onChangeText={setSearch}
      />

      {loading ? (
        <ActivityIndicator color="#10b981" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(d) => d.id}
          contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 40 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#10b981" />}
          ListEmptyComponent={<Text style={styles.empty}>{t('dietitianCare.find_empty')}</Text>}
          renderItem={({ item }) => {
            const status = statusById[item.id];
            return (
              <View style={styles.card}>
                <View style={styles.row}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{(item.display_name || item.username)[0].toUpperCase()}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.name}>{item.display_name || item.username}</Text>
                    {!!item.specialty && <Text style={styles.specialty}>{item.specialty}</Text>}
                  </View>
                </View>
                {!!item.bio && <Text style={styles.bio} numberOfLines={3}>{item.bio}</Text>}

                {status ? (
                  <View style={[styles.badge, status === 'approved' && styles.badgeOk, status === 'rejected' && styles.badgeNo]}>
                    <Text style={styles.badgeText}>{t(`dietitianCare.st_${status}`)}</Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={[styles.requestBtn, busyId === item.id && { opacity: 0.5 }]}
                    disabled={busyId === item.id}
                    onPress={() => sendRequest(item)}
                  >
                    <Text style={styles.requestText}>{t('dietitianCare.request')}</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingBottom: 8 },
  backBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  title: { color: '#fff', fontSize: 18, fontWeight: '900', letterSpacing: 0.5 },
  search: { marginHorizontal: 20, marginTop: 4, backgroundColor: '#111', borderWidth: 1, borderColor: '#222', borderRadius: 12, padding: 14, color: '#fff' },
  empty: { color: '#888', textAlign: 'center', marginTop: 40, fontSize: 14 },
  card: { backgroundColor: '#111', borderWidth: 1, borderColor: '#222', borderRadius: 18, padding: 16, marginBottom: 14 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 46, height: 46, borderRadius: 23, backgroundColor: '#10b98130', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#10b981', fontSize: 18, fontWeight: '900' },
  name: { color: '#fff', fontSize: 16, fontWeight: '800' },
  specialty: { color: '#8b5cf6', fontSize: 12, fontWeight: '700', marginTop: 2 },
  bio: { color: '#aaa', fontSize: 13, marginTop: 10 },
  requestBtn: { backgroundColor: '#10b981', borderRadius: 12, paddingVertical: 12, alignItems: 'center', marginTop: 12 },
  requestText: { color: '#fff', fontSize: 13, fontWeight: '900', letterSpacing: 0.5 },
  badge: { backgroundColor: '#f59e0b22', borderRadius: 12, paddingVertical: 10, alignItems: 'center', marginTop: 12 },
  badgeOk: { backgroundColor: '#10b98122' },
  badgeNo: { backgroundColor: '#ef444422' },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: '800' },
});
