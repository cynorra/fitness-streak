import React, { useEffect } from 'react';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path, Defs, RadialGradient, Stop } from 'react-native-svg';
import { useTranslation } from '../lib/i18n/i18n';
import StreakFitLogo from './StreakFitLogo';

interface AnimatedStreakNumberProps {
  streak: number;
}

/**
 * 2026+ Performance Sports Dial & Flame Streak Counter:
 * - Orijinal StreakFit alev amblemi ve dinamik enerji arkı
 * - Sayı kadranı, zümrüt/amber kor ışıması
 * - Çocuksu yaprak veya rastgele emojiler yerine elit performans kadranı
 */
export default function AnimatedStreakNumber({ streak }: AnimatedStreakNumberProps) {
  const { t } = useTranslation();
  const scale = useSharedValue(0.7);
  const opacity = useSharedValue(0);
  const flamePulse = useSharedValue(1);
  const ringRotate = useSharedValue(0);
  const glowPulse = useSharedValue(0.3);

  const isActive = streak > 0;
  const accentColor = streak >= 30 ? '#eab308' : streak >= 7 ? '#ff6b00' : '#10b981';

  useEffect(() => {
    scale.value = withSpring(1, { damping: 11, stiffness: 120 });
    opacity.value = withTiming(1, { duration: 450, easing: Easing.out(Easing.cubic) });

    // Enerji halkası yavaşça dönsün
    ringRotate.value = withRepeat(
      withTiming(360, { duration: 16000, easing: Easing.linear }),
      -1,
      false
    );

    // Alev ve kor nefes alışı
    flamePulse.value = withRepeat(
      withSequence(
        withTiming(1.08, { duration: 900, easing: Easing.inOut(Easing.ease) }),
        withTiming(1.0, { duration: 900, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    glowPulse.value = withRepeat(
      withSequence(
        withTiming(0.75, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.25, { duration: 1200, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, [streak]);

  const numberStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${ringRotate.value}deg` }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowPulse.value,
  }));

  const flameAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: flamePulse.value }],
  }));

  return (
    <View style={styles.container}>
      {/* Radial Glow Arkası */}
      <Animated.View style={[styles.glowWrap, glowStyle]}>
        <Svg width={260} height={260}>
          <Defs>
            <RadialGradient id="dialGlow" cx="50%" cy="50%" r="50%">
              <Stop offset="0" stopColor={accentColor} stopOpacity="0.4" />
              <Stop offset="0.6" stopColor={accentColor} stopOpacity="0.1" />
              <Stop offset="1" stopColor="transparent" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Circle cx={130} cy={130} r={130} fill="url(#dialGlow)" />
        </Svg>
      </Animated.View>

      {/* Dönen Enerji Arkı (Sport Circular Arc) */}
      <Animated.View style={[styles.arcWrap, ringStyle]}>
        <Svg width={230} height={230} viewBox="0 0 100 100">
          {/* Arka plan sönük iz */}
          <Circle
            cx="50"
            cy="50"
            r="44"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="3.5"
            fill="none"
          />
          {/* Aktif enerji segmenti */}
          <Circle
            cx="50"
            cy="50"
            r="44"
            stroke={accentColor}
            strokeWidth="3.5"
            strokeDasharray="70 200"
            strokeLinecap="round"
            fill="none"
          />
        </Svg>
      </Animated.View>

      {/* Orijinal Alev Amblemi / Logo S */}
      <Animated.View style={[styles.logoCenter, flameAnimStyle]}>
        <StreakFitLogo size={68} animated style={{ opacity: isActive ? 1 : 0.85 }} />
      </Animated.View>

      {/* Büyük Sayı */}
      <Animated.Text style={[styles.number, { color: accentColor }, numberStyle]}>
        {streak}
      </Animated.Text>

      {/* Metin Etiketi */}
      <View style={styles.badgeRow}>
        <View style={[styles.dot, { backgroundColor: accentColor }]} />
        <Text style={styles.label}>
          {streak === 0 ? 'START YOUR STREAK' : t('streakNumber.label')}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    paddingVertical: 12,
  },
  glowWrap: {
    position: 'absolute',
    pointerEvents: 'none',
  },
  arcWrap: {
    position: 'absolute',
    pointerEvents: 'none',
  },
  logoCenter: {
    marginBottom: 6,
    zIndex: 2,
  },
  number: {
    fontSize: 88,
    fontWeight: '900',
    letterSpacing: -4,
    lineHeight: 90,
    zIndex: 2,
    fontVariant: ['tabular-nums'],
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
    zIndex: 2,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  label: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 3,
    textTransform: 'uppercase',
  },
});
