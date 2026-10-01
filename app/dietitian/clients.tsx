import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../lib/auth';
import { supabase } from '../../lib/supabase';
import GlassCard from '../../components/GlassCard';
import { calculateNutritionTargets, BMRParams } from '../../lib/nutritionCalc';
import { useTranslation } from '../../lib/i18n/i18n';
import { friendlyError } from '../../lib/useOnline';
import StarRating from '../../components/StarRating';
import { fetchClientCockpit, ClientCockpit, STATUS_COLORS } from '../../lib/clientCockpit';
import { fetchDietitianScores, trustColor, DietitianScore } from '../../lib/dietitianScores';

export default function DietitianClients() {
  const { profile } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t, locale } = useTranslation();

  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // BMR Calc Modal state
  const [calcModalVisible, setCalcModalVisible] = useState(false);
  const [calcParams, setCalcParams] = useState<BMRParams>({
    weightKg: 75,
    heightCm: 175,
    ageYears: 28,
    gender: 'male',
    activityLevel: 'moderate',
    goal: 'lose_weight',
  });
  const [calcResult, setCalcResult] = useState<any>(null);
  const [cockpit, setCockpit] = useState<Map<string, ClientCockpit>>(new Map());
  // The dietitian's own trust score + latest reviews
  const [myScore, setMyScore] = useState<DietitianScore | null>(null);
  const [latestReviews, setLatestReviews] = useState<{ id: string; rating: number; comment: string | null }[]>([]);

  useEffect(() => {
    if (!profile) return;
    (async () => {
      const scoreMap = await fetchDietitianScores();
      setMyScore(scoreMap.get(profile.id) || null);
      const { data } = await supabase
        .from('dietitian_reviews')
        .select('id, rating, comment')
        .eq('dietitian_id', profile.id)
        .not('comment', 'is', null)
        .order('created_at', { ascending: false })
        .limit(3);
      setLatestReviews((data || []) as any);
    })();
  }, [profile]);

  // Free-text fields so the user can clear/retype values (including decimals) without snapping back.
  const [weightText, setWeightText] = useState('75');
  const [heightText, setHeightText] = useState('175');
  const [ageText, setAgeText] = useState('28');

  useEffect(() => {
    loadClients();
  }, [profile?.id]);

  const loadClients = async () => {
    if (!profile) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('dietitian_clients')
        .select(`
          id, status, created_at,
          client:client_id (id, username, display_name, avatar_url, current_streak)
        `)
        .eq('dietitian_id', profile.id);

      if (error) throw error;
      setClients(data || []);

      // Live dashboard data for approved clients (failure just hides the dashboard row).
      const approvedIds = (data || []).filter((c: any) => c.status === 'approved').map((c: any) => c.client?.id).filter(Boolean);
      fetchClientCockpit(profile.id, approvedIds).then(setCockpit).catch(() => {});
    } catch (err: any) {
      console.error('Error loading clients:', err);
    } finally {
      setLoading(false);
    }
  };

  // Find (or create) the conversation with a client; the chat route expects a conversation id.
  const openChat = async (clientId?: string) => {
    if (!profile || !clientId) return;
    try {
      const { data: existing } = await supabase
        .from('conversations')
        .select('id')
        .or(
          `and(participant_1.eq.${profile.id},participant_2.eq.${clientId}),and(participant_1.eq.${clientId},participant_2.eq.${profile.id})`
        )
        .limit(1);
      let conversationId = existing?.[0]?.id;
      if (!conversationId) {
        const { data: created, error } = await supabase
          .from('conversations')
          .insert({ participant_1: profile.id, participant_2: clientId })
          .select('id')
          .single();
        if (error) throw error;
        conversationId = created.id;
      }
      router.push(`/chat/${conversationId}` as any);
    } catch (err: any) {
      Alert.alert(t('common.error'), friendlyError(err?.message, t) || t('clients.chat_failed'));
    }
  };

  const respondToRequest = async (requestId: string, approve: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const { error } = await supabase
      .from('dietitian_clients')
      .update({ status: approve ? 'approved' : 'rejected' })
      .eq('id', requestId);
    if (error) {
      Alert.alert(t('common.error'), friendlyError(error.message, t));
      return;
    }
    loadClients();
  };

  const handleCalculateBMR = () => {
    const num = (v: string) => parseFloat(v.replace(',', '.'));
    const weightKg = num(weightText);
    const heightCm = num(heightText);
    const ageYears = num(ageText);
    if (
      !(weightKg >= 20 && weightKg <= 300) ||
      !(heightCm >= 100 && heightCm <= 250) ||
      !(ageYears >= 10 && ageYears <= 100)
    ) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(t('common.error'), t('clients.calc_invalid'));
      return;
    }
    const result = calculateNutritionTargets({ ...calcParams, weightKg, heightCm, ageYears });
    setCalcResult(result);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  // Needs-attention first: pending requests, then red → amber → green.
  const rank = (item: any) =>
    item.status === 'pending' ? 0 : ({ red: 1, amber: 2, green: 3 } as const)[cockpit.get(item.client?.id)?.status ?? 'green'];
  const filteredClients = clients
    .filter((item) => {
      const name = item.client?.display_name || item.client?.username || '';
      return name.toLowerCase().includes(search.toLowerCase());
    })
    .sort((a, b) => rank(a) - rank(b));
  const statusCounts = { green: 0, amber: 0, red: 0 };
  cockpit.forEach((c) => { statusCounts[c.status] += 1; });

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <LinearGradient
        colors={['#0F172A', '#0B0F19', '#020617']}
        style={StyleSheet.absoluteFill}
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerTitles}>
          <Text style={styles.headerTitle}>{t('clients.title')}</Text>
          <Text style={styles.headerSub}>{t('clients.sub')}</Text>
        </View>
        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            setCalcModalVisible(true);
          }}
          style={styles.calcTriggerBtn}
        >
          <Ionicons name="calculator-outline" size={22} color="#10b981" />
        </TouchableOpacity>
      </View>

      {/* Search Input */}
      <View style={styles.searchBar}>
        <Ionicons name="search" size={18} color="#64748b" />
        <TextInput
          style={styles.searchInput}
          placeholder={t('clients.search')}
          placeholderTextColor="#64748b"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Quick Stats Bar */}
        <GlassCard style={styles.statsCard}>
          <View style={styles.statBox}>
            <Text style={styles.statVal}>{clients.length}</Text>
            <Text style={styles.statLbl}>{t('clients.total')}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={[styles.statVal, { color: '#10b981' }]}>{clients.filter((c) => c.status === 'approved').length}</Text>
            <Text style={styles.statLbl}>{t('clients.approved')}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={[styles.statVal, { color: '#f59e0b' }]}>{clients.filter((c) => c.status === 'pending').length}</Text>
            <Text style={styles.statLbl}>{t('clients.pending')}</Text>
          </View>
        </GlassCard>

        {cockpit.size > 0 && (
          <View style={styles.statusStrip}>
            <Text style={[styles.statusChip, { color: STATUS_COLORS.green }]}>● {statusCounts.green} {t('dietitianCare.ck_on_track')}</Text>
            <Text style={[styles.statusChip, { color: STATUS_COLORS.amber }]}>● {statusCounts.amber} {t('dietitianCare.ck_watch')}</Text>
            <Text style={[styles.statusChip, { color: STATUS_COLORS.red }]}>● {statusCounts.red} {t('dietitianCare.ck_attention')}</Text>
          </View>
        )}

        {myScore && (
          <GlassCard style={styles.scoreCard}>
            <View style={styles.scoreRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.scoreTitle}>{t('dietitianCare.my_score')}</Text>
                <StarRating value={myScore.avg_rating} size={20} />
                <Text style={styles.scoreSub}>
                  {myScore.review_count > 0
                    ? `${myScore.avg_rating.toFixed(1)} · ${t('dietitianCare.reviews_n', { n: myScore.review_count })}`
                    : t('dietitianCare.no_reviews')}
                </Text>
              </View>
              <View style={[styles.scorePill, { borderColor: trustColor(myScore.trust_score) }]}>
                <Text style={[styles.scoreValue, { color: trustColor(myScore.trust_score) }]}>{myScore.trust_score}</Text>
                <Text style={styles.scoreLabel}>{t('dietitianCare.trust')}</Text>
              </View>
            </View>
            {latestReviews.map((r) => (
              <View key={r.id} style={styles.reviewRow}>
                <StarRating value={r.rating} size={12} />
                <Text style={styles.reviewText}>{r.comment}</Text>
              </View>
            ))}
          </GlassCard>
        )}

        <Text style={styles.sectionTitle}>{t('clients.active')}</Text>

        {loading ? (
          <ActivityIndicator size="large" color="#10b981" style={{ marginTop: 40 }} />
        ) : filteredClients.length === 0 ? (
          <GlassCard style={styles.emptyCard}>
            <Text style={{ fontSize: 40, marginBottom: 12 }}>🩺</Text>
            <Text style={styles.emptyTitle}>{t('clients.empty_title')}</Text>
            <Text style={styles.emptyDesc}>
              {t('clients.empty_desc')}
            </Text>
          </GlassCard>
        ) : (
          filteredClients.map((item) => (
            <GlassCard key={item.id} style={styles.clientCard}>
              <View style={styles.clientHeader}>
                <View style={styles.avatarCircle}>
                  <Text style={styles.avatarText}>
                    {(item.client?.display_name || item.client?.username || 'U')[0].toUpperCase()}
                  </Text>
                </View>

                <View style={styles.clientInfo}>
                  <Text style={styles.clientName}>
                    {item.client?.display_name || item.client?.username}
                  </Text>
                  <Text style={styles.clientStreak}>
                    {t('clients.streak_line', { n: item.client?.current_streak || 0 })}
                  </Text>
                </View>

                <View style={styles.complianceBadge}>
                  <Text style={styles.complianceText}>{t(`clients.st_${item.status}`)}</Text>
                </View>
              </View>

              {item.status === 'approved' && cockpit.get(item.client?.id) && (() => {
                const c = cockpit.get(item.client?.id)!;
                const color = STATUS_COLORS[c.status];
                return (
                  <View style={[styles.cockpitRow, { borderLeftColor: color }]}>
                    <View style={styles.cockpitCell}>
                      <Text style={[styles.cockpitValue, { color }]}>
                        {c.todayKcal}{c.targetKcal ? ` / ${c.targetKcal}` : ''}
                      </Text>
                      <Text style={styles.cockpitLabel}>{t('dietitianCare.ck_today_kcal')}</Text>
                    </View>
                    <View style={styles.cockpitCell}>
                      <Text style={styles.cockpitValue}>{c.workouts7}/7</Text>
                      <Text style={styles.cockpitLabel}>{t('dietitianCare.ck_workouts')}</Text>
                    </View>
                    <View style={styles.cockpitCell}>
                      <Text style={styles.cockpitValue}>
                        {c.daysSinceLastLog === null
                          ? '—'
                          : c.daysSinceLastLog === 0
                            ? t('dietitianCare.today')
                            : t('dietitianCare.ck_days_ago', { n: c.daysSinceLastLog })}
                      </Text>
                      <Text style={styles.cockpitLabel}>{t('dietitianCare.ck_last_log')}</Text>
                    </View>
                  </View>
                );
              })()}

              {item.status === 'pending' && (
                <View style={[styles.actionsRow, { marginBottom: 10 }]}>
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: '#10b98120', borderColor: '#10b981' }]}
                    onPress={() => respondToRequest(item.id, true)}
                  >
                    <Text style={[styles.actionBtnText, { color: '#10b981' }]}>{t('clients.approve')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: '#ef444420', borderColor: '#ef4444' }]}
                    onPress={() => respondToRequest(item.id, false)}
                  >
                    <Text style={[styles.actionBtnText, { color: '#ef4444' }]}>{t('clients.reject')}</Text>
                  </TouchableOpacity>
                </View>
              )}

              {item.status === 'approved' && (
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: '#8b5cf620', borderColor: '#8b5cf6', marginBottom: 10 }]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    router.push({
                      pathname: '/dietitian/client-meals' as any,
                      params: {
                        clientId: item.client?.id,
                        name: item.client?.display_name || item.client?.username || '',
                      },
                    });
                  }}
                >
                  <Ionicons name="restaurant-outline" size={16} color="#8b5cf6" />
                  <Text style={[styles.actionBtnText, { color: '#8b5cf6' }]}>{t('dietitianCare.view_meals')}</Text>
                </TouchableOpacity>
              )}

              {/* Action Buttons */}
              <View style={styles.actionsRow}>
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: '#10b98120', borderColor: '#10b981' }]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    router.push({
                      pathname: '/dietitian/create-plan' as any,
                      params: { clientId: item.client?.id },
                    });
                  }}
                >
                  <Ionicons name="document-text-outline" size={16} color="#10b981" />
                  <Text style={[styles.actionBtnText, { color: '#10b981' }]}>{t('clients.write_diet')}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: '#3b82f620', borderColor: '#3b82f6' }]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    openChat(item.client?.id);
                  }}
                >
                  <Ionicons name="chatbubble-ellipses-outline" size={16} color="#3b82f6" />
                  <Text style={[styles.actionBtnText, { color: '#3b82f6' }]}>{t('clients.message')}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: '#f59e0b20', borderColor: '#f59e0b' }]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    router.push('/appointments' as any);
                  }}
                >
                  <Ionicons name="calendar-outline" size={16} color="#f59e0b" />
                  <Text style={[styles.actionBtnText, { color: '#f59e0b' }]}>{t('clients.session')}</Text>
                </TouchableOpacity>
              </View>
            </GlassCard>
          ))
        )}
      </ScrollView>

      {/* BMR / TDEE Calculator Modal */}
      <Modal visible={calcModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <GlassCard style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('clients.calc_title')}</Text>
              <TouchableOpacity onPress={() => setCalcModalVisible(false)}>
                <Ionicons name="close-circle" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ gap: 12 }}>
              <Text style={styles.inputLabel}>{t('clients.gender')}</Text>
              <View style={styles.chipRow}>
                {(['male', 'female'] as const).map((g) => (
                  <TouchableOpacity
                    key={g}
                    style={[styles.chip, calcParams.gender === g && styles.chipActive]}
                    onPress={() => setCalcParams({ ...calcParams, gender: g })}
                  >
                    <Text style={[styles.chipText, calcParams.gender === g && styles.chipTextActive]}>{t(`clients.${g}`)}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>{t('clients.weight')}</Text>
              <TextInput
                style={styles.modalInput}
                keyboardType="decimal-pad"
                value={weightText}
                onChangeText={setWeightText}
              />

              <Text style={styles.inputLabel}>{t('clients.height')}</Text>
              <TextInput
                style={styles.modalInput}
                keyboardType="decimal-pad"
                value={heightText}
                onChangeText={setHeightText}
              />

              <Text style={styles.inputLabel}>{t('clients.age')}</Text>
              <TextInput
                style={styles.modalInput}
                keyboardType="number-pad"
                value={ageText}
                onChangeText={setAgeText}
              />

              <Text style={styles.inputLabel}>{t('clients.activity')}</Text>
              <View style={styles.chipRow}>
                {(['sedentary', 'light', 'moderate', 'active', 'very_active'] as const).map((a) => (
                  <TouchableOpacity
                    key={a}
                    style={[styles.chip, calcParams.activityLevel === a && styles.chipActive]}
                    onPress={() => setCalcParams({ ...calcParams, activityLevel: a })}
                  >
                    <Text style={[styles.chipText, calcParams.activityLevel === a && styles.chipTextActive]}>{t(`clients.act_${a}`)}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>{t('clients.goal')}</Text>
              <View style={styles.chipRow}>
                {([['lose_weight', 'goal_lose'], ['maintain', 'goal_maintain'], ['gain_weight', 'goal_gain'], ['build_muscle', 'goal_muscle']] as const).map(([g, key]) => (
                  <TouchableOpacity
                    key={g}
                    style={[styles.chip, calcParams.goal === g && styles.chipActive]}
                    onPress={() => setCalcParams({ ...calcParams, goal: g })}
                  >
                    <Text style={[styles.chipText, calcParams.goal === g && styles.chipTextActive]}>{t(`clients.${key}`)}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity style={styles.calcBtn} onPress={handleCalculateBMR}>
                <Text style={styles.calcBtnText}>{t('clients.calc')}</Text>
              </TouchableOpacity>

              {calcResult && (
                <View style={styles.resultBox}>
                  <Text style={styles.resultRow}>{t('clients.bmr')} <Text style={styles.resHighlight}>{calcResult.bmr} kcal</Text></Text>
                  <Text style={styles.resultRow}>{t('clients.tdee')} <Text style={styles.resHighlight}>{calcResult.tdee} kcal</Text></Text>
                  <Text style={styles.resultRow}>{t('clients.target')} <Text style={[styles.resHighlight, { color: '#10b981' }]}>{calcResult.targetCalories} kcal</Text></Text>
                  <Text style={styles.resultRow}>{t('clients.protein')}: {calcResult.macros.proteinGrams}g ({calcResult.macros.proteinPct}%) | {t('clients.carbs')}: {calcResult.macros.carbsGrams}g ({calcResult.macros.carbsPct}%) | {t('clients.fat')}: {calcResult.macros.fatGrams}g ({calcResult.macros.fatPct}%)</Text>
                  <Text style={styles.calcNote}>{t('clients.calc_note')}</Text>
                </View>
              )}
            </ScrollView>
          </GlassCard>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 12,
  },
  backBtn: { padding: 4 },
  headerTitles: { flex: 1 },
  headerTitle: { color: '#fff', fontSize: 16, fontWeight: '900', letterSpacing: 0.5 },
  headerSub: { color: '#64748b', fontSize: 11, fontWeight: '600' },
  calcTriggerBtn: {
    backgroundColor: '#10b98120',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#10b981',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  searchInput: { flex: 1, color: '#fff', fontSize: 14 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
  statsCard: { flexDirection: 'row', padding: 18, marginBottom: 20, justifyContent: 'space-around' },
  statBox: { alignItems: 'center' },
  statVal: { color: '#fff', fontSize: 20, fontWeight: '900' },
  statLbl: { color: '#64748b', fontSize: 9, fontWeight: '900', marginTop: 4 },
  statDivider: { width: 1, backgroundColor: 'rgba(255, 255, 255, 0.1)' },
  sectionTitle: { color: '#94a3b8', fontSize: 11, fontWeight: '900', letterSpacing: 1.5, marginBottom: 12 },
  emptyCard: { padding: 32, alignItems: 'center' },
  emptyTitle: { color: '#fff', fontSize: 16, fontWeight: '800', marginBottom: 6 },
  emptyDesc: { color: '#64748b', fontSize: 12, textAlign: 'center' },
  clientCard: { padding: 16, marginBottom: 14 },
  clientHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#10b98120',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#10b981',
  },
  avatarText: { color: '#10b981', fontSize: 18, fontWeight: '900' },
  clientInfo: { flex: 1 },
  clientName: { color: '#fff', fontSize: 15, fontWeight: '800' },
  clientStreak: { color: '#64748b', fontSize: 11, marginTop: 2 },
  complianceBadge: {
    backgroundColor: '#10b98120',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#10b981',
  },
  complianceText: { color: '#10b981', fontSize: 10, fontWeight: '900' },
  actionsRow: { flexDirection: 'row', gap: 8 },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  actionBtnText: { fontSize: 12, fontWeight: '800' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.8)', justifyContent: 'center', padding: 20 },
  modalContent: { padding: 24, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { color: '#fff', fontSize: 16, fontWeight: '900' },
  inputLabel: { color: '#94a3b8', fontSize: 10, fontWeight: '900', marginTop: 8 },
  statusStrip: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14, paddingHorizontal: 4 },
  statusChip: { fontSize: 12, fontWeight: '800' },
  cockpitRow: { flexDirection: 'row', borderLeftWidth: 4, backgroundColor: '#ffffff08', borderRadius: 10, paddingVertical: 10, paddingHorizontal: 12, marginBottom: 10 },
  cockpitCell: { flex: 1 },
  cockpitValue: { color: '#fff', fontSize: 14, fontWeight: '900' },
  cockpitLabel: { color: '#71717a', fontSize: 10, fontWeight: '700', marginTop: 2 },
  scoreCard: { padding: 16, marginBottom: 16 },
  scoreRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  scoreTitle: { color: '#94a3b8', fontSize: 11, fontWeight: '900', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 },
  scoreSub: { color: '#a1a1aa', fontSize: 12, fontWeight: '600', marginTop: 4 },
  scorePill: { borderWidth: 1, borderRadius: 14, paddingVertical: 8, paddingHorizontal: 14, alignItems: 'center' },
  scoreValue: { fontSize: 26, fontWeight: '900' },
  scoreLabel: { color: '#71717a', fontSize: 9, fontWeight: '800', textTransform: 'uppercase' },
  reviewRow: { marginTop: 10, gap: 4 },
  reviewText: { color: '#d4d4d8', fontSize: 12 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 999, borderWidth: 1, borderColor: '#334155', backgroundColor: '#0f172a' },
  chipActive: { borderColor: '#10b981', backgroundColor: '#10b98122' },
  chipText: { color: '#94a3b8', fontSize: 12, fontWeight: '700' },
  chipTextActive: { color: '#10b981' },
  calcNote: { color: '#64748b', fontSize: 11, marginTop: 8 },
  modalInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    padding: 12,
    color: '#fff',
    fontSize: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  calcBtn: { backgroundColor: '#10b981', padding: 14, borderRadius: 12, alignItems: 'center', marginTop: 16 },
  calcBtnText: { color: '#fff', fontWeight: '900', fontSize: 14 },
  resultBox: { marginTop: 16, backgroundColor: 'rgba(16, 185, 129, 0.1)', padding: 14, borderRadius: 12, gap: 6 },
  resultRow: { color: '#cbd5e1', fontSize: 12 },
  resHighlight: { fontWeight: '900', color: '#fff' },
});
