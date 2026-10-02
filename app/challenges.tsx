import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl, Modal, TextInput, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { addDays, differenceInCalendarDays, format, parseISO } from 'date-fns';
import * as Haptics from 'expo-haptics';
import { useTranslation } from '../lib/i18n/i18n';
import { checkContentModeration } from '../lib/profanityFilter';
import { friendlyError } from '../lib/useOnline';

type GoalType = 'workouts' | 'meal_log_days';
const DURATIONS = [7, 14, 30];

export default function Challenges() {
  const { profile } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  const [challenges, setChallenges] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // Create form (dietitians only)
  const [createOpen, setCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newGoalType, setNewGoalType] = useState<GoalType>('workouts');
  const [newGoalValue, setNewGoalValue] = useState('10');
  const [newDuration, setNewDuration] = useState(14);
  const [creating, setCreating] = useState(false);

  const isDietitian = profile?.role === 'dietitian';
  const todayStr = format(new Date(), 'yyyy-MM-dd');

  const loadChallenges = useCallback(async () => {
    if (!profile) return;

    const { data: allChallenges, error: challengesError } = await supabase
      .from('challenges')
      .select('*')
      .order('end_date', { ascending: true });
    if (challengesError || !allChallenges) return;

    const [{ data: userProgress }, { data: creators }, { data: counts }] = await Promise.all([
      supabase.from('user_challenges').select('*').eq('user_id', profile.id),
      supabase.from('profiles').select('id, display_name, username').in('id', [...new Set(allChallenges.map((c) => c.creator_id))]),
      supabase.rpc('get_challenge_participants'),
    ]);

    const creatorName = new Map((creators || []).map((p: any) => [p.id, p.display_name || p.username]));
    const countMap = new Map((counts || []).map((r: any) => [r.challenge_id, r.participants]));

    setChallenges(
      allChallenges.map((c) => ({
        ...c,
        creatorName: creatorName.get(c.creator_id) || '',
        participants: countMap.get(c.id) || 0,
        userProgress: userProgress?.find((up) => up.challenge_id === c.id) || null,
      }))
    );
  }, [profile]);

  useEffect(() => {
    loadChallenges();
  }, [loadChallenges]);

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
      status: 'accepted',
    });
    if (error && error.code !== '23505') {
      Alert.alert(t('common.error'), friendlyError(error.message, t));
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    loadChallenges();
  };

  const handleCreate = async () => {
    if (!profile) return;
    const goalValue = parseInt(newGoalValue, 10);
    if (newTitle.trim().length < 3 || !(goalValue >= 1 && goalValue <= 1000)) {
      Alert.alert(t('common.error'), t('challenges.create_invalid'));
      return;
    }
    const mod = checkContentModeration(`${newTitle} ${newDesc}`);
    if (!mod.isClean) {
      Alert.alert(t('common.error'), mod.reason);
      return;
    }
    setCreating(true);
    const start = new Date();
    const { error } = await supabase.from('challenges').insert({
      creator_id: profile.id,
      title: newTitle.trim(),
      description: newDesc.trim() || null,
      goal_type: newGoalType,
      goal_value: goalValue,
      start_date: format(start, 'yyyy-MM-dd'),
      end_date: format(addDays(start, newDuration - 1), 'yyyy-MM-dd'),
    });
    setCreating(false);
    if (error) {
      Alert.alert(t('common.error'), friendlyError(error.message, t));
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setCreateOpen(false);
    setNewTitle('');
    setNewDesc('');
    Alert.alert(t('common.success'), t('challenges.created'));
    loadChallenges();
  };

  // Active (not yet ended) first, ended ones last
  const sorted = [...challenges].sort((a, b) => {
    const aEnded = a.end_date && a.end_date < todayStr ? 1 : 0;
    const bEnded = b.end_date && b.end_date < todayStr ? 1 : 0;
    return aEnded - bEnded;
  });

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{t('challenges.title')}</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#10b981" />}
      >
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>{t('challenges.info')}</Text>
        </View>

        {isDietitian && (
          <TouchableOpacity style={styles.createBtn} onPress={() => setCreateOpen(true)}>
            <Text style={styles.createBtnText}>＋ {t('challenges.create')}</Text>
          </TouchableOpacity>
        )}

        {sorted.length === 0 && <Text style={styles.emptyText}>{t('challenges.empty')}</Text>}

        {sorted.map((c, index) => {
          const isJoined = !!c.userProgress;
          const isCompleted = c.userProgress?.status === 'completed';
          const target = c.goal_value ?? c.target_value;
          const ended = !!c.end_date && c.end_date < todayStr;
          const daysLeft = c.end_date ? differenceInCalendarDays(parseISO(c.end_date), new Date()) : null;
          const progressPercent = isJoined ? Math.min(100, (c.userProgress.progress / (target || 1)) * 100) : 0;

          return (
            <Animated.View key={c.id} entering={FadeInDown.delay(index * 80).springify()} style={[styles.card, ended && { opacity: 0.55 }]}>
              <View style={styles.cardHeader}>
                <Text style={styles.challengeTitle}>{c.title}</Text>
                {isCompleted && <Text style={styles.badgeCompleted}>{t('challenges.done')}</Text>}
              </View>

              {!!c.creatorName && <Text style={styles.creator}>🥗 {t('challenges.by', { name: c.creatorName })}</Text>}
              {!!c.description && <Text style={styles.challengeDesc}>{c.description}</Text>}

              <View style={styles.metaRow}>
                <Text style={styles.metaChip}>🎯 {t(`challenges.goal_${c.goal_type}`, { n: target })}</Text>
                <Text style={styles.metaChip}>👥 {t('challenges.participants', { n: c.participants })}</Text>
                {daysLeft !== null && (
                  <Text style={styles.metaChip}>{ended ? t('challenges.ended') : t('challenges.days_left', { n: Math.max(daysLeft, 0) + 1 })}</Text>
                )}
              </View>

              {isJoined ? (
                <View style={styles.progressContainer}>
                  <View style={styles.progressHeader}>
                    <Text style={styles.progressText}>{t('challenges.progress')}: {c.userProgress.progress} / {target}</Text>
                    <Text style={styles.progressPercent}>{Math.round(progressPercent)}%</Text>
                  </View>
                  <View style={styles.progressBarBg}>
                    <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
                  </View>
                </View>
              ) : !ended ? (
                <TouchableOpacity style={styles.joinBtn} onPress={() => handleJoin(c.id)}>
                  <Text style={styles.joinBtnText}>{t('challenges.join')}</Text>
                </TouchableOpacity>
              ) : null}
            </Animated.View>
          );
        })}
      </ScrollView>

      <Modal visible={createOpen} transparent animationType="slide" onRequestClose={() => setCreateOpen(false)}>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{t('challenges.create')}</Text>

            <Text style={styles.label}>{t('challenges.f_title')}</Text>
            <TextInput style={styles.input} value={newTitle} onChangeText={setNewTitle} maxLength={80} placeholder={t('challenges.f_title_ph')} placeholderTextColor="#555" />

            <Text style={styles.label}>{t('challenges.f_desc')}</Text>
            <TextInput style={[styles.input, { minHeight: 70, textAlignVertical: 'top' }]} value={newDesc} onChangeText={setNewDesc} multiline maxLength={300} placeholder={t('challenges.f_desc_ph')} placeholderTextColor="#555" />

            <Text style={styles.label}>{t('challenges.f_goal')}</Text>
            <View style={styles.chipRow}>
              {(['workouts', 'meal_log_days'] as GoalType[]).map((g) => (
                <TouchableOpacity key={g} style={[styles.chip, newGoalType === g && styles.chipActive]} onPress={() => setNewGoalType(g)}>
                  <Text style={[styles.chipText, newGoalType === g && styles.chipTextActive]}>{t(`challenges.type_${g}`)}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>{t('challenges.f_target')}</Text>
            <TextInput style={styles.input} value={newGoalValue} onChangeText={setNewGoalValue} keyboardType="number-pad" maxLength={4} />

            <Text style={styles.label}>{t('challenges.f_duration')}</Text>
            <View style={styles.chipRow}>
              {DURATIONS.map((d) => (
                <TouchableOpacity key={d} style={[styles.chip, newDuration === d && styles.chipActive]} onPress={() => setNewDuration(d)}>
                  <Text style={[styles.chipText, newDuration === d && styles.chipTextActive]}>{t('challenges.n_days', { n: d })}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.note}>{t('challenges.create_note')}</Text>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setCreateOpen(false)}>
                <Text style={styles.cancelText}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.saveBtn, creating && { opacity: 0.5 }]} disabled={creating} onPress={handleCreate}>
                <Text style={styles.saveText}>{t('challenges.publish')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
  createBtn: { backgroundColor: '#8b5cf620', borderWidth: 1, borderColor: '#8b5cf6', borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginBottom: 16 },
  createBtnText: { color: '#a78bfa', fontSize: 14, fontWeight: '900', letterSpacing: 0.5 },

  card: { backgroundColor: '#111', padding: 20, borderRadius: 16, marginBottom: 16, borderWidth: 1, borderColor: '#222' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  challengeTitle: { color: '#fff', fontSize: 16, fontWeight: '900', flex: 1 },
  creator: { color: '#a78bfa', fontSize: 12, fontWeight: '700', marginBottom: 8 },
  badgeCompleted: { color: '#10b981', fontSize: 10, fontWeight: '900', textTransform: 'uppercase', backgroundColor: '#10b98120', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  challengeDesc: { color: '#888', fontSize: 14, lineHeight: 20, marginBottom: 12 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 14 },
  metaChip: { color: '#d4d4d8', fontSize: 11, fontWeight: '700', backgroundColor: '#1c1c1f', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, overflow: 'hidden' },

  joinBtn: { backgroundColor: '#1a1a1a', padding: 16, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#2a2a2a' },
  joinBtnText: { color: '#10b981', fontSize: 14, fontWeight: '900', letterSpacing: 1 },

  progressContainer: { marginTop: 4 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  progressText: { color: '#aaa', fontSize: 12, fontWeight: '700' },
  progressPercent: { color: '#10b981', fontSize: 12, fontWeight: '900' },
  progressBarBg: { height: 8, backgroundColor: '#222', borderRadius: 4, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#10b981', borderRadius: 4 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: '#111', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, borderWidth: 1, borderColor: '#222' },
  modalTitle: { color: '#fff', fontSize: 17, fontWeight: '900', marginBottom: 8 },
  label: { color: '#94a3b8', fontSize: 10, fontWeight: '900', letterSpacing: 1, marginTop: 10, marginBottom: 6 },
  input: { backgroundColor: '#0a0a0a', borderWidth: 1, borderColor: '#222', borderRadius: 12, padding: 12, color: '#fff' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 999, borderWidth: 1, borderColor: '#334155' },
  chipActive: { borderColor: '#10b981', backgroundColor: '#10b98122' },
  chipText: { color: '#94a3b8', fontSize: 12, fontWeight: '700' },
  chipTextActive: { color: '#10b981' },
  note: { color: '#71717a', fontSize: 11, marginTop: 12 },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 14, paddingBottom: 8 },
  cancelBtn: { flex: 1, backgroundColor: '#1a1a1a', borderRadius: 12, paddingVertical: 13, alignItems: 'center' },
  cancelText: { color: '#aaa', fontWeight: '800' },
  saveBtn: { flex: 1, backgroundColor: '#8b5cf6', borderRadius: 12, paddingVertical: 13, alignItems: 'center' },
  saveText: { color: '#fff', fontWeight: '900' },
});
