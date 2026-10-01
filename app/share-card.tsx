import { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator, useWindowDimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import * as Haptics from 'expo-haptics';
import { differenceInCalendarDays, format, parseISO } from 'date-fns';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';
import { useTranslation } from '../lib/i18n/i18n';
import ShareCard from '../components/ShareCard';

type Variant = 'daily' | 'streak' | 'together';

type Partner = { id: string; name: string; since: string };

export default function ShareCardScreen() {
  const { profile } = useAuth();
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const { variant: variantParam, partnerId } = useLocalSearchParams<{ variant?: Variant; partnerId?: string }>();

  const [variant, setVariant] = useState<Variant>(variantParam || 'daily');
  const [loading, setLoading] = useState(true);
  const [sharing, setSharing] = useState(false);
  const cardRef = useRef<View>(null);

  const isDietitian = profile?.role === 'dietitian';

  const [data, setData] = useState({
    todayKcal: 0,
    todayProtein: 0,
    todayWorkouts: 0,
    streak: 0,
    longest: 0,
    partners: [] as Partner[],
    clientStreak: 0,
    weightDelta: null as number | null,
    workoutsTogether: 0,
  });
  const [partner, setPartner] = useState<Partner | null>(null);

  // Load personal numbers + approved partners (dietitians for a member, clients for a dietitian)
  useEffect(() => {
    if (!profile) return;
    (async () => {
      const today = format(new Date(), 'yyyy-MM-dd');
      const [logs, workouts, rel] = await Promise.all([
        supabase.from('daily_nutrition_logs').select('calories, protein_g').eq('user_id', profile.id).eq('log_date', today),
        supabase.from('workouts').select('id').eq('user_id', profile.id).eq('logical_date', today),
        isDietitian
          ? supabase.from('dietitian_clients').select('client_id, created_at').eq('dietitian_id', profile.id).eq('status', 'approved')
          : supabase.from('dietitian_clients').select('dietitian_id, created_at').eq('client_id', profile.id).eq('status', 'approved'),
      ]);

      const relRows = (rel.data || []) as any[];
      const ids = relRows.map((r) => (isDietitian ? r.client_id : r.dietitian_id));
      const { data: people } = ids.length
        ? await supabase.from('profiles').select('id, display_name, username').in('id', ids)
        : { data: [] as any[] };
      const partners: Partner[] = relRows.map((r) => {
        const id = isDietitian ? r.client_id : r.dietitian_id;
        const p = (people || []).find((x: any) => x.id === id);
        return { id, name: p?.display_name || p?.username || '', since: r.created_at };
      });

      setData((d) => ({
        ...d,
        todayKcal: Math.round((logs.data || []).reduce((a: number, l: any) => a + (l.calories || 0), 0)),
        todayProtein: Math.round((logs.data || []).reduce((a: number, l: any) => a + (Number(l.protein_g) || 0), 0)),
        todayWorkouts: (workouts.data || []).length,
        streak: profile.current_streak || 0,
        longest: profile.longest_streak || 0,
        partners,
      }));
      setPartner(partners.find((p) => p.id === partnerId) || partners[0] || null);
      setLoading(false);
    })();
  }, [profile?.id]);

  // "Together" numbers belong to the CLIENT of the pair (the member whose progress is celebrated)
  useEffect(() => {
    if (!profile || !partner) return;
    const clientId = isDietitian ? partner.id : profile.id;
    (async () => {
      const [clientProfile, measurements, workouts] = await Promise.all([
        supabase.from('profiles').select('current_streak').eq('id', clientId).single(),
        supabase.from('body_measurements').select('weight_kg, date').eq('user_id', clientId).not('weight_kg', 'is', null).order('date', { ascending: true }),
        supabase.from('workouts').select('id').eq('user_id', clientId).gte('logical_date', partner.since.slice(0, 10)),
      ]);
      const weights = (measurements.data || []) as any[];
      setData((d) => ({
        ...d,
        clientStreak: clientProfile.data?.current_streak || 0,
        weightDelta: weights.length >= 2 ? Math.round((Number(weights[weights.length - 1].weight_kg) - Number(weights[0].weight_kg)) * 10) / 10 : null,
        workoutsTogether: (workouts.data || []).length,
      }));
    })();
  }, [profile?.id, partner?.id]);

  const cardWidth = Math.min(screenWidth - 64, 320);
  const myName = profile?.display_name || profile?.username || '';

  const daysTogether = partner ? Math.max(1, differenceInCalendarDays(new Date(), parseISO(partner.since))) : 0;

  const cardProps = (() => {
    const base = { width: cardWidth, variant, footer: t('share.footer') };
    if (variant === 'streak') {
      return {
        ...base,
        headline: t('share.h_streak'),
        bigValue: String(data.streak),
        bigLabel: t('share.streak_big'),
        subline: t('share.sub_streak', { n: data.longest }),
        stats: [
          { value: String(data.todayWorkouts), label: t('share.st_workouts') },
          { value: String(data.todayKcal), label: t('share.st_kcal') },
          { value: String(data.todayProtein), label: t('share.st_protein') },
        ],
      };
    }
    if (variant === 'together') {
      const clientName = isDietitian ? partner?.name || '' : myName;
      const dietitianName = isDietitian ? myName : partner?.name || '';
      return {
        ...base,
        headline: t('share.h_together'),
        names: { client: clientName, dietitian: dietitianName },
        subline: t('share.sub_together', { n: daysTogether }),
        stats: [
          { value: String(daysTogether), label: t('share.st_days') },
          { value: data.weightDelta === null ? '—' : `${data.weightDelta > 0 ? '+' : ''}${data.weightDelta} kg`, label: t('share.st_weight') },
          { value: String(data.workoutsTogether), label: t('share.st_workouts_total') },
        ],
      };
    }
    return {
      ...base,
      headline: t('share.h_daily'),
      bigValue: String(data.todayKcal),
      bigLabel: 'kcal',
      subline: t('share.sub_daily'),
      stats: [
        { value: String(data.streak), label: t('share.st_streak') },
        { value: String(data.todayWorkouts), label: t('share.st_workouts') },
        { value: String(data.todayProtein), label: t('share.st_protein') },
      ],
    };
  })();

  const handleShare = async () => {
    if (!cardRef.current) return;
    try {
      setSharing(true);
      if (!(await Sharing.isAvailableAsync())) {
        Alert.alert(t('common.error'), t('share.unavailable'));
        return;
      }
      // Export at full story resolution regardless of the on-screen preview size.
      const uri = await captureRef(cardRef, { format: 'png', quality: 1, result: 'tmpfile', width: 1080, height: 1920 });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: t('share.title') });
    } catch {
      Alert.alert(t('common.error'), t('share.failed'));
    } finally {
      setSharing(false);
    }
  };

  const needsPartner = variant === 'together' && !partner;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{t('share.title')}</Text>
          <Text style={styles.sub}>{t('share.sub')}</Text>
        </View>
      </View>

      <View style={styles.tabs}>
        {(['daily', 'streak', 'together'] as Variant[]).map((v) => (
          <TouchableOpacity key={v} style={[styles.tab, variant === v && styles.tabActive]} onPress={() => setVariant(v)}>
            <Text style={[styles.tabText, variant === v && styles.tabTextActive]}>{t(`share.v_${v}`)}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator color="#10b981" style={{ marginTop: 40 }} />
      ) : (
        <ScrollView contentContainerStyle={{ alignItems: 'center', paddingVertical: 16, paddingBottom: insets.bottom + 100 }}>
          {variant === 'together' && data.partners.length > 1 && (
            <View style={styles.partnerRow}>
              <Text style={styles.partnerLabel}>{t(isDietitian ? 'share.pick_client' : 'share.pick_dietitian')}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {data.partners.map((p) => (
                  <TouchableOpacity key={p.id} style={[styles.chip, partner?.id === p.id && styles.chipActive]} onPress={() => setPartner(p)}>
                    <Text style={styles.chipText}>{p.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {needsPartner ? (
            <Text style={styles.empty}>{t('share.no_dietitian')}</Text>
          ) : (
            <View style={styles.cardShadow}>
              <ShareCard ref={cardRef} {...(cardProps as any)} />
            </View>
          )}
        </ScrollView>
      )}

      {!loading && !needsPartner && (
        <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
          <TouchableOpacity style={[styles.shareBtn, sharing && { opacity: 0.6 }]} disabled={sharing} onPress={handleShare}>
            <Ionicons name="share-outline" size={18} color="#fff" />
            <Text style={styles.shareText}>{sharing ? t('share.preparing') : t('share.share_btn')}</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingBottom: 8 },
  backBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  title: { color: '#fff', fontSize: 18, fontWeight: '900' },
  sub: { color: '#71717a', fontSize: 12, marginTop: 2 },
  tabs: { flexDirection: 'row', gap: 8, paddingHorizontal: 20, marginTop: 4 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 12, backgroundColor: '#1a1a1a', borderWidth: 1, borderColor: '#2a2a2a' },
  tabActive: { backgroundColor: '#10b98120', borderColor: '#10b981' },
  tabText: { color: '#71717a', fontSize: 12, fontWeight: '800' },
  tabTextActive: { color: '#10b981' },
  partnerRow: { width: '100%', paddingHorizontal: 20, marginBottom: 12 },
  partnerLabel: { color: '#94a3b8', fontSize: 10, fontWeight: '900', letterSpacing: 1, marginBottom: 6 },
  chip: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 999, borderWidth: 1, borderColor: '#334155', marginRight: 8 },
  chipActive: { borderColor: '#10b981', backgroundColor: '#10b98122' },
  chipText: { color: '#e4e4e7', fontSize: 12, fontWeight: '700' },
  empty: { color: '#888', textAlign: 'center', marginTop: 40, paddingHorizontal: 30 },
  cardShadow: { borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: '#27272a' },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 20, paddingTop: 10, backgroundColor: '#0a0a0aee' },
  shareBtn: { flexDirection: 'row', gap: 8, backgroundColor: '#10b981', borderRadius: 14, paddingVertical: 14, alignItems: 'center', justifyContent: 'center' },
  shareText: { color: '#fff', fontSize: 14, fontWeight: '900', letterSpacing: 0.5 },
});
