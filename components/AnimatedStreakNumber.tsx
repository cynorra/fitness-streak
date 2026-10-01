import React, { useEffect } from 'react';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from '../lib/i18n/i18n';

interface AnimatedStreakNumberProps {
  streak: number;
  emoji?: string;
}

/**
 * Streak sayısını animasyonlu olarak gösteren bileşen.
 * - Ekrana gelince büyüyerek belirir (scale spring)
 * - Emoji sürekli pulse atar
 * - Glow efekti var
 */
export default function AnimatedStreakNumber({ streak, emoji = '🌱' }: AnimatedStreakNumberProps) {
  const { t } = useTranslation();
  const scale = useSharedValue(0.5);
  const opacity = useSharedValue(0);
  const emojiScale = useSharedValue(1);
  const glowOpacity = useSharedValue(0.05);

  useEffect(() => {
    // Sayı giriş animasyonu
    scale.value = withSpring(1, { damping: 12, stiffness: 150 });
    opacity.value = withTiming(1, { duration: 400, easing: Easing.out(Easing.cubic) });

    // Emoji pulse — sonsuz döngü
    emojiScale.value = withRepeat(
      withSequence(
        withTiming(1.12, { duration: 900, easing: Easing.inOut(Easing.sin) }),
        withTiming(1.0, { duration: 900, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      false
    );

    // Glow pulse
    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(0.18, { duration: 1200, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.05, { duration: 1200, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      false
    );
  }, [streak]);

  const numberStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  const emojiStyle = useAnimatedStyle(() => ({
    transform: [{ scale: emojiScale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  return (
    <View style={styles.container}>
      {/* Glow arka planı */}
      <Animated.View style={[styles.glow, glowStyle]} />

      {/* Emoji */}
      <Animated.Text style={[styles.emoji, emojiStyle]}>
        {streak >= 100 ? '💎' : streak >= 30 ? '🏆' : streak >= 7 ? '🔥' : emoji}
      </Animated.Text>

      {/* Sayı */}
      <Animated.Text style={[styles.number, numberStyle]}>
        {streak}
      </Animated.Text>

      <Text style={styles.label}>
        {t('streakNumber.label')}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    position: 'relative',
    paddingVertical: 8,
  },
  glow: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: '#10b981',
    top: -20,
  },
  emoji: {
    fontSize: 80,
    zIndex: 1,
    marginBottom: 4,
  },
  number: {
    fontSize: 112,
    fontWeight: '900',
    color: '#10b981',
    letterSpacing: -6,
    lineHeight: 112,
    zIndex: 1,
  },
  label: {
    color: '#555',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 3,
    marginTop: 4,
  },
});
