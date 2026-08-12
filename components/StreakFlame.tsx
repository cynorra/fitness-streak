import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import Svg, { Path, Defs, LinearGradient, Stop, Circle } from 'react-native-svg';

interface StreakFlameProps {
  size?: number;
  active?: boolean;
}

export default function StreakFlame({ size = 48, active = true }: StreakFlameProps) {
  const pulseScale = useSharedValue(1);
  const glowOpacity = useSharedValue(0.3);

  useEffect(() => {
    if (active) {
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.12, { duration: 800, easing: Easing.inOut(Easing.ease) }),
          withTiming(1.0, { duration: 800, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
      glowOpacity.value = withRepeat(
        withSequence(
          withTiming(0.7, { duration: 900, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.2, { duration: 900, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
    }
  }, [active]);

  const flameAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const glowAnimatedStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* Background Glow Circle */}
      {active && (
        <Animated.View
          style={[
            styles.glowCircle,
            {
              width: size * 1.4,
              height: size * 1.4,
              borderRadius: (size * 1.4) / 2,
              backgroundColor: '#10b981',
              top: -size * 0.2,
              left: -size * 0.2,
            },
            glowAnimatedStyle,
          ]}
        />
      )}

      {/* SVG Flame */}
      <Animated.View style={flameAnimatedStyle}>
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Defs>
            <LinearGradient id="flameGrad" x1="0%" y1="100%" x2="0%" y2="0%">
              <Stop offset="0%" stopColor="#10b981" stopOpacity="1" />
              <Stop offset="50%" stopColor="#34d399" stopOpacity="1" />
              <Stop offset="100%" stopColor="#fbbf24" stopOpacity="1" />
            </LinearGradient>
            <LinearGradient id="flameInactive" x1="0%" y1="100%" x2="0%" y2="0%">
              <Stop offset="0%" stopColor="#333333" stopOpacity="1" />
              <Stop offset="100%" stopColor="#666666" stopOpacity="1" />
            </LinearGradient>
          </Defs>
          <Path
            d="M12 23C16.1421 23 19.5 19.6421 19.5 15.5C19.5 11.75 16.5 7.5 12 2C7.5 7.5 4.5 11.75 4.5 15.5C4.5 19.6421 7.85786 23 12 23Z"
            fill={active ? 'url(#flameGrad)' : 'url(#flameInactive)'}
          />
          <Path
            d="M12 20C13.933 20 15.5 18.433 15.5 16.5C15.5 14.5 13.5 12 12 9.5C10.5 12 8.5 14.5 8.5 16.5C8.5 18.433 10.067 20 12 20Z"
            fill="#ffffff"
            fillOpacity={active ? 0.4 : 0.15}
          />
        </Svg>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  glowCircle: {
    position: 'absolute',
  },
});
