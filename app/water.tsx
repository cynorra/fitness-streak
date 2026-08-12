import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withRepeat,
  withSequence,
  Easing,
  FadeInDown,
  FadeInUp,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import GlassCard from '../components/GlassCard';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

interface WaterLog {
  id: string;
  amount: number; // in ml
  time: string;
}

export default function WaterTrackerScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [dailyGoal, setDailyGoal] = useState<number>(2500);
  const [currentAmount, setCurrentAmount] = useState<number>(1250);
  const [logs, setLogs] = useState<WaterLog[]>([
    { id: '1', amount: 500, time: '08:30' },
    { id: '2', amount: 250, time: '11:15' },
    { id: '3', amount: 500, time: '14:00' },
  ]);

  // Wave Animation values
  const fillProgress = useSharedValue(currentAmount / dailyGoal);
  const waveOffset = useSharedValue(0);

  useEffect(() => {
    fillProgress.value = withSpring(Math.min(1, currentAmount / dailyGoal), {
      damping: 15,
      stiffness: 100,
    });
  }, [currentAmount, dailyGoal]);

  useEffect(() => {
    waveOffset.value = withRepeat(
      withTiming(1, { duration: 2500, easing: Easing.linear }),
      -1,
      false
    );
  }, []);

  const addWater = (amount: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const newAmount = currentAmount + amount;
    setCurrentAmount(newAmount);

    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now
      .getMinutes()
      .toString()
      .padStart(2, '0')}`;

    setLogs((prev) => [{ id: Date.now().toString(), amount, time: timeStr }, ...prev]);
  };

  const percentage = Math.min(100, Math.round((currentAmount / dailyGoal) * 100));

  const waveAnimatedStyle = useAnimatedStyle(() => ({
    height: `${fillProgress.value * 100}%`,
  }));

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#050B14', '#0A1224', '#030712']}
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
        <Text style={styles.headerTitle}>SU TAKİBİ</Text>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setDailyGoal((prev) => (prev === 2500 ? 3000 : 2500));
          }}
        >
          <Ionicons name="settings-outline" size={20} color="#38bdf8" />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Main Fluid Tank Display */}
        <Animated.View
          entering={FadeInDown.duration(500).springify()}
          style={styles.tankCardContainer}
        >
          <GlassCard
            gradientColors={['rgba(56, 189, 248, 0.12)', 'rgba(14, 165, 233, 0.03)']}
            borderColor="rgba(56, 189, 248, 0.3)"
            style={styles.tankCard}
          >
            <View style={styles.tankVisual}>
              {/* Background Fluid fill */}
              <Animated.View style={[styles.fluidFill, waveAnimatedStyle]}>
                <LinearGradient
                  colors={['#38bdf8', '#0284c7', '#0369a1']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                  style={StyleSheet.absoluteFill}
                />
              </Animated.View>

              {/* Foreground Stats Text */}
              <View style={styles.tankStatsOverlay}>
                <Text style={styles.percentageText}>%{percentage}</Text>
                <Text style={styles.amountText}>
                  {currentAmount} <Text style={styles.unitText}>/ {dailyGoal} ml</Text>
                </Text>
                <View style={styles.statusBadge}>
                  <Text style={styles.statusText}>
                    {percentage >= 100
                      ? '🎉 HEDEF TAMAMLANDI!'
                      : `${dailyGoal - currentAmount} ml KALDI`}
                  </Text>
                </View>
              </View>
            </View>
          </GlassCard>
        </Animated.View>

        {/* Quick Add Action Buttons */}
        <Animated.View
          entering={FadeInUp.delay(150).duration(500).springify()}
          style={styles.section}
        >
          <Text style={styles.sectionTitle}>HIZLI SU EKLE</Text>
          <View style={styles.quickAddRow}>
            {[
              { label: '+250 ml', amount: 250, icon: 'wine-outline' },
              { label: '+500 ml', amount: 500, icon: 'water-outline' },
              { label: '+750 ml', amount: 750, icon: 'fitness-outline' },
            ].map((item, idx) => (
              <TouchableOpacity
                key={idx}
                style={styles.quickAddBtn}
                onPress={() => addWater(item.amount)}
              >
                <LinearGradient
                  colors={['#0284c7', '#0369a1']}
                  style={styles.quickAddGradient}
                >
                  <Ionicons name={item.icon as any} size={24} color="#fff" />
                  <Text style={styles.quickAddText}>{item.label}</Text>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        {/* Today's Hydration Logs */}
        <Animated.View
          entering={FadeInUp.delay(300).duration(500).springify()}
          style={styles.section}
        >
          <Text style={styles.sectionTitle}>BUGÜNKÜ KAYITLAR ({logs.length})</Text>
          {logs.map((log, idx) => (
            <GlassCard
              key={log.id}
              style={styles.logCard}
              borderColor="rgba(255, 255, 255, 0.08)"
            >
              <View style={styles.logRow}>
                <View style={styles.logIconBox}>
                  <Ionicons name="water" size={20} color="#38bdf8" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.logAmount}>+{log.amount} ml Su</Text>
                  <Text style={styles.logTime}>{log.time}</Text>
                </View>
                <Ionicons name="checkmark-circle" size={20} color="#10b981" />
              </View>
            </GlassCard>
          ))}
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#030712' },
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
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 2,
  },
  scrollContent: { padding: 20, gap: 24, paddingBottom: 40 },
  tankCardContainer: { alignItems: 'center' },
  tankCard: { width: '100%', borderRadius: 32, padding: 0 },
  tankVisual: {
    height: 260,
    width: '100%',
    borderRadius: 32,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  fluidFill: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    width: '100%',
    opacity: 0.85,
  },
  tankStatsOverlay: { alignItems: 'center', zIndex: 10 },
  percentageText: {
    color: '#fff',
    fontSize: 56,
    fontWeight: '900',
    letterSpacing: -2,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowRadius: 10,
  },
  amountText: {
    color: '#e0f2fe',
    fontSize: 22,
    fontWeight: '800',
    marginTop: -4,
  },
  unitText: { color: '#94a3b8', fontSize: 14, fontWeight: '600' },
  statusBadge: {
    marginTop: 16,
    backgroundColor: 'rgba(3, 105, 161, 0.6)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#38bdf8',
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
  },
  section: { gap: 12 },
  sectionTitle: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  quickAddRow: { flexDirection: 'row', gap: 12 },
  quickAddBtn: { flex: 1, height: 90, borderRadius: 20, overflow: 'hidden' },
  quickAddGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    padding: 12,
  },
  quickAddText: { color: '#fff', fontSize: 13, fontWeight: '900', letterSpacing: 0.5 },
  logCard: { marginBottom: 8, padding: 16 },
  logRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  logIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logAmount: { color: '#fff', fontSize: 15, fontWeight: '800' },
  logTime: { color: '#64748b', fontSize: 12, marginTop: 2, fontWeight: '600' },
});
