import { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, TextInput, ActivityIndicator, Alert, RefreshControl, Modal } from 'react-native';
import StarRating from '../components/StarRating';
import { fetchDietitianScores, trustColor, DietitianScore } from '../lib/dietitianScores';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';
import { useTranslation } from '../lib/i18n/i18n';
import { friendlyError } from '../lib/useOnline';
import AmbientBackground from '../components/AmbientBackground';

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
  const [scores, setScores] = useState<Map<string, DietitianScore>>(new Map());
  const [myReviews, setMyReviews] = useState<Record<string, { rating: number; comment: string | null }>>({});
  const [rateTarget, setRateTarget] = useState<Dietitian | null>(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [savingReview, setSavingReview] = useState(false);

  const load = useCallback(async () => {
    if (!profile) return;
    const [scoreMap, reviewsRes] = await Promise.all([
      fetchDietitianScores(),
      supabase.from('dietitian_reviews').select('dietitian_id, rating, comment').eq('client_id', profile.id),
    ]);
    setScores(scoreMap);
    setMyReviews(
      Object.fromEntries((reviewsRes.data || []).map((r: any) => [r.dietitian_id, { rating: r.rating, comment: r.comment }]))
    );
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

  const openRate = (d: Dietitian) => {
    const mine = myReviews[d.id];
    setRating(mine?.rating || 0);
    setComment(mine?.comment || '');
    setRateTarget(d);
  };

  const saveReview = async () => {
    if (!profile || !rateTarget) return;
    if (rating < 1) {
      Alert.alert(t('common.error'), t('dietitianCare.rate_pick'));
      return;
    }
    setSavingReview(true);
    // upsert on the unique (dietitian, client) pair: first rating inserts, later ones edit it.
    const { error } = await supabase.from('dietitian_reviews').upsert(
      { dietitian_id: rateTarget.id, client_id: profile.id, rating, comment: comment.trim() || null },
      { onConflict: 'dietitian_id,client_id' }
    );
    setSavingReview(false);
    if (error) {
      Alert.alert(t('common.error'), friendlyError(error.message, t) || t('dietitianCare.rate_failed'));
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setRateTarget(null);
    Alert.alert(t('common.success'), t('dietitianCare.rate_saved'));
    load();
  };

  const q = search.trim().toLowerCase();
  // Highest trust score first; the score itself rises with ratings.
  const filtered = dietitians
    .filter((d) => !q || `${d.display_name || ''} ${d.username} ${d.specialty || ''}`.toLowerCase().includes(q))
    .sort((a, b) => (scores.get(b.id)?.trust_score ?? 0) - (scores.get(a.id)?.trust_score ?? 0));

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <AmbientBackground />
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
            const score = scores.get(item.id);
            return (
              <View style={styles.card}>
                <View style={styles.row}>
                  <TouchableOpacity activeOpacity={0.7} style={styles.avatar} onPress={() => router.push(`/user/${item.id}` as any)}>
                    <Text style={styles.avatarText}>{(item.display_name || item.username)[0].toUpperCase()}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity activeOpacity={0.7} style={{ flex: 1 }} onPress={() => router.push(`/user/${item.id}` as any)}>
                    <Text style={styles.name}>{item.display_name || item.username}</Text>
                    {!!item.specialty && <Text style={styles.specialty}>{item.specialty}</Text>}
                    <View style={styles.ratingRow}>
                      <StarRating value={score?.avg_rating || 0} size={15} />
                      <Text style={styles.ratingText}>
                        {score && score.review_count > 0
                          ? `${score.avg_rating.toFixed(1)} · ${t('dietitianCare.reviews_n', { n: score.review_count })}`
                          : t('dietitianCare.no_reviews')}
                      </Text>
                    </View>
                    {!!score && score.referral_count > 0 && (
                      <Text style={styles.referralBadge}>{score.referral_count} {t('referral.invited')}</Text>
                    )}
                  </TouchableOpacity>
                  {score && (
                    <View style={[styles.trustPill, { borderColor: trustColor(score.trust_score) }]}>
                      <Text style={[styles.trustValue, { color: trustColor(score.trust_score) }]}>{score.trust_score}</Text>
                      <Text style={styles.trustLabel}>{t('dietitianCare.trust')}</Text>
                    </View>
                  )}
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

                {status === 'approved' && (
                  <TouchableOpacity style={styles.rateBtn} onPress={() => openRate(item)}>
                    <Ionicons name="star" size={14} color="#fbbf24" />
                    <Text style={styles.rateText}>
                      {myReviews[item.id] ? t('dietitianCare.rate_edit') : t('dietitianCare.rate')}
                    </Text>
                  </TouchableOpacity>
                )}
                {status === 'approved' && (
                  <TouchableOpacity
                    style={[styles.rateBtn, { borderColor: '#ec4899' }]}
                    onPress={() => router.push({ pathname: '/share-card' as any, params: { variant: 'together', partnerId: item.id } })}
                  >
                    <Ionicons name="people" size={14} color="#ec4899" />
                    <Text style={[styles.rateText, { color: '#ec4899' }]}>{t('share.v_together')}</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          }}
        />
      )}

      <Modal visible={!!rateTarget} transparent animationType="fade" onRequestClose={() => setRateTarget(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{t('dietitianCare.rate_title')}</Text>
            <Text style={styles.modalName}>{rateTarget?.display_name || rateTarget?.username}</Text>
            <View style={{ alignItems: 'center', marginVertical: 14 }}>
              <StarRating value={rating} size={38} onChange={setRating} />
            </View>
            <TextInput
              style={styles.commentInput}
              placeholder={t('dietitianCare.rate_ph')}
              placeholderTextColor="#666"
              value={comment}
              onChangeText={setComment}
              multiline
              maxLength={500}
            />
            <Text style={styles.trustInfo}>{t('dietitianCare.trust_info')}</Text>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setRateTarget(null)}>
                <Text style={styles.cancelText}>{t('dietitianCare.rate_cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveBtn, savingReview && { opacity: 0.5 }]}
                disabled={savingReview}
                onPress={saveReview}
              >
                <Text style={styles.saveText}>{t('common.save')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050607' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingBottom: 8 },
  backBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  title: { color: '#fff', fontSize: 18, fontWeight: '900', letterSpacing: 0.5 },
  search: { marginHorizontal: 20, marginTop: 4, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.09)', borderRadius: 12, padding: 14, color: '#fff' },
  empty: { color: '#888', textAlign: 'center', marginTop: 40, fontSize: 14 },
  card: { backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.09)', borderRadius: 18, padding: 16, marginBottom: 14 },
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
  referralBadge: { color: '#a78bfa', fontSize: 11, fontWeight: '700', marginTop: 4 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  ratingText: { color: '#a1a1aa', fontSize: 11, fontWeight: '600' },
  trustPill: { borderWidth: 1, borderRadius: 12, paddingVertical: 6, paddingHorizontal: 10, alignItems: 'center', minWidth: 58 },
  trustValue: { fontSize: 18, fontWeight: '900' },
  trustLabel: { color: '#71717a', fontSize: 9, fontWeight: '800', textTransform: 'uppercase' },
  rateBtn: { flexDirection: 'row', justifyContent: 'center', gap: 6, borderWidth: 1, borderColor: '#fbbf24', borderRadius: 12, paddingVertical: 10, alignItems: 'center', marginTop: 8 },
  rateText: { color: '#fbbf24', fontSize: 13, fontWeight: '800' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'center', padding: 20 },
  modalCard: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.09)' },
  modalTitle: { color: '#fff', fontSize: 16, fontWeight: '900', textAlign: 'center' },
  modalName: { color: '#10b981', fontSize: 14, fontWeight: '700', textAlign: 'center', marginTop: 4 },
  commentInput: { backgroundColor: '#0a0a0a', borderWidth: 1, borderColor: 'rgba(255,255,255,0.09)', borderRadius: 12, padding: 12, color: '#fff', minHeight: 80, textAlignVertical: 'top' },
  trustInfo: { color: '#71717a', fontSize: 11, marginTop: 10 },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 16 },
  cancelBtn: { flex: 1, borderRadius: 12, paddingVertical: 12, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)' },
  cancelText: { color: '#aaa', fontWeight: '800' },
  saveBtn: { flex: 1, borderRadius: 12, paddingVertical: 12, alignItems: 'center', backgroundColor: '#10b981' },
  saveText: { color: '#fff', fontWeight: '900' },
});
