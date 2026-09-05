import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
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

const WEEKLY_CALORIES = [
  { day: 'Pzt', val: 420 },
  { day: 'Sal', val: 650 },
  { day: 'Çar', val: 380 },
  { day: 'Per', val: 720 },
  { day: 'Cum', val: 510 },
  { day: 'Cmt', val: 890 },
  { day: 'Paz', val: 600 },
];

export default function AnalyticsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [timeframe, setTimeframe] = useState<'week' | 'month'>('week');
  const { width } = useWindowDimensions();
  const CHART_WIDTH = width - 72;

  const maxCal = Math.max(...WEEKLY_CALORIES.map((d) => d.val));

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0A1128', '#050B1E', '#02040A']}
        style={StyleSheet.absoluteFill}
      />

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
        <Text style={styles.headerTitle}>PERFORMANS VE ANALİZ</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Metric Summary Grid */}
        <Animated.View
          entering={FadeInDown.duration(400).springify()}
          style={styles.statsGrid}
        >
          <GlassCard style={styles.statCard}>
            <Ionicons name="flame" size={24} color="#f97316" />
            <Text style={styles.statVal}>4,170</Text>
            <Text style={styles.statLbl}>TOPLAM KALORİ (KCAL)</Text>
          </GlassCard>
          <GlassCard style={styles.statCard}>
            <Ionicons name="time" size={24} color="#10b981" />
            <Text style={styles.statVal}>340</Text>
            <Text style={styles.statLbl}>TOPLAM DAKİKA</Text>
          </GlassCard>
        </Animated.View>

        {/* Weekly Calorie Burn Bar Chart */}
        <Animated.View
          entering={FadeInUp.delay(150).duration(500).springify()}
          style={styles.section}
        >
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>KALORİ HARCAMA GRAFİĞİ</Text>
            <View style={styles.toggleRow}>
              <TouchableOpacity
                style={[
                  styles.toggleBtn,
                  timeframe === 'week' && styles.toggleBtnActive,
                ]}
                onPress={() => setTimeframe('week')}
              >
                <Text
                  style={[
                    styles.toggleText,
                    timeframe === 'week' && styles.toggleTextActive,
                  ]}
                >
                  HAFTA
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.toggleBtn,
                  timeframe === 'month' && styles.toggleBtnActive,
                ]}
                onPress={() => setTimeframe('month')}
              >
                <Text
                  style={[
                    styles.toggleText,
                    timeframe === 'month' && styles.toggleTextActive,
                  ]}
                >
                  AY
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <GlassCard borderColor="rgba(59, 130, 246, 0.3)" style={{ padding: 16 }}>
            <Svg width={CHART_WIDTH} height={180}>
              {/* Grid Lines */}
              <Line
                x1="0"
                y1="40"
                x2={CHART_WIDTH}
                y2="40"
                stroke="rgba(255,255,255,0.06)"
                strokeDasharray="4 4"
              />
              <Line
                x1="0"
                y1="90"
                x2={CHART_WIDTH}
                y2="90"
                stroke="rgba(255,255,255,0.06)"
                strokeDasharray="4 4"
              />
              <Line
                x1="0"
                y1="140"
                x2={CHART_WIDTH}
                y2="140"
                stroke="rgba(255,255,255,0.06)"
                strokeDasharray="4 4"
              />

              {/* Bars */}
              {WEEKLY_CALORIES.map((item, idx) => {
                const barHeight = (item.val / maxCal) * 110;
                const barWidth = 24;
                const gap = (CHART_WIDTH - barWidth * 7) / 6;
                const x = idx * (barWidth + gap);
                const y = 140 - barHeight;

                return (
                  <React.Fragment key={idx}>
                    <Rect
                      x={x}
                      y={y}
                      width={barWidth}
                      height={barHeight}
                      rx={6}
                      fill={idx === 5 ? '#f97316' : '#3b82f6'}
                    />
                    <SvgText
                      x={x + barWidth / 2}
                      y={165}
                      fill="#64748b"
                      fontSize="10"
                      fontWeight="bold"
                      textAnchor="middle"
                    >
                      {item.day}
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
          <Text style={styles.sectionTitle}>30 GÜNLÜK SERİ TUTARLILIĞI</Text>
          <GlassCard style={{ padding: 16 }}>
            <View style={styles.matrixGrid}>
              {Array.from({ length: 28 }).map((_, i) => {
                const isCompleted = i % 3 !== 0;
                return (
                  <View
                    key={i}
                    style={[
                      styles.matrixSquare,
                      isCompleted && styles.matrixSquareActive,
                    ]}
                  />
                );
              })}
            </View>
          </GlassCard>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#02040A' },
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
});
