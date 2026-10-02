import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import GlassCard from '../components/GlassCard';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Rect, Line, Circle, Path, Text as SvgText } from 'react-native-svg';
import { useTranslation } from '../lib/i18n/i18n';
import { format, subDays } from 'date-fns';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import AmbientBackground from '../components/AmbientBackground';

type Bar = { label: string; val: number; highlight: boolean };

const toKey = (d: Date) => format(d, 'yyyy-MM-dd');

export default function AnalyticsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { profile } = useAuth();
  const { t } = useTranslation();
  const [timeframe, setTimeframe] = useState<'week' | 'month'>('week');
  const [rows, setRows] = useState<{ logical_date: string; duration_minutes: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const { width } = useWindowDimensions();
  const CHART_WIDTH = width - 72;

  useEffect(() => {
    if (!profile) return;
    const since = toKey(subDays(new Date(), 29));
    supabase
      .from('workouts')
      .select('logical_date, duration_minutes')
      .eq('user_id', profile.id)
      .gte('logical_date', since)
      .then(({ data }) => {
        setRows((data as any[]) || []);
        setLoading(false);
      });
  }, [profile?.id]);

  const minutesByDay = new Map<string, number>();
  rows.forEach((r) => minutesByDay.set(r.logical_date, (minutesByDay.get(r.logical_date) || 0) + r.duration_minutes));

  const today = new Date();
  const days = Array.from({ length: 30 }, (_, i) => subDays(today, 29 - i));
  const periodDays = timeframe === 'week' ? 7 : 28;
  const periodKeys = new Set(days.slice(30 - periodDays).map(toKey));
  const periodRows = rows.filter((r) => periodKeys.has(r.logical_date));
  const totalMinutes = periodRows.reduce((a, r) => a + r.duration_minutes, 0);

  const bars: Bar[] =
    timeframe === 'week'
      ? days.slice(23).map((d, i, arr) => ({
          label: t(`analytics.d${((d.getDay() + 6) % 7) + 1}`),
          val: minutesByDay.get(toKey(d)) || 0,
          highlight: i === arr.length - 1,
        }))
      : [0, 1, 2, 3].map((w) => {
          const chunk = days.slice(2 + w * 7, 2 + (w + 1) * 7);
          return {
            label: `${t('analytics.wk')}${w + 1}`,
            val: chunk.reduce((a, d) => a + (minutesByDay.get(toKey(d)) || 0), 0),
            highlight: w === 3,
          };
        });
  const maxVal = Math.max(1, ...bars.map((b) => b.val));
  const barWidth = timeframe === 'week' ? 24 : 40;

  return (
    <View style={styles.container}>
      <AmbientBackground />
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.back();
          }}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('analytics.title')}</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {loading ? (
          <ActivityIndicator color="#10b981" style={{ marginTop: 40 }} />
        ) : rows.length === 0 ? (
          <View style={styles.emptyBox}>
            <Ionicons name="bar-chart-outline" size={40} color="#64748b" />
            <Text style={styles.emptyText}>{t('analytics.empty')}</Text>
          </View>
        ) : (
        <>
        {/* Metric Summary Grid */}
        <Animated.View
          entering={FadeInDown.duration(400).springify()}
          style={styles.statsGrid}
        >
          <GlassCard style={styles.statCard}>
            <Ionicons name="barbell" size={24} color="#f97316" />
            <Text style={styles.statVal}>{periodRows.length}</Text>
            <Text style={styles.statLbl}>{t('analytics.count')}</Text>
          </GlassCard>
          <GlassCard style={styles.statCard}>
            <Ionicons name="time" size={24} color="#10b981" />
            <Text style={styles.statVal}>{totalMinutes}</Text>
            <Text style={styles.statLbl}>{t('analytics.min')}</Text>
          </GlassCard>
        </Animated.View>

        {/* Workout minutes bar chart */}
        <Animated.View
          entering={FadeInUp.delay(150).duration(500).springify()}
          style={styles.section}
        >
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('analytics.chart')}</Text>
            <View style={styles.toggleRow}>
              <TouchableOpacity
                style={[styles.toggleBtn, timeframe === 'week' && styles.toggleBtnActive]}
                onPress={() => setTimeframe('week')}
              >
                <Text style={[styles.toggleText, timeframe === 'week' && styles.toggleTextActive]}>
                  {t('analytics.week')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggleBtn, timeframe === 'month' && styles.toggleBtnActive]}
                onPress={() => setTimeframe('month')}
              >
                <Text style={[styles.toggleText, timeframe === 'month' && styles.toggleTextActive]}>
                  {t('analytics.month')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <GlassCard borderColor="rgba(59, 130, 246, 0.3)" style={{ padding: 16 }}>
            <Svg width={CHART_WIDTH} height={180}>
              {[40, 90, 140].map((y) => (
                <Line key={y} x1="0" y1={y} x2={CHART_WIDTH} y2={y} stroke="rgba(255,255,255,0.06)" strokeDasharray="4 4" />
              ))}
              {bars.map((item, idx) => {
                const barHeight = (item.val / maxVal) * 110;
                const gap = bars.length > 1 ? (CHART_WIDTH - barWidth * bars.length) / (bars.length - 1) : 0;
                const x = idx * (barWidth + gap);
                const y = 140 - barHeight;
                return (
                  <React.Fragment key={idx}>
                    <Rect x={x} y={y} width={barWidth} height={Math.max(barHeight, item.val > 0 ? 3 : 0)} rx={6} fill={item.highlight ? '#f97316' : '#3b82f6'} />
                    <SvgText x={x + barWidth / 2} y={165} fill="#64748b" fontSize="10" fontWeight="bold" textAnchor="middle">
                      {item.label}
                    </SvgText>
                  </React.Fragment>
                );
              })}
            </Svg>
          </GlassCard>
        </Animated.View>

        {/* Streak Consistency Matrix */}
        <Animated.View
          entering={FadeInUp.delay(300).duration(500).springify()}
          style={styles.section}
        >
          <Text style={styles.sectionTitle}>{t('analytics.matrix')}</Text>
          <GlassCard style={{ padding: 16 }}>
            <View style={styles.matrixGrid}>
              {days.map((d) => (
                <View
                  key={toKey(d)}
                  style={[styles.matrixSquare, minutesByDay.has(toKey(d)) && styles.matrixSquareActive]}
                />
              ))}
            </View>
          </GlassCard>
        </Animated.View>
        </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050607' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '900', letterSpacing: 2 },
  scrollContent: { padding: 20, gap: 24, paddingBottom: 40 },
  statsGrid: { flexDirection: 'row', gap: 12 },
  statCard: { flex: 1, gap: 8, padding: 16 },
  statVal: { color: '#fff', fontSize: 28, fontWeight: '900', letterSpacing: -1 },
  statLbl: { color: '#64748b', fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  section: { gap: 14 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  toggleRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 2,
  },
  toggleBtn: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 10 },
  toggleBtnActive: { backgroundColor: '#3b82f6' },
  toggleText: { color: '#64748b', fontSize: 10, fontWeight: '900' },
  toggleTextActive: { color: '#fff' },
  matrixGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  matrixSquare: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  matrixSquareActive: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  emptyBox: { alignItems: 'center', gap: 12, paddingVertical: 60 },
  emptyText: { color: '#64748b', fontSize: 14, textAlign: 'center', lineHeight: 20 },
});
