import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withSequence,
  withTiming,
  FadeInDown,
  FadeInUp,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import GlassCard from '../components/GlassCard';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from '../lib/i18n/i18n';
import AmbientBackground from '../components/AmbientBackground';

const FASTING_MODES = [
  { id: '16:8', key: 'm168', fastHours: 16, eatHours: 8 },
  { id: '18:6', key: 'm186', fastHours: 18, eatHours: 6 },
  { id: '20:4', key: 'm204', fastHours: 20, eatHours: 4 },
];

export default function FastingTrackerScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t, locale } = useTranslation();
  const [selectedMode, setSelectedMode] = useState(FASTING_MODES[0]);
  const [isFasting, setIsFasting] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isFasting) {
      interval = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isFasting]);

  const targetSeconds = selectedMode.fastHours * 3600;
  const progressRatio = Math.min(1, elapsedSeconds / targetSeconds);
  const remainingSeconds = Math.max(0, targetSeconds - elapsedSeconds);

  const formatTimer = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${h.toString().padStart(2, '0')}:${m
      .toString()
      .padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const toggleFasting = () => {
    if (!isFasting) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setIsFasting(true);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setIsFasting(false);
    }
  };

  // Determine current metabolic phase
  const hoursFasted = elapsedSeconds / 3600;
  const currentPhase =
    hoursFasted < 4
      ? { title: t('fasting.phase1'), color: '#38bdf8', icon: 'nutrition-outline' }
      : hoursFasted < 8
      ? { title: t('fasting.phase2'), color: '#fbbf24', icon: 'pulse-outline' }
      : hoursFasted < 12
      ? { title: t('fasting.phase3'), color: '#f97316', icon: 'flame-outline' }
      : { title: t('fasting.phase4'), color: '#10b981', icon: 'leaf-outline' };

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
        <Text style={styles.headerTitle}>{t('fasting.title')}</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Mode Selector Chips */}
        <Animated.View
          entering={FadeInDown.duration(400).springify()}
          style={styles.modeRow}
        >
          {FASTING_MODES.map((mode) => (
            <TouchableOpacity
              key={mode.id}
              style={[
                styles.modeChip,
                selectedMode.id === mode.id && styles.modeChipActive,
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setSelectedMode(mode);
              }}
            >
              <Text
                style={[
                  styles.modeChipText,
                  selectedMode.id === mode.id && styles.modeChipTextActive,
                ]}
              >
                {t(`fasting.${mode.key}`)}
              </Text>
            </TouchableOpacity>
          ))}
        </Animated.View>

        {/* Circular Timer Ring Display */}
        <Animated.View
          entering={FadeInUp.delay(100).duration(500).springify()}
          style={styles.timerCardContainer}
        >
          <GlassCard
            gradientColors={['rgba(249, 115, 22, 0.12)', 'rgba(234, 88, 12, 0.02)']}
            borderColor="rgba(249, 115, 22, 0.3)"
            style={styles.timerCard}
          >
            <View style={styles.ringVisual}>
              <View style={styles.timerCenter}>
                <Text style={styles.timerStateText}>
                  {isFasting ? t('fasting.state_on') : t('fasting.state_off')}
                </Text>
                <Text style={styles.timerValue}>
                  {isFasting ? formatTimer(elapsedSeconds) : formatTimer(targetSeconds)}
                </Text>
                <Text style={styles.timerSubText}>
                  {isFasting
                    ? t('fasting.remaining', { time: formatTimer(remainingSeconds) })
                    : t('fasting.target', { hours: selectedMode.fastHours })}
                </Text>

                {/* Progress Bar Line */}
                <View style={styles.progressBarBg}>
                  <View
                    style={[
                      styles.progressBarFill,
                      { width: `${progressRatio * 100}%` },
                    ]}
                  />
                </View>
              </View>
            </View>

            {/* Toggle Button */}
            <TouchableOpacity style={styles.actionBtn} onPress={toggleFasting}>
              <LinearGradient
                colors={isFasting ? ['#ef4444', '#dc2626'] : ['#f97316', '#ea580c']}
                style={styles.actionBtnGrad}
              >
                <Ionicons
                  name={isFasting ? 'stop-circle' : 'play-circle'}
                  size={28}
                  color="#fff"
                />
                <Text style={styles.actionBtnText}>
                  {isFasting ? t('fasting.stop') : t('fasting.start')}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </GlassCard>
        </Animated.View>

        {/* Current Metabolic Phase Card */}
        <Animated.View
          entering={FadeInUp.delay(250).duration(500).springify()}
          style={styles.section}
        >
          <Text style={styles.sectionTitle}>{t('fasting.phase_title')}</Text>
          <GlassCard borderColor="rgba(255, 255, 255, 0.1)">
            <View style={styles.phaseRow}>
              <View
                style={[
                  styles.phaseIconBox,
                  { backgroundColor: `${currentPhase.color}20` },
                ]}
              >
                <Ionicons
                  name={currentPhase.icon as any}
                  size={24}
                  color={currentPhase.color}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.phaseTitle, { color: currentPhase.color }]}>
                  {currentPhase.title}
                </Text>
                <Text style={styles.phaseDesc}>
                  {t('fasting.phase_desc', { hours: hoursFasted.toFixed(1) })}
                </Text>
              </View>
            </View>
          </GlassCard>
        </Animated.View>
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
  modeRow: { flexDirection: 'row', gap: 10 },
  modeChip: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
  },
  modeChipActive: {
    backgroundColor: '#f97316',
    borderColor: '#f97316',
  },
  modeChipText: { color: '#94a3b8', fontSize: 12, fontWeight: '800' },
  modeChipTextActive: { color: '#fff' },
  timerCardContainer: { alignItems: 'center' },
  timerCard: { width: '100%', borderRadius: 32, padding: 24, gap: 24 },
  ringVisual: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  timerCenter: { alignItems: 'center', width: '100%' },
  timerStateText: {
    color: '#f97316',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 8,
  },
  timerValue: {
    color: '#fff',
    fontSize: 48,
    fontWeight: '900',
    letterSpacing: -2,
  },
  timerSubText: { color: '#94a3b8', fontSize: 14, fontWeight: '700', marginTop: 4 },
  progressBarBg: {
    width: '100%',
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
    marginTop: 20,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#f97316',
    borderRadius: 4,
  },
  actionBtn: { height: 60, borderRadius: 20, overflow: 'hidden' },
  actionBtnGrad: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  actionBtnText: { color: '#fff', fontSize: 16, fontWeight: '900', letterSpacing: 1 },
  section: { gap: 12 },
  sectionTitle: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  phaseRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  phaseIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  phaseTitle: { fontSize: 16, fontWeight: '900' },
  phaseDesc: { color: '#94a3b8', fontSize: 12, marginTop: 4, lineHeight: 18 },
});
