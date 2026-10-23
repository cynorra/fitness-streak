import { ScrollView, StyleSheet, Text, TouchableOpacity, View, RefreshControl } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  Easing,
  FadeInDown,
  FadeInUp,
  ZoomIn,
} from 'react-native-reanimated';
import { useAuth } from '../../lib/auth';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase, Workout } from '../../lib/supabase';
import { format, parseISO, subDays } from 'date-fns';
import { useTranslation } from '../../lib/i18n/i18n';
import { getDateLocale } from '../../lib/i18n/dateUtils';
import { displayWorkoutType } from '../../lib/workoutTypes';
import AnimatedStreakNumber from '../../components/AnimatedStreakNumber';
import StreakFitLogo from '../../components/StreakFitLogo';
import AdMobBanner from '../../components/AdMobBanner';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AppIcon from '../../components/AppIcon';
import AmbientBackground from '../../components/AmbientBackground';
import GradientCard from '../../components/GradientCard';
import { LinearGradient } from 'expo-linear-gradient';
import PressableScale from '../../components/PressableScale';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export default function StreakHome() {
  const { profile, refreshProfile } = useAuth();
  const { t, locale } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [weekWorkouts, setWeekWorkouts] = useState<Workout[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const dateLocale = getDateLocale(locale);

  // FAB animasyonu
  const fabScale = useSharedValue(0);
  const fabRotate = useSharedValue(0);

  useEffect(() => {
    fabScale.value = withDelay(400, withSpring(1, { damping: 12, stiffness: 150 }));
  }, []);

  const fabStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: fabScale.value },
      { rotate: `${fabRotate.value}deg` },
    ],
  }));

  const handleFabPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    fabRotate.value = withSpring(45, { damping: 8 }, () => {
      fabRotate.value = withSpring(0, { damping: 8 });
    });
    router.push('/log' as any);
  };

  const loadWeek = useCallback(async () => {
    if (!profile) return;
    const since = subDays(new Date(), 7).toISOString();
    const { data, error } = await supabase
      .from('workouts')
      .select('*')
      .eq('user_id', profile.id)
      .gte('logged_at', since)
      .order('logged_at', { ascending: false });
    if (!error) setWeekWorkouts((data as Workout[]) || []);
  }, [profile]);

  useEffect(() => { loadWeek(); }, [loadWeek]);

  // Dietitian overview: pending requests, approved clients, upcoming appointments.
  const [dtStats, setDtStats] = useState<{ pending: number; clients: number; appts: number } | null>(null);
  const loadDietitianStats = useCallback(async () => {
    if (!profile || profile.role !== 'dietitian') return;
    const [reqs, appts] = await Promise.all([
      supabase.from('dietitian_clients').select('status').eq('dietitian_id', profile.id),
      supabase
        .from('appointments')
        .select('id', { count: 'exact', head: true })
        .eq('dietitian_id', profile.id)
        .in('status', ['pending', 'confirmed'])
        .gte('appointment_time', new Date().toISOString()),
    ]);
    const rows = (reqs.data || []) as { status: string }[];
    setDtStats({
      pending: rows.filter((x) => x.status === 'pending').length,
      clients: rows.filter((x) => x.status === 'approved').length,
      appts: appts.count || 0,
    });
  }, [profile?.id, profile?.role]);
  useEffect(() => { loadDietitianStats(); }, [loadDietitianStats]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refreshProfile(), loadWeek(), loadDietitianStats()]);
    setRefreshing(false);
  };

  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), 6 - i);
    const dateStr = format(date, 'yyyy-MM-dd');
    const hasWorkout = weekWorkouts.some(w => w.logical_date === dateStr);
    return { date, dateStr, hasWorkout };
  });

  const streak = profile?.current_streak ?? 0;
  const greeting = streak === 0
    ? t('dashboard.streak_start')
    : streak < 7
    ? t('dashboard.streak_continue')
    : streak < 30
    ? t('dashboard.streak_serious')
    : t('dashboard.streak_legend');

  return (
    <View style={styles.root}>
      <AmbientBackground />
      <ScrollView
        style={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#10b981" />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View entering={FadeInDown.duration(400).springify()} style={[styles.header, { paddingTop: insets.top + 20 }]}>
          <View style={styles.logoRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
              <StreakFitLogo size={36} animated />
              <Text style={styles.logoText}>
                STREAK<Text style={{ color: '#ff7a00' }}>FIT</Text>
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <TouchableOpacity
                onPress={() => {
                  Haptics.selectionAsync();
                  router.push('/(tabs)/notifications' as any);
                }}
                style={styles.msgBtn}
              >
                <Ionicons name="notifications-outline" size={20} color="#ff7a00" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  Haptics.selectionAsync();
                  router.push('/messages' as any);
                }}
                style={styles.msgBtn}
              >
                <Ionicons name="paper-plane-outline" size={20} color="#ff7a00" />
              </TouchableOpacity>
            </View>
          </View>
          <Text style={styles.hello}>
            {t('common.hello')}, {profile?.display_name?.toUpperCase() || profile?.username?.toUpperCase()}
          </Text>
        </Animated.View>

        {/* Streak Kartı */}
        <Animated.View
          entering={FadeInUp.delay(100).duration(500).springify()}
          style={styles.streakCard}
        >
          <GradientCard radius={36} padding={36} accent="#10b981" contentStyle={{ alignItems: 'center' }}>
            <AnimatedStreakNumber streak={streak} />
            <Animated.View
              entering={FadeInDown.delay(300).duration(400)}
              style={styles.greetingBox}
            >
              <Text style={styles.greeting}>{greeting.toUpperCase()}</Text>
            </Animated.View>
          </GradientCard>
        </Animated.View>

        {/* Dietitian overview */}
        {profile?.role === 'dietitian' && dtStats && (
          <Animated.View entering={FadeInUp.delay(150).duration(450).springify()} style={{ paddingHorizontal: 16, marginBottom: 20 }}>
            <PressableScale onPress={() => router.push('/dietitian/clients' as any)}>
              <GradientCard accent="#10b981" padding={18}>
                <View style={styles.dtHeader}>
                  <AppIcon name="medkit" color="#10b981" size={40} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.dtTitle}>{t('home.dt_title')}</Text>
                    <Text style={styles.dtSub}>
                      {dtStats.pending > 0 ? t('home.dt_pending', { n: dtStats.pending }) : t('home.dt_none')}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#10b981" />
                </View>
                <View style={styles.dtRow}>
                  <View style={styles.dtCell}>
                    <Text style={[styles.dtValue, dtStats.pending > 0 && { color: '#f59e0b' }]}>{dtStats.pending}</Text>
                    <Text style={styles.dtLabel}>{t('home.dt_requests')}</Text>
                  </View>
                  <View style={styles.dtCell}>
                    <Text style={styles.dtValue}>{dtStats.clients}</Text>
                    <Text style={styles.dtLabel}>{t('home.dt_clients')}</Text>
                  </View>
                  <TouchableOpacity style={styles.dtCell} onPress={() => router.push('/appointments' as any)}>
                    <Text style={styles.dtValue}>{dtStats.appts}</Text>
                    <Text style={styles.dtLabel}>{t('home.dt_appts')}</Text>
                  </TouchableOpacity>
                </View>
              </GradientCard>
            </PressableScale>
          </Animated.View>
        )}

        {/* Haftalık Şerit */}
        <Animated.View
          entering={FadeInUp.delay(200).duration(450).springify()}
          style={styles.weekStrip}
        >
          {last7Days.map(({ date, dateStr, hasWorkout }, idx) => (
            <Animated.View
              key={dateStr}
              entering={ZoomIn.delay(250 + idx * 50).springify()}
              style={styles.dayCol}
            >
              <Text style={styles.dayLabel}>
                {format(date, 'EEEEE', { locale: dateLocale })}
              </Text>
              <View style={[styles.dayDot, hasWorkout && styles.dayDotActive]}>
                {hasWorkout && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={styles.dayNum}>{format(date, 'd')}</Text>
            </Animated.View>
          ))}
        </Animated.View>

        {/* 2026 Athletic Performance Widgets: Today's Focus & Quick Action */}
        <Animated.View
          entering={FadeInUp.delay(300).duration(450).springify()}
          style={styles.performanceRow}
        >
          {/* Quick Workout Launcher */}
          <GradientCard style={{ flex: 1.1 }} accent="#ff7a00" padding={18}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <View style={styles.badgePill}>
                <View style={[styles.pulseDot, { backgroundColor: '#ff7a00' }]} />
                <Text style={styles.badgePillText}>DAILY TARGET</Text>
              </View>
              <Ionicons name="flash" size={16} color="#ff7a00" />
            </View>
            <Text style={styles.targetTitle}>
              {weekWorkouts.length > 0 ? `${weekWorkouts.length} Logged This Week` : '30 Min Target'}
            </Text>
            <Text style={styles.targetSub}>
              {streak > 0 ? `${streak} Day Momentum Active` : 'Log workout to ignite streak'}
            </Text>
            <TouchableOpacity
              style={styles.quickStartBtn}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                router.push('/log' as any);
              }}
            >
              <Text style={styles.quickStartText}>+ QUICK LOG</Text>
              <Ionicons name="arrow-forward" size={14} color="#000" />
            </TouchableOpacity>
          </GradientCard>

          {/* Athletic Consistency / Record Dial */}
          <GradientCard style={{ flex: 0.9 }} accent="#10b981" padding={18}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <Text style={styles.metricLabel}>BEST RECORD</Text>
              <Ionicons name="trophy-outline" size={16} color="#10b981" />
            </View>
            <Text style={styles.metricBigNum}>{profile?.longest_streak ?? 0}</Text>
            <Text style={styles.metricUnit}>DAYS PEAK</Text>
            <View style={styles.metricDivider} />
            <Text style={styles.metricSub}>
              {weekWorkouts.length} sessions in last 7 days
            </Text>
          </GradientCard>
        </Animated.View>

        {/* AdMob Banner */}
        <View style={{ paddingHorizontal: 16, marginBottom: 16 }}>
          <AdMobBanner />
        </View>

        {/* Gamification Links */}
        <Animated.View
          entering={FadeInUp.delay(350).duration(450).springify()}
          style={styles.gamificationRow}
        >
          <PressableScale index={0} 
            style={styles.gamificationCard}
            onPress={() => router.push('/leaderboard' as any)}
          >
            <AppIcon name="trophy" color="#eab308" size={44} style={{ marginBottom: 8 }} />
            <Text style={styles.gamificationLabel}>{t('home.leaderboard')}</Text>
          </PressableScale>
          <PressableScale index={1} 
            style={styles.gamificationCard}
            onPress={() => router.push('/challenges' as any)}
          >
            <AppIcon name="locate" color="#ef4444" size={44} style={{ marginBottom: 8 }} />
            <Text style={styles.gamificationLabel}>{t('home.challenges')}</Text>
          </PressableScale>
        </Animated.View>

        {/* Growth links: share card + learn feed */}
        <Animated.View
          entering={FadeInUp.delay(365).duration(450).springify()}
          style={[styles.gamificationRow, { marginTop: 10 }]}
        >
          <PressableScale index={2}
            style={styles.gamificationCard}
            onPress={() => router.push('/share-card' as any)}
          >
            <AppIcon name="camera" color="#ec4899" size={44} style={{ marginBottom: 8 }} />
            <Text style={styles.gamificationLabel}>{t('share.link')}</Text>
          </PressableScale>
          <PressableScale index={3}
            style={styles.gamificationCard}
            onPress={() => router.push('/learn' as any)}
          >
            <AppIcon name="bulb" color="#facc15" size={44} style={{ marginBottom: 8 }} />
            <Text style={styles.gamificationLabel}>{t('learn.link')}</Text>
          </PressableScale>
        </Animated.View>

        {/* Quick Feature Modules Grid */}
        <Animated.View
          entering={FadeInUp.delay(380).duration(450).springify()}
          style={styles.quickModulesSection}
        >
          <Text style={styles.sectionTitle}>{t('home.quick')}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.modulesScroll}>
            <PressableScale index={4}
              style={[styles.moduleCard, { borderColor: '#38bdf840' }]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push('/water' as any);
              }}
            >
              <AppIcon name="water" color="#38bdf8" size={48} style={{ marginBottom: 6 }} />
              <Text style={styles.moduleTitle}>{t('home.water')}</Text>
              <Text style={styles.moduleSub}>{t('home.water_sub')}</Text>
            </PressableScale>

            <PressableScale index={5}
              style={[styles.moduleCard, { borderColor: '#f9731640' }]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push('/fasting' as any);
              }}
            >
              <AppIcon name="timer" color="#f97316" size={48} style={{ marginBottom: 6 }} />
              <Text style={styles.moduleTitle}>{t('home.fasting')}</Text>
              <Text style={styles.moduleSub}>{t('home.fasting_sub')}</Text>
            </PressableScale>

            <PressableScale index={6}
              style={[styles.moduleCard, { borderColor: '#3b82f640' }]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push('/analytics' as any);
              }}
            >
              <AppIcon name="stats-chart" color="#3b82f6" size={48} style={{ marginBottom: 6 }} />
              <Text style={styles.moduleTitle}>{t('home.analytics')}</Text>
              <Text style={styles.moduleSub}>{t('home.analytics_sub')}</Text>
            </PressableScale>

            <PressableScale index={7}
              style={[styles.moduleCard, { borderColor: '#10b98140' }]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push('/tracker' as any);
              }}
            >
              <AppIcon name="location" color="#10b981" size={48} style={{ marginBottom: 6 }} />
              <Text style={styles.moduleTitle}>{t('home.gps')}</Text>
              <Text style={styles.moduleSub}>{t('home.gps_sub')}</Text>
            </PressableScale>

            <PressableScale index={8}
              style={[styles.moduleCard, { borderColor: '#ec489940' }]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push('/blog' as any);
              }}
            >
              <AppIcon name="book" color="#ec4899" size={48} style={{ marginBottom: 6 }} />
              <Text style={styles.moduleTitle}>{t('home.blog')}</Text>
              <Text style={styles.moduleSub}>{t('home.blog_sub')}</Text>
            </PressableScale>

            <PressableScale index={9}
              style={[styles.moduleCard, { borderColor: '#eab30840' }]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push('/gyms' as any);
              }}
            >
              <AppIcon name="barbell" color="#a855f7" size={48} style={{ marginBottom: 6 }} />
              <Text style={styles.moduleTitle}>{t('home.gyms')}</Text>
              <Text style={styles.moduleSub}>{t('home.gyms_sub')}</Text>
            </PressableScale>
          </ScrollView>
        </Animated.View>

        {/* Son Antrenmanlar */}
        {weekWorkouts.length > 0 && (
          <Animated.View
            entering={FadeInUp.delay(400).duration(450).springify()}
            style={styles.recentSection}
          >
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{t('dashboard.recent_workouts')}</Text>
              <TouchableOpacity onPress={() => router.push('/history' as any)}>
                <Text style={styles.seeAllText}>{t('dashboard.see_all')}</Text>
              </TouchableOpacity>
            </View>
            {weekWorkouts.slice(0, 5).map((w, idx) => (
              <Animated.View
                key={w.id}
                entering={FadeInDown.delay(450 + idx * 60).duration(350).springify()}
                style={styles.workoutRow}
              >
                <View>
                  <Text style={styles.workoutType}>{displayWorkoutType(w.workout_type, t)}</Text>
                  <Text style={styles.workoutDate}>
                    {format(parseISO(w.logged_at), 'd MMM • HH:mm', { locale: dateLocale })}
                  </Text>
                </View>
                <Text style={styles.workoutDuration}>
                  {w.duration_minutes} {t('common.minutes_abbr')}
                </Text>
              </Animated.View>
            ))}
          </Animated.View>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Floating Action Button — animasyonlu */}
      <AnimatedTouchable style={[styles.fab, fabStyle]} onPress={handleFabPress}>
        <LinearGradient colors={['#34d399', '#059669']} style={styles.fabFill}>
          <Ionicons name="add" size={34} color="#fff" />
        </LinearGradient>
      </AnimatedTouchable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#050607' },
  container: { flex: 1, backgroundColor: 'transparent' },
  header: { padding: 24, gap: 12 },
  logoRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  msgBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(16,185,129,0.1)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(16,185,129,0.3)' },
  msgIcon: { fontSize: 20 },
  logoBox: { width: 32, height: 32, backgroundColor: '#10b981', borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  logoLetter: { color: '#fff', fontWeight: '900', fontSize: 18 },
  logoText: { color: '#fff', fontSize: 24, fontWeight: '900', letterSpacing: -1.5 },
  hello: { color: '#666', fontSize: 11, fontWeight: '900', letterSpacing: 2 },
  streakCard: { margin: 16 },
  dtHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  dtTitle: { color: '#fff', fontSize: 15, fontWeight: '900' },
  dtSub: { color: '#8b93a1', fontSize: 12, fontWeight: '600', marginTop: 2 },
  dtRow: { flexDirection: 'row', marginTop: 16, gap: 8 },
  dtCell: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.05)' },
  dtValue: { color: '#fff', fontSize: 24, fontWeight: '900' },
  dtLabel: { color: '#6b7280', fontSize: 9, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase', marginTop: 2 },
  greetingBox: {
    marginTop: 24, paddingVertical: 8, paddingHorizontal: 16,
    backgroundColor: '#1a1a1a', borderRadius: 12, borderWidth: 1, borderColor: '#2a2a2a',
  },
  greeting: { color: '#fff', fontSize: 10, fontWeight: '900', letterSpacing: 1, textAlign: 'center' },
  weekStrip: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, marginBottom: 24 },
  dayCol: { alignItems: 'center', flex: 1 },
  dayLabel: { color: '#444', fontSize: 10, fontWeight: '900', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 },
  dayDot: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center', alignItems: 'center',
  },
  dayDotActive: {
    backgroundColor: '#10b981', borderColor: '#10b981',
    shadowColor: '#10b981', shadowOpacity: 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 4 },
  },
  checkmark: { color: '#fff', fontWeight: '900', fontSize: 18 },
  dayNum: { color: '#666', fontSize: 10, fontWeight: '900', marginTop: 6 },
  performanceRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 12, marginBottom: 28 },
  badgePill: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,122,0,0.12)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  pulseDot: { width: 5, height: 5, borderRadius: 2.5 },
  badgePillText: { color: '#ff7a00', fontSize: 9, fontWeight: '800', letterSpacing: 1 },
  targetTitle: { color: '#ffffff', fontSize: 16, fontWeight: '900', letterSpacing: -0.5, marginBottom: 4 },
  targetSub: { color: '#78716c', fontSize: 11, fontWeight: '600', marginBottom: 14, lineHeight: 15 },
  quickStartBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#ff7a00', paddingVertical: 9, paddingHorizontal: 12, borderRadius: 12 },
  quickStartText: { color: '#000000', fontSize: 11, fontWeight: '900', letterSpacing: 0.5 },
  metricLabel: { color: '#64748b', fontSize: 9, fontWeight: '800', letterSpacing: 1.5, textTransform: 'uppercase' },
  metricBigNum: { color: '#10b981', fontSize: 32, fontWeight: '900', letterSpacing: -1.5, marginTop: 4, fontVariant: ['tabular-nums'] },
  metricUnit: { color: '#94a3b8', fontSize: 9, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase' },
  metricDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.06)', marginVertical: 8 },
  metricSub: { color: '#64748b', fontSize: 10, fontWeight: '600', lineHeight: 14 },
  statsRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 12, marginBottom: 32 },
  statValue: { color: '#fff', fontSize: 36, fontWeight: '900', letterSpacing: -2, marginTop: 6 },
  statLabel: { color: '#6b7280', fontSize: 9, fontWeight: '900', marginTop: 4, textTransform: 'uppercase', letterSpacing: 1.5 },
  
  gamificationRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 12, marginBottom: 32 },
  gamificationCard: {
    flex: 1, backgroundColor: 'rgba(255,255,255,0.045)', padding: 20,
    borderRadius: 22, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },
  gamificationIcon: { fontSize: 28, marginBottom: 8 },
  gamificationLabel: { color: '#10b981', fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1, textAlign: 'center' },

  recentSection: { paddingHorizontal: 16, paddingBottom: 40 },
  quickModulesSection: { paddingHorizontal: 16, marginBottom: 32 },
  modulesScroll: { gap: 12, paddingRight: 16 },
  moduleCard: {
    width: 124,
    height: 124,
    backgroundColor: 'rgba(255,255,255,0.045)',
    borderRadius: 26,
    borderWidth: 1,
    padding: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  moduleIcon: { fontSize: 32, marginBottom: 6 },
  moduleTitle: { color: '#fff', fontSize: 12, fontWeight: '900', textAlign: 'center' },
  moduleSub: { color: '#666', fontSize: 9, fontWeight: '700', marginTop: 2, textAlign: 'center' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { color: '#666', fontSize: 10, fontWeight: '900', letterSpacing: 3, textTransform: 'uppercase' },
  seeAllText: { color: '#10b981', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  workoutRow: {
    backgroundColor: 'rgba(255,255,255,0.045)', padding: 20, borderRadius: 22,
    marginBottom: 12, flexDirection: 'row',
    justifyContent: 'space-between', alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.09)',
  },
  workoutType: { color: '#fff', fontSize: 15, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  workoutDate: { color: '#444', fontSize: 11, fontWeight: '700', marginTop: 2 },
  workoutDuration: { color: '#10b981', fontSize: 18, fontWeight: '900', letterSpacing: -0.5 },
  fab: {
    position: 'absolute', bottom: 32, right: 24,
    width: 64, height: 64, borderRadius: 32,
    shadowColor: '#10b981', shadowOpacity: 0.6, shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 }, elevation: 10,
  },
  fabFill: { width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)' },
  fabIcon: { color: '#fff', fontSize: 32, fontWeight: '900', marginTop: -2 },
});
