import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, Image, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';

interface Props {
  isReady: boolean;
  onAnimationComplete?: () => void;
}

export default function AnimatedSplashScreen({ isReady, onAnimationComplete }: Props) {
  const { width } = useWindowDimensions();
  const [removedFromDOM, setRemovedFromDOM] = useState(false);

  // Animation values
  const containerOpacity = useSharedValue(1);
  const scale = useSharedValue(0.85);
  const logoOpacity = useSharedValue(0);
  const glowPulse = useSharedValue(0.35);
  const textTranslateY = useSharedValue(20);
  const textOpacity = useSharedValue(0);
  const taglineOpacity = useSharedValue(0);

  useEffect(() => {
    // 1. Orijinal alev logosunun girişi
    logoOpacity.value = withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) });
    scale.value = withSpring(1, { damping: 12, stiffness: 100 });

    // 2. Ateş halesi soluma efekti (Breathing flame glow)
    glowPulse.value = withRepeat(
      withSequence(
        withTiming(0.8, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.35, { duration: 1200, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    // 3. Marka yazısı girişi
    textTranslateY.value = withDelay(
      250,
      withTiming(0, { duration: 550, easing: Easing.out(Easing.cubic) })
    );
    textOpacity.value = withDelay(250, withTiming(1, { duration: 500 }));

    // 4. DIETITIANS · WORKOUTS · STREAKS sloganı
    taglineOpacity.value = withDelay(450, withTiming(1, { duration: 550 }));
  }, []);

  useEffect(() => {
    if (!isReady) return;

    const timer = setTimeout(() => {
      scale.value = withTiming(1.08, { duration: 400, easing: Easing.in(Easing.cubic) });
      containerOpacity.value = withTiming(
        0,
        { duration: 400, easing: Easing.inOut(Easing.quad) },
        (finished) => {
          if (finished) {
            runOnJS(handleComplete)();
          }
        }
      );
    }, 750);

    return () => clearTimeout(timer);
  }, [isReady]);

  const handleComplete = () => {
    setRemovedFromDOM(true);
    if (onAnimationComplete) {
      onAnimationComplete();
    }
  };

  const containerAnim = useAnimatedStyle(() => ({
    opacity: containerOpacity.value,
  }));

  const logoAnim = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: scale.value }],
  }));

  const glowAnim = useAnimatedStyle(() => ({
    opacity: glowPulse.value,
  }));

  const textAnim = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
    transform: [{ translateY: textTranslateY.value }],
  }));

  const taglineAnim = useAnimatedStyle(() => ({
    opacity: taglineOpacity.value,
  }));

  if (removedFromDOM) return null;

  const logoSize = Math.min(width * 0.38, 150);

  return (
    <Animated.View style={[StyleSheet.absoluteFill, styles.container, containerAnim]}>
      {/* Premium Obsidian Gradient */}
      <LinearGradient
        colors={['#031a2e', '#010E24', '#00060f']}
        style={StyleSheet.absoluteFill}
      />

      {/* Emerald glow behind the logo */}
      <Animated.View
        style={[
          styles.fireAura,
          {
            width: logoSize * 1.8,
            height: logoSize * 1.8,
            borderRadius: (logoSize * 1.8) / 2,
          },
          glowAnim,
        ]}
      />

      {/* Center Brand Identity */}
      <View style={styles.centerBox}>
        {/* Real App Icon - D + flame-leaf */}
        <Animated.View style={[styles.logoCard, logoAnim]}>
          <Image
            source={require('../assets/icon.png')}
            style={{ width: logoSize, height: logoSize, borderRadius: 32 }}
            resizeMode="contain"
          />
        </Animated.View>

        {/* DIETITIANFIT Typography */}
        <Animated.View style={[styles.titleRow, textAnim]}>
          <Text style={styles.titleStreak}>DIETITIAN</Text>
          <Text style={styles.titleFit}>FIT</Text>
        </Animated.View>

        {/* Real Brand Tagline */}
        <Animated.View style={taglineAnim}>
          <Text style={styles.tagline}>DIETITIANS · WORKOUTS · STREAKS</Text>
        </Animated.View>
      </View>

      {/* Bottom Brand Stamp */}
      <View style={styles.footerWrap}>
        <View style={styles.statusDot} />
        <Text style={styles.footerText}>DIETITIAN + FITNESS</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    zIndex: 99999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerBox: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  fireAura: {
    position: 'absolute',
    backgroundColor: 'rgba(16, 185, 129, 0.28)',
    shadowColor: '#10b981',
    shadowOpacity: 0.9,
    shadowRadius: 50,
    elevation: 30,
  },
  logoCard: {
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.55,
    shadowRadius: 30,
    elevation: 25,
    marginBottom: 26,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  titleStreak: {
    color: '#ffffff',
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: 2,
  },
  titleFit: {
    color: '#10b981',
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: 2,
  },
  tagline: {
    color: '#34d399',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  footerWrap: {
    position: 'absolute',
    bottom: 42,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10b981',
  },
  footerText: {
    color: '#78716c',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
  },
});
